import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
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

const mockFarmers = [
  { id: "1", name: "Ram Singh", phone: "+91 98765 43210", crop: "Wheat", totalAmount: "₹45,000", status: "active", lastDeal: "2 days ago" },
  { id: "2", name: "Mohan Kumar", phone: "+91 98765 43211", crop: "Rice", totalAmount: "₹38,500", status: "active", lastDeal: "5 days ago" },
  { id: "3", name: "Vijay Sharma", phone: "+91 98765 43212", crop: "Bajra", totalAmount: "₹32,000", status: "active", lastDeal: "1 week ago" },
  { id: "4", name: "Suresh Patel", phone: "+91 98765 43213", crop: "Cotton", totalAmount: "₹28,000", status: "inactive", lastDeal: "3 weeks ago" },
];

export default function Farmers() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredFarmers = mockFarmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmer.crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Farmers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl" data-testid="button-add-farmer">
              <Plus className="mr-2 h-4 w-4" />
              Add Farmer
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
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
                <Input id="phone" placeholder="+91 98765 43210" className="rounded-2xl" data-testid="input-farmer-phone" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Enter address" className="rounded-2xl" data-testid="input-farmer-address" />
              </div>
              <div>
                <Label htmlFor="crop">Primary Crop</Label>
                <Input id="crop" placeholder="e.g., Wheat, Rice" className="rounded-2xl" data-testid="input-farmer-crop" />
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

      <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="flex gap-2">
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
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFarmers.map((farmer) => (
            <Card key={farmer.id} className="rounded-2xl hover-elevate" data-testid={`card-farmer-${farmer.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
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
                    <span className="text-muted-foreground">Crop:</span>
                    <span className="font-medium">{farmer.crop}</span>
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
                <TableHead>Crop</TableHead>
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
                  <TableCell>{farmer.crop}</TableCell>
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
