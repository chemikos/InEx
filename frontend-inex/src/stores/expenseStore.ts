// src/stores/expenseStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';

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
export interface NewExpenseData {
  amount: number;
  date: string;
  profileId: number;
  itemId: number;
}
// NOWY TYP DANYCH DLA AKTUALIZACJI
export interface UpdateExpenseData {
  id_expense: number;
  amount: number;
  date: string;
  profileId: number;
  itemId: number;
}

// --- HELPER FUNKCJA DO OBSŁUGI BŁĘDÓW ---
function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Używamy pola 'error' lub 'message' zgodnie z konwencją
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

export const useExpenseStore = defineStore('expense', () => {
  // --- STATE ---
  const expenses = ref<Expense[]>([]);
  const isLoading = ref(false); // --- GETTERS (Computed) ---

  const totalExpenses = computed(() => {
    // Obliczanie sumy wydatków
    return expenses.value.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);
  }); // --- ACTIONS ---

  async function fetchExpenses(profileId: number) {
    isLoading.value = true;
    try {
      const response = await http.get(`/expenses?profileId=${profileId}`);
      expenses.value = response.data as Expense[];
    } catch (error) {
      console.error(`Błąd podczas pobierania wydatków dla profilu ${profileId}:`, error);
      expenses.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function addExpense(expenseData: NewExpenseData) {
    if (!expenseData.amount || !expenseData.date || !expenseData.itemId) {
      throw new Error('Kwota, data i pozycja wydatku są wymagane.');
    }

    try {
      const response = await http.post('/expenses', expenseData);
      const data = response.data; // UWAGA: W idealnym świecie backend zwróciłby pełny obiekt Wydatku
      // z poprawnymi nazwami kategorii/pozycji, aby uniknąć przeładowania.

      const newExpense: Expense = {
        id_expense: data.expenseId,
        amount: expenseData.amount,
        date: expenseData.date,
        item_name: 'Nowy wydatek (odśwież, aby zobaczyć szczegóły)', // Placeholder
        category_name: 'N/A', // Placeholder
        fk_item: expenseData.itemId,
        fk_category: 0,
        labels: [],
        label_ids: [],
      };

      expenses.value.unshift(newExpense); // Dodajemy na początek listy
      return { expense: newExpense, message: data.message };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Aktualizuje istniejący wydatek (PUT).
   */
  async function updateExpense(
    updateData: UpdateExpenseData,
    itemDetails: Pick<
      Expense,
      'item_name' | 'category_name' | 'fk_category' | 'labels' | 'label_ids'
    >,
  ) {
    try {
      const url = `/expenses/${updateData.id_expense}`;

      // Wysyłanie żądania PUT. Backend oczekuje amount, date, profileId, itemId
      await http.put(url, {
        amount: updateData.amount,
        date: updateData.date,
        profileId: updateData.profileId,
        itemId: updateData.itemId,
      });

      // Aktualizacja stanu lokalnego
      const expenseToUpdate = expenses.value.find((e) => e.id_expense === updateData.id_expense);
      if (expenseToUpdate) {
        expenseToUpdate.amount = updateData.amount;
        expenseToUpdate.date = updateData.date;
        expenseToUpdate.fk_item = updateData.itemId;

        // Aktualizacja nazw pozycji/kategorii z przekazanych itemDetails
        expenseToUpdate.item_name = itemDetails.item_name;
        expenseToUpdate.category_name = itemDetails.category_name;
        expenseToUpdate.fk_category = itemDetails.fk_category;
        expenseToUpdate.labels = itemDetails.labels;
        expenseToUpdate.label_ids = itemDetails.label_ids;
      }

      return {
        success: true,
        message: `Wydatek ID ${updateData.id_expense} został zaktualizowany.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Usuwa wydatek (DELETE).
   */
  async function deleteExpense(expenseId: number, profileId: number) {
    try {
      // WYSYŁANIE ZGODNE Z KONWENCJĄ: profileId w query stringu
      const url = `/expenses/${expenseId}?profileId=${profileId}`;

      await http.delete(url);

      // Usunięcie ze stanu lokalnego
      expenses.value = expenses.value.filter((e) => e.id_expense !== expenseId);

      return { success: true, message: `Wydatek ID ${expenseId} został usunięty.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } // Zwrócenie stanu i akcji

  return {
    expenses,
    isLoading,
    totalExpenses,
    fetchExpenses,
    addExpense,
    updateExpense, // NOWA METODA
    deleteExpense, // NOWA METODA
  };
});
