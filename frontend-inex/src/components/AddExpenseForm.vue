<script setup lang="ts">
import { ref, computed } from 'vue';
import { useExpenseStore, type NewExpenseData } from '@/stores/expenseStore';
import { useProfileStore } from '@/stores/profileStore';
import { useItemStore } from '@/stores/itemStore'; // Potrzebujemy dostępu do pozycji wydatków

const expenseStore = useExpenseStore();
const profileStore = useProfileStore();
const itemStore = useItemStore(); // Użycie store'a Items

// --- STAN FORMULARZA ---
const newExpenseAmount = ref<number | null>(null);
const newExpenseDate = ref(new Date().toISOString().slice(0, 10)); // Domyślnie dzisiejsza data
const selectedItemId = ref<number | null>(null); // Wybrana pozycja wydatku
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

const activeProfileId = computed(() => profileStore.activeProfileId);

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
    profileId: activeProfileId.value,
    itemId: selectedItemId.value,
  };

  try {
    const response = await expenseStore.addExpense(newExpenseData);

    message.value = {
      text: response.message || `Dodano wydatek ID: ${response.expense.id_expense}`,
      type: 'success',
    };

    // Reset formularza
    newExpenseAmount.value = null;
    // Zostawiamy selectedItemId i date, bo często powtarzamy te wpisy

    // Opcjonalnie: Przeładowanie, aby zobaczyć pełną nazwę pozycji i kategorię
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

    <div v-if="!activeProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
      Wybierz aktywny profil, aby dodać wydatek.
    </div>
    <div
      v-else-if="itemStore.items.length === 0"
      class="text-center p-4 bg-red-50 text-red-700 rounded-md"
    >
      Brak zdefiniowanych pozycji wydatków (Items). Najpierw dodaj pozycję, aby móc zarejestrować
      wydatek.
    </div>

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
          />
        </div>
      </div>

      <div class="mb-4">
        <label for="itemId" class="form-label">Pozycja Wydatku (Item):</label>
        <select id="itemId" v-model.number="selectedItemId" required class="form-select">
          <option :value="null" disabled>Wybierz pozycję (Item)...</option>
          <option v-for="item in itemStore.items" :key="item.id_item" :value="item.id_item">
            {{ item.name }}
          </option>
        </select>
      </div>

      <button
        type="submit"
        :disabled="isSubmitting || !activeProfileId || itemStore.items.length === 0"
        class="btn-primary"
        :class="{
          'btn-disabled': isSubmitting || !activeProfileId || itemStore.items.length === 0,
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
