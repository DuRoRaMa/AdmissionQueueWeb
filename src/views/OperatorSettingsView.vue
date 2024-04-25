<script setup lang="ts">
import { getAPIData, patchAPIData } from '@/axios'
import { type OperatorSettings, type OperatorLocation, type TalonPurpose } from '@/types'
import { NotificationProgrammatic } from '@ntohq/buefy-next'
import type { BNotificationConfig } from '@ntohq/buefy-next/types/components'
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuth } from 'vue-auth3'

const auth = useAuth()
const Notification = new NotificationProgrammatic()
let settings: OperatorSettings | null = null
let locations: OperatorLocation[] = reactive([])
let purposes: TalonPurpose[] = reactive([])
let currentPurposes = ref<number[]>([])
let currentLocation = ref()
let loadingSave = ref(false)
const dataLength = computed(() => {
  return locations.length != 0
})
onMounted(() => {
  getAPIData('/queue/settings', auth, (response) => {
    settings = response.data as OperatorSettings

    getAPIData('/queue/location', auth, (response) => {
      locations.push(...(response.data as OperatorLocation[]))
      for (let loc of locations) {
        if (loc.settings !== null && settings!.location !== loc.id) {
          loc.disabled = true
        }
      }
      currentLocation.value = settings!.location
    })
    getAPIData('/queue/purposes', auth, (response) => {
      purposes.push(...(response.data as TalonPurpose[]))
      if (settings!.purposes !== null) {
        currentPurposes.value = settings!.purposes
      }
    })
  })
})
function saveSettings() {
  let postData = {
    purposes: currentPurposes.value,
    location: currentLocation.value
  }
  loadingSave.value = true
  patchAPIData(`/queue/settings/`, postData, auth, (_response) => {
    loadingSave.value = false
    let nconfig: BNotificationConfig = {
      message: `Настройки оператора успешно сохранены`,
      duration: 5000,
      type: 'is-success',
      pauseOnHover: true
    }
    Notification.open(nconfig)
  })
}
</script>
<template>
  <section class="hero is-medium container">
    <div class="hero-body">
      <div class="columns">
        <div class="column is-one-quarter"></div>
        <div class="column">
          <p class="title">Настройки оператора</p>
          <b-field label="Рабочее место">
            <b-select v-if="dataLength" v-model="currentLocation" placeholder="Выберите">
              <option :value="null" :key="0">Освободить рабочее место</option>
              <option
                v-for="option in locations"
                :value="option.id"
                :key="option.id.toString()"
                :disabled="option.disabled"
              >
                {{ option.name }}
              </option>
            </b-select>
            <b-skeleton v-else :animated="true"></b-skeleton>
          </b-field>
          <div class="block">
            <b-checkbox
              v-model="currentPurposes"
              v-for="box in purposes"
              v-bind:key="box.id"
              v-bind:native-value="box.id"
            >
              {{ box.name }}
            </b-checkbox>
          </div>
          <div class="buttons">
            <b-button @click="saveSettings" :loading="loadingSave">Сохранить</b-button>
            <b-button tag="router-link" :to="{ name: 'operator' }">Продолжить</b-button>
          </div>
        </div>
        <div class="column is-one-quarter"></div>
      </div>
    </div>
  </section>
</template>
<style>
option:disabled {
  background-color: grey;
}
</style>
