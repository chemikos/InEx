<script setup lang="ts">
import { useExpenseStore } from '@/stores/expenseStore';

const expenseStore = useExpenseStore();
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md mt-6">
    <h3 class="text-2xl font-semibold mb-3 text-red-600 border-b pb-2">Ostatnie Wydatki</h3>

    <p class="text-lg mb-4 p-3 bg-red-50 rounded">
      Łączna kwota wydatków:
      <span class="font-bold text-red-700">{{ expenseStore.totalExpenses }} zł</span>
    </p>

    <div v-if="expenseStore.isLoading" class="text-center p-8 text-gray-500">
      Ładowanie danych wydatków...
    </div>

    <div v-else-if="expenseStore.expenses.length > 0">
      <table class="min-w-full bg-white">
        <thead class="bg-gray-200">
          <tr>
            <!-- <th class="py-2 px-4 text-left text-sm">ID</th> -->
            <th class="py-2 px-4 text-left text-sm">Kwota</th>
            <th class="py-2 px-4 text-left text-sm">Data</th>
            <th class="py-2 px-4 text-left text-sm">Pozycja</th>
            <th class="py-2 px-4 text-left text-sm">Kategoria</th>
            <th class="py-2 px-4 text-left text-sm">Etykiety</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="expense in expenseStore.expenses"
            :key="expense.id_expense"
            class="border-b hover:bg-red-50"
          >
            <!-- <td class="py-2 px-4 text-sm">{{ expense.id_expense }}</td> -->
            <td class="py-2 px-4 text-sm font-medium text-red-600">
              -{{ expense.amount.toFixed(2) }}
            </td>
            <td class="py-2 px-4 text-sm">{{ expense.date.slice(0, 10) }}</td>
            <td class="py-2 px-4 text-sm">{{ expense.item_name }}</td>
            <td class="py-2 px-4 text-sm font-semibold">{{ expense.category_name }}</td>
            <td class="py-2 px-4 text-sm">
              <span
                v-for="label in expense.labels"
                :key="label"
                class="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold mr-1 px-2.5 py-0.5 rounded-full"
              >
                {{ label }}
              </span>
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
/* Styl usunięcia cienia dla samej tabeli */
table {
  border-collapse: collapse;
}
th {
  font-weight: 600;
}
</style>
