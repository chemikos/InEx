import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '@/api/http';

export interface DailyAveragePoint {
  date: string;
  historical_avg: number; // integer (grosze)
  monthly_avg: number; // integer (grosze)
}

export function useDailyAverageStore() {
  const data = ref<DailyAveragePoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDailyAverage(profileId: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await http.get(`/reports/daily-average?profileId=${profileId}`);
      data.value = response.data.data.map((row: any) => ({
        date: row.date,
        historical_avg: row.historicalAverage,
        monthly_avg: row.monthlyAverage,
      }));
    } catch (err: any) {
      error.value = err.message ?? 'Błąd pobierania danych';
    } finally {
      loading.value = false;
    }
  }

  return {
    data,
    loading,
    error,
    fetchDailyAverage,
  };
}
