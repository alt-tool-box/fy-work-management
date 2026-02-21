// Work Entry Types
export interface WorkEntry {
  id: string
  title: string
  description: string
  date: string
  category?: string
  tags?: string[]
  time_spent?: number
  priority?: Priority
  status?: WorkStatus
  sprint_id?: string
  notes?: string
  created_at: string
  updated_at: string
  attachments?: Attachment[]
}

export interface WorkEntryCreate {
  title: string
  description: string
  date: string
  category?: string
  tags?: string[]
  time_spent?: number
  priority?: Priority
  status?: WorkStatus
  sprint_id?: string
  notes?: string
}

export interface WorkEntryUpdate extends Partial<WorkEntryCreate> {}

// Planned Task Types
export interface PlannedTask {
  id: string
  title: string
  description?: string
  sprint_id?: string
  week_number?: number
  year: number
  target_date?: string
  estimated_hours?: number
  story_points?: number
  priority?: Priority
  status: PlannedTaskStatus
  category?: string
  tags?: string[]
  work_entry_id?: string
  deferred_to_sprint_id?: string
  deferred_to_week?: number
  
  // External integration fields
  external_id?: string
  external_source?: string
  last_synced_at?: string
  
  created_at: string
  updated_at: string
}

export interface PlannedTaskCreate {
  title: string
  description?: string
  sprint_id?: string
  week_number?: number
  year: number
  target_date?: string
  estimated_hours?: number
  story_points?: number
  priority?: Priority
  status?: PlannedTaskStatus
  category?: string
  tags?: string[]
}

export interface PlannedTaskUpdate extends Partial<PlannedTaskCreate> {}

// Sprint Types
export interface Sprint {
  id: string
  name: string
  quarter_id?: string
  start_date: string
  end_date: string
  status: SprintStatus
  goal?: string
  working_days: number
  created_at: string
  // Populated from join
  quarter_name?: string
  quarter_year?: number
}

export interface SprintCreate {
  name: string
  quarter_id?: string
  start_date: string
  end_date: string
  status?: SprintStatus
  goal?: string
  working_days?: number
}

// Quarter Types
export interface Quarter {
  id: string
  name: string
  start_date: string
  end_date: string
  year: number
  created_at: string
}

export interface QuarterCreate {
  name: string
  start_date: string
  end_date: string
  year: number
}

// Holiday Types
export interface Holiday {
  id: string
  name: string
  date: string
  is_recurring: boolean
  description?: string
  created_at: string
}

export interface HolidayCreate {
  name: string
  date: string
  is_recurring?: boolean
  description?: string
}

// Attachment Types
export interface Attachment {
  id: string
  work_entry_id: string
  file_name: string
  file_path?: string
  file_type?: string
  file_size?: number
  minio_bucket: string
  minio_key: string
  created_at: string
}

// Chat Types
export interface ChatMessage {
  id: string
  session_id: string
  role: "user" | "assistant"
  message: string
  created_at: string
}

export interface ChatRequest {
  message: string
  session_id?: string
}

export interface ChatResponse {
  response: string
  session_id: string
}

// Configuration Types
export interface Configuration {
  id: string
  key: string
  value: Record<string, unknown>
  updated_at: string
}

// Dashboard Types
export interface DashboardStats {
  total_work_entries: number
  total_planned_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  total_time_spent: number
  entries_this_week: number
  entries_this_month: number
  completion_rate: number
  current_sprint?: Sprint
  sprint_progress: SprintProgress
}

export interface SprintProgress {
  planned_count: number
  completed_count: number
  in_progress_count: number
  deferred_count: number
  completion_rate: number
}

export interface DashboardSummary {
  summary: string
  highlights: string[]
  recommendations: string[]
}

// Summary Types
export interface Summary {
  period: string
  start_date: string
  end_date: string
  total_entries: number
  total_time_spent: number
  categories_breakdown: Record<string, number>
  priorities_breakdown: Record<string, number>
  ai_summary?: string
  highlights?: string[]
  patterns?: string[]
  planned_vs_actual?: {
    planned: number
    completed: number
    deferred: number
    cancelled: number
  }
}

// Calendar Types
export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: "work_entry" | "holiday" | "planned_task" | "sprint_start" | "sprint_end" | "quarter_start" | "quarter_end"
  color?: string
  metadata?: Record<string, unknown>
}

// Jira Integration Types
export interface JiraSyncRequest {
  cookie: string
  rapid_view_id: number
  quick_filter_id: number
  selected_project_key: string
  year?: number
  quarter_id?: string
  sprint_id?: string
}

export interface JiraSyncResponse {
  success: boolean
  message: string
  results: {
    total: number
    created: number
    updated: number
    skipped: number
    errors: string[]
  }
  synced_at: string
}

// Enums
export type Priority = "low" | "medium" | "high" | "critical"
export type WorkStatus = "in_progress" | "completed" | "on_hold"
export type PlannedTaskStatus = "planned" | "in_progress" | "completed" | "deferred" | "cancelled"
export type SprintStatus = "planned" | "active" | "completed"
export type SummaryType = "daily" | "weekly" | "monthly" | "quarterly" | "sprint" | "yearly"

// API Response Types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiError {
  detail: string
  status_code: number
}
