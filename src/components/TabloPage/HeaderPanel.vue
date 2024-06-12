<script setup lang="ts">
import { reactive } from 'vue';
import TimePanel from './TimePanel.vue'

let date = reactive(new Date())
date.toDateString()
setInterval(() => {
  date = new Date()
}, 60000)

</script>
<template>
  <div class="columns" style="background-color: #265AA4;">
    <div class="column is-one-quarter">
      <p class="title is-2 fefu-white">
      {{ date.toLocaleDateString() }}
      </p>
    </div>
    <div class="column auto">
      <p class="title is-2 has-text-centered fefu-white">
      Приемная комиссия
      </p>
    </div>
    <div class="column is-one-quarter">
      <TimePanel/>
    </div>
  </div>
</template>
<style></style>