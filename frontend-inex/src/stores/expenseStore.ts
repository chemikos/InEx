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

  async function addExpense(expenseData: NewExpenseData) {
    if (!expenseData.amount || !expenseData.date || !expenseData.itemId) {
      throw new Error('Kwota, data i pozycja wydatku są wymagane.');
    }

    try {
      // Wysyłanie żądania POST do endpointu /expenses
      const response = await http.post('/expenses', expenseData);
      const data = response.data;

      const newExpenseId = data.expenseId;
      const successMessage = data.message;

      const newExpense: Expense = {
        id_expense: newExpenseId,
        amount: expenseData.amount,
        date: expenseData.date,
        // Wypełniamy pola placeholderami, których wymaga interfejs Expense,
        // a które zostaną uzupełnione po przeładowaniu danych.
        item_name: 'Nowy wydatek (odśwież, aby zobaczyć szczegóły)',
        category_name: 'N/A',
        fk_item: expenseData.itemId, // Używamy pola itemId z danych wejściowych
        fk_category: 0, // Musimy ustawić jakąś domyślną wartość lub wziąć z ItemStore (na razie 0)
        labels: [],
        label_ids: [],
      };

      // Dodajemy nowy wydatek do lokalnego stanu
      expenses.value.push(newExpense);

      console.log(`Pomyślnie dodano wydatek o wartości: ${expenseData.amount}`);

      // Zwracamy obiekt z pełnym komunikatem sukcesu
      return { expense: newExpense, message: successMessage };
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
    expenses,
    isLoading,
    totalExpenses,
    fetchExpenses,
    addExpense,
  };
});
