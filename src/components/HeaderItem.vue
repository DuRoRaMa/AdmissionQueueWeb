<script setup lang="ts">
import { useAuth } from 'vue-auth3'

const auth = useAuth()
</script>
<template>
  <b-navbar v-show="$route.name !== 'tablo'">
    <template #brand>
      <b-navbar-item tag="router-link" :to="{ path: '/' }">
        <b-image
          src="/src/assets/dvfu-logo.png"
          alt="Электронная очередь приемной комиссии ДВФУ"
        ></b-image>
      </b-navbar-item>
    </template>
    <template #start>
      <b-navbar-item tag="router-link" :to="{ path: '/' }"> Главная </b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/tablo' }"> Табло </b-navbar-item>
    </template>

    <template #end>
      <b-navbar-item tag="div">
        <div class="buttons">
          <b-navbar-item
            tag="router-link"
            :to="{ name: 'login' }"
            v-if="!auth.check()"
            class="button is-primary"
            type="is-primary"
            size="is-medium"
          >
            Войти
          </b-navbar-item>
          <b-navbar-item tag="div" v-else>
            <b-navbar-item
              tag="router-link"
              :to="{ name: 'profile' }"
              class="button is-primary"
              type="is-primary"
              size="is-medium"
            >
              Профиль
            </b-navbar-item>
            <a @click="auth.logout" class="button is-primary"> Выйти </a>
          </b-navbar-item>
        </div>
      </b-navbar-item>
    </template>
  </b-navbar>
</template>
