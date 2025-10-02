// src/stores/expenseStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';

// Definicja typu dla Wydatku (na podstawie Twojego response)
export interface Expense {
  id_expense: number;
  amount: number;
  date: string;
  category_name: string;
  item_name: string;
  fk_item: number;
  fk_category: number;
  labels: string[];
  label_ids: number[];
}

export const useExpenseStore = defineStore('expense', () => {
  // --- STATE ---
  const expenses = ref<Expense[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const totalExpenses = computed(() => {
    // Obliczanie sumy wydatków
    return expenses.value.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);
  });

  // --- ACTIONS ---
  async function fetchExpenses(profileId: number) {
    isLoading.value = true;
    try {
      // Wywołanie endpointu GET /expenses?profileId=...
      // Uwaga: Upewnij się, że Twój backend obsługuje filtrowanie dat,
      // np. poprzez dodanie domyślnego zakresu, jeśli nie są podane w query.
      const response = await http.get(`/expenses?profileId=${profileId}`);

      // Przyjmujemy, że API zwraca poprawnie przetworzone tablice dla labels/label_ids
      expenses.value = response.data as Expense[];
    } catch (error) {
      console.error(`Błąd podczas pobierania wydatków dla profilu ${profileId}:`, error);
      expenses.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Zwrócenie stanu i akcji
  return {
    expenses,
    isLoading,
    totalExpenses,
    fetchExpenses,
  };
});
