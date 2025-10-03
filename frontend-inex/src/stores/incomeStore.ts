// src/stores/incomeStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';

// Definicja typu dla Wpłaty (na podstawie Twojego response)
export interface Income {
  id_income: number;
  amount: number;
  date: string;
  source_name: string;
  id_source: number;
}
export interface NewIncomeData {
  amount: number;
  date: string;
  profileId: number;
  sourceId: number;
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

  async function addIncome(incomeData: NewIncomeData) {
    if (!incomeData.amount || !incomeData.date) throw new Error('Kwota i data są wymagane.');

    try {
      // Wysyłanie żądania POST do endpointu /incomes
      const response = await http.post('/incomes', incomeData);
      const data = response.data;

      const newIncomeId = data.incomeId;
      const successMessage = data.message;

      // W tym miejscu musimy założyć, że Store źródeł jest załadowany,
      // aby znaleźć nazwę źródła do wyświetlenia w liście Incomes.
      // Ponieważ nie mamy tu dostępu do sourceStore, uprościmy obiekt (tylko na potrzeby lokalnego wyświetlania):
      const newIncome = {
        id_income: newIncomeId,
        amount: incomeData.amount,
        date: incomeData.date,
        id_source: incomeData.sourceId,
        // WAŻNE: source_name będzie na razie pusty lub ogólny!
        // Najbezpieczniejszą opcją jest przeładowanie listy po udanym dodaniu.
        source_name: 'Nowa wpłata (odśwież, aby zobaczyć nazwę)',
      } as Income; // Rzutujemy na any, bo brakuje source_name !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

      // Dodajemy nową wpłatę do lokalnego stanu
      incomes.value.push(newIncome);
      // Zwykle, po dodaniu transakcji, warto przeładować listę:
      // fetchIncomes(incomeData.profileId);

      console.log(`Pomyślnie dodano wpłatę o wartości: ${incomeData.amount}`);

      // Zwracamy obiekt z pełnym komunikatem sukcesu
      return { income: newIncome, message: successMessage };
    } catch (error) {
      let errorMessage: string = 'Nieznany błąd serwera. Sprawdź konsolę.';

      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.error || `Błąd HTTP ${error.response?.status}.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  // Zwrócenie stanu i akcji
  return {
    incomes,
    isLoading,
    totalIncomes,
    fetchIncomes,
    addIncome,
  };
});
