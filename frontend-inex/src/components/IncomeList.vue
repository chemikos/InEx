<script setup lang="ts">
import { ref, computed } from 'vue';
import { useIncomeStore, type Income } from '@/stores/incomeStore';
import { useProfileStore } from '@/stores/profileStore';

const incomeStore = useIncomeStore();
const profileStore = useProfileStore();

const activeProfileId = computed(() => profileStore.activeProfileId || 0);

// --- STAN EDYCJI ---
const editingIncomeId = ref<number | null>(null);
const tempAmount = ref<number | null>(null);
const tempDate = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

/**
 * Rozpoczyna tryb edycji dla wiersza wpłaty (tylko Kwota i Data).
 */
const startEdit = (income: Income) => {
  message.value = { text: '', type: null };
  editingIncomeId.value = income.id_income;
  tempAmount.value = income.amount;
  tempDate.value = income.date.slice(0, 10);
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingIncomeId.value = null;
  message.value = { text: '', type: null };
};

/**
 * Zapisuje zaktualizowaną wpłatę (PUT) - tylko Kwota i Data.
 */
const saveEdit = async (income: Income) => {
  const newAmount = tempAmount.value;
  const newDate = tempDate.value;
  const originalSourceId = income.id_source;

  if (!newAmount || !newDate || !activeProfileId.value) {
    message.value = { text: 'Kwota i data są wymagane.', type: 'error' };
    return;
  }

  // Sprawdzenie, czy coś się zmieniło
  const isChanged = newAmount !== income.amount || newDate !== income.date.slice(0, 10);

  if (!isChanged) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    const updateData = {
      id_income: income.id_income,
      amount: newAmount,
      date: newDate,
      profileId: activeProfileId.value,
      sourceId: originalSourceId, // Wysyłamy pierwotne sourceId, zgodnie z API
    };

    const result = await incomeStore.updateIncome(updateData);

    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie wpłaty (DELETE).
 */
const confirmDelete = async (incomeId: number, amount: number) => {
  if (
    !confirm(
      `Czy na pewno chcesz usunąć wpłatę o kwocie ${amount.toFixed(2)} zł? Ta operacja jest nieodwracalna!`,
    )
  ) {
    return;
  }

  if (!activeProfileId.value) {
    message.value = { text: 'Brak aktywnego profilu, nie można usunąć.', type: 'error' };
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await incomeStore.deleteIncome(incomeId, activeProfileId.value);
    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};
</script>

<template>
  <div class="table-container income-list-container">
    <h3 class="form-title income-title-border">Ostatnie Wpłaty</h3>

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
    <p class="income-summary-box">
      Łączna kwota wpłat:
      <span class="income-summary-amount"
        >{{ parseFloat(incomeStore.totalIncomes).toFixed(2) }} zł</span
      >
    </p>
    <div v-if="incomeStore.isLoading" class="text-center p-8 text-gray-500">
      Ładowanie danych wpłat...
    </div>
    <div v-else-if="incomeStore.incomes.length > 0" class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">ID</th>
            <th class="table-header">Kwota</th>
            <th class="table-header">Data</th>
            <th class="table-header">Źródło</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="income in incomeStore.incomes"
            :key="income.id_income"
            class="table-row income-row-hover"
          >
            <td class="table-cell">{{ income.id_income }}</td>

            <td class="table-cell income-amount-cell">
              <template v-if="editingIncomeId === income.id_income">
                <input
                  type="number"
                  v-model.number="tempAmount"
                  step="0.01"
                  class="form-input"
                  style="width: 80px; padding: 0.3rem"
                />
              </template>
              <template v-else> {{ income.amount.toFixed(2) }} PLN </template>
            </td>

            <td class="table-cell">
              <template v-if="editingIncomeId === income.id_income">
                <input
                  type="date"
                  v-model="tempDate"
                  class="form-input"
                  style="width: 120px; padding: 0.3rem"
                />
              </template>
              <template v-else>
                {{ income.date.slice(0, 10) }}
              </template>
            </td>
            <td class="table-cell">{{ income.source_name }}</td>
            <td class="table-cell actions-cell">
              <template v-if="editingIncomeId === income.id_income">
                <button @click="saveEdit(income)" class="btn-action btn-edit-save mr-2">
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </template>
              <template v-else>
                <button
                  @click="startEdit(income)"
                  class="btn-action btn-edit mr-2"
                  :disabled="!!editingIncomeId"
                >
                  Edytuj
                </button>
                <button
                  @click="confirmDelete(income.id_income, income.amount)"
                  class="btn-action btn-delete-income"
                  :disabled="!!editingIncomeId"
                >
                  Usuń
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-4 text-gray-500 border p-3 rounded">
      Brak wpłat do wyświetlenia dla tego profilu.
    </div>
  </div>
</template>

<style scoped>
/* Lokalny kontener, aby uniknąć kolizji z form-container (choć używa tego samego stylu cienia) */
.income-list-container {
  /* Nadpisujemy domyślny margin-top, aby był taki jak w formularzach */
  margin-top: 1.5rem;
}

/* Tytuł i obramowanie */
.income-title-border {
  color: #059669; /* green-600 */
  border-bottom: 1px solid #d1d5db; /* gray-300 */
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem; /* text-2xl z oryginalnego kodu */
}

/* Sekcja Sumaryczna */
.income-summary-box {
  padding: 0.75rem;
  background-color: #ecfdf5; /* green-50 */
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  font-size: 1.125rem; /* text-lg */
}

.income-summary-amount {
  font-weight: 700;
  color: #047857; /* green-700 */
}

/* Wiersz po najechaniu myszą (hover) */
.income-row-hover:hover {
  background-color: #f0fdf4 !important; /* Lżejszy green-50 */
}

/* Kolor kwoty */
.income-amount-cell {
  font-weight: 500;
  color: #059669; /* green-600 */
}

/* Specjalny styl dla przycisku usuwania, aby był zielony (mniej drastyczny niż czerwony) */
.btn-delete-income {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s;
  color: #10b981; /* green-500 */
}

.btn-delete-income:hover {
  background-color: #d1fae5; /* green-100 */
}
</style>
