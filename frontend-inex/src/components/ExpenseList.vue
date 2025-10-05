<script setup lang="ts">
import { useExpenseStore } from '@/stores/expenseStore';

const editExpense = (id: number) => {
  console.log(`Edycja wydatku ID: ${id}`);
  alert(`Edycja wydatku ID: ${id} (W BUDOWIE)`);
};

const deleteExpense = (id: number) => {
  console.log(`Usuwanie wydatku ID: ${id}`);
  if (confirm(`Czy na pewno chcesz usunąć Wydatek ID: ${id}?`)) {
    alert(`Wydatek ID: ${id} usunięty! (W BUDOWIE)`);
  }
};

const expenseStore = useExpenseStore();
</script>

<template>
  <div class="table-container expense-list-container">
    <h3 class="form-title expense-title-border">Ostatnie Wydatki</h3>

    <p class="expense-summary-box">
      Łączna kwota wydatków:
      <span class="expense-summary-amount"
        >{{ parseFloat(expenseStore.totalExpenses).toFixed(2) }} zł</span
      >
    </p>

    <div v-if="expenseStore.isLoading" class="text-center p-8 text-gray-500">
      Ładowanie danych wydatków...
    </div>

    <div v-else-if="expenseStore.expenses.length > 0" class="overflow-x-auto">
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
            v-for="expense in expenseStore.expenses"
            :key="expense.id_expense"
            class="table-row expense-row-hover"
          >
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
              <button @click="editExpense(expense.id_expense)" class="btn-action btn-edit">
                Edytuj
              </button>
              <button @click="deleteExpense(expense.id_expense)" class="btn-action btn-delete">
                Usuń
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center py-4 text-gray-500 border p-3 rounded">
      Brak wydatków do wyświetlenia dla tego profilu.
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

/* Styl dla Etykiet (Labels) - Odwzorowanie oryginalnych klas Tailwind */
.expense-label-badge {
  /* inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold mr-1 px-2.5 py-0.5 rounded-full */
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
</style>
