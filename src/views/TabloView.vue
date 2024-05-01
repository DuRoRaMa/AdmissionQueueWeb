<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useTime } from 'vue-timer-hook'
import { useWebSocket } from '@vueuse/core'
import InProgressRaw from '@/components/TabloPage/InProgressRaw.vue'

const { status, data, send, open, close } = useWebSocket(`${import.meta.env.VITE_WS_URL}/tablo`, {
  autoReconnect: true,
  onMessage(ws, event) {
    const data = JSON.parse(event.data)
    let type = data.type
    let message = data.message
    console.log(type, data)

    switch (type) {
      case 'tablo.status':
        tabloStatusData.talons = message.talons
        tabloStatusData.talonLog = message.talonLog
        break

      default:
        break
    }
  }
})
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
const tabloStatusData = reactive({ talons: [], talonLog: { id: -1 } })
</script>
<template lang="">
  <div class="columns">
    <div class="column auto"></div>
    <div class="column is-one-quarter">
      <div class="title is-2">{{ hours }}:{{ minutes }}:{{ seconds }}</div>
    </div>
  </div>
  <div class="columns has-text-centered">
    <div class="column">
      <div class="fixed-grid has-1-cols">
        <div class="grid">
          <div class="cell">Ваша очередь</div>
        </div>
      </div>
    </div>
    <div class="column">
      <div class="fixed-grid has-2-cols">
        <div class="grid">
          <div class="cell">Талон</div>
          <div class="cell">Окно</div>
          <InProgressRaw v-for="talon in tabloStatusData.talons" :talon="talon" :key="talon.id" />
        </div>
      </div>
    </div>
  </div>
</template>
<style lang=""></style>
