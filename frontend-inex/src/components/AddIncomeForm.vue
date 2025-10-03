<script setup lang="ts">
import { ref, computed } from 'vue';
import { useIncomeStore, type NewIncomeData } from '@/stores/incomeStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSourceStore } from '@/stores/sourceStore';

const incomeStore = useIncomeStore();
const profileStore = useProfileStore();
const sourceStore = useSourceStore(); // Potrzebujemy dostępu do źródeł

// --- STAN FORMULARZA ---
const newIncomeAmount = ref<number | null>(null);
const newIncomeDate = ref(new Date().toISOString().slice(0, 10)); // Domyślnie dzisiejsza data
const selectedSourceId = ref<number | null>(null);
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

const activeProfileId = computed(() => profileStore.activeProfileId);

const handleSubmit = async () => {
  // Sprawdzanie podstawowej walidacji
  if (
    !newIncomeAmount.value ||
    !newIncomeDate.value ||
    !selectedSourceId.value ||
    !activeProfileId.value
  ) {
    message.value = {
      text: 'Uzupełnij wszystkie wymagane pola (kwota, data, źródło).',
      type: 'error',
    };
    return;
  }

  isSubmitting.value = true;
  message.value = { text: '', type: null };

  const newIncomeData: NewIncomeData = {
    amount: newIncomeAmount.value,
    date: newIncomeDate.value,
    profileId: activeProfileId.value,
    sourceId: selectedSourceId.value,
  };

  try {
    const response = await incomeStore.addIncome(newIncomeData);

    message.value = {
      text: response.message || `Dodano wpłatę ID: ${response.income.id_income}`,
      type: 'success',
    };

    // Reset formularza
    newIncomeAmount.value = null;
    // Zostawiamy selectedSourceId i date, bo często powtarzamy te wpisy

    // Opcjonalnie: Przeładowanie, aby zobaczyć pełną nazwę źródła
    sourceStore.fetchSources(activeProfileId.value);
    incomeStore.fetchIncomes(activeProfileId.value);
  } catch (err: unknown) {
    message.value = {
      text: err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas dodawania.',
      type: 'error',
    };
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md mt-6 border border-dashed border-green-500">
    <h3 class="text-xl font-semibold mb-3 text-green-700">Dodaj Nową Wpłatę (Income)</h3>

    <div v-if="!activeProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
      Wybierz aktywny profil, aby dodać wpłatę.
    </div>
    <div
      v-else-if="sourceStore.sources.length === 0"
      class="text-center p-4 bg-red-50 text-red-700 rounded-md"
    >
      Brak źródeł dochodu. Najpierw dodaj źródło, aby przypisać wpłatę.
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label for="incomeAmount" class="block mb-1 text-sm font-medium text-gray-700"
            >Kwota (zł):</label
          >
          <input
            id="incomeAmount"
            v-model.number="newIncomeAmount"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            class="w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label for="incomeDate" class="block mb-1 text-sm font-medium text-gray-700">Data:</label>
          <input
            id="incomeDate"
            v-model="newIncomeDate"
            type="date"
            required
            class="w-full p-2 border rounded-md"
          />
        </div>
      </div>

      <div class="mb-4">
        <label for="sourceId" class="block mb-1 text-sm font-medium text-gray-700"
          >Źródło Dochodu:</label
        >
        <select
          id="sourceId"
          v-model.number="selectedSourceId"
          required
          class="w-full p-2 border rounded-md"
        >
          <option :value="null" disabled>Wybierz źródło...</option>
          <option
            v-for="source in sourceStore.sources"
            :key="source.id_source"
            :value="source.id_source"
          >
            {{ source.name }}
          </option>
        </select>
      </div>

      <button
        type="submit"
        :disabled="isSubmitting || !activeProfileId || sourceStore.sources.length === 0"
        class="w-full p-2 font-bold rounded-md transition duration-150"
        :class="{
          'bg-green-600 text-white hover:bg-green-700': !isSubmitting && activeProfileId,
          'bg-gray-400 text-gray-700 cursor-not-allowed': isSubmitting || !activeProfileId,
        }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Wpłatę (POST /incomes)' }}
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
