<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profileStore';

const categoryStore = useCategoryStore();
const profileStore = useProfileStore();

// ZMIANA 1: Używamy nowego, bezpiecznego gettera activeCategories
// Zmieniamy 'categories' na 'activeCategories'
const { activeCategories, isLoading } = storeToRefs(categoryStore);
// Zatrzymujemy obserwację activeProfileId ze względu na uproszczenie logiki poniżej
const { verifiedActiveProfileId } = storeToRefs(profileStore);

// --- ZMIANA 2: Uproszczony watch i logika ładowania ---
// Store jest już zabezpieczony i reaguje na verifiedActiveProfileId.
// Jedyne co musimy zrobić w komponencie, to upewnić się, że fetchCategories
// zostanie wywołane za każdym razem, gdy verifiedActiveProfileId się zmieni
// na POPRAWNĄ (inną niż null) wartość, a także przy pierwszym załadowaniu (immediate: true).
watch(
  verifiedActiveProfileId,
  (newId) => {
    if (newId !== null) {
      // Wywołujemy fetchCategories tylko z ID. Store sam dba o warunek synchronizacji.
      categoryStore.fetchCategories(newId);
    }
  },
  {
    immediate: true,
  },
);

// --- STAN EDYCJI ---
// ID kategorii, która jest obecnie edytowana
const editingCategoryId = ref<number | null>(null);
// Tymczasowa nazwa używana w polu input podczas edycji
const tempCategoryName = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

// ZMIANA 3: Używamy niestandardowej funkcji modalnej (zgodnie z instrukcjami Canvas)
const showConfirmModal = (message: string) => {
  // W prawdziwej aplikacji tutaj uruchomiłby się niestandardowy komponent modalny
  // Na razie używamy okna dialogowego przeglądarki, ale ZAWSZE pamiętaj, aby to zmienić na modal Vue!
  return window.confirm(message);
};

/**
 * Rozpoczyna tryb edycji dla danej kategorii.
 */
const startEdit = (id: number, currentName: string) => {
  message.value = { text: '', type: null };
  editingCategoryId.value = id;
  tempCategoryName.value = currentName;
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingCategoryId.value = null;
  tempCategoryName.value = '';
};

/**
 * Zapisuje zaktualizowaną nazwę kategorii (PUT).
 */
const saveEdit = async (categoryId: number, profileId: number) => {
  const newName = tempCategoryName.value.trim(); // ZMIANA 4: Walidacja, czy profil jest aktywny przed wysłaniem

  if (profileId !== verifiedActiveProfileId.value) {
    message.value = {
      text: 'Błąd: Aktywny profil nie jest zgodny z profilem kategorii. Odśwież stronę.',
      type: 'error',
    };
    return;
  }
  if (!newName) {
    message.value = { text: 'Nazwa kategorii nie może być pusta.', type: 'error' };
    return;
  }

  if (activeCategories.value.find((c) => c.id_category === categoryId)?.name === newName) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    const result = await categoryStore.updateCategory({
      id_category: categoryId,
      newName,
      fk_profile: profileId,
    });

    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie kategorii (DELETE).
 */
const confirmDelete = async (categoryId: number, categoryName: string, profileId: number) => {
  // ZMIANA 5: Walidacja, czy profil jest aktywny przed wysłaniem
  if (profileId !== verifiedActiveProfileId.value) {
    message.value = {
      text: 'Błąd: Aktywny profil nie jest zgodny z profilem kategorii. Odśwież stronę.',
      type: 'error',
    };
    return;
  }
  if (
    !showConfirmModal(
      `Czy na pewno chcesz usunąć kategorię: "${categoryName}"? Spowoduje to usunięcie powiązanych transakcji!`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await categoryStore.deleteCategory(categoryId, profileId);

    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

const expandedCategories = ref<number[]>([]);
const toggleItems = (categoryId: number) => {
  const index = expandedCategories.value.indexOf(categoryId);
  if (index === -1) {
    // jeśli nie ma tego ID → dodaj
    expandedCategories.value.push(categoryId);
  } else {
    // jeśli już jest → usuń
    expandedCategories.value.splice(index, 1);
  }
};
</script>

<template>
  <div>
    <h2 class="form-title">Lista Kategorii</h2>

    <div
      v-if="message.text"
      :class="{
        'bg-green-100 border-green-400 text-green-700': message.type === 'success',
        'bg-red-100 border-red-400 text-red-700': message.type === 'error',
      }"
      class="p-3 border rounded-md mb-4 text-sm"
    >
      {{ message.text }}
    </div>

    <div v-if="isLoading" class="p-4 text-center">Ładowanie kategorii...</div>

    <!-- ZMIANA 6: Używamy activeCategories (teraz bezpiecznych) do renderowania -->

    <div v-else-if="activeCategories.length === 0" class="p-4 text-center bg-gray-50 rounded-md">
      Brak zdefiniowanych kategorii dla tego profilu.
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">Nazwa</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <!-- ZMIANA 7: Iterujemy po activeCategories -->
          <!-- <tr v-for="category in activeCategories" :key="category.id_category" class="table-row"> -->
          <!-- ✅ v-for jest tylko na <template>, nie na <tr> -->
          <template v-for="category in activeCategories" :key="category.id_category">
            <!-- Wiersz z nazwą kategorii -->
            <tr class="table-row">
              <td
                class="table-cell"
                @click="toggleItems(category.id_category)"
                style="cursor: pointer"
              >
                <template v-if="editingCategoryId === category.id_category">
                  <input
                    type="text"
                    v-model="tempCategoryName"
                    @keyup.enter="saveEdit(category.id_category, category.fk_profile)"
                    class="form-input"
                    style="width: 90%; padding: 0.3rem"
                  />
                </template>
                <template v-else> {{ category.name }} </template>
              </td>
              <td class="table-cell actions-cell">
                <template v-if="editingCategoryId === category.id_category">
                  <button
                    @click="saveEdit(category.id_category, category.fk_profile)"
                    class="btn-action btn-edit-save mr-2"
                  >
                    Zapisz
                  </button>
                  <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
                </template>
                <template v-else>
                  <button
                    @click="startEdit(category.id_category, category.name)"
                    class="btn-action btn-edit mr-2"
                  >
                    Edytuj
                  </button>
                  <button
                    @click="confirmDelete(category.id_category, category.name, category.fk_profile)"
                    class="btn-action btn-delete"
                  >
                    Usuń
                  </button>
                </template>
              </td>
            </tr>
            <!-- Wiersz rozwijany z elementami -->
            <tr v-if="expandedCategories.includes(category.id_category)">
              <td colspan="2" class="table-cell-items">
                <ul v-if="category.items">
                  <li v-for="(item, index) in category.items" :key="index">
                    {{ item.trim() }}
                  </li>
                </ul>
                <p v-else>Brak przypisanych elementów</p>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
