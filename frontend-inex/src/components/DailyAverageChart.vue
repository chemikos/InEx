<script lang="ts" setup>
import { computed, watch } from 'vue';
import ApexChart from 'vue3-apexcharts';
import { useDailyAverageStore } from '@/stores/dailyAverageStore';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profileStore';

const profileStore = useProfileStore();
const { verifiedActiveProfileId } = storeToRefs(profileStore);
// const props = defineProps<{
//   profileId: number;
// }>();

const dailyAverageStore = useDailyAverageStore();

watch(
  verifiedActiveProfileId,
  (newProfileId) => {
    if (newProfileId) {
      dailyAverageStore.fetchDailyAverage(newProfileId);
    }
  },
  { immediate: true },
);

const series = computed(() => [
  {
    name: 'Średnia historyczna',
    data: dailyAverageStore.data.value.map((d) => ({
      x: d.date,
      y: d.historical_avg / 100,
    })),
  },
  {
    name: 'Średnia miesięczna',
    data: dailyAverageStore.data.value.map((d) => ({
      x: d.date,
      y: d.monthly_avg / 100,
    })),
  },
]);

const monthSeparators = computed(() => {
  const seen = new Set<string>();

  return dailyAverageStore.data.value
    .filter((d) => {
      const isFirstDay = d.date.endsWith('-01');
      const month = d.date.slice(0, 7);

      if (isFirstDay && !seen.has(month)) {
        seen.add(month);
        return true;
      }
      return false;
    })
    .map((d) => ({
      x: d.date,
      borderColor: '#CBD5E1',
      strokeDashArray: 4,
      label: {
        text: d.date.slice(0, 7),
        style: {
          fontSize: '10px',
          color: '#64748B',
        },
      },
    }));
});


const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
  },
  annotations: {
    xaxis: monthSeparators.value,
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  // markers: {
  //   size: 0,
  // },
  // dataLabels: {
  //   enabled: false,
  // },
  xaxis: {
    type: 'category',
    tickAmount: 20, // ← ile etykiet maksymalnie
    labels: {
      rotate: -90,
      hideOverlappingLabels: false,
      // formatter: (value: string) => value.slice(0, 7), // YYYY-MM
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `${val.toFixed(2)} zł`,
    },
  },
  tooltip: {
    x: {
      format: 'yyyy-MM-dd',
    },
    y: {
      formatter: (val: number) => `${val.toFixed(2)} zł`,
    },
  },
}));
</script>

<template>
  <div>
    <apexchart
      v-if="series.length"
      type="line"
      height="500"
      :options="chartOptions"
      :series="series"
    />
    <div v-else>Brak danych</div>
  </div>
</template>
