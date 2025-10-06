// src/stores/incomeStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';

// Definicja typu dla Wpłaty
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
// NOWY TYP DANYCH DLA AKTUALIZACJI
export interface UpdateIncomeData {
  id_income: number;
  amount: number;
  date: string;
  profileId: number;
  sourceId: number; // Musi być przekazane, choć na froncie nie edytujemy
}

// --- HELPER FUNKCJA DO OBSŁUGI BŁĘDÓW ---
function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Błąd HTTP ${error.response?.status}.`
    );
  } else if (error instanceof Error) {
    return error.message;
  }
  return 'Nieznany błąd serwera. Sprawdź konsolę.';
}

export const useIncomeStore = defineStore('income', () => {
  // --- STATE ---
  const incomes = ref<Income[]>([]);
  const isLoading = ref(false); // --- GETTERS (Computed) ---

  const totalIncomes = computed(() => {
    return incomes.value.reduce((sum, income) => sum + income.amount, 0).toFixed(2);
  }); // --- ACTIONS ---

  async function fetchIncomes(profileId: number) {
    isLoading.value = true;
    try {
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
      const response = await http.post('/incomes', incomeData);
      const data = response.data;

      const newIncomeId = data.incomeId;
      const successMessage = data.message;

      const newIncome = {
        id_income: newIncomeId,
        amount: incomeData.amount,
        date: incomeData.date,
        id_source: incomeData.sourceId,
        source_name: 'Nowa wpłata (odśwież, aby zobaczyć nazwę)', // Placeholder
      } as Income;

      incomes.value.unshift(newIncome);
      return { income: newIncome, message: successMessage };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Aktualizuje istniejącą wpłatę (PUT) - tylko Kwota i Data.
   */
  async function updateIncome(updateData: UpdateIncomeData) {
    try {
      const url = `/incomes/${updateData.id_income}`;

      // Wysyłanie żądania PUT. Backend oczekuje amount, date, profileId, sourceId
      await http.put(url, {
        amount: updateData.amount,
        date: updateData.date,
        profileId: updateData.profileId,
        sourceId: updateData.sourceId, // Zachowujemy oryginalne ID, które jest w updateData
      });

      // Aktualizacja stanu lokalnego
      const incomeToUpdate = incomes.value.find((i) => i.id_income === updateData.id_income);
      if (incomeToUpdate) {
        incomeToUpdate.amount = updateData.amount;
        incomeToUpdate.date = updateData.date;
        // source_name i id_source zostają niezmienione
      }

      return {
        success: true,
        message: `Wpłata ID ${updateData.id_income} została zaktualizowana.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Usuwa wpłatę (DELETE).
   */
  async function deleteIncome(incomeId: number, profileId: number) {
    try {
      // WYSYŁANIE ZGODNE Z KONWENCJĄ: profileId w query stringu
      const url = `/incomes/${incomeId}?profileId=${profileId}`;

      await http.delete(url);

      // Usunięcie ze stanu lokalnego
      incomes.value = incomes.value.filter((i) => i.id_income !== incomeId);

      return { success: true, message: `Wpłata ID ${incomeId} została usunięta.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } // Zwrócenie stanu i akcji

  return {
    incomes,
    isLoading,
    totalIncomes,
    fetchIncomes,
    addIncome,
    updateIncome, // NOWA METODA
    deleteIncome, // NOWA METODA
  };
});
