import axios, { type AxiosInstance, type AxiosError } from "axios"
import type {
  WorkEntry,
  WorkEntryCreate,
  WorkEntryUpdate,
  PlannedTask,
  PlannedTaskCreate,
  PlannedTaskUpdate,
  Sprint,
  SprintCreate,
  Quarter,
  QuarterCreate,
  Holiday,
  HolidayCreate,
  ChatRequest,
  ChatResponse,
  DashboardStats,
  DashboardSummary,
  Summary,
  CalendarEvent,
  Configuration,
  PaginatedResponse,
  SummaryType,
  ChatMessage,
  JiraSyncRequest,
  JiraSyncResponse,
} from "@/types"

const API_BASE_URL = "/api/v1"

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = (error.response?.data as { detail?: string })?.detail || error.message
        console.error("API Error:", message)
        return Promise.reject(new Error(message))
      }
    )
  }

  // ============================================
  // WORK ENTRIES
  // ============================================
  async getWorkEntries(params?: {
    date?: string
    start_date?: string
    end_date?: string
    sprint_id?: string
    status?: string
    category?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<WorkEntry>> {
    const { data } = await this.client.get("/work-entries", { params })
    return data
  }

  async getWorkEntry(id: string): Promise<WorkEntry> {
    const { data } = await this.client.get(`/work-entries/${id}`)
    return data
  }

  async createWorkEntry(entry: WorkEntryCreate): Promise<WorkEntry> {
    const { data } = await this.client.post("/work-entries", entry)
    return data
  }

  async updateWorkEntry(id: string, entry: WorkEntryUpdate): Promise<WorkEntry> {
    const { data } = await this.client.put(`/work-entries/${id}`, entry)
    return data
  }

  async deleteWorkEntry(id: string): Promise<void> {
    await this.client.delete(`/work-entries/${id}`)
  }

  // ============================================
  // PLANNED TASKS
  // ============================================
  async getPlannedTasks(params?: {
    sprint_id?: string
    week_number?: number
    year?: number
    status?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<PlannedTask>> {
    const { data } = await this.client.get("/planned-tasks", { params })
    return data
  }

  async getPlannedTask(id: string): Promise<PlannedTask> {
    const { data } = await this.client.get(`/planned-tasks/${id}`)
    return data
  }

  async createPlannedTask(task: PlannedTaskCreate): Promise<PlannedTask> {
    const { data } = await this.client.post("/planned-tasks", task)
    return data
  }

  async updatePlannedTask(id: string, task: PlannedTaskUpdate): Promise<PlannedTask> {
    const { data } = await this.client.put(`/planned-tasks/${id}`, task)
    return data
  }

  async deletePlannedTask(id: string): Promise<void> {
    await this.client.delete(`/planned-tasks/${id}`)
  }

  async completePlannedTask(id: string, workEntryData?: Partial<WorkEntryCreate>): Promise<WorkEntry> {
    const { data } = await this.client.post(`/planned-tasks/${id}/complete`, workEntryData || {})
    return data
  }

  async deferPlannedTask(id: string, deferTo: { sprint_id?: string; week_number?: number }): Promise<PlannedTask> {
    const { data } = await this.client.post(`/planned-tasks/${id}/defer`, deferTo)
    return data
  }

  async getPlannedTaskStats(): Promise<{
    total: number
    completed: number
    in_progress: number
    deferred: number
    cancelled: number
    completion_rate: number
  }> {
    const { data } = await this.client.get("/planned-tasks/stats")
    return data
  }

  // ============================================
  // SPRINTS
  // ============================================
  async getSprints(params?: { year?: number; status?: string }): Promise<Sprint[]> {
    const { data } = await this.client.get("/sprints", { params })
    return data
  }

  async getSprint(id: string): Promise<Sprint> {
    const { data } = await this.client.get(`/sprints/${id}`)
    return data
  }

  async createSprint(sprint: SprintCreate): Promise<Sprint> {
    const { data } = await this.client.post("/sprints", sprint)
    return data
  }

  async updateSprint(id: string, sprint: Partial<SprintCreate>): Promise<Sprint> {
    const { data } = await this.client.put(`/sprints/${id}`, sprint)
    return data
  }

  async deleteSprint(id: string): Promise<void> {
    await this.client.delete(`/sprints/${id}`)
  }

  async generateSprints(year: number, startDate?: string): Promise<Sprint[]> {
    const { data } = await this.client.post("/sprints/generate", { year, start_date: startDate })
    return data
  }

  async getCurrentSprint(): Promise<Sprint | null> {
    const { data } = await this.client.get("/sprints/current")
    return data
  }

  // ============================================
  // QUARTERS
  // ============================================
  async getQuarters(year?: number): Promise<Quarter[]> {
    const { data } = await this.client.get("/quarters", { params: { year } })
    return data
  }

  async getQuarter(id: string): Promise<Quarter> {
    const { data } = await this.client.get(`/quarters/${id}`)
    return data
  }

  async createQuarter(quarter: QuarterCreate): Promise<Quarter> {
    const { data } = await this.client.post("/quarters", quarter)
    return data
  }

  async updateQuarter(id: string, quarter: Partial<QuarterCreate>): Promise<Quarter> {
    const { data } = await this.client.put(`/quarters/${id}`, quarter)
    return data
  }

  async deleteQuarter(id: string): Promise<void> {
    await this.client.delete(`/quarters/${id}`)
  }

  async generateQuarters(year: number): Promise<Quarter[]> {
    const { data } = await this.client.post(`/quarters/generate/${year}`)
    return data
  }

  // ============================================
  // HOLIDAYS
  // ============================================
  async getHolidays(year?: number): Promise<Holiday[]> {
    const { data } = await this.client.get("/holidays", { params: { year } })
    return data
  }

  async getHoliday(id: string): Promise<Holiday> {
    const { data } = await this.client.get(`/holidays/${id}`)
    return data
  }

  async createHoliday(holiday: HolidayCreate): Promise<Holiday> {
    const { data } = await this.client.post("/holidays", holiday)
    return data
  }

  async updateHoliday(id: string, holiday: Partial<HolidayCreate>): Promise<Holiday> {
    const { data } = await this.client.put(`/holidays/${id}`, holiday)
    return data
  }

  async deleteHoliday(id: string): Promise<void> {
    await this.client.delete(`/holidays/${id}`)
  }

  // ============================================
  // CALENDAR
  // ============================================
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const { data } = await this.client.get("/calendar/events", {
      params: { start_date: startDate, end_date: endDate },
    })
    return data
  }

  // ============================================
  // DASHBOARD
  // ============================================
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await this.client.get("/dashboard/stats")
    return data
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const { data } = await this.client.get("/dashboard/summary")
    return data
  }

  async getSprintProgress(sprintId?: string): Promise<{
    planned: number
    completed: number
    in_progress: number
    deferred: number
    completion_rate: number
  }> {
    const { data } = await this.client.get("/dashboard/sprint-progress", {
      params: { sprint_id: sprintId },
    })
    return data
  }

  // ============================================
  // SUMMARY
  // ============================================
  async getSummary(type: SummaryType, params?: {
    date?: string
    sprint_id?: string
    quarter_id?: string
    year?: number
    week?: number
    month?: number
  }): Promise<Summary> {
    // Sprint summary requires sprint_id in URL path, not as query param
    if (type === "sprint" && params?.sprint_id) {
      const { sprint_id, ...queryParams } = params
      const { data } = await this.client.get(`/summary/sprint/${sprint_id}`, { params: queryParams })
      return data
    }
    
    // Quarterly summary requires quarter_id in URL path, not as query param
    if (type === "quarterly" && params?.quarter_id) {
      const { quarter_id, ...queryParams } = params
      const { data } = await this.client.get(`/summary/quarter/${quarter_id}`, { params: queryParams })
      return data
    }
    
    const { data } = await this.client.get(`/summary/${type}`, { params })
    return data
  }

  // ============================================
  // AI CHAT
  // ============================================
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const { data } = await this.client.post("/chat", request)
    return data
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const { data } = await this.client.get("/chat/history", { params: { session_id: sessionId } })
    return data
  }

  // ============================================
  // CONFIGURATION
  // ============================================
  async getConfigurations(): Promise<Configuration[]> {
    const { data } = await this.client.get("/config")
    return data
  }

  async getConfiguration(key: string): Promise<Configuration> {
    const { data } = await this.client.get(`/config/${key}`)
    return data
  }

  async updateConfiguration(key: string, value: Record<string, unknown>): Promise<Configuration> {
    const { data } = await this.client.put(`/config/${key}`, { value })
    return data
  }

  // ============================================
  // FILES
  // ============================================
  async uploadFile(workEntryId: string, file: File): Promise<{ id: string; url: string }> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("work_entry_id", workEntryId)

    const { data } = await this.client.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return data
  }

  async getFileUrl(id: string): Promise<string> {
    const { data } = await this.client.get(`/files/${id}`)
    return data.url
  }

  async deleteFile(id: string): Promise<void> {
    await this.client.delete(`/files/${id}`)
  }

  // ============================================
  // JIRA INTEGRATION
  // ============================================
  async syncJiraTasks(request: JiraSyncRequest): Promise<JiraSyncResponse> {
    const { data } = await this.client.post("/jira/sync", request)
    return data
  }

  async getJiraSyncHistory(limit: number = 10): Promise<PlannedTask[]> {
    const { data } = await this.client.get("/jira/sync-history", {
      params: { limit },
    })
    return data
  }

  async testJiraConnection(cookie: string, rapidViewId: number = 27928): Promise<{
    success: boolean
    message: string
    board_id: number
    total_issues: number
  }> {
    const { data } = await this.client.get("/jira/test-connection", {
      params: {
        cookie,
        rapid_view_id: rapidViewId,
      },
    })
    return data
  }

  // ============================================
  // HEALTH CHECK
  // ============================================
  async healthCheck(): Promise<{ status: string }> {
    const { data} = await this.client.get("/health")
    return data
  }
}

export const api = new ApiClient()
export default api
