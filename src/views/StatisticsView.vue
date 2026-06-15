<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { useAuth } from 'vue-auth3';
import VueApexCharts from 'vue3-apexcharts';

import { getAPIData } from '@/axios';
import type {   
    OperatorDetailedStatsResponse,
  QueueStatsByOperator,
  QueueStatsFilterOptions,
  QueueStatsResponse } from '@/types/index';

const auth = useAuth();
const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy;
function resetFilters() {
  filters.purpose = null;
  filters.operator = null;
  filters.status = null;

  loadStatistics();
}

const loading = ref(false);
const filtersLoading = ref(false);


const filterOptions = reactive<QueueStatsFilterOptions>({
  purposes: [],
  operators: [],
  statuses: {}
});

const operatorModalActive = ref(false);
const operatorLoading = ref(false);
const selectedOperator = ref<QueueStatsByOperator | null>(null);

const filters = reactive({
  purpose: null as number | null,
  operator: null as number | null,
  status: null as string | null
});

const operatorDetails = reactive<OperatorDetailedStatsResponse>({
  filters: {
    start: '',
    end: '',
    purpose: null,
    status: null
  },
  operator: null,
  summary: {
    total: 0,
    assigned: 0,
    started: 0,
    completed: 0,
    cancelled: 0,
    notified: 0,
    avg_wait_seconds: 0,
    avg_service_seconds: 0
  },
  talons: [],
  status_labels: {}
});

const dates = ref<[Date, Date]>([new Date(), new Date()]);

const stats = reactive<QueueStatsResponse>({
  filters: {
    start: '',
    end: '',
    purpose: null,
    operator: null,
    status: null
  },
  summary: {
    total: 0,
    waiting: 0,
    assigned: 0,
    started: 0,
    in_service: 0,
    completed: 0,
    cancelled: 0,
    redirected: 0,
    avg_wait_seconds: 0,
    avg_service_seconds: 0
  },
  by_day: [],
  by_hour: [],
  by_purpose: [],
  by_operator: [],
  status_labels: {}
});

function toApiDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${day}-${month}`
}
function loadFilterOptions() {
  filtersLoading.value = true;

  getAPIData(
    '/queue/stats/filters/',
    auth,
    (response) => {
      Object.assign(filterOptions, response.data);
      filtersLoading.value = false;
    },
    (error) => {
      filtersLoading.value = false;

      $buefy?.toast.open({
        message: `Не удалось загрузить фильтры: ${error.message}`,
        type: 'is-danger'
      });
    }
  );
}
function formatDuration(seconds: number): string {
  if (!seconds) return '0 мин';

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return `${hours} ч ${restMinutes} мин`;
}
function formatDateTime(value: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatNullableDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) {
    return '—';
  }

  return formatDuration(seconds);
}

function numberValue(value: number | undefined): string {
  return String(value ?? 0);
}

function loadStatistics() {
  loading.value = true;

  const [startDate, endDate] = dates.value;

  getAPIData(
    '/queue/stats/extended/',
    auth,
    (response) => {
      Object.assign(stats, response.data);
      loading.value = false;
    },
    (error) => {
      loading.value = false;

      $buefy?.toast.open({
        message: `Не удалось загрузить статистику: ${error.message}`,
        type: 'is-danger'
      });
    },
    {
      start: toApiDate(startDate),
      end: toApiDate(endDate),
      purpose: filters.purpose || undefined,
      operator: filters.operator || undefined,
      status: filters.status || undefined
    }
  );
}

function loadOperatorDetails(operator: QueueStatsByOperator) {
  selectedOperator.value = operator;
  operatorModalActive.value = true;
  operatorLoading.value = true;

  const [startDate, endDate] = dates.value;

  getAPIData(
    `/queue/stats/operators/${operator.id}/`,
    auth,
    (response) => {
      Object.assign(operatorDetails, response.data);
      operatorLoading.value = false;
    },
    (error) => {
      operatorLoading.value = false;

      $buefy?.toast.open({
        message: `Не удалось загрузить статистику оператора: ${error.message}`,
        type: 'is-danger'
      });
    },
    {
      start: toApiDate(startDate),
      end: toApiDate(endDate)
    }
  );
}

const summaryCards = computed(() => [
  {
    title: 'Всего талонов',
    value: numberValue(stats.summary.total),
    subtitle: 'Создано за период'
  },
  {
    title: 'Ожидают',
    value: numberValue(stats.summary.waiting),
    subtitle: 'Талоны в очереди'
  },
  {
    title: 'В обслуживании',
    value: numberValue(stats.summary.in_service),
    subtitle: 'Назначены или начаты'
  },
  {
    title: 'Завершено',
    value: numberValue(stats.summary.completed),
    subtitle: 'Успешно обработано'
  },
  {
    title: 'Отменено',
    value: numberValue(stats.summary.cancelled),
    subtitle: 'Отменённые талоны'
  },
  {
    title: 'Среднее ожидание',
    value: formatDuration(stats.summary.avg_wait_seconds),
    subtitle: 'До начала обслуживания'
  },
  {
    title: 'Среднее обслуживание',
    value: formatDuration(stats.summary.avg_service_seconds),
    subtitle: 'Время работы оператора'
  }
]);

const dayChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: {
      show: false
    }
  },
  xaxis: {
    categories: stats.by_day.map((item) => item.date)
  },
  dataLabels: {
    enabled: false
  },
  legend: {
    position: 'top'
  }
}));

const dayChartSeries = computed(() => [
  {
    name: 'Всего',
    data: stats.by_day.map((item) => item.total)
  },
  {
    name: 'Завершено',
    data: stats.by_day.map((item) => item.completed)
  },
  {
    name: 'Отменено',
    data: stats.by_day.map((item) => item.cancelled)
  }
]);

const hourChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: {
      show: false
    }
  },
  xaxis: {
    categories: stats.by_hour.map((item) => item.hour)
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  }
}));

const hourChartSeries = computed(() => [
  {
    name: 'Талоны',
    data: stats.by_hour.map((item) => item.total)
  }
]);

const purposeChartOptions = computed(() => ({
  chart: {
    type: 'pie',
    toolbar: {
      show: false
    }
  },
  labels: stats.by_purpose.map((item) => item.name),
  legend: {
    position: 'bottom'
  },
  dataLabels: {
    enabled: true
  },
  tooltip: {
    y: {
      formatter: (value: number) => `${value} тал.`
    }
  }
}));

const purposeChartSeries = computed(() =>
  stats.by_purpose.map((item) => item.total)
);

onMounted(() => {
  loadFilterOptions();
  loadStatistics();
});
</script>

<template>
  <section class="queue-statistics">
    <div class="statistics-header">
      <div>
        <h1 class="title is-3 statistics-title">Расширенная статистика очереди</h1>
        <p class="statistics-subtitle">
          Аналитика по талонам, направлениям, операторам и времени обслуживания.
        </p>
      </div>

      <b-button type="is-primary" :loading="loading" @click="loadStatistics">
        Обновить
      </b-button>
    </div>

    <div class="box filters-box">
        <div class="filters-grid">
            <b-field label="Период">
            <b-datepicker
                v-model="dates"
                placeholder="Выберите период"
                range
            />
            </b-field>

            <b-field label="Направление">
            <b-select
                v-model="filters.purpose"
                placeholder="Все направления"
                expanded
                :loading="filtersLoading"
            >
                <option :value="null">Все направления</option>

                <option
                v-for="purpose in filterOptions.purposes"
                :key="purpose.id"
                :value="purpose.id"
                >
                {{ purpose.name }}
                </option>
            </b-select>
            </b-field>

            <b-field label="Оператор">
            <b-select
                v-model="filters.operator"
                placeholder="Все операторы"
                expanded
                :loading="filtersLoading"
            >
                <option :value="null">Все операторы</option>

                <option
                v-for="operator in filterOptions.operators"
                :key="operator.id"
                :value="operator.id"
                >
                {{ operator.full_name || operator.username }}
                </option>
            </b-select>
            </b-field>

            <b-field label="Статус">
            <b-select
                v-model="filters.status"
                placeholder="Все статусы"
                expanded
                :loading="filtersLoading"
            >
                <option :value="null">Все статусы</option>

                <option
                v-for="(label, value) in filterOptions.statuses"
                :key="value"
                :value="value"
                >
                {{ label }}
                </option>
            </b-select>
            </b-field>
        </div>

        <div class="filters-actions">
            <b-button
            type="is-primary"
            :loading="loading"
            @click="loadStatistics"
            >
            Применить
            </b-button>

            <b-button @click="resetFilters">
            Сбросить
            </b-button>
        </div>
        </div>

    <b-loading :is-full-page="false" v-model="loading" />

    <div class="summary-grid">
      <div v-for="card in summaryCards" :key="card.title" class="summary-card box">
        <p class="summary-card__title">{{ card.title }}</p>
        <p class="summary-card__value">{{ card.value }}</p>
        <p class="summary-card__subtitle">{{ card.subtitle }}</p>
      </div>
    </div>

    <div class="charts-grid">
      <div class="box chart-card">
        <h2 class="title is-5">Динамика по дням</h2>
        <VueApexCharts
          height="320"
          :options="dayChartOptions"
          :series="dayChartSeries"
        />
      </div>

      <div class="box chart-card">
        <h2 class="title is-5">Нагрузка по часам</h2>
        <VueApexCharts
          height="320"
          :options="hourChartOptions"
          :series="hourChartSeries"
        />
      </div>

      <div class="box chart-card chart-card--wide">
        <h2 class="title is-5">Талоны по направлениям</h2>
        <VueApexCharts
          height="360"
          :options="purposeChartOptions"
          :series="purposeChartSeries"
        />
      </div>
    </div>

    <div class="box table-card">
      <h2 class="title is-5">Статистика по операторам</h2>

      <div v-if="!stats.by_operator.length" class="empty-state">
        Нет данных по операторам за выбранный период.
      </div>

      <div v-else class="table-container">
        <table class="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Оператор</th>
              <th>Назначено</th>
              <th>Начато</th>
              <th>Завершено</th>
              <th>Отменено</th>
              <th>Среднее обслуживание</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="operator in stats.by_operator" :key="operator.id">
              <td>{{ operator.username }}</td>
              <td>{{ operator.assigned }}</td>
              <td>{{ operator.started }}</td>
              <td>{{ operator.completed }}</td>
              <td>{{ operator.cancelled }}</td>
              <td>{{ formatDuration(operator.avg_service_seconds) }}</td>
              <td class="has-text-right">
                <b-button
                    size="is-small"
                    type="is-primary"
                    outlined
                    @click="loadOperatorDetails(operator)"
                >
                    Подробнее
                </b-button>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="box mobile-operator-list">
      <h2 class="title is-5">Операторы</h2>

      <div v-if="!stats.by_operator.length" class="empty-state">
        Нет данных по операторам за выбранный период.
      </div>

      <article
        v-for="operator in stats.by_operator"
        :key="operator.id"
        class="operator-mobile-card"
      >
        <div class="operator-mobile-card__header">
          <strong>{{ operator.username }}</strong>
          <span>{{ operator.completed }} завершено</span>
        </div>

        <div class="operator-mobile-card__grid">
          <span>Назначено: {{ operator.assigned }}</span>
          <span>Начато: {{ operator.started }}</span>
          <span>Отменено: {{ operator.cancelled }}</span>
          <span>Среднее: {{ formatDuration(operator.avg_service_seconds) }}</span>
        </div>
        <b-button
            size="is-small"
            type="is-primary"
            outlined
            expanded
            @click="loadOperatorDetails(operator)"
        >
            Подробнее
        </b-button>
      </article>
    </div>
    <b-modal
  v-model="operatorModalActive"
  has-modal-card
  trap-focus
  :destroy-on-hide="false"
>
  <div class="modal-card operator-details-modal">
    <header class="modal-card-head">
      <div>
        <p class="modal-card-title">
          Статистика оператора
        </p>
        <p class="operator-modal-subtitle">
          {{ operatorDetails.operator?.full_name || operatorDetails.operator?.username || selectedOperator?.username }}
        </p>
      </div>

      <button
        type="button"
        class="delete"
        aria-label="close"
        @click="operatorModalActive = false"
      />
    </header>

    <section class="modal-card-body">
      <b-loading :is-full-page="false" v-model="operatorLoading" />

      <div class="operator-summary-grid">
        <div class="operator-summary-card">
          <span>Всего талонов</span>
          <strong>{{ operatorDetails.summary.total }}</strong>
        </div>

        <div class="operator-summary-card">
          <span>Назначено</span>
          <strong>{{ operatorDetails.summary.assigned }}</strong>
        </div>

        <div class="operator-summary-card">
          <span>Начато</span>
          <strong>{{ operatorDetails.summary.started }}</strong>
        </div>

        <div class="operator-summary-card">
          <span>Завершено</span>
          <strong>{{ operatorDetails.summary.completed }}</strong>
        </div>

        <div class="operator-summary-card">
          <span>Отменено</span>
          <strong>{{ operatorDetails.summary.cancelled }}</strong>
        </div>

        <div class="operator-summary-card">
          <span>Среднее ожидание</span>
          <strong>{{ formatDuration(operatorDetails.summary.avg_wait_seconds) }}</strong>
        </div>

        <div class="operator-summary-card">
          <span>Среднее обслуживание</span>
          <strong>{{ formatDuration(operatorDetails.summary.avg_service_seconds) }}</strong>
        </div>
      </div>

      <h3 class="title is-5 operator-talons-title">
        Талоны оператора
      </h3>

      <div v-if="!operatorDetails.talons.length && !operatorLoading" class="empty-state">
        По выбранному периоду нет талонов.
      </div>

      <div v-else class="operator-talons-list">
        <article
          v-for="talon in operatorDetails.talons"
          :key="talon.id"
          class="operator-talon-card"
        >
          <div class="operator-talon-card__header">
            <div>
              <strong>{{ talon.name }}</strong>
              <p>{{ talon.purpose.name }}</p>
            </div>

            <span class="tag is-light">
              {{ talon.status_label }}
            </span>
          </div>

          <div class="operator-talon-card__grid">
            <div>
              <span>Создан</span>
              <strong>{{ formatDateTime(talon.created_at) }}</strong>
            </div>

            <div>
              <span>Назначен</span>
              <strong>{{ formatDateTime(talon.assigned_at) }}</strong>
            </div>

            <div>
              <span>Начат</span>
              <strong>{{ formatDateTime(talon.started_at) }}</strong>
            </div>

            <div>
              <span>Завершён</span>
              <strong>{{ formatDateTime(talon.completed_at) }}</strong>
            </div>

            <div>
              <span>Ожидание</span>
              <strong>{{ formatNullableDuration(talon.wait_seconds) }}</strong>
            </div>

            <div>
              <span>Обслуживание</span>
              <strong>{{ formatNullableDuration(talon.service_seconds) }}</strong>
            </div>
          </div>

          <details v-if="talon.operator_logs.length" class="operator-talon-logs">
            <summary>Журнал действий оператора</summary>

            <div
              v-for="log in talon.operator_logs"
              :key="log.id"
              class="operator-log-row"
            >
              <span>{{ formatDateTime(log.created_at) }}</span>
              <strong>{{ log.action_label }}</strong>
              <small v-if="log.comment">{{ log.comment }}</small>
            </div>
          </details>
        </article>
      </div>
    </section>

    <footer class="modal-card-foot">
      <b-button @click="operatorModalActive = false">
        Закрыть
      </b-button>
    </footer>
  </div>
</b-modal>
  </section>
</template>

<style scoped>
.queue-statistics {
  padding: 24px;
}

.statistics-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.statistics-title {
  margin-bottom: 6px;
}

.statistics-subtitle {
  color: #6b7280;
}

.filters-box {
  margin-bottom: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  margin-bottom: 0;
}

.summary-card__title {
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 0.9rem;
}

.summary-card__value {
  margin-bottom: 4px;
  color: #111827;
  font-size: 1.8rem;
  font-weight: 800;
}

.summary-card__subtitle {
  color: #9ca3af;
  font-size: 0.85rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  overflow: hidden;
}

.chart-card--wide {
  grid-column: 1 / -1;
}

.table-card {
  margin-bottom: 20px;
}

.empty-state {
  padding: 24px;
  color: #6b7280;
  text-align: center;
}

.mobile-operator-list {
  display: none;
}

.operator-mobile-card {
  padding: 14px 0;
  border-bottom: 1px solid #e5e7eb;
}

.operator-mobile-card:last-child {
  border-bottom: none;
}

.operator-mobile-card__header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.operator-mobile-card__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  color: #6b7280;
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .queue-statistics {
    padding: 14px;
  }

  .statistics-header {
    flex-direction: column;
  }

  .statistics-header .button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .table-card {
    display: none;
  }

  .mobile-operator-list {
    display: block;
  }

  .operator-mobile-card__header {
    flex-direction: column;
  }

  .operator-mobile-card__grid {
    grid-template-columns: 1fr;
  }
}
.operator-details-modal {
  width: min(1100px, calc(100vw - 32px));
}

.operator-modal-subtitle {
  margin-top: 4px;
  color: #6b7280;
  font-size: 0.9rem;
}

.operator-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.operator-summary-card {
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #f9fafb;
}

.operator-summary-card span {
  display: block;
  margin-bottom: 6px;
  color: #6b7280;
  font-size: 0.85rem;
}

.operator-summary-card strong {
  color: #111827;
  font-size: 1.25rem;
}

.operator-talons-title {
  margin-bottom: 14px;
}

.operator-talons-list {
  display: grid;
  gap: 14px;
}

.operator-talon-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
}

.operator-talon-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.operator-talon-card__header p {
  margin-top: 4px;
  color: #6b7280;
}

.operator-talon-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  gap: 12px;
}

.operator-talon-card__grid span {
  display: block;
  margin-bottom: 4px;
  color: #6b7280;
  font-size: 0.82rem;
}

.operator-talon-card__grid strong {
  color: #111827;
  font-size: 0.95rem;
}

.operator-talon-logs {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.operator-talon-logs summary {
  cursor: pointer;
  color: #2563eb;
  font-weight: 600;
}

.operator-log-row {
  display: grid;
  grid-template-columns: 160px 140px 1fr;
  gap: 10px;
  padding: 8px 0;
  color: #374151;
  font-size: 0.9rem;
  border-bottom: 1px solid #f3f4f6;
}

.operator-log-row:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .operator-details-modal {
    width: calc(100vw - 20px);
  }

  .operator-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .operator-talon-card__header {
    flex-direction: column;
  }

  .operator-talon-card__grid {
    grid-template-columns: 1fr;
  }

  .operator-log-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .operator-summary-grid {
    grid-template-columns: 1fr;
  }
}
.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 16px;
  align-items: end;
}

.filters-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 640px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .filters-actions {
    flex-direction: column;
  }

  .filters-actions .button {
    width: 100%;
  }
}
</style>
