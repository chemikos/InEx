<script setup lang="ts">
import { useIncomeStore } from '@/stores/incomeStore';

const incomeStore = useIncomeStore();
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md mt-6">
    <h3 class="text-2xl font-semibold mb-3 text-green-600 border-b pb-2">Ostatnie Wpłaty</h3>

    <p class="text-lg mb-4 p-3 bg-green-50 rounded">
      Łączna kwota wpłat:
      <span class="font-bold text-green-700">{{ incomeStore.totalIncomes }} zł</span>
    </p>

    <div v-if="incomeStore.isLoading" class="text-center p-8 text-gray-500">
      Ładowanie danych wpłat...
    </div>

    <div v-else-if="incomeStore.incomes.length > 0">
      <table class="min-w-full bg-white">
        <thead class="bg-gray-200">
          <tr>
            <th class="py-2 px-4 text-left text-sm">ID</th>
            <th class="py-2 px-4 text-left text-sm">Kwota</th>
            <th class="py-2 px-4 text-left text-sm">Data</th>
            <th class="py-2 px-4 text-left text-sm">Źródło</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="income in incomeStore.incomes"
            :key="income.id_income"
            class="border-b hover:bg-green-50"
          >
            <td class="py-2 px-4 text-sm">{{ income.id_income }}</td>
            <td class="py-2 px-4 text-sm font-medium text-green-600">
              {{ income.amount.toFixed(2) }} PLN
            </td>
            <td class="py-2 px-4 text-sm">{{ income.date.slice(0, 10) }}</td>
            <td class="py-2 px-4 text-sm">{{ income.source_name }}</td>
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
/* Scoped style: usunięcie cienia dla samej tabeli, ponieważ jest na głównym divie */
table {
  border-collapse: collapse;
}
th {
  font-weight: 600;
}
</style>
