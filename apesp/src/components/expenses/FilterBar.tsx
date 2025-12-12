"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Check,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";

// --- Configuration ---
const CATEGORIES = [
  "Food",
  "Travel",
  "Entertainment",
  "Shopping",
  "Bills",
  "General",
  "Pooja",
];

const SORT_OPTIONS = [
  { label: "Newest First", by: "created_at", order: "desc" },
  { label: "Oldest First", by: "created_at", order: "asc" },
  { label: "Amount: High to Low", by: "amount", order: "desc" },
  { label: "Amount: Low to High", by: "amount", order: "asc" },
];

// --- Helper Components ---

/**
 * A custom stylized dropdown meant to look like a popover filter.
 * Uses native select for maximum accessibility and reliability without
 * requiring complex third-party UI libraries.
 */
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
      {/* Visual Button */}
      <div
        className={cn(
          "flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-medium transition-all duration-200 cursor-pointer",
          active
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm hover:bg-indigo-100"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        {active ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        )}
        <span>
          {active
            ? options.find((o) => o.value === value)?.label || value
            : label}
        </span>
      </div>

      {/* Invisible Native Select Overlay for Interaction */}
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

  // --- Local State for Inputs ---
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // --- Helpers ---

  // Create a new query string by merging current params with new ones
  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset page on filter change
      if (name !== "page") {
        params.set("page", "1");
      }
      return params.toString();
    },
    [searchParams]
  );

  // --- Handlers ---

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (searchTerm !== currentSearch) {
        router.replace(
          `${pathname}?${createQueryString("search", searchTerm || null)}`,
          { scroll: false }
        );
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, searchParams, router, pathname, createQueryString]);

  const handleSortChange = (value: string) => {
    // Value format: "by_order" e.g., "created_at_desc"
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete("sort_by");
      params.delete("sort_order");
    } else {
      const [by, order] = value.split("__"); // using double underscore separator
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

  // --- Derived State for UI ---
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
        {/* 1. Search Bar (Fluid Width) */}
        <div className="relative flex-1 w-full md:max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-full border border-slate-200 bg-slate-50/50 text-sm outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* 2. Filter Actions (Horizontal Scroll on Mobile, Flex on Desktop) */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {/* Category Filter */}
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

          {/* Sort Filter */}
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

          {/* Reset Button (Only visible when filtered) */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 px-3 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50"
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
