<script setup lang="ts">
import { getAPIData, postAPIData } from '@/axios';
import { computed, onMounted, ref, watch, getCurrentInstance } from 'vue';
import { useAuth } from 'vue-auth3';
import { useRouter } from 'vue-router';
import type { OperatorSettings } from '@/types';
import { useQuery } from '@vue/apollo-composable';
import { GET_TALON_BY_ID } from '@/queries';
import HelpModalForm from '@/components/HelpModalForm.vue';
import { useStopwatch } from 'vue-timer-hook';

const stopWatch = useStopwatch(0, false);
const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy;
const auth = useAuth();
let currentSettings: OperatorSettings | null = null;
let currentTalon = ref({});
let currentTalonId = ref(-1);
const enabledTalonById = ref(false);
const talonStatus = computed(() => {
  if (!currentTalon.value?.name) return 'NOT_ASSIGNED';
  return currentTalon.value.logs.at(-1).action;
});
let disabledStateOfButtons = ref({
  next: true,
  notify: true,
  cancel: true,
  start: true,
  complete: true,
  redirect: true
});
let talonById = useQuery(
  GET_TALON_BY_ID,
  { id: currentTalonId },
  { enabled: enabledTalonById, fetchPolicy: 'cache-and-network' }
);
talonById.onResult((res) => {
  if (res.loading) return null;
  currentTalon.value = res.data.talon;
});
watch(
  talonStatus,
  (newStatus, oldStatus) => {
    switch (newStatus) {
      case 'NOT_ASSIGNED':
        disabledStateOfButtons.value.next = false;
        disabledStateOfButtons.value.notify = true;
        disabledStateOfButtons.value.start = true;
        disabledStateOfButtons.value.redirect = true;
        disabledStateOfButtons.value.cancel = true;
        if (currentSettings?.automatic_assignment) disabledStateOfButtons.value.next = true;
        break;
      case 'Assigned':
        disabledStateOfButtons.value.next = true;
        disabledStateOfButtons.value.notify = false;
        disabledStateOfButtons.value.start = false;
        disabledStateOfButtons.value.redirect = true;
        disabledStateOfButtons.value.cancel = false;
        break;
      case 'Canceled':
        disabledStateOfButtons.value.next = false;
        disabledStateOfButtons.value.notify = true;
        disabledStateOfButtons.value.start = true;
        disabledStateOfButtons.value.redirect = true;
        disabledStateOfButtons.value.cancel = true;
        break;
      case 'Started':
        const started = new Date(currentTalon.value.logs.at(-1).createdAt);
        const offset = (new Date() - started) / 1000;
        stopWatch.reset(offset, true);
        disabledStateOfButtons.value.next = true;
        disabledStateOfButtons.value.start = true;
        disabledStateOfButtons.value.complete = false;
        disabledStateOfButtons.value.redirect = true;
        disabledStateOfButtons.value.cancel = false;
        break;
      case 'Completed':
        disabledStateOfButtons.value.complete = true;
        break;
      default:
        break;
    }
  },
  { immediate: true }
);
function getNextTalon() {
  disabledStateOfButtons.value.next = true;
  getAPIData(
    '/queue/operator/talon/action',
    auth,
    (response) => {
      if (response.data.id) {
        currentTalonId.value = response.data.id;
        enabledTalonById.value = true;
      } else {
        disabledStateOfButtons.value.next = false;
      }
    },
    { action: 'next' }
  );
}
function startTalon() {
  disabledStateOfButtons.value.start = true;
  postAPIData(
    '/queue/operator/talon/action',
    null,
    auth,
    (response) => {
      if (response.status === 200) {
        talonById.refetch();
      }
    },
    {
      action: 'start'
    }
  );
}
function cancelTalon() {
  disabledStateOfButtons.value.complete = true;
  postAPIData(
    '/queue/operator/talon/action',
    null,
    auth,
    (response) => {
      if (response.status === 200) {
        currentTalon.value = {};
        stopWatch.reset(0, false);
      }
    },
    {
      action: 'cancel'
    }
  );
}
function notifyTalon() {
  disabledStateOfButtons.value.complete = true;
  postAPIData(
    '/queue/operator/talon/action',
    null,
    auth,
    (response) => {
      $buefy.notification.open({
        message: `Уведомление запущено`,
        duration: 1000,
        type: 'is-success',
        pauseOnHover: false
      });
    },
    {
      action: 'notify'
    }
  );
}
function completeTalon() {
  disabledStateOfButtons.value.complete = true;
  postAPIData(
    '/queue/operator/talon/action',
    null,
    auth,
    (response) => {
      if (response.status === 200) {
        currentTalon.value = {};
        stopWatch.reset(0, false);
      }
    },
    {
      action: 'complete'
    }
  );
}
function cardHelpModal() {
  $buefy.modal.open({
    component: HelpModalForm,
    props: { auth },
    hasModalCard: true,
    trapFocus: true
  });
}
onMounted(() => {
  getAPIData(
    '/queue/operator/talon/action',
    auth,
    (response) => {
      if (response.data.id) {
        currentTalonId.value = response.data.id;
        enabledTalonById.value = true;
      }
    },
    { action: 'current' }
  );
});
</script>
<template>
  <div class="wrapper columns">
    <div class="column">
      <div class="columns">
        <div class="column is-one-third">
          <div class="fixed-grid has-3-cols">
            <div class="grid">
              <b-button
                @click="getNextTalon()"
                class="cell"
                type="is-link"
                :disabled="disabledStateOfButtons.next"
              >
                Следующий
              </b-button>
              <b-button
                @click="notifyTalon()"
                class="cell"
                type="is-warning"
                :disabled="disabledStateOfButtons.notify"
              >
                Позвать
              </b-button>
              <b-button
                @click="cancelTalon()"
                class="cell"
                type="is-danger"
                :disabled="disabledStateOfButtons.cancel"
              >
                Отменить
              </b-button>
              <b-button
                v-if="!disabledStateOfButtons.start"
                @click="startTalon()"
                class="cell"
                type="is-success"
                :disabled="disabledStateOfButtons.start"
              >
                Начать
              </b-button>
              <b-button
                v-else
                @click="completeTalon()"
                class="cell"
                type="is-success"
                :disabled="disabledStateOfButtons.complete"
              >
                Завершить
              </b-button>
              <b-button
                class="cell"
                type="is-warning is-light"
                :disabled="disabledStateOfButtons.redirect"
              >
                Переадресовать
              </b-button>
              <b-button class="cell" type="is-info" @click="cardHelpModal">Помощь</b-button>
            </div>
          </div>
        </div>
        <div class="column"></div>
      </div>
      <div class="block">
        <p>Информация об абитуриенте</p>
        <div v-if="currentTalon?.name">
          <div>Номер талона: {{ currentTalon.name }}</div>
          <div>
            Время регистрации:
            {{
              new Date(
                currentTalon.logs.filter((x: any) => x.action === 'Created')[0].createdAt
              ).toLocaleString() || ''
            }}
          </div>
          <div>Статус: {{ currentTalon.logs.at(-1).action || '' }}</div>
          <div>Цель: {{ currentTalon.purpose.name || '' }}</div>
          <div>
            Комментарии:
            {{ talonById.result.value?.talon.logs.map((x: any) => x.comment) || '' }}
          </div>
        </div>
        <div v-else>
          <div>Номер талона:</div>
          <div>Время регистрации:</div>
          <div>Статус:</div>
          <div>Цель:</div>
          <div>Комментарии:</div>
        </div>
        <div>
          Время обработки: {{ stopWatch.hours }}:{{ stopWatch.minutes }}:{{ stopWatch.seconds }}
        </div>
      </div>
    </div>
  </div>
</template>
<style>
.wrapper {
  margin: auto;
}
</style>
