<!-- eslint-disable no-case-declarations -->
<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useQuery, useSubscription } from '@vue/apollo-composable';
import InProgressRaw from '@/components/TabloPage/InProgressRaw.vue';
import HeaderPanel from '@/components/TabloPage/HeaderPanel.vue';
import { type tabloTalons, TABLO_STATUS } from '@/queries/tabloTalons';
import { type talonLogs, TALON_LOG_SUB } from '@/queries/talonLogSub';
interface Talon {
  id: number;
  name: string;
  location: string;
}

const data = reactive({ talons: [] as Talon[], lastTalonLogId: -1 });
const tablo_status = useQuery(TABLO_STATUS, {}, { fetchPolicy: 'network-only' });
const { result } = useSubscription(TALON_LOG_SUB, {}, { fetchPolicy: 'network-only' });
const currentNotification = reactive({ name: '123', location: '123', show: false });
let queueForNotification: Talon[] = [];
// res -> queue -> setinterval -> pop from queue -> show -> setInterval check if somethins show -> cycle
setInterval(() => {
  if (!currentNotification.show) {
    showNotification();
  }
}, 1000);
function showNotification() {
  let notif = queueForNotification.shift();
  if (notif) {
    currentNotification.name = notif.name;
    currentNotification.location = notif.location;
    currentNotification.show = true;
    setTimeout(() => {
      currentNotification.show = false;
    }, 10000);
  }
}
watch(
  result,
  (res) => {
    const log: talonLogs = res.talonLogs;
    switch (log.action) {
      case 'Assigned':
        const talon: Talon = {
          id: log.talon.id,
          name: log.talon.name,
          location: log.createdBy.operatorSettings!.location.name
        };
        queueForNotification.push(talon);
        data.talons.unshift(talon);
        break;
      case 'Completed':
        data.talons.splice(
          data.talons.findIndex((x) => x.id === log.talon.id),
          1
        );
        break;
      case 'Cancelled':
        data.talons.splice(
          data.talons.findIndex((x) => x.id === log.talon.id),
          1
        );
        break;
      default:
        break;
    }
    data.lastTalonLogId = log.id;
  },
  { immediate: false }
);
tablo_status.onResult((res) => {
  if (res.loading) return null;
  let tablo_talons: tabloTalons[] = res.data.tabloTalons;

  for (const talon of tablo_talons) {
    const assigned_logs = talon.logs.filter((x: any) => x.action === 'Assigned');
    const created_by = assigned_logs.at(-1).createdBy;
    const place = created_by.operatorSettings.location.name;
    data.talons.push({ id: talon.id, name: talon.name, location: place });
  }
  data.lastTalonLogId = res.data.lastTalonLog.id;
});
</script>
<template>
  <div style="margin: 10px">
    <HeaderPanel></HeaderPanel>
    <div class="columns has-text-centered">
      <div class="column">
        <div class="columns is-multiline" style="padding: 1%">
          <div
            class="column is-full"
            style="
              background-color: aliceblue;
              border-radius: 10px;
              padding: 1%;
              padding-top: 0;
              margin-top: 10px;
            "
          >
            <p class="title">Ваша очередь</p>
          </div>
          <div class="column is-full">
            <div v-if="currentNotification.show">
              <p class="title fefu-white" style="font-size: 6em">
                Талон {{ currentNotification.name }}
              </p>
              <p class="title fefu-white" style="font-size: 6em">
                {{ currentNotification.location }}
              </p>
            </div>
            <img
              src="@/assets/ru (1).png"
              alt=""
              style="max-height: 350px; position: absolute; bottom: 9.7%; left: 6.6%"
            />
          </div>
        </div>
      </div>
      <div class="column is-half">
        <div class="columns is-multiline" style="padding: 1%">
          <div
            class="column is-full"
            style="
              background-color: aliceblue;
              border-radius: 10px;
              padding: 1%;
              padding-top: 0;
              margin-top: 10px;
            "
          >
            <p class="title">Статус очереди</p>
          </div>
          <div class="column">
            <div class="columns is-multiline is-gapless">
              <InProgressRaw
                v-for="talon in data.talons.slice(0, 12)"
                :talon="talon"
                :key="talon.id"
              />
            </div>
          </div>
          <div class="column" v-if="data.talons.length > 12">
            <div class="columns is-multiline is-gapless">
              <InProgressRaw
                v-for="talon in data.talons.slice(12)"
                :talon="talon"
                :key="talon.id"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
html {
  background-color: #265aa4;
  overflow: hidden;
}
.vertical-center {
  margin: 0;
  position: absolute;
  top: 50%;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
}
</style>
