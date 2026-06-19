<script setup lang="ts">
import {
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from 'vue';
import { useSubscription } from '@vue/apollo-composable';

import InProgressRaw from '@/components/TabloPage/InProgressRaw.vue';
import HeaderPanel from '@/components/TabloPage/HeaderPanel.vue';
import {
  TALON_LOG_SUB
} from '@/queries/talonLogSub';

const talonsPerCol = 7;

interface Talon {
  id: number;
  name: string;
  location: string;
}

interface PublicTalon {
  id: number;
  name: string;
  action: string;
  purpose: string;
  last_log_id?: number | null;
  last_log_action?: string | null;
  last_log_comment?: string | null;
  last_log_created_at?: string | null;
}

interface PublicLocation {
  id: number;
  name: string;
  is_operator_assigned?: boolean;
  talon: PublicTalon | null;
}

interface PublicQueueState {
  locations: PublicLocation[];
}

const CALL_COMMENT = 'Вызов талона оператором';

const data = reactive({
  talons: [] as Talon[]
});

const data_for_show = reactive(
  [] as {
    name: string | undefined;
    location: string;
  }[]
);

const currentNotification = reactive({
  name: 'З - 01',
  location: '14',
  show: false
});

const isSmallScreen = ref(false);
const isStateLoading = ref(false);

let queueForNotification: Talon[] = [];
let stateRefreshInterval: number | null = null;
let notificationInterval: number | null = null;
let hideNotificationTimer: number | null = null;

const processedNotificationLogIds = new Set<number>();

const { result } = useSubscription(
  TALON_LOG_SUB,
  {},
  {
    fetchPolicy: 'network-only'
  }
);

const checkScreenSize = () => {
  isSmallScreen.value =
    window.innerWidth <= 1260 &&
    window.innerHeight <= 260;
};

function getNumber(value: unknown): number | null {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function isCallEvent(talon: PublicTalon): boolean {
  if (talon.last_log_action === 'Started') {
    return true;
  }

  return (
    talon.last_log_action === 'Assigned' &&
    talon.last_log_comment === CALL_COMMENT
  );
}

function enqueueNotificationsFromState(
  locations: PublicLocation[],
  shouldEnqueue: boolean
): void {
  for (const location of locations) {
    const talon = location.talon;

    if (!talon) {
      continue;
    }

    const logId = getNumber(talon.last_log_id);

    if (logId === null) {
      continue;
    }

    if (processedNotificationLogIds.has(logId)) {
      continue;
    }

    processedNotificationLogIds.add(logId);

    if (!shouldEnqueue) {
      continue;
    }

    if (!isCallEvent(talon)) {
      continue;
    }

    queueForNotification.push({
      id: talon.id,
      name: talon.name,
      location: location.name
    });
  }
}

function rebuildRows(
  locations: PublicLocation[]
): void {
  data.talons = locations
    .filter(
      (item): item is PublicLocation & {
        talon: PublicTalon;
      } => item.talon !== null
    )
    .map((item) => ({
      id: item.talon.id,
      name: item.talon.name,
      location: item.name
    }));

  data_for_show.length = 0;

  for (const item of locations) {
    data_for_show.push({
      name: item.talon?.name,
      location: item.name
    });
  }

  data_for_show.sort((a, b) => {
    const locationA = Number(a.location);
    const locationB = Number(b.location);

    if (
      Number.isFinite(locationA) &&
      Number.isFinite(locationB)
    ) {
      return locationA - locationB;
    }

    return a.location.localeCompare(
      b.location,
      'ru',
      {
        numeric: true
      }
    );
  });
}

async function fetchQueueState(
  shouldEnqueueNotifications = true
): Promise<void> {
  if (isStateLoading.value) {
    return;
  }

  isStateLoading.value = true;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/queue/public/state/`,
      {
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(
        `Не удалось получить состояние табло: HTTP ${response.status}`
      );
    }

    const responseData =
      (await response.json()) as PublicQueueState;

    const locations = responseData.locations ?? [];

    rebuildRows(locations);
    enqueueNotificationsFromState(
      locations,
      shouldEnqueueNotifications
    );
  } catch (error) {
    console.error(
      'Ошибка обновления состояния табло:',
      error
    );
  } finally {
    isStateLoading.value = false;
  }
}

function showNotification(): void {
  const notification = queueForNotification.shift();

  if (!notification) {
    return;
  }

  currentNotification.name = notification.name;
  currentNotification.location =
    notification.location;
  currentNotification.show = true;

  fetch('http://localhost:8001/tts', {
    method: 'POST',
    body: JSON.stringify(notification),
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*'
    }
  }).catch((error) => {
    console.error(
      'Ошибка отправки текста в TTS:',
      error
    );
  });

  if (hideNotificationTimer !== null) {
    window.clearTimeout(hideNotificationTimer);
  }

  hideNotificationTimer = window.setTimeout(() => {
    currentNotification.show = false;
    hideNotificationTimer = null;
  }, 10000);
}

watch(
  result,
  async (subscriptionResult) => {
    if (!subscriptionResult?.talonLogs) {
      return;
    }

    /*
     * GraphQL используем только как быстрый триггер.
     * Само состояние и событие вызова берём из REST,
     * потому что там есть стол оператора и last_log_id.
     */
    await fetchQueueState(true);
  },
  {
    immediate: false
  }
);

onMounted(async () => {
  /*
   * Первый запрос только синхронизирует текущее состояние.
   * Старые last_log_id помечаем обработанными, чтобы при
   * открытии/обновлении страницы табло не озвучивало старый вызов.
   */
  await fetchQueueState(false);

  stateRefreshInterval = window.setInterval(
    () => {
      fetchQueueState(true);
    },
    2000
  );

  notificationInterval = window.setInterval(
    () => {
      if (!currentNotification.show) {
        showNotification();
      }
    },
    1000
  );

  checkScreenSize();
  window.addEventListener(
    'resize',
    checkScreenSize
  );
});

onUnmounted(() => {
  if (stateRefreshInterval !== null) {
    window.clearInterval(
      stateRefreshInterval
    );
  }

  if (notificationInterval !== null) {
    window.clearInterval(
      notificationInterval
    );
  }

  if (hideNotificationTimer !== null) {
    window.clearTimeout(
      hideNotificationTimer
    );
  }

  window.removeEventListener(
    'resize',
    checkScreenSize
  );
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
    >
      Удачи<br />
      при поступлении!
    </p>
    <div class="columns has-text-centered">
      <div class="column">
        <div class="columns is-multiline" style="padding: 1%">
          <div class="column is-full" style="padding-left: 60px; padding-top: 10px">
            <div v-if="currentNotification.show" class="notification-content">
              <p style="font-size: 4em; color: black; font-family: 'HeliosC'; font-weight: 700">
                Талон
              </p>
              <p style="font-size: 7em; color: #1d3d84; font-family: 'HeliosC'; font-weight: 700">
                {{ currentNotification.name }}
              </p>
              <p
                style="
                  font-size: 5em;
                  line-height: 90px;
                  font-family: 'HeliosC';
                  color: black;
                  font-weight: 700;
                "
              >
                стол
              </p>
              <p
                style="
                  font-size: 6em;
                  line-height: 90px;
                  font-family: 'HeliosC';
                  color: black;
                  font-weight: 700;
                "
              >
                {{ currentNotification.location }}
              </p>
            </div>
            <img
              src="@/assets/DVFU_logo_tablo.svg"
              alt=""
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
.small-screen .notification-content {
  transform: scale(0.85);
  transform-origin: top left;
  padding-top: 5px;
}

.small-screen .notification-content p {
  line-height: 1.2 !important;
  margin-bottom: 0.2em !important;
}

.small-screen .notification-content p:first-child {
  font-size: 3em !important;
}

.small-screen .notification-content p:nth-child(2) {
  font-size: 5em !important;
}

.small-screen .notification-content p:nth-child(3) {
  font-size: 3.5em !important;
}

.small-screen .notification-content p:nth-child(4) {
  font-size: 4.5em !important;
}

.small-screen .up-ver-line {
  height: 70vh;
}

.small-screen p[style*="bottom: 4%"] {
  font-size: 20px !important;
  bottom: 6% !important;
}

.small-screen img {
  max-height: 250px !important;
  bottom: 5% !important;
  left: 3% !important;
  transform: scale(0.7) !important;
}
</style>