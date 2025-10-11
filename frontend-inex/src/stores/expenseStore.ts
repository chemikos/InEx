// src/stores/expenseStore.ts

import { defineStore, storeToRefs } from 'pinia'; // Dodano storeToRefs
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';
import { useProfileStore } from './profileStore'; // Importujemy useProfileStore

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
  fk_profile: number;
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
  const profileStore = useProfileStore();
  const { verifiedActiveProfileId } = storeToRefs(profileStore); // Używamy strażnika
  // --- STATE ---

  const expenses = ref<Expense[]>([]);
  const isLoading = ref(false); // --- GETTERS (Computed) ---

  const totalExpenses = computed(() => {
    // Obliczanie sumy wydatków
    return expenses.value.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);
  }); // NOWY GETTER: Zwraca listę wydatków tylko dla zweryfikowanego profilu
  const activeExpenses = computed(() => {
    if (verifiedActiveProfileId.value === null) {
      return [];
    }
    return expenses.value;
  }); // --- ACTIONS ---
  /**
   * Pobiera listę wydatków dla danego profilu (GET).
   */

  async function fetchExpenses(profileId: number) {
    // Zabezpieczenie: Jeśli ID nie jest poprawne, resetujemy i wychodzimy.
    if (!profileId) {
      expenses.value = [];
      return;
    } // Dodatkowe zabezpieczenie: Upewnij się, że profil jest aktualnie aktywny
    if (profileId !== verifiedActiveProfileId.value) {
      console.warn('Próba pobrania wydatków dla nieaktywnego lub niezsynchronizowanego profilu.');
      expenses.value = [];
      return;
    }

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
  } /**
   * Dodaje nowy wydatek (POST).
   */

  async function addExpense(expenseData: NewExpenseData) {
    if (!expenseData.amount || !expenseData.date || !expenseData.itemId) {
      throw new Error('Kwota, data i pozycja wydatku są wymagane.');
    } // Zabezpieczenie: Tylko dla aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || expenseData.profileId !== currentActiveId) {
      throw new Error('Nie można dodać wydatku: Niezgodność ID aktywnego profilu.');
    }

    try {
      const response = await http.post('/expenses', expenseData);
      const data = response.data;

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
        fk_profile: expenseData.profileId,
      };

      expenses.value.unshift(newExpense); // Dodajemy na początek listy
      return { expense: newExpense, message: data.message };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Aktualizuje istniejący wydatek (PUT).
   */

  async function updateExpense(
    updateData: UpdateExpenseData,
    itemDetails: Pick<
      Expense,
      'item_name' | 'category_name' | 'fk_category' | 'labels' | 'label_ids'
    >,
  ) {
    // Zabezpieczenie: Tylko dla aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || updateData.profileId !== currentActiveId) {
      throw new Error('Nie można zaktualizować wydatku: Niezgodność ID aktywnego profilu.');
    }

    try {
      const url = `/expenses/${updateData.id_expense}`; // Wysyłanie żądania PUT. Backend oczekuje amount, date, profileId, itemId

      await http.put(url, {
        amount: updateData.amount,
        date: updateData.date,
        profileId: updateData.profileId,
        itemId: updateData.itemId,
      }); // Aktualizacja stanu lokalnego

      const expenseToUpdate = expenses.value.find((e) => e.id_expense === updateData.id_expense);
      if (expenseToUpdate) {
        expenseToUpdate.amount = updateData.amount;
        expenseToUpdate.date = updateData.date;
        expenseToUpdate.fk_item = updateData.itemId; // Aktualizacja nazw pozycji/kategorii z przekazanych itemDetails

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
  } /**
   * Usuwa wydatek (DELETE).
   */

  async function deleteExpense(expenseId: number, profileId: number) {
    // Zabezpieczenie: Tylko dla aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || profileId !== currentActiveId) {
      throw new Error('Nie można usunąć wydatku: Niezgodność ID aktywnego profilu.');
    }

    try {
      // WYSYŁANIE ZGODNE Z KONWENCJĄ: profileId w query stringu
      const url = `/expenses/${expenseId}?profileId=${profileId}`;

      await http.delete(url); // Usunięcie ze stanu lokalnego

      expenses.value = expenses.value.filter((e) => e.id_expense !== expenseId);

      return { success: true, message: `Wydatek ID ${expenseId} został usunięty.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } // Zwrócenie stanu i akcji

  return {
    expenses,
    activeExpenses, // Nowy bezpieczny getter
    isLoading,
    totalExpenses,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  };
});
