import { useState, useEffect } from "react"
import {
  BarChart3,
  Calendar,
  FileText,
  Sparkles,
  TrendingUp,
  Loader2,
  Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Markdown } from "@/components/ui/markdown"
import { formatDate, formatTime } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { Summary, SummaryType, Sprint, Quarter } from "@/types"

const SUMMARY_TYPES: { value: SummaryType; label: string; icon: typeof BarChart3 }[] = [
  { value: "daily", label: "Daily", icon: Calendar },
  { value: "weekly", label: "Weekly", icon: BarChart3 },
  { value: "monthly", label: "Monthly", icon: TrendingUp },
  { value: "quarterly", label: "Quarterly", icon: Target },
  { value: "sprint", label: "Sprint", icon: Target },
  { value: "yearly", label: "Yearly", icon: BarChart3 },
]

export function SummaryPage() {
  const { currentYear, addNotification } = useAppStore()
  const [summaryType, setSummaryType] = useState<SummaryType>("weekly")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [selectedSprint, setSelectedSprint] = useState<string>("")
  const [selectedQuarter, setSelectedQuarter] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadSummary()
  }, [summaryType, selectedSprint, selectedQuarter, selectedDate])

  const loadInitialData = async () => {
    try {
      const [sprintList, quarterList] = await Promise.all([
        api.getSprints(),
        api.getQuarters(currentYear),
      ])
      setSprints(sprintList)
      setQuarters(quarterList)

      // Set defaults
      const currentSprint = sprintList.find((s) => s.status === "active")
      if (currentSprint) setSelectedSprint(currentSprint.id)

      const currentQuarter = quarterList.find((q) => {
        const now = new Date()
        return new Date(q.start_date) <= now && new Date(q.end_date) >= now
      })
      if (currentQuarter) setSelectedQuarter(currentQuarter.id)
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  const loadSummary = async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = {}

      switch (summaryType) {
        case "daily":
        case "weekly":
        case "monthly":
          params.date = selectedDate
          break
        case "sprint":
          if (!selectedSprint) {
            setSummary(null)
            setIsLoading(false)
            return
          }
          params.sprint_id = selectedSprint
          break
        case "quarterly":
          if (!selectedQuarter) {
            setSummary(null)
            setIsLoading(false)
            return
          }
          params.quarter_id = selectedQuarter
          break
        case "yearly":
          params.year = currentYear
          break
      }

      const data = await api.getSummary(summaryType, params)
      setSummary(data)
    } catch (error) {
      console.error("Failed to load summary:", error)
      addNotification("error", "Failed to load summary")
    } finally {
      setIsLoading(false)
    }
  }

  const regenerateSummary = async () => {
    setIsGenerating(true)
    try {
      await loadSummary()
      addNotification("success", "Summary regenerated with AI insights")
    } finally {
      setIsGenerating(false)
    }
  }

  const renderCategoriesChart = () => {
    if (!summary?.categories_breakdown) return null
    const total = Object.values(summary.categories_breakdown).reduce((a, b) => a + b, 0)
    if (total === 0) return null

    const entries = Object.entries(summary.categories_breakdown).sort((a, b) => b[1] - a[1])

    return (
      <div className="space-y-3">
        {entries.map(([category, count]) => {
          const percentage = (count / total) * 100
          return (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{category}</span>
                <span className="text-muted-foreground">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Summary & Analytics
          </h2>
          <p className="text-muted-foreground">View your work summaries with AI insights</p>
        </div>
        <Button onClick={regenerateSummary} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate AI Summary
            </>
          )}
        </Button>
      </div>

      {/* Summary type tabs */}
      <Tabs value={summaryType} onValueChange={(v) => setSummaryType(v as SummaryType)}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {SUMMARY_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              <type.icon className="mr-2 h-4 w-4" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Filters based on summary type */}
        <div className="mt-4">
          {(summaryType === "daily" || summaryType === "weekly" || summaryType === "monthly") && (
            <div className="flex gap-4">
              <div className="w-48">
                <label className="text-sm font-medium mb-1 block">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {summaryType === "sprint" && (
            <div className="w-64">
              <label className="text-sm font-medium mb-1 block">Sprint</label>
              <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {summaryType === "quarterly" && (
            <div className="w-64">
              <label className="text-sm font-medium mb-1 block">Quarter</label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((quarter) => (
                    <SelectItem key={quarter.id} value={quarter.id}>
                      {quarter.name} {quarter.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Summary content */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !summary ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No data available</h3>
                <p className="text-muted-foreground">
                  No work entries found for this period.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Stats cards */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{summary.period}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(summary.start_date)} - {formatDate(summary.end_date)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Entries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{summary.total_entries}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Time Logged
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{formatTime(summary.total_time_spent)}</p>
                  </CardContent>
                </Card>

                {summary.planned_vs_actual && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Planned vs Actual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Planned</span>
                          <Badge variant="secondary">{summary.planned_vs_actual.planned}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Completed</span>
                          <Badge variant="success">{summary.planned_vs_actual.completed}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Deferred</span>
                          <Badge variant="warning">{summary.planned_vs_actual.deferred}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Categories breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderCategoriesChart() || (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No category data
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* AI Summary */}
              <Card className="lg:row-span-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/20">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    AI Summary
                  </CardTitle>
                  <CardDescription>Generated insights from your work</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                  {summary.ai_summary ? (
                    <div className="rounded-lg bg-gradient-to-br from-muted/50 to-transparent p-4 border border-border/50">
                      <Markdown content={summary.ai_summary} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-3 rounded-full bg-muted/50 mb-4">
                        <Sparkles className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-[200px]">
                        AI summary not available. Click "Regenerate AI Summary" to generate insights.
                      </p>
                    </div>
                  )}

                  {summary.highlights && summary.highlights.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        Highlights
                      </h4>
                      <div className="space-y-2">
                        {summary.highlights.map((highlight, i) => (
                          <div 
                            key={i} 
                            className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20 text-sm"
                          >
                            <span className="mt-0.5 w-5 h-5 rounded-full bg-success/20 flex items-center justify-center text-success text-xs font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-muted-foreground">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.patterns && summary.patterns.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-info" />
                        Patterns Detected
                      </h4>
                      <div className="space-y-2">
                        {summary.patterns.map((pattern, i) => (
                          <div 
                            key={i} 
                            className="flex items-start gap-3 p-3 rounded-lg bg-info/5 border border-info/20 text-sm"
                          >
                            <TrendingUp className="h-4 w-4 mt-0.5 text-info shrink-0" />
                            <span className="text-muted-foreground">{pattern}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}
