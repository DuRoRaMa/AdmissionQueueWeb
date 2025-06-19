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
const isSmallScreen = ref(false);

// Проверка размера экрана
const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth <= 1260 && window.innerHeight <= 260;
  console.log(`Screen size: ${window.innerWidth}x${window.innerHeight}, small: ${isSmallScreen.value}`);
};

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
  
  // Инициализация отслеживания размера экрана
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  if (settingsRefreshInterval) {
    clearInterval(settingsRefreshInterval);
  }
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<template>
  <div style="margin: 32px" :class="{ 'small-screen': isSmallScreen }">
    <HeaderPanel></HeaderPanel>
    <div class="hor-line"></div>
    <div class="up-ver-line"></div>
    <div class="down-hor-line"></div>
    <p
      style="
        position: absolute;
        bottom: 4%;
        left: 10%;
        font-size: 28px;
        font-family: 'Unbounded-Bold';
        color: #1d3d84;
      "
      :class="{ 'small-screen-text': isSmallScreen }"
    >
      Удачи<br />
      при поступлении!
    </p>
    <div class="columns has-text-centered">
      <div class="column">
        <div class="columns is-multiline" style="padding: 1%">
          <div class="column is-full" style="padding-left: 60px; padding-top: 10px">
            <div v-if="currentNotification.show" class="notification-content" :class="{ 'small-notification': isSmallScreen }">
              <p :class="{ 'small-text': isSmallScreen }">Талон</p>
              <p :class="{ 'small-number': isSmallScreen }">{{ currentNotification.name }}</p>
              <p :class="{ 'small-text': isSmallScreen }">стол</p>
              <p :class="{ 'small-number': isSmallScreen }">{{ currentNotification.location }}</p>
            </div>
            <img
              src="@/assets/DVFU_logo_tablo.svg"
              alt=""
              :class="{ 'small-logo': isSmallScreen }"
              style="
                max-height: 350px;
                position: absolute;
                bottom: 3%;
                left: 5%;
                transform: scale(0.8);
              "
            />
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
                v-for="talon in data_for_show.slice(0, talonsPerCol)"
                :talon="talon"
                :key="talon.location"
              />
            </div>
          </div>
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

<style>
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
.vertical-center {
  margin: 0;
  position: absolute;
  top: 50%;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
}

/* Адаптивные стили для маленьких экранов */
.small-screen .up-ver-line {
  height: 70vh !important;
}

.small-notification {
  transform: scale(0.85) !important;
  transform-origin: top left !important;
  padding-top: 5px !important;
}

.small-text {
  font-size: 3em !important;
  color: black !important;
  font-family: 'HeliosC' !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  margin-bottom: 0.2em !important;
}

.small-number {
  font-size: 5em !important;
  color: #1d3d84 !important;
  font-family: 'HeliosC' !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  margin-bottom: 0.2em !important;
}

.small-screen-text {
  font-size: 20px !important;
  bottom: 6% !important;
}

.small-logo {
  max-height: 250px !important;
  bottom: 5% !important;
  left: 3% !important;
  transform: scale(0.7) !important;
}
</style>
