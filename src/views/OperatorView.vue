<script setup lang="ts">
import { NotificationProgrammatic } from '@ntohq/buefy-next'
import { getAPIData, postAPIData } from '@/axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useAuth } from 'vue-auth3'
import { useRouter } from 'vue-router'
import type { OperatorSettings } from '@/types'
import { useLazyQuery, useQuery } from '@vue/apollo-composable'
import { GET_TALON_BY_ID } from '@/queries'

const auth = useAuth()
const router = useRouter()
const Notification = new NotificationProgrammatic()
let currentSettings: OperatorSettings | null = null
let currentTalon = ref({})
let currentTalonId = ref(null)
const talonStatus = computed(() => {
  if (!currentTalon.value?.name) return 'NOT_ASSIGNED'
  return currentTalon.value.logs.at(-1).action
})
let disabledStateOfButtons = ref({
  next: true,
  notify: true,
  cancel: true,
  start: true,
  complete: true,
  redirect: true
})
watch(
  talonStatus,
  (newStatus, oldStatus) => {
    switch (newStatus) {
      case 'NOT_ASSIGNED':
        disabledStateOfButtons.value.next = false
        break
      case 'ASSIGNED':
        disabledStateOfButtons.value.next = true
        disabledStateOfButtons.value.notify = false
        disabledStateOfButtons.value.start = false
        disabledStateOfButtons.value.redirect = false
        disabledStateOfButtons.value.cancel = false
        break
      case 'CANCELED':
        disabledStateOfButtons.value.cancel = false
        break
      case 'STARTED':
        disabledStateOfButtons.value.next = true
        disabledStateOfButtons.value.start = true
        disabledStateOfButtons.value.complete = false
        disabledStateOfButtons.value.redirect = false
        break
      case 'COMPLETED':
        disabledStateOfButtons.value.complete = true
      default:
        break
    }
  },
  { immediate: true }
)
function getNextTalon() {
  disabledStateOfButtons.value.next = true
  getAPIData(
    '/queue/operator/talon/action',
    auth,
    (response) => {
      if (response.data.id) {
        currentTalonId.value = response.data.id
        enabledTalonById.value = true
      } else {
        disabledStateOfButtons.value.next = false
      }
    },
    { action: 'next' }
  )
}
function startTalon() {
  disabledStateOfButtons.value.start = true
  postAPIData(
    '/queue/operator/talon/action',
    null,
    auth,
    (response) => {
      if (response.status === 200) {
        talonById.refetch()
      }
    },
    {
      action: 'start'
    }
  )
}
function completeTalon() {
  disabledStateOfButtons.value.complete = true
  postAPIData(
    '/queue/operator/talon/action',
    null,
    auth,
    (response) => {
      if (response.status === 200) {
        currentTalon.value = {}
        enabledTalonById.value = false
        currentTalonId.value = null
        enabledTalonById.value = true
      }
    },
    {
      action: 'complete'
    }
  )
}
const enabledTalonById = ref(false)
let talonById = useQuery(
  GET_TALON_BY_ID,
  { id: currentTalonId },
  { enabled: enabledTalonById, fetchPolicy: 'cache-and-network' }
)
talonById.onResult((res) => {
  if (res.loading) return null
  currentTalon.value = res.data.talonById
})
onMounted(() => {
  getAPIData('/queue/operator/settings', auth, (response) => {
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
  getAPIData(
    '/queue/operator/talon/action',
    auth,
    (response) => {
      if (response.data.id) {
        currentTalonId.value = response.data.id
        enabledTalonById.value = true
      }
    },
    { action: 'current' }
  )
})
</script>
<template>
  <div class="columns">
    <div class="column">
      <p class="title">Панель оператора</p>
      <div class="columns">
        <div class="column is-one-third">
          <div class="fixed-grid has-3-cols">
            <div class="grid">
              <b-button
                @click="getNextTalon()"
                class="cell"
                type="is-link"
                :disabled="disabledStateOfButtons.next"
              >
                Следующий
              </b-button>
              <b-button class="cell" type="is-warning" :disabled="disabledStateOfButtons.notify"
                >Позвать</b-button
              >
              <b-button class="cell" type="is-danger" :disabled="disabledStateOfButtons.cancel"
                >Отменить</b-button
              >
              <b-button
                v-if="!disabledStateOfButtons.start"
                @click="startTalon()"
                class="cell"
                type="is-success"
                :disabled="disabledStateOfButtons.start"
                >Начать</b-button
              >
              <b-button
                v-else
                @click="completeTalon()"
                class="cell"
                type="is-success"
                :disabled="disabledStateOfButtons.complete"
                >Завершить</b-button
              >
              <b-button
                class="cell"
                type="is-warning is-light"
                :disabled="disabledStateOfButtons.redirect"
                >Переадресовать</b-button
              >
              <b-button class="cell" type="is-info">Помощь</b-button>
            </div>
          </div>
        </div>
        <div class="column"></div>
      </div>
      <div class="block">
        <p>Информация об абитуриенте</p>
        <div v-if="currentTalon?.name">
          <div>Номер талона: {{ currentTalon.name }}</div>
          <div>
            Время регистрации:
            {{
              new Date(
                currentTalon.logs.filter((x: any) => x.action === 'CREATED')[0].createdAt
              ).toLocaleString() || ''
            }}
          </div>
          <div>Статус: {{ currentTalon.logs.at(-1).action || '' }}</div>
          <div>Цель: {{ currentTalon.purpose.name || '' }}</div>
          <div>
            Комментарии:
            {{ talonById.result.value?.talonById.logs.map((x: any) => x.comment) || '' }}
          </div>
        </div>
        <div v-else>
          <div>Номер талона:</div>
          <div>Время регистрации:</div>
          <div>Статус:</div>
          <div>Цель:</div>
          <div>Комментарии:</div>
        </div>
        <input type="text" v-model="currentTalonId" />
      </div>
    </div>
  </div>
</template>
