"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  Check,
  ChevronDown,
  ArrowUpDown,
  Filter,
} from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/src/components/ui/Dropdown-menu";

const CATEGORIES = [
  "Food & Dining",
  "Housing & Utilities",
  "Transportation",
  "Travel & Accommodation",
  "Shopping & Personal",
  "Entertainment & Social",
  "Health & Wellness",
  "Education & Work",
  "Family",
  "Bills & Subscriptions",
  "Other",
];

const SORT_OPTIONS = [
  { label: "Newest First", by: "created_at", order: "desc" },
  { label: "Oldest First", by: "created_at", order: "asc" },
  { label: "Amount: High to Low", by: "amount", order: "desc" },
  { label: "Amount: Low to High", by: "amount", order: "asc" },
];

// --- Enhanced Dropdown Component ---
const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  active,
  icon: Icon,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  active: boolean;
  icon?: any;
}) => {
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20",
            active
              ? "bg-primary/10 border-primary/20 text-primary shadow-sm hover:bg-primary/15"
              : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/30"
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                active ? "text-primary" : "text-muted-foreground"
              )}
            />
          )}
          <span>{active ? selectedLabel : label}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200 ml-1",
              active ? "opacity-100" : "opacity-50"
            )}
          />
        </button>
      </DropdownMenuTrigger>
      {/* UPDATED: Added max-h-[280px] and overflow-y-auto for scrolling */}
      <DropdownMenuContent
        align="start"
        className="w-[200px] p-1 rounded-xl max-h-[280px] overflow-y-auto overflow-x-hidden"
      >
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Select {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={() => onChange("")}
          // UPDATED: Removed 'my-0.5' and set 'py-2' for compact but touch-friendly spacing
          className="rounded-lg focus:bg-muted cursor-pointer font-medium py-2"
        >
          <span className="flex-1">All</span>
          {!active && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              // UPDATED: Removed 'my-0.5' to reduce gaps
              className={cn(
                "rounded-lg focus:bg-muted cursor-pointer py-2",
                isSelected && "bg-primary/5 text-primary font-semibold"
              )}
            >
              <span className="flex-1 truncate">{opt.label}</span>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(name, value);
      else params.delete(name);
      if (name !== "page") params.set("page", "1");
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (searchTerm !== currentSearch) {
        router.replace(
          `${pathname}?${createQueryString("search", searchTerm || null)}`,
          { scroll: false }
        );
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParams, router, pathname, createQueryString]);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete("sort_by");
      params.delete("sort_order");
    } else {
      const [by, order] = value.split("__");
      params.set("sort_by", by);
      params.set("sort_order", order);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("category");
    params.delete("sort_by");
    params.delete("sort_order");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setSearchTerm("");
  };

  const activeCategory = searchParams.get("category");
  const activeSortBy = searchParams.get("sort_by");
  const activeSortOrder = searchParams.get("sort_order");
  const activeSortValue =
    activeSortBy && activeSortOrder
      ? `${activeSortBy}__${activeSortOrder}`
      : "";

  const isFiltered =
    !!activeCategory || !!activeSortBy || !!searchParams.get("search");

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col md:flex-row gap-3 items-center w-full">
        <div className="relative flex-1 w-full md:max-w-md group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-full border border-border bg-background/50 backdrop-blur-sm text-sm outline-none focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <FilterDropdown
            label="Category"
            icon={Filter}
            active={!!activeCategory}
            value={activeCategory || ""}
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            onChange={(val) =>
              router.replace(
                `${pathname}?${createQueryString("category", val)}`,
                { scroll: false }
              )
            }
          />

          <FilterDropdown
            label="Sort"
            icon={ArrowUpDown}
            active={!!activeSortValue}
            value={activeSortValue}
            options={SORT_OPTIONS.map((s) => ({
              label: s.label,
              value: `${s.by}__${s.order}`,
            }))}
            onChange={handleSortChange}
          />

          {/* Reset Filter Button */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isFiltered ? "w-auto opacity-100 ml-1" : "w-0 opacity-0"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 px-3 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 whitespace-nowrap"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
