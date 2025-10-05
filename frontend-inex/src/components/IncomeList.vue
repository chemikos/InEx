<script setup lang="ts">
import { useIncomeStore } from '@/stores/incomeStore';
const editIncome = (id: number) => {
  console.log(`Edycja wpłaty ID: ${id}`);
  alert(`Edycja wpłaty ID: ${id} (W BUDOWIE)`);
};

const deleteIncome = (id: number) => {
  console.log(`Usuwanie wpłaty ID: ${id}`);
  if (confirm(`Czy na pewno chcesz usunąć Wpłatę ID: ${id}?`)) {
    alert(`Wpłata ID: ${id} usunięta! (W BUDOWIE)`);
  }
};

const incomeStore = useIncomeStore();
</script>

<template>
  <div class="table-container income-list-container">
    <h3 class="form-title income-title-border">Ostatnie Wpłaty</h3>

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
            <td class="table-cell income-amount-cell">{{ income.amount.toFixed(2) }} PLN</td>
            <td class="table-cell">{{ income.date.slice(0, 10) }}</td>
            <td class="table-cell">{{ income.source_name }}</td>
            <td class="table-cell actions-cell">
              <button @click="editIncome(income.id_income)" class="btn-action btn-edit">
                Edytuj
              </button>
              <button @click="deleteIncome(income.id_income)" class="btn-action btn-delete-income">
                Usuń
              </button>
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
