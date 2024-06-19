<!-- eslint-disable no-case-declarations -->
<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useQuery, useSubscription } from '@vue/apollo-composable';
import InProgressRaw from '@/components/TabloPage/InProgressRaw.vue';
import HeaderPanel from '@/components/TabloPage/HeaderPanel.vue';
import { type tabloTalons, TABLO_STATUS } from '@/queries/tabloTalons';
import { type talonLogs, TALON_LOG_SUB } from '@/queries/talonLogSub';

const talonsPerCol = 7;
interface Talon {
  id: number;
  name: string;
  location: string;
}

const data = reactive({ talons: [] as Talon[], lastTalonLogId: -1 });
const tablo_status = useQuery(TABLO_STATUS, {}, { fetchPolicy: 'network-only', prefetch: true });
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
  console.log(data);

  for (const talon of tablo_talons) {
    const assigned_logs = talon.logs.filter((x: any) => x.action === 'Assigned');
    const created_by = assigned_logs.at(-1).createdBy;
    const place = created_by.operatorSettings.location?.name;
    data.talons.push({ id: talon.id, name: talon.name, location: place });
  }
  data.talons.sort((a, b) => Number(a.location) - Number(b.location));
  data.lastTalonLogId = res.data.lastTalonLog.id;
  console.log(data);
});
</script>
<template>
  <div style="margin: 32px">
    <HeaderPanel></HeaderPanel>
    <div class="hor-line"></div>
    <div class="columns has-text-centered">
      <div class="column">
        <div class="columns is-multiline" style="padding: 1%">
          <div class="column is-full">
            <div v-if="currentNotification.show">
              <p class="title fefu-white" style="font-size: 6em">
                Талон {{ currentNotification.name }}
              </p>
              <p class="title fefu-white" style="font-size: 6em">
                {{ currentNotification.location }}
              </p>
            </div>
            <!-- <img
              src="@/assets/ru (1).png"
              alt=""
              style="max-height: 350px; position: absolute; bottom: 9.7%; left: 6.6%"
            /> -->
          </div>
        </div>
      </div>
      <div class="column is-two-thirds">
        <div class="columns is-multiline" style="padding: 1%">
          <div class="column">
            <div class="columns is-multiline is-gapless">
              <div class="column is-three-fifths">
                <p style="font-family: HeliosC; font-size: 30px; font-weight: 800; color: black">
                  Талон
                </p>
              </div>
              <div class="column is-one-fifths"></div>
              <div class="column is-one-fifths">
                <p style="font-family: HeliosC; font-size: 30px; font-weight: 800; color: black">
                  Стол
                </p>
              </div>
              <InProgressRaw
                v-for="talon in data.talons.slice(0, talonsPerCol)"
                :talon="talon"
                :key="talon.id"
              />
            </div>
          </div>
          <div class="column" v-if="data.talons.length > talonsPerCol">
            <div class="columns is-multiline is-gapless">
              <div class="column is-three-fifths">
                <p style="font-family: HeliosC; font-size: 30px; font-weight: 800; color: black">
                  Талон
                </p>
              </div>
              <div class="column is-one-fifths"></div>
              <div class="column is-one-fifths">
                <p style="font-family: HeliosC; font-size: 30px; font-weight: 800; color: black">
                  Стол
                </p>
              </div>
              <InProgressRaw
                v-for="talon in data.talons.slice(talonsPerCol)"
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
.hor-line {
  border-bottom: 3px solid #f5f7fb;
  width: calc(100% - 64px);
  margin-left: 40px;
}
html {
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
