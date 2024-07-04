<script setup lang="ts">
import { reactive } from 'vue';

const series = reactive([44, 55, 13, 43, 22]);
const chartOptions = {
  chart: {
    type: 'pie'
  },
  labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  ],
  noData: { text: 'Нет данных' }
};
</script>
<template>
  <apexchart type="pie" width="380" :options="chartOptions" :series="series" />
</template>
