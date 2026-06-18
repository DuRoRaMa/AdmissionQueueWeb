<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref, watch } from 'vue';
import { useAuth } from 'vue-auth3';
import { useLazyQuery } from '@vue/apollo-composable';
import { IN_QUEUE_TALONS, type in_queue_talon } from '@/queries/inQueueTalons';
import { postAPIData } from '@/axios';

const auth = useAuth();
const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy;
const in_queue_talons = useLazyQuery(IN_QUEUE_TALONS, {}, { fetchPolicy: 'network-only' });
let data = reactive([] as in_queue_talon[]);
const disabled = reactive({} as { [key: number]: boolean });
let num = 1;
const lastTimeUpdated = ref<Date>();
function onSort(field: string, order: string) {
  num = 1;
}
async function updateTable() {
  data.splice(0, data.length);
  num = 1;
  let res = await in_queue_talons.load();
  if (!res) {
    res = (await in_queue_talons.refetch())?.data;
  }
  Object.assign(data, res.inQueueTalons);
  data.forEach((x) => (disabled[x.id] = false));
  data.sort((a, b) => a.id - b.id);
  lastTimeUpdated.value = new Date();
}
function blackColorClass(row: any, column: any) {
  return { style: { color: 'black' } };
}
async function cancelTalon(id: number) {
  disabled[id] = true;

  postAPIData(
    '/queue/registrator/talon/cancel',
    {},
    auth,
    (response: any) => {
      $buefy.notification.open({
        message: response.data?.detail || 'Талон отменён',
        duration: 3000,
        type: 'is-success',
        pauseOnHover: false
      });
    },
    (error: any) => {
      const detail = error?.response?.data?.detail;

      $buefy.notification.open({
        message: detail || 'Не удалось отменить талон',
        duration: 3000,
        type: 'is-danger',
        pauseOnHover: false
      });

      disabled[id] = false;
    },
    { id }
  );
}
</script>
<template>
  <div class="columns">
    <div class="column">
      <b-button @click="updateTable">Обновить</b-button>
      <p>Последний раз обновлено: {{ lastTimeUpdated?.toLocaleTimeString('ru-ru') }}</p>
      <b-table :data="data" :bordered="true" @sort="onSort">
        <b-table-column label="№" width="40" :td-attrs="blackColorClass" numeric centered>
          {{ num++ }}
        </b-table-column>
        <b-table-column
          field="id"
          label="ID"
          width="40"
          :td-attrs="blackColorClass"
          v-slot="props"
          numeric
          sortable
          centered
        >
          {{ props.row.id }}
        </b-table-column>
        <b-table-column
          field="name"
          label="Имя"
          :td-attrs="blackColorClass"
          v-slot="props"
          sortable
        >
          {{ props.row.name }}
        </b-table-column>
        <b-table-column
          field="createdAt"
          label="Создан"
          :td-attrs="blackColorClass"
          v-slot="props"
          sortable
        >
          {{ new Date(props.row.createdAt).toLocaleTimeString('ru-ru') }}
        </b-table-column>
        <b-table-column label="" v-slot="props">
          <b-button
            class="is-danger"
            @click="cancelTalon(props.row.id)"
            :disabled="disabled[props.row.id]"
          >
            Отменить
          </b-button>
        </b-table-column>
        <template #empty>
          <div class="has-text-centered" style="color: black">Нет данных</div>
        </template>
      </b-table>
    </div>
    <div class="column"></div>
  </div>
</template>
