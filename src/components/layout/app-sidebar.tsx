"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/lib/constants";
import { CollapsibleSidebarGroup } from "./collapsible-sidebar-group";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const { user } = useAuth();
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="!bg-[var(--glass-bg)] !backdrop-blur-[20px] !border !border-[var(--glass-border)] !rounded-[20px] !m-[14px] !shadow-[var(--glass-shadow)] !h-[calc(100vh-28px)]"
    >
      <SidebarHeader className="border-0 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#3d8c5c] to-[#2d6b44] text-white text-[13px] font-semibold shadow-[0_2px_8px_rgba(61,140,92,0.3)]">
            B
          </div>
          <span className="truncate text-[15px] font-medium group-data-[collapsible=icon]:hidden">
            Breeding
          </span>
        </Link>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--muted)] px-3 py-2.5 text-[12px] text-[var(--muted-foreground)] group-data-[collapsible=icon]:hidden">
          <Search className="h-3.5 w-3.5 opacity-40" />
          <span>Search...</span>
          <kbd className="ml-auto text-[9px] bg-[var(--secondary)] px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
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
                      className="rounded-xl data-[active=true]:bg-[var(--accent)] data-[active=true]:text-[var(--accent-foreground)]"
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
                          className="rounded-xl data-[active=true]:bg-[var(--accent)] data-[active=true]:text-[var(--accent-foreground)]"
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
        {/* User card at bottom */}
        <div className="mt-auto p-3 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-[var(--muted)] p-2.5 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--foreground)] text-[10px] font-medium text-[var(--background)]">
              {initials}
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-[12px] font-medium">{user?.name}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
