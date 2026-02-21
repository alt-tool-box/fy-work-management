import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Save, Loader2, Plus, X, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import { cn, formatDate } from "@/lib/utils"
import type { PlannedTaskCreate, PlannedTaskUpdate, Sprint, Quarter } from "@/types"

const CATEGORIES = [
  "Development",
  "Meeting",
  "Documentation",
  "Planning",
  "Review",
  "Bug Fix",
  "Research",
  "Other",
]

const PRIORITIES = ["low", "medium", "high", "critical"] as const
const STATUSES = ["planned", "in_progress", "completed", "deferred", "cancelled"] as const

interface FormErrors {
  title?: string
  description?: string
  quarter?: string
  sprint?: string
  week_number?: string
  target_date?: string
  estimated_hours?: string
  story_points?: string
}

export function PlannedTaskFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification, currentYear } = useAppStore()
  const isEdit = !!id

  // Form state
  const [formData, setFormData] = useState<PlannedTaskCreate>({
    title: "",
    description: "",
    year: currentYear,
    sprint_id: undefined,
    week_number: undefined,
    target_date: undefined,
    estimated_hours: undefined,
    story_points: undefined,
    priority: "medium",
    status: "planned",
    category: "",
    tags: [],
  })
  
  // Hierarchy state
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>("")
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  
  // UI state
  const [tagInput, setTagInput] = useState("")
  const [planningMode, setPlanningMode] = useState<"sprint" | "week">("sprint")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Filter sprints by selected quarter
  const filteredSprints = useMemo(() => {
    if (!selectedQuarterId) return []
    return sprints.filter(s => s.quarter_id === selectedQuarterId)
  }, [sprints, selectedQuarterId])

  // Get selected sprint details
  const selectedSprint = useMemo(() => {
    if (!formData.sprint_id) return null
    return sprints.find(s => s.id === formData.sprint_id)
  }, [sprints, formData.sprint_id])

  // Get selected quarter details
  const selectedQuarter = useMemo(() => {
    if (!selectedQuarterId) return null
    return quarters.find(q => q.id === selectedQuarterId)
  }, [quarters, selectedQuarterId])

  // Calculate valid date range based on sprint
  const dateConstraints = useMemo(() => {
    if (selectedSprint) {
      return {
        min: selectedSprint.start_date,
        max: selectedSprint.end_date,
        label: `${formatDate(selectedSprint.start_date)} - ${formatDate(selectedSprint.end_date)}`,
      }
    }
    if (selectedQuarter) {
      return {
        min: selectedQuarter.start_date,
        max: selectedQuarter.end_date,
        label: `${formatDate(selectedQuarter.start_date)} - ${formatDate(selectedQuarter.end_date)}`,
      }
    }
    return null
  }, [selectedSprint, selectedQuarter])

  useEffect(() => {
    loadData()
  }, [id, currentYear])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [quarterList, sprintList] = await Promise.all([
        api.getQuarters(currentYear),
        api.getSprints({ year: currentYear }),
      ])
      setQuarters(quarterList || [])
      setSprints(sprintList || [])

      if (isEdit) {
        const task = await api.getPlannedTask(id)
        setFormData({
          title: task.title,
          description: task.description || "",
          year: task.year,
          sprint_id: task.sprint_id,
          week_number: task.week_number,
          target_date: task.target_date,
          estimated_hours: task.estimated_hours,
          story_points: task.story_points,
          priority: task.priority || "medium",
          status: task.status,
          category: task.category || "",
          tags: task.tags || [],
        })
        setPlanningMode(task.sprint_id ? "sprint" : "week")
        
        // Set quarter based on sprint
        if (task.sprint_id) {
          const sprint = sprintList?.find((s: Sprint) => s.id === task.sprint_id)
          if (sprint?.quarter_id) {
            setSelectedQuarterId(sprint.quarter_id)
          }
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      addNotification("error", "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  // Validation functions
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case "title":
        if (!value || !value.trim()) return "Title is required"
        if (value.trim().length < 3) return "Title must be at least 3 characters"
        if (value.trim().length > 255) return "Title must be less than 255 characters"
        return undefined
        
      case "quarter":
        if (planningMode === "sprint" && !selectedQuarterId) {
          return "Please select a quarter first"
        }
        return undefined
        
      case "sprint":
        if (planningMode === "sprint" && !formData.sprint_id) {
          return "Sprint is required when planning by sprint"
        }
        return undefined
        
      case "week_number":
        if (planningMode === "week") {
          if (!value) return "Week number is required when planning by week"
          const num = parseInt(value)
          if (isNaN(num) || num < 1 || num > 53) return "Week number must be between 1 and 53"
        }
        return undefined
        
      case "target_date":
        if (value && dateConstraints) {
          const date = new Date(value)
          const minDate = new Date(dateConstraints.min)
          const maxDate = new Date(dateConstraints.max)
          if (date < minDate || date > maxDate) {
            return `Date must be within ${dateConstraints.label}`
          }
        }
        return undefined
        
      case "estimated_hours":
        if (value !== undefined && value !== null && value !== "") {
          const num = parseFloat(value)
          if (isNaN(num) || num < 0) return "Estimated hours must be a positive number"
          if (num > 200) return "Estimated hours cannot exceed 200"
        }
        return undefined
        
      case "story_points":
        if (value !== undefined && value !== null && value !== "") {
          const num = parseInt(value)
          if (isNaN(num) || num < 0) return "Story points must be a positive number"
          if (num > 100) return "Story points cannot exceed 100"
        }
        return undefined
        
      default:
        return undefined
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      title: validateField("title", formData.title),
      quarter: validateField("quarter", selectedQuarterId),
      sprint: validateField("sprint", formData.sprint_id),
      week_number: validateField("week_number", formData.week_number),
      target_date: validateField("target_date", formData.target_date),
      estimated_hours: validateField("estimated_hours", formData.estimated_hours),
      story_points: validateField("story_points", formData.story_points),
    }
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, (formData as any)[field])
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleQuarterChange = (quarterId: string) => {
    setSelectedQuarterId(quarterId === "_none" ? "" : quarterId)
    // Reset sprint when quarter changes
    setFormData(prev => ({ ...prev, sprint_id: undefined }))
    setErrors(prev => ({ ...prev, quarter: undefined, sprint: undefined }))
  }

  const handleSprintChange = (sprintId: string) => {
    const newSprintId = sprintId === "_none" ? undefined : sprintId
    setFormData(prev => ({ ...prev, sprint_id: newSprintId }))
    
    // Clear sprint error
    setErrors(prev => ({ ...prev, sprint: undefined }))
    
    // If target date is set, validate it against new sprint
    if (formData.target_date && newSprintId) {
      const sprint = sprints.find(s => s.id === newSprintId)
      if (sprint) {
        const date = new Date(formData.target_date)
        const startDate = new Date(sprint.start_date)
        const endDate = new Date(sprint.end_date)
        if (date < startDate || date > endDate) {
          setFormData(prev => ({ ...prev, target_date: sprint.start_date }))
        }
      }
    }
  }

  const handlePlanningModeChange = (mode: "sprint" | "week") => {
    setPlanningMode(mode)
    // Clear the other mode's value
    if (mode === "sprint") {
      setFormData(prev => ({ ...prev, week_number: undefined }))
    } else {
      setFormData(prev => ({ ...prev, sprint_id: undefined }))
      setSelectedQuarterId("")
    }
    // Clear related errors
    setErrors(prev => ({ ...prev, sprint: undefined, week_number: undefined, quarter: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setTouched({
      title: true,
      quarter: true,
      sprint: true,
      week_number: true,
      target_date: true,
      estimated_hours: true,
      story_points: true,
    })

    if (!validateForm()) {
      addNotification("error", "Please fix the validation errors")
      return
    }

    const dataToSubmit = {
      ...formData,
      sprint_id: planningMode === "sprint" ? formData.sprint_id : undefined,
      week_number: planningMode === "week" ? formData.week_number : undefined,
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await api.updatePlannedTask(id, dataToSubmit as PlannedTaskUpdate)
        addNotification("success", "Task updated successfully")
      } else {
        await api.createPlannedTask(dataToSubmit)
        addNotification("success", "Task created successfully")
      }
      navigate("/planned")
    } catch (error: any) {
      const message = error.response?.data?.detail || `Failed to ${isEdit ? "update" : "create"} task`
      addNotification("error", message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags?.includes(tag)) {
      if (tag.length > 30) {
        addNotification("error", "Tag must be less than 30 characters")
        return
      }
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {isEdit ? "Edit Planned Task" : "New Planned Task"}
          </h2>
          <p className="text-muted-foreground">
            {isEdit ? "Update your planned task" : "Plan work for a sprint or week - Select Quarter → Sprint → Target Date"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Step 1: Task Details */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
              Task Details
            </CardTitle>
            <CardDescription>
              Describe what needs to be done
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                onBlur={() => handleFieldBlur("title")}
                placeholder="What needs to be done? (e.g., Implement user dashboard)"
                className={cn(errors.title && touched.title && "border-destructive")}
              />
              {errors.title && touched.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Add details about this task... (acceptance criteria, technical notes, etc.)"
                className="min-h-[100px]"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={formData.category || "_none"}
                onValueChange={(v) => handleFieldChange("category", v === "_none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    <span className="text-muted-foreground">No category</span>
                  </SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Planning Context */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
              Planning Context
            </CardTitle>
            <CardDescription>
              When should this task be completed?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Planning mode toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan for</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={planningMode === "sprint" ? "default" : "outline"}
                  onClick={() => handlePlanningModeChange("sprint")}
                  className="flex-1"
                >
                  Sprint (Recommended)
                </Button>
                <Button
                  type="button"
                  variant={planningMode === "week" ? "default" : "outline"}
                  onClick={() => handlePlanningModeChange("week")}
                  className="flex-1"
                >
                  Week Number
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {planningMode === "sprint" 
                  ? "Plan tasks within specific sprints for better tracking" 
                  : "Use week numbers for flexible planning"}
              </p>
            </div>

            {planningMode === "sprint" ? (
              <>
                {/* Quarter Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Quarter <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedQuarterId || "_none"}
                    onValueChange={handleQuarterChange}
                  >
                    <SelectTrigger className={cn(
                      errors.quarter && touched.quarter && "border-destructive",
                      selectedQuarterId && "border-primary/50"
                    )}>
                      <SelectValue placeholder="Select quarter first" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">
                        <span className="text-muted-foreground">Select quarter</span>
                      </SelectItem>
                      {quarters.map((quarter) => (
                        <SelectItem key={quarter.id} value={quarter.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{quarter.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatDate(quarter.start_date)} - {formatDate(quarter.end_date)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.quarter && touched.quarter && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.quarter}
                    </p>
                  )}
                  {selectedQuarter && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {selectedQuarter.name} ({selectedQuarter.year})
                    </p>
                  )}
                </div>

                {/* Sprint Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Sprint <span className="text-destructive">*</span>
                    {!selectedQuarterId && (
                      <span className="text-xs text-warning ml-2">(Select quarter first)</span>
                    )}
                  </label>
                  <Select
                    value={formData.sprint_id || "_none"}
                    onValueChange={handleSprintChange}
                    disabled={!selectedQuarterId}
                  >
                    <SelectTrigger className={cn(
                      !selectedQuarterId && "opacity-50",
                      errors.sprint && touched.sprint && "border-destructive",
                      formData.sprint_id && "border-primary/50"
                    )}>
                      <SelectValue placeholder={selectedQuarterId ? "Select sprint" : "Select quarter first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">
                        <span className="text-muted-foreground">Select sprint</span>
                      </SelectItem>
                      {filteredSprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sprint.name}</span>
                            <Badge variant={sprint.status === "active" ? "success" : "outline"} className="text-xs">
                              {sprint.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({formatDate(sprint.start_date)} - {formatDate(sprint.end_date)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {filteredSprints.length === 0 && selectedQuarterId && (
                        <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                          No sprints in this quarter
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.sprint && touched.sprint && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.sprint}
                    </p>
                  )}
                  {selectedSprint && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {selectedSprint.name}: {formatDate(selectedSprint.start_date)} - {formatDate(selectedSprint.end_date)}
                      {selectedSprint.goal && (
                        <span className="ml-2 italic">Goal: {selectedSprint.goal}</span>
                      )}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Week Number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="53"
                    value={formData.week_number || ""}
                    onChange={(e) => handleFieldChange("week_number", e.target.value ? parseInt(e.target.value) : undefined)}
                    onBlur={() => handleFieldBlur("week_number")}
                    placeholder="1-53"
                    className={cn(errors.week_number && touched.week_number && "border-destructive")}
                  />
                  {errors.week_number && touched.week_number && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.week_number}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Input
                    type="number"
                    min="2020"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => handleFieldChange("year", parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Target date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date (optional)</label>
              <Input
                type="date"
                value={formData.target_date || ""}
                onChange={(e) => handleFieldChange("target_date", e.target.value || undefined)}
                onBlur={() => handleFieldBlur("target_date")}
                min={dateConstraints?.min}
                max={dateConstraints?.max}
                className={cn(errors.target_date && touched.target_date && "border-destructive")}
              />
              {errors.target_date && touched.target_date ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.target_date}
                </p>
              ) : dateConstraints ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Valid range: {dateConstraints.label}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Estimation & Priority */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
              Estimation & Priority
            </CardTitle>
            <CardDescription>
              Estimate effort and set priority
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estimation */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Hours</label>
                <Input
                  type="number"
                  min="0"
                  max="200"
                  step="0.5"
                  value={formData.estimated_hours || ""}
                  onChange={(e) => handleFieldChange("estimated_hours", e.target.value ? parseFloat(e.target.value) : undefined)}
                  onBlur={() => handleFieldBlur("estimated_hours")}
                  placeholder="e.g., 4"
                  className={cn(errors.estimated_hours && touched.estimated_hours && "border-destructive")}
                />
                {errors.estimated_hours && touched.estimated_hours && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.estimated_hours}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Story Points</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.story_points || ""}
                  onChange={(e) => handleFieldChange("story_points", e.target.value ? parseInt(e.target.value) : undefined)}
                  onBlur={() => handleFieldBlur("story_points")}
                  placeholder="e.g., 3, 5, 8, 13"
                  className={cn(errors.story_points && touched.story_points && "border-destructive")}
                />
                {errors.story_points && touched.story_points && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.story_points}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Common values: 1, 2, 3, 5, 8, 13 (Fibonacci)
                </p>
              </div>
            </div>

            {/* Priority & Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => handleFieldChange("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            p === "critical" && "bg-destructive",
                            p === "high" && "bg-warning",
                            p === "medium" && "bg-primary",
                            p === "low" && "bg-muted-foreground"
                          )} />
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isEdit && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => handleFieldChange("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "h-2 w-2 rounded-full",
                              s === "completed" && "bg-success",
                              s === "in_progress" && "bg-warning",
                              s === "planned" && "bg-primary",
                              s === "deferred" && "bg-muted-foreground",
                              s === "cancelled" && "bg-destructive"
                            )} />
                            {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Add a tag (press Enter)..."
                  maxLength={30}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Validation Summary */}
        {Object.values(errors).some(e => e) && Object.values(touched).some(t => t) && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Please fix the following errors:</p>
                  <ul className="mt-1 text-sm text-destructive list-disc list-inside">
                    {Object.entries(errors)
                      .filter(([_, error]) => error)
                      .map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? "Update Task" : "Create Task"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
