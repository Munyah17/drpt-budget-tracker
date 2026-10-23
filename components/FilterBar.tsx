"use client";

import { useState } from "react";
import Icon from "./Icon";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  categoryOptions?: FilterOption[];
  statusOptions?: FilterOption[];
  onSearchChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onClear?: () => void;
}

export default function FilterBar({
  searchPlaceholder = "Search...",
  categoryOptions = [],
  statusOptions = [],
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onClear,
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [statusValue, setStatusValue] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange?.(value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategoryValue(value);
    onCategoryChange?.(value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusValue(value);
    onStatusChange?.(value);
  };

  const handleClear = () => {
    setSearchValue("");
    setCategoryValue("");
    setStatusValue("");
    onSearchChange?.("");
    onCategoryChange?.("");
    onStatusChange?.("");
    onClear?.();
  };

  const hasActiveFilters = searchValue || categoryValue || statusValue;

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
      <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
        <Icon name="search" />
        <input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>
      {categoryOptions.length > 0 && (
        <select
          className="settings-select"
          value={categoryValue}
          onChange={handleCategoryChange}
          style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", minWidth: 150 }}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {statusOptions.length > 0 && (
        <select
          className="settings-select"
          value={statusValue}
          onChange={handleStatusChange}
          style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", minWidth: 150 }}
        >
          <option value="">All Status</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {hasActiveFilters && (
        <button
          className="btn btn-ghost"
          onClick={handleClear}
          style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}
        >
          <Icon name="x" size={16} />
          Clear Filters
        </button>
      )}
    </div>
  );
}
