"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/lib/constants";
import type { NavItem } from "@/lib/constants";
import { CollapsibleSidebarGroup } from "./collapsible-sidebar-group";
import { useTranslations } from "next-intl";

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('navigation');

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            BA
          </div>
          <span className="truncate text-lg font-semibold group-data-[collapsible=icon]:hidden">
            Breeding App
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((section) => {
              if ("url" in section) {
                const Icon = section.icon;
                return (
                  <SidebarMenuItem key={section.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === section.url}
                      tooltip={t(section.title)}
                    >
                      <Link href={section.url}>
                        <Icon />
                        <span>{t(section.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              const isSectionActive = section.items.some(
                (item) =>
                  pathname === item.url || pathname.startsWith(item.url + "/")
              );

              return (
                <CollapsibleSidebarGroup
                  key={section.title}
                  title={t(section.title)}
                  isActive={isSectionActive}
                >
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={
                            pathname === item.url ||
                            pathname.startsWith(item.url + "/")
                          }
                        >
                          <Link href={item.url}>
                            {ItemIcon && <ItemIcon />}
                            <span>{t(item.title)}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </CollapsibleSidebarGroup>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
