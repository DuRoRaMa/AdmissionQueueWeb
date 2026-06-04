export interface OperatorLocation {
  id: number
  name: string
  settings?: number
  disabled?: boolean
}
export interface OperatorSettings {
  location: number
  purposes: number[]
  automatic_assignment: boolean
}
export interface TalonPurpose {
  id: number
  name: string
  description: string
}
export interface QueueStatsSummary {
  total: number;
  waiting: number;
  assigned: number;
  started: number;
  in_service: number;
  completed: number;
  cancelled: number;
  redirected: number;
  avg_wait_seconds: number;
  avg_service_seconds: number;
}

export interface QueueStatsByDay {
  date: string;
  total: number;
  waiting: number;
  assigned: number;
  started: number;
  completed: number;
  cancelled: number;
  redirected: number;
}

export interface QueueStatsByHour {
  hour: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface QueueStatsByPurpose {
  id: number;
  name: string;
  code: string;
  total: number;
  waiting: number;
  assigned: number;
  started: number;
  completed: number;
  cancelled: number;
  redirected: number;
}

export interface QueueStatsByOperator {
  id: number;
  username: string;
  assigned: number;
  started: number;
  completed: number;
  cancelled: number;
  notified?: number;
  avg_service_seconds: number;
}

export interface QueueStatsFilters {
  start: string;
  end: string;
  purpose: string | number | null;
  operator: string | number | null;
  status: string | null;
}

export interface QueueStatsResponse {
  filters: QueueStatsFilters;
  summary: QueueStatsSummary;
  by_day: QueueStatsByDay[];
  by_hour: QueueStatsByHour[];
  by_purpose: QueueStatsByPurpose[];
  by_operator: QueueStatsByOperator[];
  status_labels: Record<string, string>;
}
export interface QueueStatsUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface QueueStatsTalonLog {
  id: number;
  action: string;
  action_label: string;
  comment: string | null;
  created_at: string;
  created_by: QueueStatsUser | null;
}

export interface OperatorStatsTalon {
  id: number;
  name: string;
  ordinal: number;
  status: string;
  status_label: string;
  purpose: {
    id: number;
    name: string;
    code: string;
  };
  created_at: string;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  wait_seconds: number | null;
  service_seconds: number | null;
  comment: string | null;
  logs: QueueStatsTalonLog[];
  operator_logs: QueueStatsTalonLog[];
}

export interface OperatorDetailedStatsResponse {
  filters: {
    start: string;
    end: string;
    purpose: string | number | null;
    status: string | null;
  };
  operator: QueueStatsUser | null;
  summary: {
    total: number;
    assigned: number;
    started: number;
    completed: number;
    cancelled: number;
    notified: number;
    avg_wait_seconds: number;
    avg_service_seconds: number;
  };
  talons: OperatorStatsTalon[];
  status_labels: Record<string, string>;
}

export interface QueueStatsFilterPurpose {
  id: number;
  name: string;
  code: string;
}

export interface QueueStatsFilterOperator {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface QueueStatsFilterOptions {
  purposes: QueueStatsFilterPurpose[];
  operators: QueueStatsFilterOperator[];
  statuses: Record<string, string>;
}