<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref, watch } from 'vue';
import { useAuth } from 'vue-auth3';
import { useLazyQuery } from '@vue/apollo-composable';
import { TALONS, type HistoryTalon } from '@/queries/historyTalons';

const auth = useAuth();
const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy;
const vars = reactive({ offset: 0, limit: 10 });
const history_talons = useLazyQuery(TALONS, vars, { fetchPolicy: 'network-only' });
let data = reactive([] as HistoryTalon[]);
let num = 1;
const lastTimeUpdated = ref<Date>();
function onSort(field, order) {
  num = 1;
}
async function updateTable() {
  data.splice(0, data.length);
  num = 1;
  let res = await history_talons.load();
  if (!res) {
    res = (await history_talons.refetch())?.data;
  }
  console.log(res);

  Object.assign(data, res.historyTalons);
  lastTimeUpdated.value = new Date();
}
function blackColorClass(row, column) {
  return { style: { color: 'black' } };
}
</script>
<template>
  <!-- <div class="columns">
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
  </div> -->
  <p>В разработке</p>
</template>
