<script setup lang="ts">
import { onMounted, reactive, ref, watch, onUnmounted } from 'vue';
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
const data_for_show = reactive([] as { name: string | undefined; location: string }[]);
const active_locations = reactive([] as string[]);
const tablo_status_enabled = ref(false);
const tablo_status = useQuery(
  TABLO_STATUS,
  {},
  { fetchPolicy: 'network-only', enabled: tablo_status_enabled }
);
const { result } = useSubscription(TALON_LOG_SUB, {}, { fetchPolicy: 'network-only' });
const currentNotification = reactive({ name: 'З - 01', location: '14', show: false });
let queueForNotification: Talon[] = [];
let settingsRefreshInterval: number | null = null;

// Периодическое обновление статуса столов
const fetchActiveLocations = async () => {
  try {
    const response = await fetch(import.meta.env.VITE_API_URL + '/queue/info');
    const data = await response.json();
    const locations = data.locations;
    
    // Очищаем и обновляем активные столы
    active_locations.length = 0;
    for (const loc of locations) {
      if (loc.settings !== null) {
        active_locations.push(loc.name);
      }
    }
  } catch (error) {
    console.error('Ошибка при обновлении статуса столов:', error);
  }
};

setInterval(() => {
  if (!currentNotification.show) {
    showNotification();
  }
}, 1000);

tablo_status.onResult((res) => {
  if (res.loading) return;
  let tablo_talons: tabloTalons[] = res.data.tabloTalons;

  const newTalons = tablo_talons.map((talon) => {
    const assigned_logs = talon.logs.filter((x: any) => x.action === 'Assigned');
    const created_by = assigned_logs.at(-1)?.createdBy;
    const place = created_by?.operatorSettings?.location?.name;
    return { id: talon.id, name: talon.name, location: place };
  });

  data.talons = newTalons.sort((a, b) => Number(a.location) - Number(b.location));
  data.lastTalonLogId = res.data.lastTalonLog.id;
});

function showNotification() {
  let notif = queueForNotification.shift();
  if (notif) {
    currentNotification.name = notif.name;
    currentNotification.location = notif.location;
    currentNotification.show = true;
    fetch('http://localhost:8001/tts', {
      method: 'POST',
      body: JSON.stringify(notif),
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        'Access-Control-Allow-Origin': '*'
      }
    });
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
        if (log.id > data.lastTalonLogId) {
          data.talons = [talon, ...data.talons];
        }
        break;
      case 'Completed':
      case 'Cancelled':
        data.talons = data.talons.filter((x) => x.id !== log.talon.id);
        break;
      default:
        break;
    }
    if (log.id > data.lastTalonLogId) data.lastTalonLogId = log.id;
  },
  { immediate: false }
);

watch(
  data,
  () => {
    updateDataForShow();
  },
  { deep: true }
);

watch(
  active_locations,
  () => {
    updateDataForShow();
  },
  { deep: true }
);

function updateDataForShow() {
  data_for_show.length = 0;
  const locs = [...active_locations];

  // Добавляем активные талоны
  for (const tal of data.talons) {
    if (tal.location) {
      data_for_show.push(tal);
      const ind = locs.indexOf(tal.location);
      if (ind !== -1) {
        locs.splice(ind, 1);
      }
    }
  }

  // Добавляем свободные столы
  for (const loc of locs) {
    data_for_show.push({ name: undefined, location: loc });
  }

  // Сортируем по номеру стола
  data_for_show.sort((a, b) => Number(a.location) - Number(b.location));
}

onMounted(() => {
  // Первоначальная загрузка активных столов
  fetchActiveLocations();
  
  // Настройка периодического обновления
  settingsRefreshInterval = setInterval(fetchActiveLocations, 5000);
  
  // Включаем запрос статуса табло
  tablo_status_enabled.value = true;
});

onUnmounted(() => {
  if (settingsRefreshInterval) {
    clearInterval(settingsRefreshInterval);
  }
});
</script>

<template>
  <div class="container">
    <HeaderPanel></HeaderPanel>
    <div class="hor-line"></div>
    <div class="up-ver-line"></div>
    <div class="down-hor-line"></div>
    <p class="good-luck-text">
      Удачи<br />
      при поступлении!
    </p>
    <div class="columns has-text-centered">
      <div class="column">
        <div class="columns is-multiline notification-section">
          <div class="column is-full notification-container">
            <div v-if="currentNotification.show" class="notification-content">
              <p class="notification-title">Талон</p>
              <p class="notification-name">{{ currentNotification.name }}</p>
              <p class="notification-desk-label">стол</p>
              <p class="notification-desk-number">{{ currentNotification.location }}</p>
            </div>
            <img
              src="@/assets/DVFU_logo_tablo.svg"
              alt="DVFU Logo"
              class="logo-image"
            />
          </div>
        </div>
      </div>
      <div class="column is-two-thirds">
        <div class="columns is-multiline" style="padding: 1%">
          <div class="column">
            <div class="columns is-multiline is-gapless">
              <div class="column is-three-fifths">
                <p class="column-header">Талон</p>
              </div>
              <div class="column is-one-fifths"></div>
              <div class="column is-one-fifths">
                <p class="column-header">Стол</p>
              </div>
              <InProgressRaw
                v-for="talon in data_for_show.slice(0, talonsPerCol)"
                :talon="talon"
                :key="talon.location"
              />
            </div>
          </div>
          <div class="column">
            <div class="columns is-multiline is-gapless">
              <div class="column is-three-fifths">
                <p class="column-header">Талон</p>
              </div>
              <div class="column is-one-fifths"></div>
              <div class="column is-one-fifths">
                <p class="column-header">Стол</p>
              </div>
              <InProgressRaw
                v-for="talon in data_for_show.slice(talonsPerCol)"
                :talon="talon"
                :key="talon.location"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  margin: 32px;
}

.hor-line {
  border-bottom: 3px solid #f5f7fb;
  width: calc(100% - 64px);
  margin-left: 40px;
}

.up-ver-line {
  border-right: 3px solid #f5f7fb;
  height: 80vh;
  margin-top: 40px;
  position: absolute;
  left: 36%;
}

.down-hor-line {
  border-bottom: 3px solid #f5f7fb;
  position: absolute;
  width: 30%;
  bottom: 18%;
  left: 4%;
}

html {
  overflow: hidden;
}

.good-luck-text {
  position: absolute;
  bottom: 4%;
  left: 10%;
  font-size: 28px;
  font-family: 'Unbounded-Bold';
  color: #1d3d84;
}

.notification-section {
  padding: 1%;
}

.notification-container {
  padding-left: 60px; 
  padding-top: 10px;
  position: relative;
}

.notification-content {
  position: relative;
  z-index: 10;
}

.notification-title {
  font-size: 4em;
  color: black;
  font-family: 'HeliosC';
  font-weight: 700;
  margin-bottom: 0.2em;
  line-height: 1;
}

.notification-name {
  font-size: 7em;
  color: #1d3d84;
  font-family: 'HeliosC';
  font-weight: 700;
  margin-bottom: 0.2em;
  line-height: 1;
}

.notification-desk-label {
  font-size: 5em;
  font-family: 'HeliosC';
  color: black;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.1em;
}

.notification-desk-number {
  font-size: 6em;
  font-family: 'HeliosC';
  color: black;
  font-weight: 700;
  line-height: 1;
}

.logo-image {
  max-height: 350px;
  position: absolute;
  bottom: 3%;
  left: 5%;
  transform: scale(0.8);
}

.column-header {
  font-family: HeliosC; 
  font-size: 30px; 
  font-weight: 800; 
  color: black;
}

/* Адаптация для экранов 1260x260 */
@media (max-width: 1260px) and (max-height: 260px) {
  .notification-title {
    font-size: 3em !important;
  }
  
  .notification-name {
    font-size: 5em !important;
  }
  
  .notification-desk-label {
    font-size: 3.5em !important;
  }
  
  .notification-desk-number {
    font-size: 4.5em !important;
  }
  
  .up-ver-line {
    height: 70vh !important;
  }
  
  .good-luck-text {
    font-size: 20px !important;
    bottom: 6% !important;
  }
  
  .logo-image {
    max-height: 250px !important;
    bottom: 5% !important;
    left: 3% !important;
    transform: scale(0.7) !important;
  }
  
  .notification-container {
    padding-left: 30px !important;
    padding-top: 5px !important;
  }
}
</style>
