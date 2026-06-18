<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

interface RatingOperatorData {
  data: object[];
  operator: string[];
}

const props = withDefaults(
  defineProps<{
    data?: RatingOperatorData;
  }>(),
  {
    data: () => ({
      data: [],
      operator: []
    })
  }
);

const series = reactive<object[]>([]);
const labels = reactive<string[]>([]);

const chartOptions = {
  chart: {
    type: 'bar',
    stacked: true
  },
  plotOptions: {
    bar: {
      horizontal: true
    }
  },
  xaxis: {
    categories: labels
  },
  noData: {
    text: 'Нет данных'
  }
};

const height = computed(() => {
  return Math.max(400, 10 * labels.length);
});

watch(
  () => props.data,
  (newData) => {
    series.splice(0, series.length);
    labels.splice(0, labels.length);

    series.push(...newData.data);
    labels.push(...newData.operator);
  },
  { immediate: true }
);
</script>

<template>
  <apexchart
    type="bar"
    :height="height"
    width="400"
    :options="chartOptions"
    :series="series"
  />
</template>
