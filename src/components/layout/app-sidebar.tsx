"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
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
import type { NavItem } from "@/lib/constants";
import { CollapsibleSidebarGroup } from "./collapsible-sidebar-group";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("navigation");
  const { user } = useAuth();
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Flatten all nav links for search matching
  const allLinks = useMemo(() => {
    const links: { title: string; translatedTitle: string; url: string; icon: React.ComponentType<{ className?: string }> }[] = [];
    for (const section of NAV_ITEMS) {
      if ("url" in section) {
        links.push({ title: section.title, translatedTitle: t(section.title), url: section.url, icon: section.icon });
      } else {
        for (const item of section.items) {
          links.push({ title: item.title, translatedTitle: t(item.title), url: item.url, icon: item.icon });
        }
      }
    }
    return links;
  }, [t]);

  // Filter results
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allLinks.filter(
      (link) =>
        link.translatedTitle.toLowerCase().includes(q) ||
        link.title.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q)
    );
  }, [query, allLinks]);

  const isSearching = query.trim().length > 0;

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(isSearching && searchResults.length > 0 ? 0 : -1);
  }, [searchResults, isSearching]);

  // Keyboard navigation in search results
  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (!isSearching) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0 && searchResults[selectedIndex]) {
      e.preventDefault();
      router.push(searchResults[selectedIndex].url);
      setQuery("");
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  }

  // Filter nav items for display when searching
  function filterNavItems(items: NavItem[]): NavItem[] {
    if (!isSearching) return items;
    const q = query.toLowerCase();
    return items
      .map((section) => {
        if ("url" in section) {
          const matches =
            t(section.title).toLowerCase().includes(q) ||
            section.title.toLowerCase().includes(q);
          return matches ? section : null;
        }
        const filteredItems = section.items.filter(
          (item) =>
            t(item.title).toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q)
        );
        if (filteredItems.length === 0) return null;
        return { ...section, items: filteredItems };
      })
      .filter(Boolean) as NavItem[];
  }

  const filteredNav = filterNavItems(NAV_ITEMS);

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
        {/* Functional search */}
        <div className="mt-3 relative group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 rounded-xl bg-[var(--muted)] px-3 py-2 text-[12px] text-[var(--muted-foreground)]">
            <Search className="h-3.5 w-3.5 opacity-40 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none placeholder:text-[var(--muted-foreground)] text-[var(--foreground)] text-[12px]"
            />
            {isSearching ? (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="text-[9px] bg-[var(--secondary)] px-1.5 py-0.5 rounded shrink-0">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Search results dropdown */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[var(--glass-bg)] backdrop-blur-[20px] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] py-1 z-50 max-h-[240px] overflow-y-auto">
              {searchResults.map((result, i) => {
                const Icon = result.icon;
                return (
                  <Link
                    key={result.url}
                    href={result.url}
                    onClick={() => setQuery("")}
                    className={`flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors ${
                      i === selectedIndex
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-60" />
                    <span>{result.translatedTitle}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {isSearching && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[var(--glass-bg)] backdrop-blur-[20px] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] py-3 z-50 text-center text-[11px] text-[var(--muted-foreground)]">
              No results
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {filteredNav.map((section) => {
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
                  forceOpen={isSearching ? true : undefined}
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
