<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref, watch } from 'vue';
import { useAuth } from 'vue-auth3';
import { useLazyQuery } from '@vue/apollo-composable';
import { IN_QUEUE_TALONS, type in_queue_talon } from '@/queries/inQueueTalons';

const auth = useAuth();
const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy;
const in_queue_talons = useLazyQuery(IN_QUEUE_TALONS, {}, { fetchPolicy: 'network-only' });
let data = reactive([] as in_queue_talon[]);
let num = 1;
const lastTimeUpdated = ref<Date>();
function onSort(field, order) {
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
  lastTimeUpdated.value = new Date();
}
function blackColorClass(row, column) {
  return { style: { color: 'black' } };
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
        <template #empty>
          <div class="has-text-centered" style="color: black">Нет данных</div>
        </template>
      </b-table>
    </div>
    <div class="column"></div>
  </div>
</template>
