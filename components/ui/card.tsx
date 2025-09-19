"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Card({ className, defaultOpen = false, ...props }: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm overflow-hidden",
        className,
      )}
      {...props}
    />
  )
}

function CardTrigger({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="card-trigger"
      className={cn(
        "flex items-center justify-between w-full px-6 py-4 text-left hover:bg-muted/50 transition-colors",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
    </button>
  )
}

function CardCollapsible({ className, isOpen, ...props }: React.ComponentProps<"div"> & { isOpen: boolean }) {
  return (
    <div
      data-slot="card-collapsible"
      className={cn(
        "transition-all duration-200 ease-in-out",
        isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden",
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 py-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  collapsible = false,
  triggerText = "Reference Files",
  ...props
}: React.ComponentProps<"div"> & { collapsible?: boolean; triggerText?: string }) {
  const [isCollapsed, setIsCollapsed] = React.useState(true)

  if (collapsible) {
    return (
      <div data-slot="card-content" className={cn("border-t", className)}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between w-full px-6 py-3 text-left hover:bg-muted/50 transition-colors text-sm font-medium"
        >
          {triggerText}
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isCollapsed ? "" : "rotate-180")} />
        </button>
        <div
          className={cn(
            "transition-all duration-200 ease-in-out overflow-hidden",
            isCollapsed ? "max-h-0 opacity-0" : "max-h-screen opacity-100",
          )}
        >
          <div className="px-6 pb-4" {...props} />
        </div>
      </div>
    )
  }

  return <div data-slot="card-content" className={cn("px-6 pb-4", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6 [.border-t]:pt-6", className)} {...props} />
}

export {
  Card,
  CardTrigger,
  CardCollapsible,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
