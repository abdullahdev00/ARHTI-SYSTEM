import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";

export function ViewToggle() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        variant={viewMode === "grid" ? "default" : "outline"}
        size="icon"
        onClick={() => setViewMode("grid")}
        className="rounded-2xl"
        data-testid="button-view-grid"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "outline"}
        size="icon"
        onClick={() => setViewMode("table")}
        className="rounded-2xl"
        data-testid="button-view-table"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
