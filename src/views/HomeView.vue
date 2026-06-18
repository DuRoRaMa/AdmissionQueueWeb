<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useUser } from 'vue-auth3'

type RoleName = 'Operators' | 'Registrators' | 'Admins'

interface AuthUser {
  username?: string
  groups?: string[]
}

interface HomeButton {
  if: RoleName
  name: string
  text: string
}

const user = useUser<AuthUser>()

const roles = reactive<Record<RoleName, boolean>>({
  Operators: false,
  Registrators: false,
  Admins: false
})

const buttons = reactive<HomeButton[]>([
  { if: 'Operators', name: 'operator', text: 'Оператор' },
  { if: 'Registrators', name: 'registrator', text: 'Ресепшен' },
  { if: 'Admins', name: 'dashboard', text: 'Дашборд' }
])

watch(
  user,
  () => {
    roles.Registrators = false
    roles.Operators = false
    roles.Admins = false

    const groups = user.value?.groups || []

    groups.forEach((group) => {
      if (group in roles) {
        roles[group as RoleName] = true
      }
    })
  },
  { immediate: true }
)
</script>

<template>
  <section class="hero is-large container">
    <div class="hero-body">
      <div class="columns">
        <b-button
          v-for="button in buttons"
          :key="button.name"
          v-show="roles[button.if]"
          tag="router-link"
          :to="{ name: button.name }"
          class="column is-large is-primary"
          style="margin-right: 20px"
        >
          {{ button.text }}
        </b-button>
      </div>
    </div>
  </section>
</template>
