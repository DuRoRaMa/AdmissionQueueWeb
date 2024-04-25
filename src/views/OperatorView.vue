<script setup lang="ts">
import { NotificationProgrammatic } from '@ntohq/buefy-next'
import { getAPIData } from '@/axios'
import { onMounted, reactive } from 'vue'
import { useAuth } from 'vue-auth3'
import { useRouter } from 'vue-router'
import type { OperatorSettings, TalonPurpose } from '@/types'
const auth = useAuth()
const router = useRouter()
const Notification = new NotificationProgrammatic()
let currentSettings: OperatorSettings | null = null
let purposes = reactive<TalonPurpose[]>([])
onMounted(() => {
  getAPIData('/queue/settings', auth, (response) => {
    currentSettings = response.data as OperatorSettings
    if (currentSettings.location === null || currentSettings.purposes.length === 0) {
      Notification.open({
        message: `Настройки оператора должны быть заполнены`,
        duration: 5000,
        type: 'is-warning',
        pauseOnHover: true
      })
      router.push({ name: 'operator_settings' })
    }
  })
  getAPIData('/queue/purposes', auth, (response) => {
    purposes.push(...(response.data as TalonPurpose[]))
  })
})
</script>
<template>
  <div class="hero is-medium container">
    <div class="hero-body">
      <div class="columns">
        <div class="column is-one-quarter"></div>
        <div class="column">
          Панель оператора
          <div class="column">Цели посещения:</div>
          <div class="column"></div>
        </div>
        <div class="column is-one-quarter"></div>
      </div>
    </div>
  </div>
</template>
