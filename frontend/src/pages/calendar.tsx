import { useState, useEffect, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Sun,
  FileText,
  Target,
  PartyPopper,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatDate } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { CalendarEvent, Holiday, HolidayCreate } from "@/types"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type ViewMode = "month" | "week"

export function CalendarPage() {
  const { currentYear, setCurrentYear, addNotification } = useAppStore()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false)
  const [newHoliday, setNewHoliday] = useState<HolidayCreate>({
    name: "",
    date: "",
    is_recurring: false,
    description: "",
  })
  const [, setIsLoading] = useState(true)

  // Load data
  useEffect(() => {
    loadCalendarData()
  }, [currentYear, currentMonth])

  const loadCalendarData = async () => {
    setIsLoading(true)
    try {
      const startDate = new Date(currentYear, currentMonth, 1)
      const endDate = new Date(currentYear, currentMonth + 1, 0)
      
      const [calendarEvents, holidayList] = await Promise.all([
        api.getCalendarEvents(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        ),
        api.getHolidays(currentYear),
      ])

      setEvents(Array.isArray(calendarEvents) ? calendarEvents : [])
      setHolidays(Array.isArray(holidayList) ? holidayList : [])
    } catch (error) {
      console.error("Failed to load calendar:", error)
      addNotification("error", "Failed to load calendar data")
      setEvents([])
      setHolidays([])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startingDay = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: Array<{ date: Date; isCurrentMonth: boolean; events: CalendarEvent[] }> = []

    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, -i)
      days.push({ date, isCurrentMonth: false, events: [] })
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dateStr = date.toISOString().split("T")[0]
      const dayEvents = (events || []).filter((e) => e.date === dateStr)
      days.push({ date, isCurrentMonth: true, events: dayEvents })
    }

    // Next month days
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentYear, currentMonth + 1, i)
      days.push({ date, isCurrentMonth: false, events: [] })
    }

    return days
  }, [currentYear, currentMonth, events])

  const navigateMonth = (direction: number) => {
    const newMonth = currentMonth + direction
    if (newMonth < 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else if (newMonth > 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(newMonth)
    }
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      addNotification("error", "Please fill in all required fields")
      return
    }

    try {
      await api.createHoliday(newHoliday)
      addNotification("success", "Holiday added successfully")
      setIsAddHolidayOpen(false)
      setNewHoliday({ name: "", date: "", is_recurring: false, description: "" })
      loadCalendarData()
    } catch {
      addNotification("error", "Failed to add holiday")
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isHoliday = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return holidays.some((h) => h.date === dateStr)
  }

  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const getEventIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "work_entry":
        return FileText
      case "planned_task":
        return Target
      case "holiday":
        return PartyPopper
      case "sprint_start":
      case "sprint_end":
        return Target
      default:
        return CalendarIcon
    }
  }

  const getEventColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "work_entry":
        return "bg-primary"
      case "planned_task":
        return "bg-info"
      case "holiday":
        return "bg-success"
      case "sprint_start":
        return "bg-warning"
      case "sprint_end":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-2xl font-bold">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Holiday</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    placeholder="Holiday name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newHoliday.description || ""}
                    onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newHoliday.is_recurring}
                    onChange={(e) => setNewHoliday({ ...newHoliday, is_recurring: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="recurring" className="text-sm">
                    Recurring annually
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddHolidayOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddHoliday}>Add Holiday</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "p-2 text-center text-sm font-medium",
                  i === 0 || i === 6 ? "text-destructive/70" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-border">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "min-h-[100px] p-2 cursor-pointer transition-colors",
                  day.isCurrentMonth ? "bg-card" : "bg-muted/30",
                  isToday(day.date) && "ring-2 ring-primary ring-inset",
                  isHoliday(day.date) && "bg-success/5",
                  isWeekend(day.date) && day.isCurrentMonth && "bg-muted/50",
                  selectedDate?.toDateString() === day.date.toDateString() && "bg-accent"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                      isToday(day.date) && "bg-primary text-primary-foreground font-bold",
                      !day.isCurrentMonth && "text-muted-foreground",
                      isWeekend(day.date) && day.isCurrentMonth && !isToday(day.date) && "text-destructive/70"
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  {isHoliday(day.date) && (
                    <Sun className="h-4 w-4 text-success" />
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {day.events.slice(0, 3).map((event) => {
                    const Icon = getEventIcon(event.type)
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium text-white truncate",
                          getEventColor(event.type)
                        )}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.title}</span>
                      </div>
                    )
                  })}
                  {day.events.length > 3 && (
                    <div className="text-[10px] text-muted-foreground pl-1">
                      +{day.events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected date details */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>{formatDate(selectedDate, "long")}</span>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link to={`/work/new?date=${selectedDate.toISOString().split("T")[0]}`}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Work
                  </Link>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.filter((e) => e.date === selectedDate.toISOString().split("T")[0]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No events for this date</p>
            ) : (
              <div className="space-y-2">
                {events
                  .filter((e) => e.date === selectedDate.toISOString().split("T")[0])
                  .map((event) => {
                    const Icon = getEventIcon(event.type)
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <div className={cn("rounded-full p-2", getEventColor(event.type))}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <Badge variant="outline" className="mt-1">
                            {event.type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary" />
          <span className="text-muted-foreground">Work Entry</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-info" />
          <span className="text-muted-foreground">Planned Task</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-success" />
          <span className="text-muted-foreground">Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-warning" />
          <span className="text-muted-foreground">Sprint Start</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded ring-2 ring-primary" />
          <span className="text-muted-foreground">Today</span>
        </div>
      </div>
    </div>
  )
}
