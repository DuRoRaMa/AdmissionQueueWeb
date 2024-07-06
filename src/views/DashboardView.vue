<script setup lang="ts">
import { getAPIData } from '@/axios';
import TotalTalonPurposes from '@/components/DashboardPage/TotalTalonsPurposes.vue';
import RatingOperatorByTalonPurposes from '@/components/DashboardPage/RatingOperatorByTalonPurposes.vue';
import { onMounted, reactive, ref, watch } from 'vue';
import { useAuth } from 'vue-auth3';
const auth = useAuth();
const data = reactive({});
const dates = ref([new Date(), new Date()]);
function update() {
  getAPIData(
    '/queue/dashboard',
    auth,
    (response) => {
      Object.assign(data, response.data);
    },
    {
      start: dates.value[0],
      end: dates.value[1]
    }
  );
}
onMounted(() => {
  dates.value[0].setHours(0, 0, 0, 0);
  dates.value[1].setHours(23, 59, 59, 999);
  update();
  watch(dates, update);
});
</script>
<template>
  <b-field label="Выберите дату">
    <b-datepicker
      placeholder="Нажмите, чтобы выбрать"
      v-model="dates"
      @range-end="
        (value) => {
          return value.setHours(23, 59, 59, 999);
        }
      "
      range
    >
    </b-datepicker>
  </b-field>
  <TotalTalonPurposes :data="data.totalTalonPurposes" :talon_purposes="data.TalonPurposes" />
  <RatingOperatorByTalonPurposes :data="data.ratingOperatorByTalonPurposes" />
</template>
