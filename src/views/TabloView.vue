<script setup lang="ts">
import { computed } from 'vue'
import { useTime } from 'vue-timer-hook'
const time = useTime('24-hour')
const hours = computed(() => {
  return time.hours.value.toLocaleString('ru-ru', { minimumIntegerDigits: 2 })
})
const minutes = computed(() => {
  return time.minutes.value.toLocaleString('ru-ru', { minimumIntegerDigits: 2 })
})
const seconds = computed(() => {
  return time.seconds.value.toLocaleString('ru-ru', { minimumIntegerDigits: 2 })
})
</script>
<template lang="">
  <div class="columns">
    <div class="column auto"></div>
    <div class="column is-one-quarter">
      <div class="title is-2">{{ hours }}:{{ minutes }}:{{ seconds }}</div>
    </div>
  </div>
</template>
<style lang=""></style>
