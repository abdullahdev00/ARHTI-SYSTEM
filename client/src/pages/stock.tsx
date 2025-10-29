import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewToggle } from "@/components/view-toggle";
import { PageFilter, type FilterOption } from "@/components/page-filter";
import { getMockData } from "@shared/schema";

const stockFilters: FilterOption[] = [
  {
    id: "crop",
    label: "Crop Type",
    options: [
      { value: "wheat", label: "Wheat" },
      { value: "rice", label: "Rice" },
      { value: "bajra", label: "Bajra" },
      { value: "cotton", label: "Cotton" },
    ],
  },
  {
    id: "stockLevel",
    label: "Stock Level",
    options: [
      { value: "low", label: "Low Stock (< 100 bags)" },
      { value: "medium", label: "Medium (100-300 bags)" },
      { value: "high", label: "High (> 300 bags)" },
    ],
  },
  {
    id: "bagType",
    label: "Bag Type",
    options: [
      { value: "40kg", label: "40 kg bags" },
      { value: "60kg", label: "60 kg bags" },
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Stock() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const mockData = getMockData();
  const mockStock = mockData.stock;

  const filteredStock = mockStock.filter(item => {
    const matchesSearch = item.crop.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilters = true;
    
    if (activeFilters.crop && activeFilters.crop.length > 0) {
      matchesFilters = matchesFilters && activeFilters.crop.some(crop => 
        item.crop.toLowerCase() === crop.toLowerCase()
      );
    }
    
    if (activeFilters.stockLevel && activeFilters.stockLevel.length > 0) {
      const totalBags = item.bags60kg.quantity + item.bags40kg.quantity;
      const matchesStockLevel = activeFilters.stockLevel.some(level => {
        if (level === 'low') return totalBags < 100;
        if (level === 'medium') return totalBags >= 100 && totalBags <= 300;
        if (level === 'high') return totalBags > 300;
        return true;
      });
      matchesFilters = matchesFilters && matchesStockLevel;
    }
    
    if (activeFilters.bagType && activeFilters.bagType.length > 0) {
      const matchesBagType = activeFilters.bagType.some(bagType => {
        if (bagType === '40kg') return item.bags40kg.quantity > 0;
        if (bagType === '60kg') return item.bags60kg.quantity > 0;
        return true;
      });
      matchesFilters = matchesFilters && matchesBagType;
    }
    
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Stock Inventory</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl shrink-0" data-testid="button-add-stock">
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] sm:max-h-fit">
            <DialogHeader>
              <DialogTitle>Add Stock Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="crop">Crop Type</Label>
                <Input id="crop" placeholder="e.g., Wheat, Rice" className="rounded-2xl" data-testid="input-crop" />
              </div>
              <div>
                <Label htmlFor="bagType">Bag Type</Label>
                <Select>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Select bag size" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="40kg">40 kg bag</SelectItem>
                    <SelectItem value="60kg">60 kg bag</SelectItem>
                    <SelectItem value="custom">Custom weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Number of Bags</Label>
                <Input id="quantity" type="number" placeholder="100" className="rounded-2xl" data-testid="input-quantity" />
              </div>
              <div>
                <Label htmlFor="buyRate">Buy Rate per Bag (Rs)</Label>
                <Input id="buyRate" type="number" placeholder="2100" className="rounded-2xl" data-testid="input-buy-rate" />
              </div>
              <div>
                <Label htmlFor="sellRate">Sell Rate per Bag (Rs)</Label>
                <Input id="sellRate" type="number" placeholder="2200" className="rounded-2xl" data-testid="input-sell-rate" />
              </div>
              <Button className="w-full rounded-2xl" data-testid="button-submit-stock">
                Add to Stock
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stock..."
            className="pl-10 rounded-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-stock"
          />
        </div>
        <PageFilter filters={stockFilters} onFilterChange={setActiveFilters} />
        <ViewToggle />
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStock.map((item) => (
            <Card key={item.id} className="rounded-2xl hover-elevate" data-testid={`card-stock-${item.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 hover:bg-primary/20 hover:scale-110">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="rounded-2xl">
                    In Stock
                  </Badge>
                </div>
                <CardTitle className="mt-3">{item.crop}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-2">60 kg Bags</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{item.bags60kg.quantity} bags</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Buy:</span>
                        <span className="font-medium">Rs {item.bags60kg.buyRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sell:</span>
                        <span className="font-medium text-green-600">Rs {item.bags60kg.sellRate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-2">40 kg Bags</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{item.bags40kg.quantity} bags</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Buy:</span>
                        <span className="font-medium">Rs {item.bags40kg.buyRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sell:</span>
                        <span className="font-medium text-green-600">Rs {item.bags40kg.sellRate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Value:</span>
                      <span className="text-lg font-bold text-primary">{item.totalValue}</span>
                    </div>
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
                <TableHead>Crop</TableHead>
                <TableHead>60kg Bags</TableHead>
                <TableHead>60kg Buy Rate</TableHead>
                <TableHead>60kg Sell Rate</TableHead>
                <TableHead>40kg Bags</TableHead>
                <TableHead>40kg Buy Rate</TableHead>
                <TableHead>40kg Sell Rate</TableHead>
                <TableHead>Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((item) => (
                <TableRow key={item.id} data-testid={`row-stock-${item.id}`}>
                  <TableCell className="font-medium">{item.crop}</TableCell>
                  <TableCell>{item.bags60kg.quantity}</TableCell>
                  <TableCell>Rs {item.bags60kg.buyRate}</TableCell>
                  <TableCell className="text-green-600 font-medium">Rs {item.bags60kg.sellRate}</TableCell>
                  <TableCell>{item.bags40kg.quantity}</TableCell>
                  <TableCell>Rs {item.bags40kg.buyRate}</TableCell>
                  <TableCell className="text-green-600 font-medium">Rs {item.bags40kg.sellRate}</TableCell>
                  <TableCell className="font-medium">{item.totalValue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
