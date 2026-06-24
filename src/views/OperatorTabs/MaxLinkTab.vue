<script setup lang="ts">
import { ref, getCurrentInstance } from 'vue'
import { useAuth } from 'vue-auth3'
import { postAPIData } from '@/axios'

const auth = useAuth()
const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy

const loading = ref(false)
const code = ref('')
const command = ref('')

function getErrorMessage(error: any) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    'Не удалось получить код привязки MAX'
  )
}

function generateMaxLinkCode() {
  loading.value = true
  code.value = ''
  command.value = ''

  postAPIData(
    '/helper/max/link-code/',
    {},
    auth,
    (response) => {
      code.value = response.data.code
      command.value = response.data.command || `/link ${response.data.code}`

      $buefy?.notification.open({
        message: 'Код привязки MAX создан',
        duration: 3000,
        type: 'is-success',
        pauseOnHover: true
      })

      loading.value = false
    },
    (error) => {
      $buefy?.notification.open({
        message: getErrorMessage(error),
        duration: 5000,
        type: 'is-danger',
        pauseOnHover: true
      })

      loading.value = false
    }
  )
}

async function copyCommand() {
  if (!command.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(command.value)

    $buefy?.toast.open({
      message: 'Команда скопирована',
      type: 'is-success'
    })
  } catch {
    $buefy?.toast.open({
      message: 'Не удалось скопировать команду',
      type: 'is-warning'
    })
  }
}
</script>

<template>
  <section class="max-link-tab">
    <b-message type="is-info" has-icon>
      Здесь можно получить код для привязки MAX-бота к профилю помощника.
      После генерации отправьте команду боту в MAX.
    </b-message>

    <div class="box">
      <h2 class="title is-5">Привязка MAX</h2>

      <p class="mb-4">
        Нажмите кнопку ниже, чтобы создать одноразовый код привязки.
      </p>

      <b-button
        type="is-primary"
        icon-left="link"
        :loading="loading"
        @click="generateMaxLinkCode"
      >
        Получить код привязки
      </b-button>

      <div v-if="code" class="max-link-result">
        <b-field label="Код привязки">
          <b-input :model-value="code" readonly />
        </b-field>

        <b-field label="Команда для MAX-бота">
          <b-input :model-value="command" readonly />
        </b-field>

        <div class="buttons">
          <b-button
            type="is-success"
            icon-left="content-copy"
            @click="copyCommand"
          >
            Скопировать команду
          </b-button>
        </div>

        <b-message type="is-warning" has-icon>
          Откройте MAX-бота электронной очереди и отправьте ему:
          <strong>{{ command }}</strong>
        </b-message>
      </div>
    </div>
  </section>
</template>

<style scoped>
.max-link-tab {
  padding: 16px 0;
}

.max-link-result {
  margin-top: 24px;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>