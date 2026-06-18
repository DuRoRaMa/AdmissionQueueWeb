<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    data?: number[]
    talon_purposes?: string[]
  }>(),
  {
    data: () => [],
    talon_purposes: () => []
  }
)

const series = reactive<number[]>([])
const labels = reactive<string[]>([])

const chartOptions = {
  chart: {
    type: 'pie'
  },
  labels,
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  ],
  noData: {
    text: 'Нет данных'
  }
}

watch(
  () => [props.data, props.talon_purposes],
  () => {
    series.splice(0, series.length)
    labels.splice(0, labels.length)

    series.push(...props.data)
    labels.push(...props.talon_purposes)
  },
  { immediate: true }
)
</script>

<template>
  <apexchart type="pie" width="380" :options="chartOptions" :series="series" />
</template>
