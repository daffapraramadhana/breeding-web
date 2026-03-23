"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar"

export function CollapsibleSidebarGroup({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  isActive = false,
  forceOpen,
}: {
  title: string
  icon?: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
  isActive?: boolean
  forceOpen?: boolean
}) {
  const openProps = forceOpen !== undefined
    ? { open: forceOpen }
    : { defaultOpen: defaultOpen || isActive }

  return (
    <CollapsiblePrimitive.Root
      asChild
      {...openProps}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsiblePrimitive.CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title} isActive={isActive} className="rounded-xl">
            {Icon && <Icon />}
            <span className="text-[9px] uppercase tracking-[1.5px] text-[var(--muted-foreground)]">{title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsiblePrimitive.CollapsibleTrigger>
        <CollapsiblePrimitive.CollapsibleContent>
          <SidebarMenuSub>{children}</SidebarMenuSub>
        </CollapsiblePrimitive.CollapsibleContent>
      </SidebarMenuItem>
    </CollapsiblePrimitive.Root>
  )
}
