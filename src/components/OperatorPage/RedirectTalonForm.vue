<script setup lang="ts">
import { getAPIData, postAPIData } from '@/axios';
import { getCurrentInstance, onMounted, ref } from 'vue';

const props = defineProps<{
  auth: any;
  talonName?: string;
  currentPurposeId?: number | null;
}>();

const emit = defineEmits<{
  (e: 'redirected'): void;
  (e: 'close'): void;
}>();

const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy;

const loading = ref(false);
const infoLoading = ref(false);

const purposes = ref<any[]>([]);
const freeOperators = ref<any[]>([]);

const mode = ref<'queue' | 'operator'>('queue');
const selectedPurpose = ref<number | null>(props.currentPurposeId || null);
const selectedOperator = ref<number | null>(null);
const comment = ref('');

function loadInfo() {
  infoLoading.value = true;

  getAPIData(
    '/queue/info',
    props.auth,
    (response) => {
      purposes.value = response.data.purposes || [];
      freeOperators.value = response.data.free_operators || [];

      if (!selectedPurpose.value && purposes.value.length) {
        selectedPurpose.value = props.currentPurposeId || purposes.value[0].id;
      }

      infoLoading.value = false;
    },
    (error) => {
      infoLoading.value = false;

      $buefy?.toast.open({
        message: `Не удалось загрузить данные для переадресации: ${error}`,
        type: 'is-danger'
      });
    }
  );
}

function submitRedirect() {
  if (mode.value === 'queue' && !selectedPurpose.value) {
    $buefy?.toast.open({
      message: 'Выберите направление для возврата в очередь',
      type: 'is-danger'
    });
    return;
  }

  if (mode.value === 'operator' && !selectedOperator.value) {
    $buefy?.toast.open({
      message: 'Выберите свободного оператора',
      type: 'is-danger'
    });
    return;
  }

  loading.value = true;

  const payload =
    mode.value === 'queue'
      ? {
          mode: 'queue',
          purpose: selectedPurpose.value,
          comment: comment.value
        }
      : {
            mode: 'operator',
            operator_settings: selectedOperator.value,
            comment: comment.value
        };

  postAPIData(
    '/queue/operator/talon/action',
    payload,
    props.auth,
    (response) => {
      loading.value = false;

      $buefy?.toast.open({
        message: response.data?.detail || 'Талон переадресован',
        type: 'is-success'
      });

      emit('redirected');
      emit('close');
    },
    (error) => {
      loading.value = false;

      $buefy?.toast.open({
        message: error?.response?.data?.detail || error,
        type: 'is-danger'
      });
    },
    {
      action: 'redirect'
    }
  );
}

onMounted(loadInfo);
</script>

<template>
  <div class="modal-card redirect-modal">
    <header class="modal-card-head">
      <div>
        <p class="modal-card-title">Переадресовать талон</p>
        <p v-if="talonName" class="redirect-modal__subtitle">
          Текущий талон: {{ talonName }}
        </p>
      </div>

      <button
        type="button"
        class="delete"
        aria-label="close"
        @click="$emit('close')"
      />
    </header>

    <section class="modal-card-body">
      <b-field label="Способ переадресации">
        <div class="redirect-mode">
          <b-radio-button
            v-model="mode"
            native-value="queue"
            type="is-link"
          >
            Вернуть в очередь
          </b-radio-button>

          <b-radio-button
            v-model="mode"
            native-value="operator"
            type="is-link"
          >
            Передать оператору
          </b-radio-button>
        </div>
      </b-field>

      <div v-if="mode === 'queue'" class="redirect-alert">
        Талон вернётся в очередь. Можно оставить текущее направление или выбрать новое.
      </div>

      <div v-if="mode === 'operator'" class="redirect-alert">
        В списке отображаются только свободные операторы с назначенным рабочим местом.
      </div>

      <b-field v-if="mode === 'queue'" label="Направление">
        <b-select
          v-model="selectedPurpose"
          expanded
          placeholder="Выберите направление"
          :loading="infoLoading"
        >
          <option
            v-for="purpose in purposes"
            :key="purpose.id"
            :value="purpose.id"
          >
            {{ purpose.name }} ({{ purpose.code }})
          </option>
        </b-select>
      </b-field>

      <b-field v-if="mode === 'operator'" label="Свободный оператор">
        <b-select
          v-model="selectedOperator"
          expanded
          placeholder="Выберите оператора"
          :loading="infoLoading"
        >
          <option
            v-for="operator in freeOperators"
            :key="operator.settings_id"
            :value="operator.settings_id"
          >
            {{
              operator.location?.name
                ? `${operator.location.name} — ${operator.full_name || operator.username}`
                : operator.full_name || operator.username
            }}
          </option>
        </b-select>
      </b-field>

      <div
        v-if="mode === 'operator' && !freeOperators.length && !infoLoading"
        class="redirect-empty"
      >
        Сейчас нет свободных операторов для передачи талона.
      </div>

      <b-field label="Комментарий">
        <b-input
          v-model="comment"
          type="textarea"
          placeholder="Причина переадресации"
        />
      </b-field>
    </section>

    <footer class="modal-card-foot">
      <b-button @click="$emit('close')">
        Отмена
      </b-button>

      <b-button
        type="is-warning"
        :loading="loading"
        @click="submitRedirect"
      >
        Переадресовать
      </b-button>
    </footer>
  </div>
</template>

<style scoped>
.redirect-modal {
  width: min(620px, calc(100vw - 32px));
}

.redirect-modal__subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.9rem;
}

.redirect-mode {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.redirect-alert {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 0.95rem;
}

.redirect-empty {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.95rem;
}
</style>