<script setup lang="ts">
import { getAPIData } from '@/axios';
import TotalTalonPurposes from '@/components/DashboardPage/TotalTalonsPurposes.vue';
import RatingOperatorByTalonPurposes from '@/components/DashboardPage/RatingOperatorByTalonPurposes.vue';
import { getCurrentInstance, onMounted, reactive, ref, watch } from 'vue';
import { useAuth } from 'vue-auth3';

interface RatingOperatorByTalonPurposesData {
  data: object[];
  operator: string[];
}

interface DashboardData {
  totalTalonPurposes: number[];
  TalonPurposes: string[];
  ratingOperatorByTalonPurposes: RatingOperatorByTalonPurposesData;
}

const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy as any;
const auth = useAuth();

const data = reactive<DashboardData>({
  totalTalonPurposes: [],
  TalonPurposes: [],
  ratingOperatorByTalonPurposes: {
    data: [],
    operator: []
  }
});

const dates = ref<[Date, Date]>([new Date(), new Date()]);
const needUpdate = ref(false);

function handleRangeEnd() {
  needUpdate.value = true;
}

function update() {
  const [startDate, endDate] = dates.value;

  const d1 = new Date(startDate.getTime());
  const d2 = new Date(endDate.getTime());

  d1.setHours(0, 0, 0, 0);
  d2.setHours(23, 59, 59, 999);

  getAPIData(
    '/queue/dashboard',
    auth,
    (response: any) => {
      data.totalTalonPurposes = response.data?.totalTalonPurposes || [];
      data.TalonPurposes = response.data?.TalonPurposes || [];
      data.ratingOperatorByTalonPurposes =
        response.data?.ratingOperatorByTalonPurposes || {
          data: [],
          operator: []
        };
    },
    (error: any) => {
      const detail = error?.response?.data?.detail;

      $buefy?.toast.open({
        message: detail || String(error),
        type: 'is-danger'
      });
    },
    {
      start: d1,
      end: d2
    }
  );

  needUpdate.value = false;
}

onMounted(() => {
  update();
});

watch(needUpdate, (newValue) => {
  if (newValue) {
    update();
  }
});
</script>

<template>
  <b-field label="Выберите дату">
    <b-datepicker
      v-model="dates"
      placeholder="Нажмите, чтобы выбрать"
      range
      @range-end="handleRangeEnd"
    />
  </b-field>

  <TotalTalonPurposes
    :data="data.totalTalonPurposes"
    :talon_purposes="data.TalonPurposes"
  />

  <RatingOperatorByTalonPurposes
    :data="data.ratingOperatorByTalonPurposes"
  />
</template>
