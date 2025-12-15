"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Check, ChevronDown } from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";

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
  "Other"
];

const SORT_OPTIONS = [
  { label: "Newest First", by: "created_at", order: "desc" },
  { label: "Oldest First", by: "created_at", order: "asc" },
  { label: "Amount: High to Low", by: "amount", order: "desc" },
  { label: "Amount: Low to High", by: "amount", order: "asc" },
];

const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  active,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  active: boolean;
}) => {
  return (
    <div className="relative group">
      <div
        className={cn(
          "flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-medium transition-all duration-200 cursor-pointer",
          active
            ? "bg-primary/10 border-primary/20 text-primary shadow-sm hover:bg-primary/15"
            : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
        )}
      >
        {active ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        )}
        <span>
          {active
            ? options.find((o) => o.value === value)?.label || value
            : label}
        </span>
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
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
    router.replace(pathname, { scroll: false });
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
        <div className="relative flex-1 w-full md:max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-full border border-border bg-muted/30 text-sm outline-none focus:bg-card focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <FilterDropdown
            label="Category"
            active={!!activeCategory}
            value={activeCategory || ""}
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            onChange={(val) =>
              router.replace(
                `${pathname}?${createQueryString("category", val)}`
              )
            }
          />

          <FilterDropdown
            label="Sort"
            active={!!activeSortValue}
            value={activeSortValue}
            options={SORT_OPTIONS.map((s) => ({
              label: s.label,
              value: `${s.by}__${s.order}`,
            }))}
            onChange={handleSortChange}
          />

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 px-3 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
