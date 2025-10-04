<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useItemStore, type NewItemData } from '@/stores/itemStore';
import { useProfileStore } from '@/stores/profileStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useLabelStore } from '@/stores/labelStore';

const itemStore = useItemStore();
const profileStore = useProfileStore();
const categoryStore = useCategoryStore();
const labelStore = useLabelStore();

// --- STAN FORMULARZA ---
const newItemName = ref('');
const selectedCategoryId = ref<number | null>(null);
const selectedLabelIds = ref<number[]>([]);
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

// Lista profili jest dostępna z profileStore, ale potrzebujemy aktywnego ID
const activeProfileId = computed(() => profileStore.activeProfileId);

// Obserwacja zmian kategorii: jeśli jest tylko jedna, ustawiamy ją jako domyślną
watchEffect(() => {
  // 1. Sprawdzamy, czy tablica ma dokładnie jeden element
  if (categoryStore.categories.length === 1 && selectedCategoryId.value === null) {
    // 2. Pobieramy ten element bezpiecznie
    const singleCategory = categoryStore.categories[0];

    // 3. Dodatkowa weryfikacja, choć w tym przypadku z lengh === 1 niepotrzebna,
    // usuwa ostrzeżenie Typescripta i zapewnia bezpieczeństwo
    if (singleCategory && singleCategory.id_category) {
      selectedCategoryId.value = singleCategory.id_category;
    }
  }
});

const handleSubmit = async () => {
  if (!newItemName.value.trim() || !selectedCategoryId.value || !activeProfileId.value) {
    message.value = { text: 'Uzupełnij nazwę pozycji i kategorię.', type: 'error' };
    return;
  }

  isSubmitting.value = true;
  message.value = { text: '', type: null };

  const newItemData: NewItemData = {
    itemName: newItemName.value.trim(),
    profileId: activeProfileId.value,
    categoryId: selectedCategoryId.value,
    labelIds: selectedLabelIds.value,
  };

  try {
    const response = await itemStore.addItem(newItemData);

    message.value = {
      text: response.message || `Dodano pozycję ID: ${response.item.id_item}`,
      type: 'success',
    };

    // Reset formularza
    newItemName.value = '';
    selectedLabelIds.value = []; // Reset tylko etykiet, kategoria może zostać

    // Przeładowanie, aby zobaczyć pełne nazwy w ItemList
    itemStore.fetchItems(activeProfileId.value);
  } catch (err: unknown) {
    message.value = {
      text: err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas dodawania.',
      type: 'error',
    };
  } finally {
    isSubmitting.value = false;
  }
};

// Funkcja do przełączania zaznaczenia etykiet
const toggleLabel = (id: number) => {
  const index = selectedLabelIds.value.indexOf(id);
  // Upewniamy się, że nie dodajemy duplikatów (Twój backend przyjmuje listę)
  if (index === -1) {
    selectedLabelIds.value.push(id);
  } else {
    selectedLabelIds.value.splice(index, 1);
  }
};
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md mt-6 border border-dashed border-red-300">
    <h3 class="text-xl font-semibold mb-3 text-red-700">Dodaj Nową Pozycję Wydatku (Item)</h3>

    <div v-if="!activeProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
      Wybierz aktywny profil, aby dodać pozycję.
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label for="itemName" class="block mb-1 text-sm font-medium text-gray-700"
          >Nazwa Pozycji:</label
        >
        <input
          id="itemName"
          v-model="newItemName"
          type="text"
          required
          placeholder="np. 'Kawa i ciastko', 'Abonament Netflix'"
          class="w-full p-2 border rounded-md"
        />
      </div>

      <div class="mb-3">
        <label for="categoryId" class="block mb-1 text-sm font-medium text-gray-700"
          >Kategoria:</label
        >
        <select
          id="categoryId"
          v-model.number="selectedCategoryId"
          required
          class="w-full p-2 border rounded-md"
          :disabled="categoryStore.categories.length === 0"
        >
          <option :value="null" disabled>Wybierz kategorię...</option>
          <option
            v-for="category in categoryStore.categories"
            :key="category.id_category"
            :value="category.id_category"
          >
            {{ category.name }}
          </option>
        </select>
        <div
          v-if="categoryStore.categories.length === 0 && !categoryStore.isLoading"
          class="text-red-500 text-xs mt-1"
        >
          Brak kategorii. Dodaj je, aby móc tworzyć pozycje.
        </div>
      </div>

      <div class="mb-4">
        <label class="block mb-1 text-sm font-medium text-gray-700">Etykiety (Opcjonalnie):</label>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            v-for="label in labelStore.labels"
            :key="label.id_label"
            @click="toggleLabel(label.id_label)"
            class="px-3 py-1 text-xs font-semibold rounded-full transition duration-150"
            :class="{
              'bg-indigo-600 text-white hover:bg-indigo-700': selectedLabelIds.includes(
                label.id_label,
              ),
              'bg-gray-200 text-gray-700 hover:bg-gray-300': !selectedLabelIds.includes(
                label.id_label,
              ),
            }"
          >
            {{ label.name }}
          </button>
          <div
            v-if="labelStore.labels.length === 0 && !labelStore.isLoading"
            class="text-gray-500 text-xs mt-1"
          >
            Brak dostępnych etykiet.
          </div>
        </div>
      </div>

      <button
        type="submit"
        :disabled="isSubmitting || !activeProfileId || !selectedCategoryId"
        class="w-full p-2 font-bold rounded-md transition duration-150"
        :class="{
          'bg-red-600 text-white hover:bg-red-700':
            !isSubmitting && activeProfileId && selectedCategoryId,
          'bg-gray-400 text-gray-700 cursor-not-allowed':
            isSubmitting || !activeProfileId || !selectedCategoryId,
        }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Pozycję (POST /items)' }}
      </button>
    </form>

    <div
      v-if="message.text"
      :class="{
        'mt-3 p-2 rounded text-sm font-medium': true,
        'bg-green-100 text-green-700': message.type === 'success',
        'bg-red-100 text-red-700': message.type === 'error',
      }"
    >
      {{ message.text }}
    </div>
  </div>
</template>
