<script setup lang="ts">
const { talon } = defineProps(['talon']);
</script>
<template>
  <div
    class="column is-two-fifths"
    style="background-color: aliceblue; border-radius: 10px; margin-top: 10px"
  >
    <p class="title">{{ talon.name }}</p>
  </div>
  <div class="column is-one-fifth" style="margin-top: 10px">
    <b-icon class="fefu-white" icon="arrow-right" size="is-large"></b-icon>
  </div>
  <div
    class="column is-two-fifths"
    style="background-color: aliceblue; border-radius: 10px; margin-top: 10px"
  >
    <p class="title" style="padding-bottom: 0">{{ talon.location }}</p>
  </div>
</template>
<style scoped></style>
