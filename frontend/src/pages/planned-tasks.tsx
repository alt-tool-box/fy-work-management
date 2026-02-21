import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  ListTodo,
  Clock,
  CheckCircle,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Loader2,
  Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChatMarkdown } from "@/components/ui/markdown"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { PlannedTask, Sprint } from "@/types"

const statusColors = {
  planned: "secondary",
  in_progress: "info",
  completed: "success",
  deferred: "warning",
  cancelled: "destructive",
} as const

const priorityColors = {
  low: "secondary",
  medium: "default",
  high: "warning",
  critical: "destructive",
} as const

export function PlannedTasksPage() {
  const { addNotification, currentYear } = useAppStore()
  const [tasks, setTasks] = useState<PlannedTask[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sprintFilter, setSprintFilter] = useState<string>("all")
  const [deleteTask, setDeleteTask] = useState<PlannedTask | null>(null)
  const [completeTask, setCompleteTask] = useState<PlannedTask | null>(null)
  const [page] = useState(1)
  
  // Jira sync states
  const [showJiraSyncDialog, setShowJiraSyncDialog] = useState(false)
  const [jiraCookie, setJiraCookie] = useState("")
  const [jiraRapidViewId, setJiraRapidViewId] = useState(27928)
  const [jiraQuickFilterId, setJiraQuickFilterId] = useState(399097)
  const [jiraProjectKey, setJiraProjectKey] = useState("SECENGDEV")
  const [jiraSyncQuarter, setJiraSyncQuarter] = useState<string>("")
  const [jiraSyncSprint, setJiraSyncSprint] = useState<string>("")
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Get quarters for Jira sync
  const [quarters, setQuarters] = useState<import("@/types").Quarter[]>([])

  useEffect(() => {
    const loadQuarters = async () => {
      try {
        const quarterList = await api.getQuarters(currentYear)
        setQuarters(quarterList)
      } catch (error) {
        console.error("Failed to load quarters:", error)
      }
    }
    loadQuarters()
  }, [currentYear])

  useEffect(() => {
    loadData()
  }, [statusFilter, sprintFilter, page])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [sprintList] = await Promise.all([api.getSprints()])
      setSprints(sprintList)

      const params: Record<string, unknown> = {
        page,
        page_size: 100, // Increased from 10 to show more tasks
      }
      if (statusFilter !== "all") params.status = statusFilter
      if (sprintFilter !== "all") params.sprint_id = sprintFilter

      const response = await api.getPlannedTasks(params)
      // Backend returns array directly, not paginated response
      setTasks(Array.isArray(response) ? response : response?.items || [])
    } catch (error) {
      console.error("Failed to load tasks:", error)
      addNotification("error", "Failed to load planned tasks")
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTask) return

    try {
      await api.deletePlannedTask(deleteTask.id)
      addNotification("success", "Task deleted")
      setDeleteTask(null)
      loadData()
    } catch {
      addNotification("error", "Failed to delete task")
    }
  }

  const handleComplete = async () => {
    if (!completeTask) return

    try {
      await api.completePlannedTask(completeTask.id)
      addNotification("success", "Task completed and work entry created")
      setCompleteTask(null)
      loadData()
    } catch {
      addNotification("error", "Failed to complete task")
    }
  }

  const handleJiraSync = async () => {
    if (!jiraCookie.trim()) {
      addNotification("error", "Please provide a Jira cookie")
      return
    }
    
    if (!jiraSyncQuarter || !jiraSyncSprint) {
      addNotification("error", "Please select both Quarter and Sprint")
      return
    }
    
    setIsSyncing(true)
    
    try {
      const result = await api.syncJiraTasks({
        cookie: jiraCookie,
        rapid_view_id: jiraRapidViewId,
        quick_filter_id: jiraQuickFilterId,
        selected_project_key: jiraProjectKey,
        year: currentYear,
        quarter_id: jiraSyncQuarter,
        sprint_id: jiraSyncSprint,
      })
      
      addNotification("success", result.message)
      setJiraCookie("") // Clear for security
      setShowJiraSyncDialog(false)
      
      // Reset filters and show the sprint where tasks were synced
      setStatusFilter("all")
      setSprintFilter(jiraSyncSprint) // Show the sprint we just synced to
      
      loadData() // Reload tasks
    } catch (error: any) {
      addNotification("error", `Sync failed: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredTasks = (tasks || []).filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Group tasks by status for board view
  const tasksByStatus = {
    planned: filteredTasks.filter((t) => t.status === "planned"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
    deferred: filteredTasks.filter((t) => t.status === "deferred"),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-info" />
            Planned Tasks
          </h2>
          <p className="text-muted-foreground">Manage your sprint and weekly tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowJiraSyncDialog(true)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Sync from Jira
          </Button>
          <Button asChild>
            <Link to="/planned/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="deferred">Deferred</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sprintFilter} onValueChange={setSprintFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sprints</SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks board view */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-24 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {(["planned", "in_progress", "completed", "deferred"] as const).map((status) => (
            <Card key={status} className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span className="capitalize">{status.replace("_", " ")}</span>
                  <Badge variant={statusColors[status]}>{tasksByStatus[status].length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasksByStatus[status].length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <Card
                      key={task.id}
                      className="hover:shadow-lg transition-all cursor-pointer"
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/planned/${task.id}`}
                              className="font-medium text-sm hover:text-primary line-clamp-2"
                            >
                              {task.title}
                            </Link>
                            {task.priority && (
                              <Badge
                                variant={priorityColors[task.priority]}
                                className="shrink-0 text-[10px]"
                              >
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <div className="text-xs text-muted-foreground line-clamp-3 prose prose-sm max-w-none [&>*]:my-0 [&>*]:leading-tight">
                              <ChatMarkdown content={task.description} />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              {task.estimated_hours && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {task.estimated_hours}h
                                </span>
                              )}
                              {task.story_points && (
                                <span>{task.story_points} pts</span>
                              )}
                            </div>
                            {task.target_date && (
                              <span>{formatDate(task.target_date)}</span>
                            )}
                          </div>
                          {/* Quick actions */}
                          {status !== "completed" && status !== "deferred" && (
                            <div className="flex gap-1 pt-2 border-t border-border">
                              {status === "planned" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 text-xs h-7"
                                  onClick={() => setCompleteTask(task)}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Complete
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <Link to={`/planned/${task.id}/edit`}>
                                  <Pencil className="h-3 w-3" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => setDeleteTask(task)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTask} onOpenChange={() => setDeleteTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTask?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTask(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete confirmation */}
      <Dialog open={!!completeTask} onOpenChange={() => setCompleteTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Mark "{completeTask?.title}" as completed? This will create a work entry for this task.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleComplete}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Jira sync dialog */}
      <Dialog open={showJiraSyncDialog} onOpenChange={setShowJiraSyncDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Sync Tasks from Jira
            </DialogTitle>
            <DialogDescription>
              Import your assigned Jira tasks to avoid manual entry. Your cookie is never stored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jira Cookie (Required)</label>
              <Input
                type="password"
                placeholder="Paste your Jira authentication cookie"
                value={jiraCookie}
                onChange={(e) => setJiraCookie(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                From browser DevTools → Network → Jira request → Copy 'Cookie' header
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">RapidView ID</label>
                <Input
                  type="number"
                  value={jiraRapidViewId}
                  onChange={(e) => setJiraRapidViewId(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter ID</label>
                <Input
                  type="number"
                  value={jiraQuickFilterId}
                  onChange={(e) => setJiraQuickFilterId(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Key</label>
                <Input
                  type="text"
                  value={jiraProjectKey}
                  onChange={(e) => setJiraProjectKey(e.target.value)}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Assign Tasks To (Required)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quarter *</label>
                  <Select
                    value={jiraSyncQuarter}
                    onValueChange={(v) => {
                      setJiraSyncQuarter(v)
                      setJiraSyncSprint("") // Reset sprint when quarter changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarters.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sprint *</label>
                  <Select
                    value={jiraSyncSprint}
                    onValueChange={setJiraSyncSprint}
                    disabled={!jiraSyncQuarter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      {sprints
                        .filter((s) => s.quarter_id === jiraSyncQuarter)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>ℹ️ What happens:</strong></p>
              <ul className="ml-4 mt-1 space-y-0.5 list-disc">
                <li>Fetches tasks from Jira using your filters</li>
                <li>Assigns all tasks to the selected Quarter → Sprint</li>
                <li>Creates new tasks or updates existing ones</li>
                <li>Prevents duplicates using Jira issue keys</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowJiraSyncDialog(false)
                setJiraCookie("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleJiraSync} disabled={!jiraCookie.trim() || isSyncing}>
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
