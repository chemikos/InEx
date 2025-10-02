// src/stores/incomeStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';

// Definicja typu dla Wpłaty (na podstawie Twojego response)
export interface Income {
  id_income: number;
  amount: number;
  date: string;
  source_name: string;
  id_source: number;
}

export const useIncomeStore = defineStore('income', () => {
  // --- STATE ---
  const incomes = ref<Income[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const totalIncomes = computed(() => {
    // Obliczanie sumy wpłat
    return incomes.value.reduce((sum, income) => sum + income.amount, 0).toFixed(2);
  });

  // --- ACTIONS ---
  async function fetchIncomes(profileId: number) {
    isLoading.value = true;
    try {
      // Wywołanie endpointu GET /incomes?profileId=...
      const response = await http.get(`/incomes?profileId=${profileId}`);

      incomes.value = response.data as Income[];
    } catch (error) {
      console.error(`Błąd podczas pobierania wpłat dla profilu ${profileId}:`, error);
      incomes.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Zwrócenie stanu i akcji
  return {
    incomes,
    isLoading,
    totalIncomes,
    fetchIncomes,
  };
});
