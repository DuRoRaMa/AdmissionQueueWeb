<script setup lang="ts">
import { getAPIData, postAPIData } from '@/axios';
import { computed, onMounted, ref, watch, getCurrentInstance } from 'vue';
import { useAuth } from 'vue-auth3';
import type { OperatorSettings } from '@/types';
import { useQuery } from '@vue/apollo-composable';
import { GET_TALON_BY_ID } from '@/queries';
import HelpModalForm from '@/components/HelpModalForm.vue';
import ConfirmNewTalonForm from '@/components/OperatorPage/ConfirmNewTalonForm.vue';
import RedirectTalonForm from '@/components/OperatorPage/RedirectTalonForm.vue';
import { useStopwatch } from 'vue-timer-hook';
import { useOperatorTalonStore } from '@/stores/OperatorTalonStore';
import { storeToRefs } from 'pinia';

const stopWatch = useStopwatch(0, false);
const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy;
const auth = useAuth();
const operatorTalonStore = useOperatorTalonStore();
const { currentTalonId } = storeToRefs(operatorTalonStore);
let currentSettings: OperatorSettings | null = null;
const currentTalon = ref({});
const enabledTalonById = ref(false);
const talonStatus = computed(() => {
  if (!currentTalon.value?.name) return 'NOT_ASSIGNED';
  return currentTalon.value.action;
});
let disabledStateOfButtons = ref({
  next: true,
  notify: true,
  cancel: true,
  new: false,
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
        disabledStateOfButtons.value.new = false;
        disabledStateOfButtons.value.notify = true;
        disabledStateOfButtons.value.start = true;
        disabledStateOfButtons.value.redirect = true;
        disabledStateOfButtons.value.cancel = true;
        if (currentSettings?.automatic_assignment) disabledStateOfButtons.value.next = true;
        break;
      case 'Assigned':
        disabledStateOfButtons.value.next = true;
        disabledStateOfButtons.value.new = true;
        disabledStateOfButtons.value.notify = false;
        disabledStateOfButtons.value.start = false;
        disabledStateOfButtons.value.redirect = false;
        disabledStateOfButtons.value.cancel = false;
        break;
      case 'Canceled':
        disabledStateOfButtons.value.next = false;
        disabledStateOfButtons.value.new = false;
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
        disabledStateOfButtons.value.new = true;
        disabledStateOfButtons.value.start = true;
        disabledStateOfButtons.value.complete = false;
        disabledStateOfButtons.value.redirect = false;
        disabledStateOfButtons.value.cancel = false;
        disabledStateOfButtons.value.notify = true;
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
        operatorTalonStore.setCurrentTalonId(response.data.id);
        enabledTalonById.value = true;
      } else {
        disabledStateOfButtons.value.next = false;
        $buefy.toast.open({
          message: 'В очереди нет талонов'
        });
      }
    },
    (error) => {
      $buefy.toast.open({
        message: error
      });
      disabledStateOfButtons.value.next = false;
    },
    { action: 'next' }
  );
}
function startTalon() {
  disabledStateOfButtons.value.start = true;
  postAPIData(
    '/queue/operator/talon/action',
    {},
    auth,
    (response) => {
      if (response.status === 200) {
        talonById.refetch();
      }
    },
    (error) => {
      $buefy.toast.open({
        message: error
      });
      disabledStateOfButtons.value.start = false;
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
    {},
    auth,
    (response) => {
      if (response.status === 200) {
        currentTalon.value = {};
        stopWatch.reset(0, false);
      }
    },
    (error) => {
      $buefy.toast.open({
        message: error
      });
      disabledStateOfButtons.value.cancel = false;
    },
    {
      action: 'cancel'
    }
  );
}
function notifyTalon() {
  disabledStateOfButtons.value.notify = true;
  postAPIData(
    '/queue/operator/talon/action',
    {},
    auth,
    (response) => {
      $buefy.notification.open({
        message: `Уведомление запущено`,
        duration: 1000,
        type: 'is-success',
        pauseOnHover: false
      });
      disabledStateOfButtons.value.notify = false;
    },
    (error) => {
      $buefy.toast.open({
        message: error
      });
      disabledStateOfButtons.value.notify = false;
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
    {},
    auth,
    (response) => {
      if (response.status === 200) {
        currentTalon.value = {};
        stopWatch.reset(0, false);
      }
    },
    (error) => {
      $buefy.toast.open({
        message: error
      });
      disabledStateOfButtons.value.complete = false;
    },
    {
      action: 'complete'
    }
  );
}
function getNewTalon() {
  $buefy.modal.open({
    component: ConfirmNewTalonForm,
    props: { auth },
    hasModalCard: true,
    trapFocus: true
  });
}
function redirectTalon() {
  if (!currentTalon.value?.name) {
    $buefy.toast.open({
      message: 'Нет активного талона для переадресации',
      type: 'is-danger'
    });
    return;
  }

  $buefy.modal.open({
    component: RedirectTalonForm,
    props: {
      auth,
      talonName: currentTalon.value.name,
      currentPurposeId: currentTalon.value?.purpose?.id || null
    },
    events: {
      redirected: () => {
        currentTalon.value = {};
        enabledTalonById.value = false;
        operatorTalonStore.setCurrentTalonId(null);
        stopWatch.reset(0, false);
      }
    },
    hasModalCard: true,
    trapFocus: true
  });
}
function cardHelpModal() {
  $buefy.modal.open({
    component: HelpModalForm,
    props: { auth },
    hasModalCard: true,
    trapFocus: true
  });
}
function getCurrentTalon() {
  console.log('getCurrentTalon');

  getAPIData(
    '/queue/operator/talon/action',
    auth,
    (response) => {
      if (response.data.id) {
        operatorTalonStore.setCurrentTalonId(response.data.id);
        enabledTalonById.value = true;
      }
    },
    (error) => {
      $buefy.toast.open({
        message: error
      });
    },
    { action: 'current' }
  );
}
onMounted(getCurrentTalon);
</script>
<template>
  <section class="operator-workspace">
    <div class="operator-layout">
      <article class="operator-current-card">
        <div class="operator-current-card__top">
          <div>
            <p class="operator-current-card__label">Текущий талон</p>

            <h2 v-if="currentTalon?.name" class="operator-current-card__number">
              {{ currentTalon.name }}
            </h2>

            <h2 v-else class="operator-current-card__empty">
              Нет активного талона
            </h2>
          </div>

          <div class="operator-current-card__purpose">
            {{ currentTalon?.purpose?.name || 'Направление не выбрано' }}
          </div>
        </div>

        <div class="operator-current-card__meta">
          <div class="operator-meta-item">
            <span>Время регистрации</span>
            <strong>
              {{
                currentTalon?.createdAt
                  ? new Date(currentTalon.createdAt).toLocaleString()
                  : '—'
              }}
            </strong>
          </div>

          <div class="operator-meta-item">
            <span>Статус</span>
            <strong>
              {{ talonStatus === 'NOT_ASSIGNED' ? 'Свободен' : currentTalon.action }}
            </strong>
          </div>

          <div class="operator-meta-item">
            <span>Время обработки</span>
            <strong>
              {{ stopWatch.hours }}:{{ stopWatch.minutes }}:{{ stopWatch.seconds }}
            </strong>
          </div>
        </div>

        <div class="operator-current-card__comments">
          <span>Комментарии</span>

          <p v-if="currentTalon?.name">
            {{
              talonById.result.value?.talon.logs
                .map((x: any) => x.comment)
                .filter((x: string) => x)
                .join('; ') || '—'
            }}
          </p>

          <p v-else>—</p>
        </div>
      </article>

      <div class="operator-actions-panel">
        <div class="operator-actions-grid">
          <b-button
            @click="getNextTalon"
            type="is-link"
            class="operator-action-button"
            :disabled="disabledStateOfButtons.next"
          >
            Следующий
          </b-button>

          <b-button
            @click="notifyTalon"
            type="is-warning"
            class="operator-action-button"
            :disabled="disabledStateOfButtons.notify"
          >
            Позвать
          </b-button>

          <b-button
            @click="cancelTalon"
            type="is-danger"
            class="operator-action-button"
            :disabled="disabledStateOfButtons.cancel"
          >
            Отменить
          </b-button>

          <b-button
            @click="getNewTalon"
            type="is-primary is-light"
            class="operator-action-button"
            :disabled="disabledStateOfButtons.new"
          >
            Создать
          </b-button>

          <b-button
            v-if="!disabledStateOfButtons.start"
            @click="startTalon"
            type="is-success"
            class="operator-action-button"
            :disabled="disabledStateOfButtons.start"
          >
            Начать
          </b-button>

          <b-button
            v-else
            @click="completeTalon"
            type="is-success"
            class="operator-action-button"
            :disabled="disabledStateOfButtons.complete"
          >
            Завершить
          </b-button>

          <b-button
            @click="redirectTalon"
            type="is-warning is-light"
            class="operator-action-button"
            :disabled="disabledStateOfButtons.redirect"
          >
            Переадресовать
          </b-button>

          <b-button
            type="is-info"
            class="operator-action-button"
            @click="cardHelpModal"
          >
            Помощь
          </b-button>
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped>
.operator-workspace {
  padding: 20px;
}

.operator-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}

.operator-current-card {
  padding: 24px;
  border: 1px solid #dbdbdb;
  border-radius: 12px;
  background: #ffffff;
}

.operator-current-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.operator-current-card__label {
  margin: 0 0 8px;
  color: #7a7a7a;
  font-size: 0.95rem;
  font-weight: 600;
}

.operator-current-card__number {
  margin: 0;
  color: #1f2937;
  font-size: clamp(3rem, 7vw, 6rem);
  line-height: 1;
}

.operator-current-card__empty {
  margin: 0;
  color: #9ca3af;
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.1;
}

.operator-current-card__purpose {
  max-width: 240px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #f5f5f5;
  color: #363636;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
}

.operator-current-card__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.operator-meta-item {
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
}

.operator-meta-item span,
.operator-current-card__comments span {
  display: block;
  margin-bottom: 5px;
  color: #7a7a7a;
  font-size: 0.85rem;
  font-weight: 600;
}

.operator-meta-item strong {
  color: #363636;
  font-size: 0.98rem;
}

.operator-current-card__comments {
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
}

.operator-current-card__comments p {
  margin: 0;
  color: #363636;
}

.operator-actions-panel {
  padding: 16px;
  border: 1px solid #dbdbdb;
  border-radius: 12px;
  background: #ffffff;
}

.operator-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
}

.operator-action-button {
  min-height: 44px;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .operator-actions-grid {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
}

@media (max-width: 640px) {
  .operator-workspace {
    padding: 12px;
  }

  .operator-current-card {
    padding: 16px;
  }

  .operator-current-card__top {
    flex-direction: column;
  }

  .operator-current-card__purpose {
    max-width: none;
  }

  .operator-current-card__meta {
    grid-template-columns: 1fr;
  }

  .operator-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>