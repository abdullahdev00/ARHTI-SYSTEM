import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

interface PageFilterProps {
  filters: FilterOption[];
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

export function PageFilter({ filters, onFilterChange }: PageFilterProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const handleFilterToggle = (filterId: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[filterId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      const updated = { ...prev, [filterId]: newValues };
      onFilterChange?.(updated);
      return updated;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    onFilterChange?.({});
  };

  const activeFilterCount = Object.values(selectedFilters).reduce(
    (acc, values) => acc + values.length,
    0
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-2xl relative" 
          data-testid="button-filter"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {filters.map((filter) => (
          <DropdownMenuSub key={filter.id}>
            <DropdownMenuSubTrigger>
              <span className="flex items-center gap-2">
                {filter.label}
                {selectedFilters[filter.id]?.length > 0 && (
                  <Badge variant="secondary" className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {selectedFilters[filter.id].length}
                  </Badge>
                )}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="rounded-2xl">
              {filter.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selectedFilters[filter.id]?.includes(option.value)}
                  onCheckedChange={() => handleFilterToggle(filter.id, option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
