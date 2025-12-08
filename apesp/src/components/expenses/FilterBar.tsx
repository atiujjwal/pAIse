"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";
import { useDebounce } from "@/src/hooks/use-debounce";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/Select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/Popover";
import { Label } from "@/src/components/ui/label";

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL once
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [category, setCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort_by") || "created_at"
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sort_order") || "desc"
  );

  const [minAmount, setMinAmount] = useState(
    searchParams.get("min_amount") || ""
  );
  const [maxAmount, setMaxAmount] = useState(
    searchParams.get("max_amount") || ""
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("from_date") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to_date") || "");

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Effect to update URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Helper to set/delete
    const updateParam = (key: string, value: string) => {
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
    };

    updateParam("search", debouncedSearch);
    updateParam("category", category);
    params.set("sort_by", sortBy);
    params.set("sort_order", sortOrder);
    updateParam("min_amount", minAmount);
    updateParam("max_amount", maxAmount);
    updateParam("from_date", dateFrom);
    updateParam("to_date", dateTo);

    // Reset page if filters change (but not on initial load if params match)
    // We check if the new string is different from current URL
    const currentString = searchParams.toString();
    const newString = params.toString();

    if (currentString !== newString) {
      params.set("page", "1"); // Reset pagination on filter change
      router.push(`?${params.toString()}`);
    }
  }, [
    debouncedSearch,
    category,
    sortBy,
    sortOrder,
    minAmount,
    maxAmount,
    dateFrom,
    dateTo,
    router,
    searchParams,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setCategory("all");
    setMinAmount("");
    setMaxAmount("");
    setDateFrom("");
    setDateTo("");
    router.push("?"); // Clear URL
  };

  const hasActiveFilters =
    category !== "all" ||
    minAmount ||
    maxAmount ||
    dateFrom ||
    dateTo ||
    searchTerm;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {/* Category */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px] h-11 bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Food">Food</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-11 bg-white">
              <span className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                <SelectValue placeholder="Sort by" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="date">Expense Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 bg-white shrink-0"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>

          {/* Advanced Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 bg-white gap-2">
                <Filter className="h-4 w-4" /> Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Advanced Filters</h4>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amount Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:bg-red-50"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
