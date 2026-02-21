import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "primary" | "success" | "warning" | "info"
}

const variants = {
  default: {
    icon: "bg-muted text-muted-foreground",
    trend: "text-muted-foreground",
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    trend: "text-primary",
  },
  success: {
    icon: "bg-success/10 text-success",
    trend: "text-success",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    trend: "text-warning",
  },
  info: {
    icon: "bg-info/10 text-info",
    trend: "text-info",
  },
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
}: StatsCardProps) {
  const colors = variants[variant]

  return (
    <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p className={cn("text-sm font-medium", colors.trend)}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              <span className="ml-1 text-muted-foreground font-normal">vs last period</span>
            </p>
          )}
        </div>
        <div className={cn("rounded-xl p-3", colors.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  )
}
