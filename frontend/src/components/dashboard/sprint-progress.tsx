import { Target, Clock, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Sprint, SprintProgress as SprintProgressType } from "@/types"

interface SprintProgressProps {
  sprint: Sprint | null
  progress: SprintProgressType | null
  isLoading?: boolean
}

export function SprintProgress({ sprint, progress, isLoading }: SprintProgressProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-20 w-full bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sprint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Sprint Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active sprint</p>
        </CardContent>
      </Card>
    )
  }

  const completionRate = progress?.completion_rate || 0
  const total = progress?.planned_count || 0
  const completed = progress?.completed_count || 0
  const inProgress = progress?.in_progress_count || 0
  const deferred = progress?.deferred_count || 0

  // Calculate days remaining
  const endDate = new Date(sprint.end_date)
  const today = new Date()
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <Card variant="gradient">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {sprint.name}
          </CardTitle>
          <Badge variant={sprint.status === "active" ? "success" : "secondary"}>
            {sprint.status}
          </Badge>
        </div>
        {sprint.goal && (
          <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p>
        )}
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-semibold">{completionRate.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completionRate >= 80 ? "bg-success" : completionRate >= 50 ? "bg-primary" : "bg-warning"
              )}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Planned</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/10">
            <p className="text-2xl font-bold text-success">{completed}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-info/10">
            <p className="text-2xl font-bold text-info">{inProgress}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <p className="text-2xl font-bold text-warning">{deferred}</p>
            <p className="text-xs text-muted-foreground">Deferred</p>
          </div>
        </div>

        {/* Sprint timeline */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {daysRemaining} days remaining
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>{new Date(sprint.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <ArrowRight className="h-3 w-3" />
            <span>{new Date(sprint.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
