import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewToggle } from "@/components/view-toggle";
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

const mockPurchases = [
  { id: "1", farmer: "Ram Singh", crop: "Wheat", quantity: "500", rate: "25", total: "12,500", date: "2024-10-27", status: "paid" },
  { id: "2", farmer: "Mohan Kumar", crop: "Rice", quantity: "300", rate: "35", total: "10,500", date: "2024-10-26", status: "pending" },
  { id: "3", farmer: "Vijay Sharma", crop: "Bajra", quantity: "400", rate: "22", total: "8,800", date: "2024-10-25", status: "paid" },
];

export default function Purchases() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPurchases = mockPurchases.filter(purchase =>
    purchase.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Purchases</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl shrink-0" data-testid="button-add-purchase">
              <Plus className="mr-2 h-4 w-4" />
              Add Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Purchase</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="farmer">Select Farmer</Label>
                <Select>
                  <SelectTrigger className="rounded-2xl" data-testid="select-farmer">
                    <SelectValue placeholder="Choose farmer" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="1">Ram Singh</SelectItem>
                    <SelectItem value="2">Mohan Kumar</SelectItem>
                    <SelectItem value="3">Vijay Sharma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="crop">Crop Type</Label>
                <Input id="crop" placeholder="e.g., Wheat, Rice" className="rounded-2xl" data-testid="input-crop" />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity (kg)</Label>
                <Input id="quantity" type="number" placeholder="500" className="rounded-2xl" data-testid="input-quantity" />
              </div>
              <div>
                <Label htmlFor="rate">Rate per kg (Rs)</Label>
                <Input id="rate" type="number" placeholder="25" className="rounded-2xl" data-testid="input-rate" />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" className="rounded-2xl" data-testid="input-date" />
              </div>
              <Button className="w-full rounded-2xl" data-testid="button-submit-purchase">
                Add Purchase
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchases..."
            className="pl-10 rounded-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-purchases"
          />
        </div>
        <ViewToggle />
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPurchases.map((purchase) => (
            <Card key={purchase.id} className="rounded-2xl hover-elevate" data-testid={`card-purchase-${purchase.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 hover:bg-primary/20 hover:scale-110">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    variant={purchase.status === "paid" ? "default" : "secondary"}
                    className="rounded-2xl"
                  >
                    {purchase.status}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{purchase.farmer}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Crop:</span>
                    <span className="font-medium">{purchase.crop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{purchase.quantity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate/kg:</span>
                    <span className="font-medium">Rs {purchase.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">Rs {purchase.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date(purchase.date).toLocaleDateString("en-IN")}</span>
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
                <TableHead>Farmer</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Quantity (kg)</TableHead>
                <TableHead>Rate/kg</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                  <TableCell className="font-medium">{purchase.farmer}</TableCell>
                  <TableCell>{purchase.crop}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>Rs {purchase.rate}</TableCell>
                  <TableCell className="font-medium">Rs {purchase.total}</TableCell>
                  <TableCell>{new Date(purchase.date).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge
                      variant={purchase.status === "paid" ? "default" : "secondary"}
                      className="rounded-2xl"
                    >
                      {purchase.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
