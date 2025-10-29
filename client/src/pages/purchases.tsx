import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewToggle } from "@/components/view-toggle";
import { PageFilter, type FilterOption } from "@/components/page-filter";

const purchaseFilters: FilterOption[] = [
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
    id: "status",
    label: "Payment Status",
    options: [
      { value: "paid", label: "Paid" },
      { value: "pending", label: "Pending" },
    ],
  },
  {
    id: "date",
    label: "Date Range",
    options: [
      { value: "today", label: "Today" },
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

const mockCropRates = [
  { crop: "Wheat", bag40kg: 1400, bag60kg: 2100 },
  { crop: "Rice", bag40kg: 2000, bag60kg: 3000 },
  { crop: "Bajra", bag40kg: 1200, bag60kg: 1800 },
  { crop: "Cotton", bag40kg: 3000, bag60kg: 4500 },
];

export default function Purchases() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFarmerDialogOpen, setIsFarmerDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [bagType, setBagType] = useState("");
  const [customBagWeight, setCustomBagWeight] = useState("");
  const [numberOfBags, setNumberOfBags] = useState("");
  const [ratePerBag, setRatePerBag] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
  }, []);

  useEffect(() => {
    if (selectedCrop && bagType) {
      const cropRate = mockCropRates.find(r => r.crop === selectedCrop);
      if (cropRate) {
        const rate = bagType === "40kg" ? cropRate.bag40kg : bagType === "60kg" ? cropRate.bag60kg : 0;
        setRatePerBag(rate.toString());
      }
    }
  }, [selectedCrop, bagType]);

  const filteredPurchases = mockPurchases.filter(purchase =>
    purchase.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFarmerChange = (value: string) => {
    if (value === "add_new") {
      setIsFarmerDialogOpen(true);
    } else {
      setSelectedFarmer(value);
    }
  };

  const handleCropRateChange = (value: string) => {
    if (value === "add_new") {
      setIsRateDialogOpen(true);
    } else {
      setSelectedCrop(value);
    }
  };

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
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="farmer">Select Farmer</Label>
                <Select value={selectedFarmer} onValueChange={handleFarmerChange}>
                  <SelectTrigger className="rounded-2xl" data-testid="select-farmer">
                    <SelectValue placeholder="Choose farmer" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="1">Ram Singh</SelectItem>
                    <SelectItem value="2">Mohan Kumar</SelectItem>
                    <SelectItem value="3">Vijay Sharma</SelectItem>
                    <SelectItem value="add_new" className="text-primary font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Farmer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="crop">Crop Type & Rate</Label>
                <Select value={selectedCrop} onValueChange={handleCropRateChange}>
                  <SelectTrigger className="rounded-2xl" data-testid="select-crop">
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {mockCropRates.map((rate) => (
                      <SelectItem key={rate.crop} value={rate.crop}>
                        {rate.crop} (40kg: Rs {rate.bag40kg}, 60kg: Rs {rate.bag60kg})
                      </SelectItem>
                    ))}
                    <SelectItem value="add_new" className="text-primary font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Crop Rate
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bagType">Bag Type</Label>
                <Select value={bagType} onValueChange={setBagType}>
                  <SelectTrigger className="rounded-2xl" data-testid="select-bag-type">
                    <SelectValue placeholder="Select bag size" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="40kg">40 kg bag</SelectItem>
                    <SelectItem value="60kg">60 kg bag</SelectItem>
                    <SelectItem value="custom">Custom weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bagType === "custom" && (
                <div>
                  <Label htmlFor="customWeight">Custom Bag Weight (kg)</Label>
                  <Input 
                    id="customWeight" 
                    type="number" 
                    placeholder="50" 
                    className="rounded-2xl"
                    value={customBagWeight}
                    onChange={(e) => setCustomBagWeight(e.target.value)}
                    data-testid="input-custom-weight" 
                  />
                </div>
              )}

              <div>
                <Label htmlFor="quantity">Number of Bags</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  placeholder="100" 
                  className="rounded-2xl"
                  value={numberOfBags}
                  onChange={(e) => setNumberOfBags(e.target.value)}
                  data-testid="input-quantity" 
                />
              </div>

              <div>
                <Label htmlFor="rate">Rate per Bag (Rs)</Label>
                <Input 
                  id="rate" 
                  type="number" 
                  placeholder="2100" 
                  className="rounded-2xl"
                  value={ratePerBag}
                  onChange={(e) => setRatePerBag(e.target.value)}
                  data-testid="input-rate" 
                />
              </div>

              {numberOfBags && ratePerBag && (
                <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-lg font-bold text-primary">
                      Rs {(parseFloat(numberOfBags) * parseFloat(ratePerBag)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="date">Purchase Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  className="rounded-2xl"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  data-testid="input-date" 
                />
              </div>

              <Button className="w-full rounded-2xl" data-testid="button-submit-purchase">
                Add Purchase
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Farmer Dialog */}
        <Dialog open={isFarmerDialogOpen} onOpenChange={setIsFarmerDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="farmerName">Full Name</Label>
                <Input id="farmerName" placeholder="Enter farmer name" className="rounded-2xl" />
              </div>
              <div>
                <Label htmlFor="farmerPhone">Phone Number</Label>
                <Input id="farmerPhone" placeholder="03001234567" className="rounded-2xl" />
              </div>
              <div>
                <Label htmlFor="farmerAddress">Address</Label>
                <Input id="farmerAddress" placeholder="Enter address" className="rounded-2xl" />
              </div>
              <Button 
                className="w-full rounded-2xl"
                onClick={() => setIsFarmerDialogOpen(false)}
              >
                Add Farmer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Crop Rate Dialog */}
        <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Crop Rate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cropName">Crop Name</Label>
                <Input id="cropName" placeholder="e.g., Wheat, Rice" className="rounded-2xl" />
              </div>
              <div>
                <Label htmlFor="rate40kg">Rate for 40kg Bag (Rs)</Label>
                <Input id="rate40kg" type="number" placeholder="1400" className="rounded-2xl" />
              </div>
              <div>
                <Label htmlFor="rate60kg">Rate for 60kg Bag (Rs)</Label>
                <Input id="rate60kg" type="number" placeholder="2100" className="rounded-2xl" />
              </div>
              <Button 
                className="w-full rounded-2xl"
                onClick={() => setIsRateDialogOpen(false)}
              >
                Add Crop Rate
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
        <PageFilter filters={purchaseFilters} />
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
