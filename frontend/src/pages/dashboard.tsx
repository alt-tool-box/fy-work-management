import { useEffect, useState } from "react"
import { 
  FileText, 
  ListTodo, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SprintProgress } from "@/components/dashboard/sprint-progress"
import { RecentTasks } from "@/components/dashboard/recent-tasks"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { DashboardStats, Sprint, SprintProgress as SprintProgressType, WorkEntry, PlannedTask } from "@/types"
import { formatTime } from "@/lib/utils"

export function DashboardPage() {
  const { setDashboardStats, setCurrentSprint, addNotification } = useAppStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [sprintProgress, setSprintProgress] = useState<SprintProgressType | null>(null)
  const [recentWork, setRecentWork] = useState<WorkEntry[]>([])
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const [statsResult, sprintResult, workResult, tasksResult] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getCurrentSprint(),
        api.getWorkEntries({ page_size: 5 }),
        api.getPlannedTasks({ page_size: 10 }),
      ])

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
        setDashboardStats(statsResult.value)
      }

      if (sprintResult.status === "fulfilled" && sprintResult.value) {
        setSprint(sprintResult.value)
        setCurrentSprint(sprintResult.value)
        
        // Load sprint progress
        try {
          const progress = await api.getSprintProgress(sprintResult.value.id)
          setSprintProgress({
            planned_count: progress.planned,
            completed_count: progress.completed,
            in_progress_count: progress.in_progress,
            deferred_count: progress.deferred,
            completion_rate: progress.completion_rate,
          })
        } catch {
          // Ignore sprint progress errors
        }
      }

      if (workResult.status === "fulfilled") {
        setRecentWork(workResult.value?.items || [])
      }

      if (tasksResult.status === "fulfilled") {
        // Backend returns array directly, not paginated response
        const tasks = tasksResult.value
        setPlannedTasks(Array.isArray(tasks) ? tasks : tasks?.items || [])
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error)
      addNotification("error", "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/work/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Work Entry
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/planned/new">
            <ListTodo className="mr-2 h-4 w-4" />
            Plan Task
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/calendar">
            <CalendarIcon className="mr-2 h-4 w-4" />
            View Calendar
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Work Entries"
          value={stats?.total_work_entries || 0}
          description="All time work logs"
          icon={FileText}
          variant="primary"
        />
        <StatsCard
          title="Planned Tasks"
          value={stats?.total_planned_tasks || 0}
          description={`${stats?.completed_tasks || 0} completed`}
          icon={ListTodo}
          variant="info"
        />
        <StatsCard
          title="Time Logged"
          value={formatTime(stats?.total_time_spent || 0)}
          description="This month"
          icon={Clock}
          variant="success"
        />
        <StatsCard
          title="Completion Rate"
          value={`${(stats?.completion_rate || 0).toFixed(0)}%`}
          description="Sprint tasks"
          icon={stats?.completion_rate && stats.completion_rate >= 80 ? CheckCircle : TrendingUp}
          variant={stats?.completion_rate && stats.completion_rate >= 80 ? "success" : "warning"}
        />
      </div>

      {/* Sprint progress */}
      <SprintProgress
        sprint={sprint}
        progress={sprintProgress}
        isLoading={isLoading}
      />

      {/* Recent tasks */}
      <RecentTasks
        workEntries={recentWork}
        plannedTasks={plannedTasks}
        isLoading={isLoading}
      />
    </div>
  )
}
