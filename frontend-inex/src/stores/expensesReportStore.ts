// src/stores/expensesReportStore.ts

import { defineStore, storeToRefs } from 'pinia'; // Dodano storeToRefs
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';
import { useProfileStore } from './profileStore'; // Importujemy useProfileStore

// Definicja typu
interface ExpenseRow {
  id: number;
  name: string;
  total: number;
  year: Record<string, number>;
  month: Record<string, number>;
  expanded?: boolean;
  items?: Row[];
}

interface Row {
  id: number;
  name: string;
  expense: number;
}

interface CategoryRow extends Row {}

const categories = ref<CategoryRow[]>([]);
const labels = ref<LabelRow[]>([]);
const items = ref<ItemRow[]>([]);
const summary = ref<SummaryData | null>(null);

const loading = ref(false);
const error = ref<string | null>(null);

export const useExpensesReportStore = defineStore('expensesReport', () => {
  const data = ref(null);
  const loading = ref(false);

  async function fetchReport(profileId: number) {
    loading.value = true;
    const res = await http.get(`/reports/expenses?profileId=${profileId}`);
    data.value = res.data;
    loading.value = false;
  }

  return { data, fetchReport, loading };
});

async function fetchCategoryItems(profileId: number, categoryId: number, period: string) {
  const res = await http.get(`/reports/expenses/${categoryId}/items`, {
    params: { profileId, period },
  });
  return res.data;
}
