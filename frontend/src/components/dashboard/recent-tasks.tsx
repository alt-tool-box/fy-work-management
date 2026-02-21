import { FileText, Clock, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChatMarkdown } from "@/components/ui/markdown"
import { formatDate, formatTime } from "@/lib/utils"
import type { WorkEntry, PlannedTask } from "@/types"

interface RecentTasksProps {
  workEntries: WorkEntry[]
  plannedTasks: PlannedTask[]
  isLoading?: boolean
}

const statusColors = {
  completed: "success",
  in_progress: "info",
  on_hold: "warning",
  planned: "secondary",
  deferred: "warning",
  cancelled: "destructive",
} as const

export function RecentTasks({ workEntries = [], plannedTasks = [], isLoading }: RecentTasksProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Recent Work Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Recent Work
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/work">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {workEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No work entries yet. Start logging your work!
            </p>
          ) : (
            <div className="space-y-4">
              {workEntries.slice(0, 5).map((entry) => (
                <Link
                  key={entry.id}
                  to={`/work/${entry.id}`}
                  className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{entry.title}</h4>
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-0.5 prose prose-sm max-w-none [&>*]:my-0 [&>*]:leading-tight">
                        <ChatMarkdown content={entry.description} />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.date)}
                        </span>
                        {entry.time_spent && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(entry.time_spent)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusColors[entry.status || "completed"]} className="shrink-0">
                      {entry.status || "completed"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Planned Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            Upcoming Tasks
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/planned">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {plannedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No planned tasks. Create your sprint plan!
            </p>
          ) : (
            <div className="space-y-4">
              {plannedTasks
                .filter((t) => t.status === "planned" || t.status === "in_progress")
                .slice(0, 5)
                .map((task) => (
                  <Link
                    key={task.id}
                    to={`/planned/${task.id}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{task.title}</h4>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-0.5 prose prose-sm max-w-none [&>*]:my-0 [&>*]:leading-tight">
                            <ChatMarkdown content={task.description} />
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {task.target_date && (
                            <span className="text-xs text-muted-foreground">
                              Due: {formatDate(task.target_date)}
                            </span>
                          )}
                          {task.estimated_hours && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {task.estimated_hours}h est.
                            </span>
                          )}
                          {task.story_points && (
                            <span className="text-xs text-muted-foreground">
                              {task.story_points} pts
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={statusColors[task.status]} className="shrink-0">
                        {task.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
