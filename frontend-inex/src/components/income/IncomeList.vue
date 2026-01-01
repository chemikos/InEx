<script setup lang="ts">
import { ref, watch, computed } from 'vue'; // Usunięto podwójny import
import { storeToRefs } from 'pinia';
import {
  useIncomeStore,
  type Income,
  type IncomeFilterParams,
  // type IncomeTotals,
  // type IncomeAggregated,
} from '@/stores/incomeStore';
import { useProfileStore } from '@/stores/profileStore';

const incomeStore = useIncomeStore();
const profileStore = useProfileStore();

// --- KLUCZOWE ZMIANY ---
// 1. Używamy storeToRefs do uzyskania reaktywności dla zweryfikowanego ID
const { verifiedActiveProfileId } = storeToRefs(profileStore);

// 2. Wypakowujemy stan z IncomeStore
const { incomes, isLoading, filteredTotalIncomes, totals, aggregated } = storeToRefs(incomeStore);

// Używamy zweryfikowanego ID profilu
const currentProfileId = computed(() => verifiedActiveProfileId.value);

// --- POMOCNICY DATY ---
/**
 * Zwraca datę w formacie YYYY-MM-DD.
 * Jeśli `isStart` jest true, zwraca pierwszy dzień miesiąca, w przeciwnym razie ostatni.
 */
const getDefaultDateForCurrentMonth = (isStart: boolean): string => {
  const now = new Date();
  let dateToSet: Date;

  if (isStart) {
    // Pierwszy dzień miesiąca (np. 2025-10-01)
    dateToSet = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    // Ostatni dzień miesiąca (np. 2025-10-31)
    dateToSet = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  const year = dateToSet.getFullYear();
  const month = String(dateToSet.getMonth() + 1).padStart(2, '0');
  const day = String(dateToSet.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;

  // // Formatowanie do YYYY-MM-DD, wymagane przez input type="date"
  // return dateToSet.toISOString().split('T')[0] || '';
};

// --- STAN FILTROWANIA DAT ---
// Domyślnie ustawiony jest bieżący miesiąc i jest aktywny, zgodnie z prośbą
const dateFrom = ref<string | null>(getDefaultDateForCurrentMonth(true));
const dateTo = ref<string | null>(getDefaultDateForCurrentMonth(false));
const isDateFromActive = ref(true);
const isDateToActive = ref(true);

/**
 * Uruchamia pobieranie wydatków z uwzględnieniem aktywnych filtrów dat.
 */
const applyFilter = async () => {
  // Czyścimy komunikaty przed rozpoczęciem operacji
  message.value = { text: '', type: null };
  const profileId = currentProfileId.value;

  if (profileId === null) {
    return;
  }

  // Określenie, które daty wysłać do backendu
  const start = isDateFromActive.value && dateFrom.value ? dateFrom.value : null;
  const end = isDateToActive.value && dateTo.value ? dateTo.value : null;

  // Walidacja zakresu dat
  if (start && end && start > end) {
    message.value = {
      text: 'Data początkowa nie może być późniejsza niż data końcowa.',
      type: 'error',
    };
    return;
  }

  try {
    const filters: IncomeFilterParams = {
      dateFrom: start,
      dateTo: end,
    };
    await incomeStore.fetchIncomes(profileId, filters);
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Resetuje daty filtrowania do bieżącego miesiąca i odświeża listę.
 */
const resetFilter = () => {
  dateFrom.value = getDefaultDateForCurrentMonth(true);
  dateTo.value = getDefaultDateForCurrentMonth(false);
  isDateFromActive.value = true;
  isDateToActive.value = true;
  applyFilter();
};

// --- REAKTYWNE ŁADOWANIE DANYCH ---
// Obserwujemy zmianę aktywnego ID profilu i wywołujemy fetchIncomes
watch(
  currentProfileId,
  (newId) => {
    // Sprawdzamy, czy mamy poprawne ID przed pobraniem
    if (newId !== null && newId !== 0) {
      incomeStore.fetchIncomes(newId);
    }
  },
  {
    immediate: true, // Uruchamia ładowanie przy pierwszym montowaniu
  },
);
// ---------------------------------

// --- STAN EDYCJI ---
const editingIncomeId = ref<number | null>(null);
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
 * Rozpoczyna tryb edycji dla wiersza wpłaty (tylko Kwota i Data).
 */
const startEdit = (income: Income) => {
  message.value = { text: '', type: null };
  editingIncomeId.value = income.id_income;
  tempAmount.value = income.amount / 100.0;
  tempDate.value = income.date.slice(0, 10);
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingIncomeId.value = null;
  message.value = { text: '', type: null };
};

/**
 * Zapisuje zaktualizowaną wpłatę (PUT) - tylko Kwota i Data.
 */
const saveEdit = async (income: Income) => {
  const newAmount = tempAmount.value;
  const newDate = tempDate.value;
  const originalSourceId = income.id_source;

  if (!newAmount || !newDate || !currentProfileId.value) {
    // Używamy currentProfileId
    message.value = { text: 'Kwota i data są wymagane.', type: 'error' };
    return;
  } // Sprawdzenie, czy coś się zmieniło

  const isChanged = newAmount !== income.amount / 100.0 || newDate !== income.date.slice(0, 10);

  if (!isChanged) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    const updateData = {
      id_income: income.id_income,
      amount: newAmount,
      date: newDate,
      profileId: currentProfileId.value, // Używamy zweryfikowanego ID
      sourceId: originalSourceId, // Wysyłamy pierwotne sourceId, zgodnie z API
    }; // Nie musimy wysyłać source_name, bo to pole tylko do wyświetlania w UI

    const result = await incomeStore.updateIncome(updateData);

    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie wpłaty (DELETE).
 */
const confirmDelete = async (incomeId: number, amount: number, profileId: number) => {
  // WAŻNE: Zgodnie z wytycznymi, usuwamy window.confirm().
  // W prawdziwej aplikacji, w tym miejscu powinno być wywołanie
  // niestandardowego komponentu modalnego.
  // Na razie dodajemy log, by symulować potwierdzenie
  // console.log(
  //   `Prośba o usunięcie wpłaty ID: ${incomeId} (kwota: ${amount.toFixed(2)} zł). Potwierdzenie UI jest wymagane.`,
  // ); // Symulacja anulowania: jeśli chcielibyśmy pokazać logikę
  // if (!isConfirmed) { return; }
  // if (!currentProfileId.value) {
  //   // Używamy currentProfileId
  //   message.value = { text: 'Brak aktywnego profilu, nie można usunąć.', type: 'error' };
  //   return;
  // }

  // message.value = { text: 'Trwa usuwanie...', type: null };

  // try {
  //   const result = await incomeStore.deleteIncome(incomeId, currentProfileId.value);
  //   message.value = { text: result.message, type: 'success' };
  // } catch (error) {
  //   message.value = { text: (error as Error).message, type: 'error' };
  // }

  if (profileId !== verifiedActiveProfileId.value) {
    message.value = {
      text: 'Błąd: Aktywny profil nie jest zgodny z profilem wpłaty. Odśwież stronę.',
      type: 'error',
    };
    return;
  }
  if (
    !showConfirmModal(
      `Czy na pewno chcesz usunąć wpłatę ID: ${incomeId} (kwota: ${(amount / 100.0).toFixed(2)} zł). Potwierdzenie UI jest wymagane.`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await incomeStore.deleteIncome(incomeId, profileId);

    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};
</script>

<template>
  <div class="table-container income-list-container padding-left padding-right">
    <h3 class="form-title expense-title-border">Wszystkie Wpłaty</h3>
    <p class="expense-summary-box">
      <span>
        Wszystkie wpłaty:
        <span class="expense-summary-amount">
          {{ (totals.AllTimeIncomes / 100.0).toFixed(2) }} zł</span
        >
      </span>
      <span>
        Wpłaty w tym roku:
        <span class="expense-summary-amount"
          >{{ (totals.CurrentYearIncomes / 100.0).toFixed(2) }} zł</span
        >
      </span>
      <span>
        Wpłaty w tym miesiącu:
        <span class="expense-summary-amount"
          >{{ (totals.CurrentMonthIncomes / 100.0).toFixed(2) }} zł</span
        >
      </span>
    </p>

    <table class="data-table">
      <thead>
        <tr>
          <th class="table-header">Źródło</th>
          <th class="table-header">Kwota łączna</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="agg in aggregated" :key="agg.source_name" class="table-row income-row-hover">
          <td class="table-cell">{{ agg.source_name }}</td>
          <td class="table-cell income-amount-cell">{{ (agg.total / 100.0).toFixed(2) }} PLN</td>
        </tr>
      </tbody>
    </table>

    <h3 class="form-title income-title-border">Ostatnie Wpłaty</h3>

    <div class="filter-panel">
      <div class="inline">
        <div class="filter-group">
          <div class="inline">
            <input type="checkbox" id="checkStart" v-model="isDateFromActive" />
            <label for="checkStart" class="form-label">Od daty:</label>
          </div>
          <input
            type="date"
            id="dateFrom"
            v-model="dateFrom"
            :disabled="!isDateFromActive"
            class="form-input"
            :class="{ 'opacity-50 bg-gray-100': !isDateFromActive }"
          />
        </div>
        <div class="filter-group">
          <div class="inline">
            <input type="checkbox" id="checkEnd" v-model="isDateToActive" />
            <label for="checkEnd" class="form-label">Do daty:</label>
          </div>
          <input
            type="date"
            id="dateTo"
            v-model="dateTo"
            :disabled="!isDateToActive"
            class="form-input"
            :class="{ 'opacity-50 bg-gray-100': !isDateToActive }"
          />
        </div>
      </div>
      <div class="inline">
        <button @click="applyFilter" :disabled="isLoading" class="btn-primary-small w-full">
          <span v-if="isLoading">Filtrowanie...</span>
          <span v-else>Filtruj</span>
        </button>
        <button @click="resetFilter" :disabled="isLoading" class="btn-secondary-small w-full">
          Reset
        </button>
      </div>
    </div>

    <div
      v-if="message.text"
      class="msg-box"
      :class="{
        'msg-success': message.type === 'success',
        'msg-error': message.type === 'error',
      }"
    >
      {{ message.text }}
    </div>
    <p class="income-summary-box">
      Łączna kwota wpłat:
      <span class="income-summary-amount">{{ (filteredTotalIncomes / 100.0).toFixed(2) }} zł</span>
    </p>
    <div v-if="isLoading" class="text-center p-8 text-gray-500">Ładowanie danych wpłat...</div>
    <div v-else-if="incomes.length > 0" class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">ID</th>
            <th class="table-header">Kwota</th>
            <th class="table-header">Data</th>
            <th class="table-header">Źródło</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="income in incomes" :key="income.id_income" class="table-row income-row-hover">
            <td class="table-cell">{{ income.id_income }}</td>
            <td class="table-cell income-amount-cell">
              <template v-if="editingIncomeId === income.id_income">
                <input
                  type="number"
                  v-model.number="tempAmount"
                  step="0.01"
                  class="form-input"
                  style="width: 80px; padding: 0.3rem"
                />
              </template>
              <template v-else> {{ (income.amount / 100.0).toFixed(2) }} PLN </template>
            </td>
            <td class="table-cell">
              <template v-if="editingIncomeId === income.id_income">
                <input
                  type="date"
                  v-model="tempDate"
                  class="form-input"
                  style="width: 120px; padding: 0.3rem"
                />
              </template>
              <template v-else>
                {{ income.date.slice(0, 10) }}
              </template>
            </td>
            <td class="table-cell">{{ income.source_name }}</td>
            <td class="table-cell actions-cell">
              <template v-if="editingIncomeId === income.id_income">
                <button @click="saveEdit(income)" class="btn-action btn-edit-save mr-2">
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </template>
              <template v-else>
                <button
                  @click="startEdit(income)"
                  class="btn-action btn-edit mr-2"
                  :disabled="!!editingIncomeId"
                >
                  Edytuj
                </button>
                <button
                  @click="confirmDelete(income.id_income, income.amount, income.fk_profile)"
                  class="btn-action btn-delete-income"
                  :disabled="!!editingIncomeId"
                >
                  Usuń
                </button>
              </template>
            </td>
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
/* Lokalny kontener, aby uniknąć kolizji z form-container (choć używa tego samego stylu cienia) */
.income-list-container {
  /* Nadpisujemy domyślny margin-top, aby był taki jak w formularzach */
  margin-top: 1.5rem;
}

/* Tytuł i obramowanie */
.income-title-border {
  color: #059669; /* green-600 */
  border-bottom: 1px solid #d1d5db; /* gray-300 */
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem; /* text-2xl z oryginalnego kodu */
}

/* Sekcja Sumaryczna */
.income-summary-box {
  padding: 0.75rem;
  background-color: #ecfdf5; /* green-50 */
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  font-size: 1.125rem; /* text-lg */
}

.income-summary-amount {
  font-weight: 700;
  color: #047857; /* green-700 */
}

/* Wiersz po najechaniu myszą (hover) */
.income-row-hover:hover {
  background-color: #f0fdf4 !important; /* Lżejszy green-50 */
}

/* Kolor kwoty */
.income-amount-cell {
  font-weight: 500;
  color: #059669; /* green-600 */
}

/* Specjalny styl dla przycisku usuwania, aby był zielony (mniej drastyczny niż czerwony) */
.btn-delete-income {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s;
  color: #10b981; /* green-500 */
}

.btn-delete-income:hover {
  background-color: #d1fae5; /* green-100 */
}
</style>
