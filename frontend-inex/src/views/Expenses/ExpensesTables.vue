<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import http from '@/api/http';

interface SummaryRecord {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

interface CategoryRecord {
  period: string;
  dimension_id: number;
  dimension_name: string;
  expense: number;
}

interface ItemRecord {
  item_name: string;
  id_item: number;
  total_expenses: number;
  expense_count: number;
}

interface RowData {
  id?: number;
  description: string;
  total: number;
  yearVal: number;
  months: Array<number | null>;
  expanded?: boolean;
  items?: RowData[];
}

const profileId = 1; // hardcoded for now
const year = ref(new Date().getFullYear());

const summary = ref<{
  month: SummaryRecord[];
  year: SummaryRecord[];
  total: SummaryRecord[];
} | null>(null);
const categories = ref<{
  month: CategoryRecord[];
  year: CategoryRecord[];
  total: CategoryRecord[];
} | null>(null);

import { watch } from 'vue';

const monthNames = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

const numberFormatter = new Intl.NumberFormat('pl-PL');

const incomeRow = ref<RowData | null>(null);
const expenseRow = ref<RowData | null>(null);
const balanceRow = ref<RowData | null>(null);
const categoryRows = ref<RowData[]>([]);

function prepareTable() {
  if (!summary.value || !categories.value) return;

  const yearStr = year.value.toString();

  function makeMonthsData(id: number): Array<number | null> {
    const result: Array<number | null> = [];
    for (let m = 1; m <= 12; m++) {
      const period = `${yearStr}-${m.toString().padStart(2, '0')}`;
      const rec = categories.value!.month.find((r) => r.dimension_id === id && r.period === period);
      result.push(rec ? rec.expense : null);
    }
    return result;
  }

  // summary rows
  const totalSummary = summary.value.total.find((r) => r.period.toLowerCase() === 'total');
  const yearSummary = summary.value.year.find((r) => r.period === yearStr);

  incomeRow.value = {
    description: 'Wpływy',
    total: totalSummary ? totalSummary.income : 0,
    yearVal: yearSummary ? yearSummary.income : 0,
    months: [],
  };
  expenseRow.value = {
    description: 'Wydatki',
    total: totalSummary ? totalSummary.expense : 0,
    yearVal: yearSummary ? yearSummary.expense : 0,
    months: [],
  };
  balanceRow.value = {
    description: 'Bilans',
    total: totalSummary ? totalSummary.balance : 0,
    yearVal: yearSummary ? yearSummary.balance : 0,
    months: [],
  };

  // fill monthly details for summary rows
  for (let m = 1; m <= 12; m++) {
    const period = `${yearStr}-${m.toString().padStart(2, '0')}`;
    const rec = summary.value.month.find((r) => r.period === period);
    incomeRow.value.months.push(rec ? rec.income : null);
    expenseRow.value.months.push(rec ? rec.expense : null);
    balanceRow.value.months.push(rec ? rec.balance : null);
  }

  // categories
  categoryRows.value = categories.value.year
    .filter((r) => r.period === yearStr)
    .map((r) => {
      const totalRec = categories.value!.total.find((t) => t.dimension_id === r.dimension_id);
      return {
        id: r.dimension_id,
        description: r.dimension_name,
        total: totalRec ? totalRec.expense : r.expense,
        yearVal: r.expense,
        months: makeMonthsData(r.dimension_id),
        expanded: false,
        items: [],
      } as RowData;
    });
}

async function fetchReport() {
  try {
    const resp = await http.get(`/reports/expenses?profileId=${profileId}`);
    categories.value = resp.data.categories;
    summary.value = resp.data.summary;
    prepareTable();
  } catch (err) {
    console.error('Nie udało się pobrać raportu', err);
  }
}

async function toggleCategory(row: RowData) {
  if (!row.id) return;
  if (!row.expanded) {
    // fetch items for year
    const resp = await http.get(
      `/reports/expenses/${row.id}/items?profileId=${profileId}&period=${year.value}`,
    );
    const items: ItemRecord[] = resp.data;
    row.items = items.map((i) => ({
      description: i.item_name,
      total: i.total_expenses,
      yearVal: i.total_expenses,
      months: Array(12).fill(null),
    }));
  }
  row.expanded = !row.expanded;
}

onMounted(fetchReport);

watch(year, () => {
  prepareTable();
});
</script>

<template>
  <div class="p-8 bg-white shadow-lg rounded-lg">
    <h1 class="text-3xl font-bold mb-4 text-gray-700">Tabele (Agregacje Wydatków)</h1>

    <div class="mb-4">
      <label for="yearSelect" class="mr-2">Rok:</label>
      <select id="yearSelect" v-model="year" @change="prepareTable" class="border px-2 py-1">
        <option v-for="rec in summary?.year" :key="rec.period" :value="Number(rec.period)">
          {{ rec.period }}
        </option>
      </select>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left">Opis</th>
            <th class="px-4 py-2 text-right">Suma całkowita</th>
            <th class="px-4 py-2 text-right">Suma {{ year }}</th>
            <th v-for="(m, idx) in monthNames" :key="idx" class="px-4 py-2 text-right">
              {{ m }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="incomeRow">
            <td class="px-4 py-2 font-semibold">{{ incomeRow.description }}</td>
            <td class="px-4 py-2 text-right">{{ numberFormatter.format(incomeRow.total) }}</td>
            <td class="px-4 py-2 text-right">{{ numberFormatter.format(incomeRow.yearVal) }}</td>
            <td v-for="(val, idx) in incomeRow.months" :key="idx" class="px-4 py-2 text-right">
              {{ val !== null ? numberFormatter.format(val) : '-' }}
            </td>
          </tr>

          <tr v-if="expenseRow">
            <td class="px-4 py-2 font-semibold">{{ expenseRow.description }}</td>
            <td class="px-4 py-2 text-right">{{ numberFormatter.format(expenseRow.total) }}</td>
            <td class="px-4 py-2 text-right">{{ numberFormatter.format(expenseRow.yearVal) }}</td>
            <td v-for="(val, idx) in expenseRow.months" :key="idx" class="px-4 py-2 text-right">
              {{ val !== null ? numberFormatter.format(val) : '-' }}
            </td>
          </tr>

          <tr v-if="balanceRow">
            <td class="px-4 py-2 font-semibold">{{ balanceRow.description }}</td>
            <td class="px-4 py-2 text-right">{{ numberFormatter.format(balanceRow.total) }}</td>
            <td class="px-4 py-2 text-right">{{ numberFormatter.format(balanceRow.yearVal) }}</td>
            <td v-for="(val, idx) in balanceRow.months" :key="idx" class="px-4 py-2 text-right">
              {{ val !== null ? numberFormatter.format(val) : '-' }}
            </td>
          </tr>

          <template v-for="row in categoryRows" :key="row.id">
            <tr class="cursor-pointer hover:bg-gray-100" @click="toggleCategory(row)">
              <td class="px-4 py-2">
                <span class="mr-2">
                  {{ row.expanded ? '▾' : '▸' }}
                </span>
                {{ row.description }}
              </td>
              <td class="px-4 py-2 text-right">{{ numberFormatter.format(row.total) }}</td>
              <td class="px-4 py-2 text-right">{{ numberFormatter.format(row.yearVal) }}</td>
              <td v-for="(val, idx) in row.months" :key="idx" class="px-4 py-2 text-right">
                {{ val !== null ? numberFormatter.format(val) : '-' }}
              </td>
            </tr>
            <tr v-if="row.expanded" v-for="item in row.items" :key="item.description">
              <td class="px-4 py-2 pl-8 text-sm text-gray-700">{{ item.description }}</td>
              <td class="px-4 py-2 text-right">{{ numberFormatter.format(item.total) }}</td>
              <td class="px-4 py-2 text-right">{{ numberFormatter.format(item.yearVal) }}</td>
              <td v-for="(_, idx) in monthNames" :key="idx" class="px-4 py-2 text-right">-</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <p class="mt-4 text-sm text-gray-500">Routing: /dashboard/wydatki/tabele</p>
  </div>
</template>
