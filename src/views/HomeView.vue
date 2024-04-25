<script setup lang="ts"></script>

<template>
  <section class="hero is-large container">
    <div class="hero-body">
      <div class="columns">
        <b-button
          tag="router-link"
          :to="{ name: 'operator_settings' }"
          class="column is-large is-primary"
          >Оператор</b-button
        >
        <div class="column is-0"></div>
        <b-button tag="router-link" :to="{ name: 'registrator' }" class="column is-large is-primary"
          >Регистратор</b-button
        >
      </div>
    </div>
  </section>
</template>
