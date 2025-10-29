import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewToggle } from "@/components/view-toggle";
import { PageFilter, type FilterOption } from "@/components/page-filter";
import { getMockData } from "@shared/schema";

const farmerFilters: FilterOption[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  {
    id: "lastDeal",
    label: "Last Deal",
    options: [
      { value: "thisWeek", label: "This Week" },
      { value: "thisMonth", label: "This Month" },
      { value: "older", label: "Older" },
    ],
  },
];
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Farmers() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const mockData = getMockData();
  const mockFarmers = mockData.farmers;

  const filteredFarmers = mockFarmers.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilters = true;
    
    if (activeFilters.status && activeFilters.status.length > 0) {
      matchesFilters = matchesFilters && activeFilters.status.includes(farmer.status);
    }
    
    if (activeFilters.lastDeal && activeFilters.lastDeal.length > 0) {
      const lastDealMatch = activeFilters.lastDeal.some(filter => {
        if (filter === 'thisWeek') {
          return farmer.lastDeal.includes('day') || farmer.lastDeal.includes('yesterday');
        }
        if (filter === 'thisMonth') {
          return farmer.lastDeal.includes('week') || farmer.lastDeal.includes('day');
        }
        if (filter === 'older') {
          return farmer.lastDeal.includes('month') || farmer.lastDeal.includes('year');
        }
        return true;
      });
      matchesFilters = matchesFilters && lastDealMatch;
    }
    
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Farmers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl shrink-0" data-testid="button-add-farmer">
              <Plus className="mr-2 h-4 w-4" />
              Add Farmer
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] sm:max-h-fit">
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter farmer name" className="rounded-2xl" data-testid="input-farmer-name" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="03001234567" className="rounded-2xl" data-testid="input-farmer-phone" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Enter address" className="rounded-2xl" data-testid="input-farmer-address" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Any additional notes" className="rounded-2xl" data-testid="input-farmer-notes" />
              </div>
              <Button className="w-full rounded-2xl" data-testid="button-submit-farmer">
                Add Farmer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search farmers..."
            className="pl-10 rounded-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-farmers"
          />
        </div>
        <PageFilter filters={farmerFilters} onFilterChange={setActiveFilters} />
        <ViewToggle />
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFarmers.map((farmer) => (
            <Card key={farmer.id} className="rounded-2xl hover-elevate" data-testid={`card-farmer-${farmer.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 hover:bg-primary/20 hover:scale-110">
                    <span className="text-lg font-medium text-primary">
                      {farmer.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <Badge
                    variant={farmer.status === "active" ? "default" : "secondary"}
                    className="rounded-2xl"
                  >
                    {farmer.status}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{farmer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{farmer.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">{farmer.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Deal:</span>
                    <span className="font-medium">{farmer.lastDeal}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Deal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmers.map((farmer) => (
                <TableRow key={farmer.id} data-testid={`row-farmer-${farmer.id}`}>
                  <TableCell className="font-medium">{farmer.name}</TableCell>
                  <TableCell>{farmer.phone}</TableCell>
                  <TableCell>{farmer.totalAmount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={farmer.status === "active" ? "default" : "secondary"}
                      className="rounded-2xl"
                    >
                      {farmer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{farmer.lastDeal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
