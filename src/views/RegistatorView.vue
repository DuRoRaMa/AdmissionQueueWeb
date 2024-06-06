<script setup lang="ts">
import { getAPIData, postAPIData } from '@/axios'
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { useAuth } from 'vue-auth3'
import type { TalonPurpose } from '@/types'
import { NotificationProgrammatic } from '@ntohq/buefy-next'
import { useLazyQuery } from '@vue/apollo-composable'
import { GET_TALON_BY_ID } from '@/queries'

const auth = useAuth()
const Notification = new NotificationProgrammatic()
let currentPurpose = ref(0)
let currentComment = ref('')
let loadingRegister = ref(false)
let purposes = reactive<TalonPurpose[]>([])
let lastTalonId = ref(0)
let lastTalonById = ref({})
let talonById = useLazyQuery(GET_TALON_BY_ID, {}, { fetchPolicy: 'cache-and-network' })
talonById.onResult((res) => {
  if (res.loading) return null
  lastTalonById.value = res.data
})
watch(lastTalonId, async (newTalonId, oldTalonId) => {
  if (newTalonId !== 0) {
    ;(await talonById.load(null, { id: newTalonId })) ||
      (await talonById.refetch({ id: newTalonId }))
    print()
  }
})
function print() {
  fetch('http://localhost:8001/', {
    method: 'POST',
    body: JSON.stringify(lastTalonById.value),
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
const dataLength = computed(() => {
  return purposes.length != 0
})
function registerTalon() {
  loadingRegister.value = true
  postAPIData(
    '/queue/talon/',
    { purpose: currentPurpose.value, comment: currentComment.value },
    auth,
    (response) => {
      loadingRegister.value = false
      if (response.status === 201) {
        lastTalonId.value = response.data.id
        Notification.open({
          message: `Талон успешно создан`,
          duration: 5000,
          type: 'is-success',
          pauseOnHover: true
        })
      } else {
        Notification.open({
          message: `Произошла ошибка при отправке запроса. Повторите позже или свяжитесь с администратором`,
          duration: 5000,
          type: 'is-success',
          pauseOnHover: true
        })
      }
    }
  )
}
onMounted(() => {
  getAPIData('/queue/purposes', auth, (response) => {
    purposes.push(...(response.data as TalonPurpose[]))
    currentPurpose.value = purposes[0].id
  })
})
</script>
<template>
  <div class="hero is-medium container">
    <div class="hero-body">
      <div class="columns">
        <div class="column is-one-quarter"></div>
        <div class="column">
          <p class="title">Ресепшен</p>
          <b-field label="Цель">
            <b-select v-if="dataLength" v-model="currentPurpose" placeholder="Выберите">
              <option v-for="option in purposes" :value="option.id" :key="option.id.toString()">
                {{ option.name }}
              </option>
            </b-select>
            <b-skeleton v-else :animated="true"></b-skeleton>
          </b-field>
          <b-field label="Комментарий">
            <b-input v-model="currentComment" maxlength="200" type="textarea"></b-input>
          </b-field>
          <b-button @click="registerTalon" :loading="loadingRegister">Зарегистрировать</b-button>
          <!-- <b-button @click="print()">Print</b-button> -->
        </div>
        <div class="column is-one-quarter"></div>
      </div>
    </div>
  </div>
</template>
