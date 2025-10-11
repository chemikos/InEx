<script setup lang="ts">
import { ref, computed } from 'vue';
import { useExpenseStore, type NewExpenseData } from '@/stores/expenseStore';
import { useProfileStore } from '@/stores/profileStore';
import { useItemStore } from '@/stores/itemStore';
import { storeToRefs } from 'pinia'; // Import storeToRefs

const expenseStore = useExpenseStore();
const profileStore = useProfileStore();
const itemStore = useItemStore();

// Destrukturyzacja z profileStore dla bezpiecznego ID i stanu gotowości
const { verifiedActiveProfileId, isProfileStoreReady } = storeToRefs(profileStore);

// Destrukturyzacja z itemStore dla aktywnej listy Items
const { items: activeItems } = storeToRefs(itemStore);

// --- STAN FORMULARZA ---
const newExpenseAmount = ref<number | null>(null);
const newExpenseDate = ref(new Date().toISOString().slice(0, 10)); // Domyślnie dzisiejsza data
const selectedItemId = ref<number | null>(null); // Wybrana pozycja wydatku
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

// Używamy bezpiecznego ID profilu
const activeProfileId = computed(() => verifiedActiveProfileId.value);

// Blokada formularza, jeśli profil nie jest gotowy lub nie ma pozycji
const isFormDisabled = computed(() => {
  return (
    isSubmitting.value ||
    !isProfileStoreReady.value || // Czekamy, aż profil się załaduje
    activeProfileId.value === null || // Brak aktywnego profilu
    activeItems.value.length === 0 // Brak Items do wybrania
  );
});

const handleSubmit = async () => {
  // Sprawdzanie podstawowej walidacji
  if (
    !newExpenseAmount.value ||
    !newExpenseDate.value ||
    !selectedItemId.value ||
    !activeProfileId.value
  ) {
    message.value = {
      text: 'Uzupełnij wszystkie wymagane pola (kwota, data, pozycja).',
      type: 'error',
    };
    return;
  }

  isSubmitting.value = true;
  message.value = { text: '', type: null };

  const newExpenseData: NewExpenseData = {
    amount: newExpenseAmount.value,
    date: newExpenseDate.value,
    profileId: activeProfileId.value, // Używamy zweryfikowanego ID
    itemId: selectedItemId.value,
  };

  try {
    const response = await expenseStore.addExpense(newExpenseData);

    message.value = {
      text: response.message || `Dodano wydatek ID: ${response.expense.id_expense}`,
      type: 'success',
    }; // Reset formularza

    newExpenseAmount.value = null; // Zostawiamy selectedItemId i date, bo często powtarzamy te wpisy
    // Ponowne ładowanie wydatków, aby odświeżyć ExpenseList
    expenseStore.fetchExpenses(activeProfileId.value);
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
  <div class="form-container expense-container">
    <h3 class="form-title text-red-700">Dodaj Nowy Wydatek (Expense)</h3>
    <!-- Komunikat, gdy profil nie jest wybrany/gotowy -->
    <div
      v-if="!isProfileStoreReady || activeProfileId === null"
      class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md mb-4"
    >
      Oczekiwanie na aktywny profil. Wybierz profil, aby dodać wydatek.
    </div>
    <!-- Komunikat, gdy nie ma Items -->
    <div
      v-else-if="activeItems.length === 0"
      class="text-center p-4 bg-red-50 text-red-700 rounded-md mb-4"
    >
      Brak zdefiniowanych pozycji wydatków (Items) dla tego profilu. Najpierw dodaj pozycję w
      słowniku.
    </div>
    <!-- Formularz jest widoczny i aktywny tylko, gdy wszystko jest gotowe -->
    <form v-else @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label for="expenseAmount" class="form-label">Kwota (zł):</label>
          <input
            id="expenseAmount"
            v-model.number="newExpenseAmount"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            class="form-input"
            :disabled="isFormDisabled"
          />
        </div>
        <div>
          <label for="expenseDate" class="form-label">Data:</label>
          <input
            id="expenseDate"
            v-model="newExpenseDate"
            type="date"
            required
            class="form-input"
            :disabled="isFormDisabled"
          />
        </div>
      </div>
      <div class="mb-4">
        <label for="itemId" class="form-label">Pozycja Wydatku (Item):</label>
        <select
          id="itemId"
          v-model.number="selectedItemId"
          required
          class="form-select"
          :disabled="isFormDisabled"
        >
          <option :value="null" disabled>Wybierz pozycję (Item)...</option>
          <option v-for="item in activeItems" :key="item.id_item" :value="item.id_item">
            {{ item.name }} ({{ item.category_name }})
          </option>
        </select>
      </div>
      <button
        type="submit"
        :disabled="isFormDisabled"
        class="btn-primary"
        :class="{
          'btn-disabled': isFormDisabled,
        }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Wydatek (POST /expenses)' }}
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
/* Lokalny styl do nadpisania obramowania kontenera na czerwono,
 oraz naprawa marginesów inputów w gridzie. */
.expense-container {
  border: 1px dashed #ef4444; /* red-500 */
}

/* Nadpisanie marginesu dolnego dla inputów w gridzie */
.form-input {
  margin-bottom: 0 !important; /* Usuń domyślny margines form-input, aby działał grid gap-3 */
}
</style>
