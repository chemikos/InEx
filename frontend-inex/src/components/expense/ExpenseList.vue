<script setup lang="ts">
import { watch, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import {
  useExpenseStore,
  type Expense,
  type ExpenseFilterParams,
  // type ExpenseTotals,
} from '@/stores/expenseStore'; // Importujemy ExpenseFilterParams
import { useProfileStore } from '@/stores/profileStore';

const expenseStore = useExpenseStore();
const profileStore = useProfileStore();

// Destrukturyzacja z profileStore dla bezpiecznego ID i stanu gotowości
const { verifiedActiveProfileId } = storeToRefs(profileStore);
const { expenses, isLoading, filteredtotalExpenses, totals } = storeToRefs(expenseStore);

// Używamy zweryfikowanego ID profilu
const currentProfileId = computed(() => verifiedActiveProfileId.value);

// --- POMOCNICY DATY ---
/**
 * Zwraca datę w formacie YYYY-MM-DD.
 * Jeśli `isStart` jest true, zwraca pierwszy dzień miesiąca, w przeciwnym razie ostatni.
 */
const getDefaultDateForCurrentMonth = (isStart: boolean): string => {
  const now = new Date();
  let dateToSet: Date;

  if (isStart) {
    // Pierwszy dzień miesiąca (np. 2025-10-01)
    dateToSet = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    // Ostatni dzień miesiąca (np. 2025-10-31)
    dateToSet = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  const year = dateToSet.getFullYear();
  const month = String(dateToSet.getMonth() + 1).padStart(2, '0');
  const day = String(dateToSet.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;

  // // Formatowanie do YYYY-MM-DD, wymagane przez input type="date"
  // return dateToSet.toISOString().split('T')[0] || '';
};

// --- STAN FILTROWANIA DAT ---
// Domyślnie ustawiony jest bieżący miesiąc i jest aktywny, zgodnie z prośbą
const dateFrom = ref<string | null>(getDefaultDateForCurrentMonth(true));
const dateTo = ref<string | null>(getDefaultDateForCurrentMonth(false));
const isDateFromActive = ref(true);
const isDateToActive = ref(true);

/**
 * Uruchamia pobieranie wydatków z uwzględnieniem aktywnych filtrów dat.
 */
const applyFilter = async () => {
  // Czyścimy komunikaty przed rozpoczęciem operacji
  message.value = { text: '', type: null };
  const profileId = currentProfileId.value;

  if (profileId === null) {
    return;
  }

  // Określenie, które daty wysłać do backendu
  const start = isDateFromActive.value && dateFrom.value ? dateFrom.value : null;
  const end = isDateToActive.value && dateTo.value ? dateTo.value : null;

  // Walidacja zakresu dat
  if (start && end && start > end) {
    message.value = {
      text: 'Data początkowa nie może być późniejsza niż data końcowa.',
      type: 'error',
    };
    return;
  }

  try {
    const filters: ExpenseFilterParams = {
      dateFrom: start,
      dateTo: end,
    };
    await expenseStore.fetchExpenses(profileId, filters);
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Resetuje daty filtrowania do bieżącego miesiąca i odświeża listę.
 */
const resetFilter = () => {
  dateFrom.value = getDefaultDateForCurrentMonth(true);
  dateTo.value = getDefaultDateForCurrentMonth(false);
  isDateFromActive.value = true;
  isDateToActive.value = true;
  applyFilter();
};

// Ładowanie wydatków przy zmianie aktywnego profilu (wywołuje applyFilter)
watch(
  currentProfileId,
  (newId) => {
    // Upewniamy się, że profil jest gotowy i ID jest poprawne
    if (newId !== null && newId !== 0) {
      // Po zmianie profilu lub pierwszym załadowaniu aplikujemy domyślny filtr
      resetFilter();
    } else {
      expenseStore.expenses = [];
    }
  },
  {
    immediate: true, // Kluczowe: Powoduje pierwsze ładowanie po montażu komponentu
  },
);

// --- STAN EDYCJI ---
const editingExpenseId = ref<number | null>(null);
const tempAmount = ref<number | null>(null);
const tempDate = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

const showConfirmModal = (message: string) => {
  // Używamy window.confirm() jako tymczasowego rozwiązania
  return window.confirm(message);
};

/**
 * Rozpoczyna tryb edycji dla wiersza wydatku (tylko Kwota i Data).
 */
const startEdit = (expense: Expense) => {
  message.value = { text: '', type: null };
  editingExpenseId.value = expense.id_expense;
  tempAmount.value = expense.amount;
  tempDate.value = expense.date.slice(0, 10);
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingExpenseId.value = null;
  message.value = { text: '', type: null };
};

/**
 * Zapisuje zaktualizowany wydatek (PUT) - tylko Kwota i Data.
 */
const saveEdit = async (expense: Expense) => {
  const newAmount = tempAmount.value;
  const newDate = tempDate.value;

  const originalItemId = expense.fk_item;

  if (!newAmount || !newDate || !currentProfileId.value) {
    message.value = { text: 'Kwota i data są wymagane, a profil musi być aktywny.', type: 'error' };
    return;
  }

  const isChanged = newAmount !== expense.amount || newDate !== expense.date.slice(0, 10);

  if (!isChanged) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    // DANE DO WYSŁANIA
    const updateData = {
      id_expense: expense.id_expense,
      amount: newAmount,
      date: newDate,
      profileId: currentProfileId.value,
      itemId: originalItemId,
    }; // DANE DLA LOKALNEGO ZAAKTUALIZOWANIA UI (Item się nie zmienił)

    const itemUIDetails = {
      item_name: expense.item_name,
      category_name: expense.category_name,
      fk_category: expense.fk_category,
      labels: expense.labels,
      label_ids: expense.label_ids,
    };

    const result = await expenseStore.updateExpense(updateData, itemUIDetails);

    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie wydatku (DELETE).
 */
const confirmDelete = async (
  expenseId: number,
  item_name: string,
  category_name: string,
  amount: number,
  profileId: number,
) => {
  if (profileId !== verifiedActiveProfileId.value) {
    message.value = {
      text: 'Błąd: Aktywny profil nie jest zgodny z profilem wydatku. Odśwież stronę.',
      type: 'error',
    };
    return;
  }
  if (
    !showConfirmModal(
      `Czy na pewno chcesz usunąć wydatek "${item_name} (${category_name})" w kwocie ${amount.toFixed(2)} zł?`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await expenseStore.deleteExpense(expenseId, profileId);

    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};
</script>

<template>
  <div class="table-container expense-list-container">
    <h3 class="form-title expense-title-border">Wszystkie Wydatki</h3>
    <p class="expense-summary-box">
      <span>
        Wszystkie wydatki:
        <span class="expense-summary-amount"> {{ totals.AllTimeExpenses }} zł</span>
      </span>
      <span>
        Wydatki w tym roku:
        <span class="expense-summary-amount">{{ totals.CurrentYearExpenses }} zł</span>
      </span>
      <span>
        Wydatki w tym miesiącu:
        <span class="expense-summary-amount">{{ totals.CurrentMonthExpenses }} zł</span>
      </span>
    </p>
    <h3 class="form-title expense-title-border">Ostatnie Wydatki</h3>
    <div class="filter-panel">
      <div class="inline">
        <div class="filter-group">
          <div class="inline">
            <input type="checkbox" id="checkStart" v-model="isDateFromActive" />
            <label for="checkStart" class="form-label">Od daty:</label>
          </div>
          <input
            type="date"
            id="dateFrom"
            v-model="dateFrom"
            :disabled="!isDateFromActive"
            class="form-input"
            :class="{ 'opacity-50 bg-gray-100': !isDateFromActive }"
          />
        </div>
        <div class="filter-group">
          <div class="inline">
            <input type="checkbox" id="checkEnd" v-model="isDateToActive" />
            <label for="checkEnd" class="form-label">Do daty:</label>
          </div>
          <input
            type="date"
            id="dateTo"
            v-model="dateTo"
            :disabled="!isDateToActive"
            class="form-input"
            :class="{ 'opacity-50 bg-gray-100': !isDateToActive }"
          />
        </div>
      </div>
      <div class="inline">
        <button @click="applyFilter" :disabled="isLoading" class="btn-primary-small w-full">
          <span v-if="isLoading">Filtrowanie...</span>
          <span v-else>Filtruj</span>
        </button>
        <button @click="resetFilter" :disabled="isLoading" class="btn-secondary-small w-full">
          Reset
        </button>
      </div>
    </div>
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
    <p class="expense-summary-box">
      Łączna kwota wydatków:
      <span class="expense-summary-amount"
        >{{ parseFloat(filteredtotalExpenses).toFixed(2) }} zł</span
      >
    </p>
    <div v-if="isLoading" class="text-center p-8 text-gray-500">Ładowanie danych wydatków...</div>
    <div v-else-if="expenses.length > 0" class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">Kwota</th>
            <th class="table-header">Data</th>
            <th class="table-header">Pozycja</th>
            <th class="table-header">Kategoria</th>
            <th class="table-header">Etykiety</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="expense in expenses"
            :key="expense.id_expense"
            class="table-row expense-row-hover"
          >
            <template v-if="editingExpenseId === expense.id_expense">
              <td class="table-cell">
                <input
                  type="number"
                  v-model.number="tempAmount"
                  step="0.01"
                  class="form-input"
                  style="width: 80px; padding: 0.3rem"
                />
              </td>

              <td class="table-cell">
                <input
                  type="date"
                  v-model="tempDate"
                  class="form-input"
                  style="width: 120px; padding: 0.3rem"
                />
              </td>

              <td class="table-cell">{{ expense.item_name }}</td>
              <td class="table-cell font-semibold">{{ expense.category_name }}</td>
              <td class="table-cell">
                <span v-for="label in expense.labels" :key="label" class="expense-label-badge">
                  {{ label }}
                </span>
              </td>
              <td class="table-cell actions-cell">
                <button @click="saveEdit(expense)" class="btn-action btn-edit-save mr-2">
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </td>
            </template>
            <template v-else>
              <td class="table-cell expense-amount-cell">-{{ expense.amount.toFixed(2) }}</td>
              <td class="table-cell">{{ expense.date.slice(0, 10) }}</td>
              <td class="table-cell">{{ expense.item_name }}</td>
              <td class="table-cell font-semibold">{{ expense.category_name }}</td>
              <td class="table-cell">
                <span v-for="label in expense.labels" :key="label" class="expense-label-badge">
                  {{ label }}
                </span>
              </td>
              <td class="table-cell actions-cell">
                <button
                  @click="startEdit(expense)"
                  class="btn-action btn-edit mr-2"
                  :disabled="!!editingExpenseId"
                >
                  Edytuj
                </button>
                <button
                  @click="
                    confirmDelete(
                      expense.id_expense,
                      expense.item_name,
                      expense.category_name,
                      expense.amount,
                      expense.fk_profile,
                    )
                  "
                  class="btn-action btn-delete"
                  :disabled="!!editingExpenseId"
                >
                  Usuń
                </button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center py-4 text-gray-500 border p-3 rounded">
      Brak wydatków do wyświetlenia dla tego profilu lub w wybranym okresie.
    </div>
  </div>
</template>

<style scoped>
/* Lokalny kontener, aby uniknąć kolizji z form-container i zachować unikalny margin-top */
.expense-list-container {
  margin-top: 1.5rem;
}

/* Tytuł i obramowanie */
.expense-title-border {
  color: #dc2626; /* red-600 */
  border-bottom: 1px solid #d1d5db; /* gray-300 */
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem; /* text-2xl z oryginalnego kodu */
}
/* Sekcja Filtrowania */
.filter-panel {
  display: flex;
  flex-wrap: wrap; /* jeśli się nie mieści, niech zawinie w kolejną linię */
  align-items: center;
  gap: 1rem; /* odstęp między grupami */
  padding: 1rem;
  margin-bottom: 1.5rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Każda grupa (checkbox + input) */
.filter-group {
  display: flex;
  align-items: center; /* checkbox i label w jednej linii */
  gap: 0.5rem;
  min-width: 200px;
}

/* Etykiety */
.form-label {
  font-weight: 500;
  color: #4b5563;
  margin: 0;
}

/* Pola input */
.form-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  width: 150px;
  box-sizing: border-box;
  transition: all 0.2s;
}

/* Kontener na przyciski */
.filter-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Styl przykładowy dla przycisków */
.btn-primary-small,
.btn-secondary-small {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}

/* Sekcja Sumaryczna */
.expense-summary-box {
  padding: 0.75rem;
  background-color: #fef2f2; /* red-50 */
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  font-size: 1.125rem; /* text-lg */
}

.expense-summary-amount {
  font-weight: 700;
  color: #b91c1c; /* red-700 */
}

/* Wiersz po najechaniu myszą (hover) */
.expense-row-hover:hover {
  background-color: #fef4f4 !important; /* Lżejszy red-50 */
}

/* Kolor kwoty */
.expense-amount-cell {
  font-weight: 500;
  color: #dc2626; /* red-600 */
}

/* Styl dla Etykiet (Labels) */
.expense-label-badge {
  display: inline-block;
  background-color: #e0e7ff; /* indigo-100 */
  color: #4338ca; /* indigo-800 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 600; /* font-semibold */
  margin-right: 0.25rem;
  padding: 2px 10px;
  border-radius: 9999px; /* rounded-full */
  white-space: nowrap;
}

/* Style dla przycisków akcji filtrowania */
.btn-primary-small,
.btn-secondary-small {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background-color 0.2s;
}
.btn-primary-small {
  background-color: #10b981; /* emerald */
  color: white;
}
.btn-primary-small:hover:not(:disabled) {
  background-color: #059669;
}
.btn-secondary-small {
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}
.btn-secondary-small:hover:not(:disabled) {
  background-color: #f3f4f6;
}

/* Style dla przycisków akcji w tabeli */
.btn-action {
  padding: 0.3rem 0.6rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition:
    background-color 0.2s,
    opacity 0.2s;
}
.btn-edit {
  background-color: #3b82f6; /* blue-500 */
  color: white;
}
.btn-edit-save {
  background-color: #10b981; /* emerald-500 */
  color: white;
}
.btn-delete {
  background-color: #ef4444; /* red-500 */
  color: white;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
