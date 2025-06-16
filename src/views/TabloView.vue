<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useQuery, useSubscription } from '@vue/apollo-composable';
import { TABLO_STATUS, TALON_LOG_SUB } from '@/queries/tablo';
import InProgressRaw from '@/components/TabloPage/InProgressRaw.vue';
import HeaderPanel from '@/components/TabloPage/HeaderPanel.vue';

const talonsPerCol = 7;

interface Talon {
  id: number;
  name: string;
  location: string;
}

// Состояние компонента
const data = reactive({ talons: [] as Talon[], lastTalonLogId: -1 });
const data_for_show = reactive([] as { name: string | undefined; location: string }[]);
const active_locations = reactive([] as string[]);
const tablo_status_enabled = ref(false);
const currentNotification = reactive({ name: 'З - 01', location: '14', show: false });
let queueForNotification: Talon[] = [];

// Настройка Apollo
const { result: subscriptionResult, error: subscriptionError, onError: onSubscriptionError } = useSubscription(
  TALON_LOG_SUB,
  {},
  { 
    fetchPolicy: 'network-only',
    shouldResubscribe: true
  }
);

const { result: queryResult, refetch: refetchTabloStatus } = useQuery(
  TABLO_STATUS,
  {},
  { 
    fetchPolicy: 'network-only',
    enabled: tablo_status_enabled
  }
);

// Обработка ошибок WebSocket
onSubscriptionError((error) => {
  console.error('WebSocket error:', error);
  setTimeout(() => {
    refetchTabloStatus();
  }, 3000);
});

// Обработка данных подписки
watch(subscriptionResult, (res) => {
  if (!res) return;
  
  const log = res.talonLogs;
  switch (log.action) {
    case 'Assigned':
      const talon: Talon = {
        id: log.talon.id,
        name: log.talon.name,
        location: log.createdBy.operatorSettings?.location?.name || '0'
      };
      queueForNotification.push(talon);
      if (log.id > data.lastTalonLogId) {
        data.talons = [talon, ...data.talons];
      }
      break;
      
    case 'Completed':
    case 'Cancelled':
      data.talons = data.talons.filter(x => x.id !== log.talon.id);
      break;
  }
  
  if (log.id > data.lastTalonLogId) {
    data.lastTalonLogId = log.id;
  }
});

// Обработка данных запроса
watch(queryResult, (res) => {
  if (!res || res.loading) return;
  
  const tablo_talons = res.data.tabloTalons;
  const newTalons = tablo_talons.map(talon => ({
    id: talon.id,
    name: talon.name,
    location: talon.logs
      .filter(x => x.action === 'Assigned')
      .at(-1)
      ?.createdBy?.operatorSettings?.location?.name || '0'
  }));
  
  data.talons = newTalons.sort((a, b) => Number(a.location) - Number(b.location));
  data.lastTalonLogId = res.data.lastTalonLog.id;
});

// Обновление данных для отображения
watch(data, () => {
  data_for_show.length = 0;
  const locs = [...active_locations];

  data.talons.forEach(tal => {
    if (tal.location) {
      data_for_show.push(tal);
      const ind = locs.indexOf(tal.location);
      if (ind !== -1) locs.splice(ind, 1);
    }
  });

  locs.forEach(loc => {
    data_for_show.push({ name: undefined, location: loc });
  });

  data_for_show.sort((a, b) => Number(a.location) - Number(b.location));
}, { deep: true });

// Уведомления
setInterval(() => {
  if (!currentNotification.show && queueForNotification.length > 0) {
    const notif = queueForNotification.shift()!;
    currentNotification.name = notif.name;
    currentNotification.location = notif.location;
    currentNotification.show = true;
    
    fetch('/api/v1/queue/tts', {
      method: 'POST',
      body: JSON.stringify(notif),
      headers: { 'Content-Type': 'application/json' }
    });
    
    setTimeout(() => currentNotification.show = false, 10000);
  }
}, 1000);

// Инициализация
onMounted(async () => {
  try {
    const response = await fetch('/api/v1/queue/info');
    const { locations } = await response.json();
    active_locations.push(...locations.filter(loc => loc.settings).map(loc => loc.name));
    tablo_status_enabled.value = true;
  } catch (error) {
    console.error('Failed to load locations:', error);
  }
});
</script>

<template>
  <div class="tablo-container">
    <HeaderPanel />
    
    <div class="columns">
      <div class="column notification-column">
        <div v-if="currentNotification.show" class="notification">
          <p class="notification-title">Талон</p>
          <p class="notification-number">{{ currentNotification.name }}</p>
          <p class="notification-desk">стол</p>
          <p class="notification-location">{{ currentNotification.location }}</p>
        </div>
      </div>
      
      <div class="column is-two-thirds">
        <div class="columns is-multiline">
          <div class="column" v-for="(col, index) in [data_for_show.slice(0, talonsPerCol), data_for_show.slice(talonsPerCol)]" :key="index">
            <div class="talon-list">
              <div class="list-header">
                <span>Талон</span>
                <span>Стол</span>
              </div>
              <InProgressRaw v-for="talon in col" :talon="talon" :key="talon.location" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tablo-container {
  margin: 32px;
}

.notification-column {
  position: relative;
}

.notification {
  text-align: center;
  padding: 20px;
}

.notification-title {
  font-size: 4em;
  color: black;
  font-family: 'HeliosC';
  font-weight: 700;
}

.notification-number {
  font-size: 7em;
  color: #1d3d84;
  font-family: 'HeliosC';
  font-weight: 700;
}

.talon-list {
  margin-top: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-family: HeliosC;
  font-size: 30px;
  font-weight: 800;
  color: black;
}
</style>
