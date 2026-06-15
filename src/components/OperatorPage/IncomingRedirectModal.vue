<script setup lang="ts">
interface IncomingRedirect {
  event: 'talon_redirected'
  talon: {
    id: number
    name: string
    purpose: string
    action: string
  }
  comment: string
  from_operator: {
    id: number
    name: string
  }
  location?: {
    id: number
    name: string
  }
}

defineProps<{
  redirect: IncomingRedirect
}>()

defineEmits<{
  (event: 'close'): void
}>()
</script>

<template>
  <div class="modal-card incoming-redirect-modal">
    <header class="modal-card-head">
      <div>
        <p class="modal-card-title">
          Вам переадресован талон
        </p>

        <p class="incoming-redirect-modal__subtitle">
          Талон назначен вам и готов к обслуживанию
        </p>
      </div>
    </header>

    <section class="modal-card-body">
      <div class="incoming-redirect-modal__talon">
        {{ redirect.talon.name }}
      </div>

      <div class="incoming-redirect-modal__details">
        <div class="incoming-redirect-modal__row">
          <span>Направление</span>

          <strong>
            {{ redirect.talon.purpose }}
          </strong>
        </div>

        <div class="incoming-redirect-modal__row">
          <span>Отправитель</span>

          <strong>
            {{ redirect.from_operator.name }}
          </strong>
        </div>

        <div
          v-if="redirect.location?.name"
          class="incoming-redirect-modal__row"
        >
          <span>Рабочее место</span>

          <strong>
            {{ redirect.location.name }}
          </strong>
        </div>
      </div>

      <div class="incoming-redirect-modal__comment">
        <span class="incoming-redirect-modal__comment-label">
          Комментарий
        </span>

        <p>
          {{
            redirect.comment ||
            'Комментарий не указан'
          }}
        </p>
      </div>
    </section>

    <footer class="modal-card-foot">
      <b-button
        type="is-primary"
        expanded
        @click="$emit('close')"
      >
        Понятно
      </b-button>
    </footer>
  </div>
</template>

<style scoped>
.incoming-redirect-modal {
  width: min(520px, calc(100vw - 32px));
}

.incoming-redirect-modal__subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.9rem;
}

.incoming-redirect-modal__talon {
  margin-bottom: 20px;
  padding: 18px;
  border-radius: 16px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 2rem;
  font-weight: 800;
  text-align: center;
}

.incoming-redirect-modal__details {
  display: grid;
  gap: 12px;
}

.incoming-redirect-modal__row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.incoming-redirect-modal__row span {
  color: #64748b;
}

.incoming-redirect-modal__row strong {
  text-align: right;
}

.incoming-redirect-modal__comment {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff7ed;
}

.incoming-redirect-modal__comment-label {
  display: block;
  margin-bottom: 6px;
  color: #9a3412;
  font-size: 0.85rem;
  font-weight: 700;
}

.incoming-redirect-modal__comment p {
  margin: 0;
  color: #431407;
  white-space: pre-wrap;
}
</style>