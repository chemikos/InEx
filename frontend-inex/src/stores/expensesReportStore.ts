// // src/stores/expensesReportStore.ts

// import { defineStore, storeToRefs } from 'pinia'; // Dodano storeToRefs
// import { ref, computed } from 'vue';
// import http from '@/api/http';
// import { isAxiosError } from 'axios';
// import { useProfileStore } from './profileStore'; // Importujemy useProfileStore

// // Definicja typu
// interface ExpenseRow {
//   id: number;
//   name: string;
//   total: number;
//   year: Record<string, number>;
//   month: Record<string, number>;
//   expanded?: boolean;
//   items?: Row[];
// }

// interface Row {
//   id: number;
//   name: string;
//   expense: number;
// }

// interface CategoryRow extends Row {}

// const categories = ref<CategoryRow[]>([]);
// const labels = ref<LabelRow[]>([]);
// const items = ref<ItemRow[]>([]);
// const summary = ref<SummaryData | null>(null);

// const loading = ref(false);
// const error = ref<string | null>(null);

// export const useExpensesReportStore = defineStore('expensesReport', () => {
//   const data = ref(null);
//   const loading = ref(false);

//   async function fetchReport(profileId: number) {
//     loading.value = true;
//     const res = await http.get(`/reports/expenses?profileId=${profileId}`);
//     data.value = res.data;
//     loading.value = false;
//   }

//   return { data, fetchReport, loading };
// });

// async function fetchCategoryItems(profileId: number, categoryId: number, period: string) {
//   const res = await http.get(`/reports/expenses/${categoryId}/items`, {
//     params: { profileId, period },
//   });
//   return res.data;
// }

import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '@/api/http';

/**
 * Jeden wspólny model dla category / label / item
 */
export interface ExpenseRow {
  id: number;
  name: string;

  total: number;
  year: Record<string, number>;
  month: Record<string, number>;

  expanded?: boolean;
  children?: ExpenseRow[];
}

/**
 * Summary (dochody / bilans)
 */
export interface SummaryRow {
  period: string;
  income: number;
  expense: number;
  balance: number;
  cumulative_balance?: number;
}

interface RawDimensionRow {
  period: string;
  dimension_id: number;
  dimension_name: string;
  expense: number;
}

interface RawPeriodsResponse {
  month: RawDimensionRow[];
  year: RawDimensionRow[];
  total: RawDimensionRow[];
}

export const useExpensesReportStore = defineStore('expensesReport', () => {
  // ============================
  // STATE
  // ============================

  const categories = ref<ExpenseRow[]>([]);
  const labels = ref<ExpenseRow[]>([]);
  const items = ref<ExpenseRow[]>([]);
  const summary = ref<{
    month: SummaryRow[];
    year: SummaryRow[];
    total: SummaryRow[];
  } | null>(null);

  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============================
  // NORMALIZACJA
  // ============================

  function mergePeriods(raw: RawPeriodsResponse): ExpenseRow[] {
    const map = new Map<number, ExpenseRow>();

    function ensureRow(row: RawDimensionRow): ExpenseRow {
      if (!map.has(row.dimension_id)) {
        map.set(row.dimension_id, {
          id: row.dimension_id,
          name: row.dimension_name,
          total: 0,
          year: {},
          month: {},
        });
      }
      return map.get(row.dimension_id)!;
    }

    // MONTH
    for (const r of raw.month) {
      const row = ensureRow(r);
      row.month[r.period] = r.expense;
    }

    // YEAR
    for (const r of raw.year) {
      const row = ensureRow(r);
      row.year[r.period] = r.expense;
    }

    // TOTAL
    for (const r of raw.total) {
      const row = ensureRow(r);
      row.total = r.expense;
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ============================
  // ACTIONS
  // ============================

  async function fetchReport(profileId: number) {
    loading.value = true;
    error.value = null;

    try {
      const res = await http.get(`/reports/expenses`, {
        params: { profileId },
      });

      const data = res.data;

      categories.value = mergePeriods(data.categories);
      labels.value = mergePeriods(data.labels);
      items.value = mergePeriods(data.items);

      summary.value = data.summary;
    } catch (e: any) {
      error.value = e?.message ?? 'Błąd podczas pobierania raportu';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Lazy loading itemów dla kategorii
   */
  async function fetchCategoryItems(
    profileId: number,
    categoryId: number,
    period: string,
  ): Promise<ExpenseRow[]> {
    try {
      const res = await http.get(`/reports/expenses/${categoryId}/items`, {
        params: { profileId, period },
      });

      return res.data.map((i: any) => ({
        id: i.id_item,
        name: i.item_name,
        total: i.total_expenses,
        year: {},
        month: {},
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Expand + pobranie children tylko raz
   */
  async function toggleCategory(profileId: number, category: ExpenseRow, period: string) {
    category.expanded = !category.expanded;

    if (category.expanded && !category.children) {
      category.children = await fetchCategoryItems(profileId, category.id, period);
    }
  }

  function reset() {
    categories.value = [];
    labels.value = [];
    items.value = [];
    summary.value = null;
  }

  return {
    // state
    categories,
    labels,
    items,
    summary,
    loading,
    error,

    // actions
    fetchReport,
    toggleCategory,
    reset,
  };
});

// selectedPeriodType: 'month' | 'year' | 'total'
// selectedPeriod: string
