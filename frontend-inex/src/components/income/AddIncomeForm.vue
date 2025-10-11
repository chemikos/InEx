<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia'; // Dodano storeToRefs
import { useIncomeStore, type NewIncomeData } from '@/stores/incomeStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSourceStore } from '@/stores/sourceStore';

const incomeStore = useIncomeStore();
const profileStore = useProfileStore();
const sourceStore = useSourceStore();

// Używamy storeToRefs do uzyskania reaktywnych i zweryfikowanych stanów
const { verifiedActiveProfileId, isProfileStoreReady } = storeToRefs(profileStore);

// --- STAN FORMULARZA ---
const newIncomeAmount = ref<number | null>(null);
const newIncomeDate = ref(new Date().toISOString().slice(0, 10)); // Domyślnie dzisiejsza data
const selectedSourceId = ref<number | null>(null);
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

// Używamy bezpiecznego, zweryfikowanego ID
const currentProfileId = computed(() => verifiedActiveProfileId.value);

/**
 * Ładuje źródła i przychody dla aktywnego profilu, gdy ID jest dostępne.
 */
const loadInitialData = (profileId: number) => {
  // Nie musimy ręcznie przeładowywać, ale upewniamy się, że są pobrane
  sourceStore.fetchSources(profileId);
  incomeStore.fetchIncomes(profileId);
};

// 1. Reakcja na zmianę aktywnego profilu
watch(
  currentProfileId,
  (newId) => {
    if (newId !== null && newId !== 0) {
      loadInitialData(newId);
    }
  },
  { immediate: true },
);

// 2. Obsługa przypadku, gdy profil jest już gotowy przy montażu
onMounted(() => {
  if (isProfileStoreReady.value && currentProfileId.value && currentProfileId.value !== 0) {
    loadInitialData(currentProfileId.value);
  }
});

// --- OBSŁUGA ZAPISU ---
const handleSubmit = async () => {
  // Sprawdzanie podstawowej walidacji
  if (
    !newIncomeAmount.value ||
    !newIncomeDate.value ||
    !selectedSourceId.value ||
    !currentProfileId.value
  ) {
    // Używamy zweryfikowanego ID
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
    profileId: currentProfileId.value, // Używamy zweryfikowanego ID
    sourceId: selectedSourceId.value,
  };

  try {
    const response = await incomeStore.addIncome(newIncomeData);

    message.value = {
      text: response.message || `Dodano wpłatę ID: ${response.income.id_income}`,
      type: 'success',
    }; // Reset formularza

    newIncomeAmount.value = null; // Zostawiamy selectedSourceId i date, bo często powtarzamy te wpisy

    // Skoro store'y są już nasłuchiwane (patrz watch/onMounted),
    // nie musimy ręcznie wywoływać fetchIncomes i fetchSources.
    // Zaktualizowane dane powinny przyjść przez reaktywność store'ów.
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
  <div class="form-container income-container">
    <h3 class="form-title text-green-700">Dodaj Nową Wpłatę (Income)</h3>
    <div v-if="!currentProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
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
          <label for="incomeAmount" class="form-label">Kwota (zł):</label>
          <input
            id="incomeAmount"
            v-model.number="newIncomeAmount"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            class="form-input"
          />
        </div>
        <div>
          <label for="incomeDate" class="form-label">Data:</label>
          <input id="incomeDate" v-model="newIncomeDate" type="date" required class="form-input" />
        </div>
      </div>
      <div class="mb-4">
        <label for="sourceId" class="form-label">Źródło Dochodu:</label>
        <select id="sourceId" v-model.number="selectedSourceId" required class="form-select">
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
        :disabled="isSubmitting || !currentProfileId || sourceStore.sources.length === 0"
        class="btn-success"
        :class="{
          'btn-disabled': isSubmitting || !currentProfileId || sourceStore.sources.length === 0,
        }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Wpłatę (POST /incomes)' }}
      </button>
    </form>
    <div
      v-if="message.text"
      class="msg-box"
      :class="{
        'msg-success': message.type === 'success',
        'msg-error': message.type === 'error',
      }"
    >
      {{ message.text }}
    </div>
  </div>
</template>

<style scoped>
/* Lokalny styl do nadpisania obramowania kontenera na zielono,
 zamiast domyślnego zdefiniowanego w AddItemForm.vue */
.income-container {
  border: 1px dashed #10b981; /* green-500 */
}

/* Ponieważ grid i gap-3 nie są globalnie zdefiniowane, pozostawiamy je
 w HTML, ponieważ są to unikalne style layoutu dla tego formularza. */

/* Nadpisanie marginesu dolnego dla inputów w gridzie */
.form-input {
  margin-bottom: 0 !important; /* Usuń domyślny margines form-input */
}
</style>
