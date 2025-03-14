import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TestFiltersProps = {
  filters: {
    featureId: string;
    priority: string;
    tagIds: string[];
    status: string;
    result: string;
  };
  onFilterChange: (filterName: string, value: any) => void;
  features: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
};

const TestFilters = ({ filters, onFilterChange, features, tags }: TestFiltersProps) => {
  // Calculate active filters count for badge display
  const activeFilterCount =
    (filters.featureId !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.result !== "all" ? 1 : 0) +
    filters.tagIds.length;

  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {/* Feature Filter */}
      <Select
        value={filters.featureId}
        onValueChange={(value) => onFilterChange("featureId", value)}
      >
        <SelectTrigger className="w-[160px] h-10">
          <SelectValue placeholder="Feature" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Features</SelectItem>
          {features.map(feature => (
            <SelectItem key={feature.id} value={feature.id}>
              {feature.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={filters.priority}
        onValueChange={(value) => onFilterChange("priority", value)}
      >
        <SelectTrigger className="w-[140px] h-10">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange("status", value)}
      >
        <SelectTrigger className="w-[140px] h-10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="ready">Ready</SelectItem>
          <SelectItem value="deprecated">Deprecated</SelectItem>
        </SelectContent>
      </Select>

      {/* Test Result Filter */}
      <Select
        value={filters.result}
        onValueChange={(value) => onFilterChange("result", value)}
      >
        <SelectTrigger className="w-[140px] h-10">
          <SelectValue placeholder="Result" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Results</SelectItem>
          <SelectItem value="passed">Passed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
          <SelectItem value="not_executed">Not Executed</SelectItem>
        </SelectContent>
      </Select>

      {/* Tags Filter - Multi-select dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[120px] h-10 relative">
            Tags
            {filters.tagIds.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filters.tagIds.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {tags.length > 0 ? (
            tags.map(tag => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={filters.tagIds.includes(tag.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFilterChange("tagIds", [...filters.tagIds, tag.id]);
                  } else {
                    onFilterChange("tagIds", filters.tagIds.filter(id => id !== tag.id));
                  }
                }}
              >
                {tag.name}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-gray-500">No tags available</div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset Filters button - only show if filters are active */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onFilterChange("featureId", "all");
            onFilterChange("priority", "all");
            onFilterChange("tagIds", []);
            onFilterChange("status", "all");
            onFilterChange("result", "all");
          }}
          className="h-10"
        >
          Clear Filters
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  );
};

export default TestFilters;
