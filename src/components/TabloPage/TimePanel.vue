<script setup lang="ts">
import { useTime } from 'vue-timer-hook'
import { computed } from 'vue'
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
<template>
  <div class="columns">
    <div class="column"></div>
    <div class="column is-half">
      <div class="title is-2">
        <p class="has-text-left fefu-white">
        {{ hours }}:{{ minutes }}:{{ seconds }}
        </p>
      </div>
    </div>
  </div>
</template>
<style>
    
</style>