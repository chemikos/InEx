<script setup lang="ts">
import { watch, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useExpenseStore, type Expense } from '@/stores/expenseStore';
import { useProfileStore } from '@/stores/profileStore';
// import { useItemStore } from '@/stores/itemStore'; // Nieużywane

const expenseStore = useExpenseStore();
const profileStore = useProfileStore();

// Destrukturyzacja z profileStore dla bezpiecznego ID i stanu gotowości
const { verifiedActiveProfileId } = storeToRefs(profileStore);
const { expenses, isLoading, totalExpenses } = storeToRefs(expenseStore);

// Używamy zweryfikowanego ID profilu
const currentProfileId = computed(() => verifiedActiveProfileId.value);

// Ładowanie wydatków przy zmianie aktywnego profilu
watch(
  currentProfileId,
  (newId) => {
    // Upewniamy się, że profil jest gotowy i ID jest poprawne
    if (newId !== null && newId !== 0) {
      expenseStore.fetchExpenses(newId);
    }
  },
  {
    immediate: true, // Kluczowe: Powoduje pierwsze ładowanie po montażu komponentu
  },
);

// --- STAN EDYCJI ---
const editingExpenseId = ref<number | null>(null);
const tempAmount = ref<number | null>(null);
const tempDate = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

const showConfirmModal = (message: string) => {
  // W prawdziwej aplikacji tutaj uruchomiłby się niestandardowy komponent modalny
  // Na razie używamy okna dialogowego przeglądarki, ale ZAWSZE pamiętaj, aby to zmienić na modal Vue!
  return window.confirm(message);
};

/**
 * Rozpoczyna tryb edycji dla wiersza wydatku (tylko Kwota i Data).
 */
const startEdit = (expense: Expense) => {
  message.value = { text: '', type: null };
  editingExpenseId.value = expense.id_expense;
  tempAmount.value = expense.amount;
  tempDate.value = expense.date.slice(0, 10);
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingExpenseId.value = null;
  message.value = { text: '', type: null };
};

/**
 * Zapisuje zaktualizowany wydatek (PUT) - tylko Kwota i Data.
 */
const saveEdit = async (expense: Expense) => {
  const newAmount = tempAmount.value;
  const newDate = tempDate.value;

  // Zachowujemy oryginalne itemId
  const originalItemId = expense.fk_item;

  if (!newAmount || !newDate || !currentProfileId.value) {
    message.value = { text: 'Kwota i data są wymagane, a profil musi być aktywny.', type: 'error' };
    return;
  }

  // Sprawdzenie, czy coś się zmieniło
  const isChanged = newAmount !== expense.amount || newDate !== expense.date.slice(0, 10);

  if (!isChanged) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    // 1. DANE DO WYSŁANIA (UpdateExpenseData)
    const updateData = {
      id_expense: expense.id_expense,
      amount: newAmount,
      date: newDate,
      profileId: currentProfileId.value, // Używamy zweryfikowanego ID
      itemId: originalItemId, // Wysyłamy pierwotne itemId
    };

    // 2. DANE DLA LOKALNEGO ZAAKTUALIZOWANIA UI
    // Zachowujemy oryginalne detale, bo Item się nie zmienił
    const itemUIDetails = {
      item_name: expense.item_name,
      category_name: expense.category_name,
      fk_category: expense.fk_category,
      labels: expense.labels,
      label_ids: expense.label_ids,
    };

    const result = await expenseStore.updateExpense(updateData, itemUIDetails);

    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie wydatku (DELETE).
 */
const confirmDelete = async (
  expenseId: number,
  item_name: string,
  category_name: string,
  amount: number,
  profileId: number,
) => {
  // UWAGA: Zgodnie z instrukcjami, nie można używać window.confirm().
  // W prawdziwej aplikacji, w tym miejscu powinno być wywołanie
  // niestandardowego komponentu modalnego do potwierdzenia usunięcia.

  // Aktualnie, usunięcie następuje natychmiast po kliknięciu.
  // Jeśli potrzebujesz potwierdzenia, musisz zaimplementować własny modal.

  // if (!currentProfileId.value) {
  //   message.value = { text: 'Brak aktywnego profilu, nie można usunąć.', type: 'error' };
  //   return;
  // }

  // message.value = { text: 'Trwa usuwanie...', type: null };

  // try {
  //   const result = await expenseStore.deleteExpense(expenseId, currentProfileId.value);
  //   message.value = { text: result.message, type: 'success' };
  // } catch (error) {
  //   message.value = { text: (error as Error).message, type: 'error' };
  // }
  if (profileId !== verifiedActiveProfileId.value) {
    message.value = {
      text: 'Błąd: Aktywny profil nie jest zgodny z profilem wydatku. Odśwież stronę.',
      type: 'error',
    };
    return;
  }
  if (
    !showConfirmModal(
      `Czy na pewno chcesz usunąć wydatek "${item_name} (${category_name})" w kwocie ${amount.toFixed(2)} zł? Spowoduje to usunięcie powiązanych transakcji!`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await expenseStore.deleteExpense(expenseId, profileId);

    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};
</script>

<template>
  <div class="table-container expense-list-container">
    <h3 class="form-title expense-title-border">Ostatnie Wydatki</h3>
    <div
      v-if="message.text"
      :class="{
        'bg-green-100 border-green-400 text-green-700': message.type === 'success',
        'bg-red-100 border-red-400 text-red-700': message.type === 'error',
      }"
      class="p-3 border rounded-md mb-4 text-sm"
    >
      {{ message.text }}
    </div>
    <p class="expense-summary-box">
      Łączna kwota wydatków:
      <span class="expense-summary-amount">{{ parseFloat(totalExpenses).toFixed(2) }} zł</span>
    </p>
    <div v-if="isLoading" class="text-center p-8 text-gray-500">Ładowanie danych wydatków...</div>
    <div v-else-if="expenses.length > 0" class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">Kwota</th>
            <th class="table-header">Data</th>
            <th class="table-header">Pozycja</th>
            <th class="table-header">Kategoria</th>
            <th class="table-header">Etykiety</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="expense in expenses"
            :key="expense.id_expense"
            class="table-row expense-row-hover"
          >
            <template v-if="editingExpenseId === expense.id_expense">
              <td class="table-cell">
                <input
                  type="number"
                  v-model.number="tempAmount"
                  step="0.01"
                  class="form-input"
                  style="width: 80px; padding: 0.3rem"
                />
              </td>
              <td class="table-cell">
                <input
                  type="date"
                  v-model="tempDate"
                  class="form-input"
                  style="width: 120px; padding: 0.3rem"
                />
              </td>
              <td class="table-cell">{{ expense.item_name }}</td>
              <td class="table-cell font-semibold">{{ expense.category_name }}</td>
              <td class="table-cell">
                <span v-for="label in expense.labels" :key="label" class="expense-label-badge">
                  {{ label }}
                </span>
              </td>
              <td class="table-cell actions-cell">
                <button @click="saveEdit(expense)" class="btn-action btn-edit-save mr-2">
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </td>
            </template>
            <template v-else>
              <td class="table-cell expense-amount-cell">-{{ expense.amount.toFixed(2) }}</td>
              <td class="table-cell">{{ expense.date.slice(0, 10) }}</td>
              <td class="table-cell">{{ expense.item_name }}</td>
              <td class="table-cell font-semibold">{{ expense.category_name }}</td>
              <td class="table-cell">
                <span v-for="label in expense.labels" :key="label" class="expense-label-badge">
                  {{ label }}
                </span>
              </td>
              <td class="table-cell actions-cell">
                <button
                  @click="startEdit(expense)"
                  class="btn-action btn-edit mr-2"
                  :disabled="!!editingExpenseId"
                >
                  Edytuj
                </button>
                <button
                  @click="
                    confirmDelete(
                      expense.id_expense,
                      expense.item_name,
                      expense.category_name,
                      expense.amount,
                      expense.fk_profile,
                    )
                  "
                  class="btn-action btn-delete"
                  :disabled="!!editingExpenseId"
                >
                  Usuń
                </button>
              </td>
            </template>
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
/* Lokalny kontener, aby uniknąć kolizji z form-container i zachować unikalny margin-top */
.expense-list-container {
  margin-top: 1.5rem;
}

/* Tytuł i obramowanie */
.expense-title-border {
  color: #dc2626; /* red-600 */
  border-bottom: 1px solid #d1d5db; /* gray-300 */
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem; /* text-2xl z oryginalnego kodu */
}

/* Sekcja Sumaryczna */
.expense-summary-box {
  padding: 0.75rem;
  background-color: #fef2f2; /* red-50 */
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  font-size: 1.125rem; /* text-lg */
}

.expense-summary-amount {
  font-weight: 700;
  color: #b91c1c; /* red-700 */
}

/* Wiersz po najechaniu myszą (hover) */
.expense-row-hover:hover {
  background-color: #fef4f4 !important; /* Lżejszy red-50 */
}

/* Kolor kwoty */
.expense-amount-cell {
  font-weight: 500;
  color: #dc2626; /* red-600 */
}

/* Styl dla Etykiet (Labels) - Odwzorowanie oryginalnych klas Tailwind */
.expense-label-badge {
  /* inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold mr-1 px-2.5 py-0.5 rounded-full */
  display: inline-block;
  background-color: #e0e7ff; /* indigo-100 */
  color: #4338ca; /* indigo-800 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 600; /* font-semibold */
  margin-right: 0.25rem;
  padding: 2px 10px;
  border-radius: 9999px; /* rounded-full */
  white-space: nowrap;
}
</style>
