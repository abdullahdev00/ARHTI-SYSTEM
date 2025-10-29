import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewToggle } from "@/components/view-toggle";
import { PageFilter, type FilterOption } from "@/components/page-filter";
import { Checkbox } from "@/components/ui/checkbox";
import { getMockData } from "@shared/schema";
import { generatePurchaseInvoice } from "@/lib/pdf-generator";

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

export default function Purchases() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFarmerDialogOpen, setIsFarmerDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [bagType, setBagType] = useState("");
  const [customBagWeight, setCustomBagWeight] = useState("");
  const [numberOfBags, setNumberOfBags] = useState("");
  const [ratePerBag, setRatePerBag] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
  const [printInvoice, setPrintInvoice] = useState(false);
  
  const mockData = getMockData();
  const availableCharges = mockData.charges;
  const mockPurchases = mockData.purchases;
  const mockCropRates = mockData.cropRates;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
    
    const savedCharges = localStorage.getItem('selectedCharges');
    if (savedCharges) {
      setSelectedCharges(JSON.parse(savedCharges));
    }
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

  const filteredPurchases = mockPurchases.filter(purchase => {
    const matchesSearch = purchase.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.crop.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilters = true;
    
    if (activeFilters.crop && activeFilters.crop.length > 0) {
      matchesFilters = matchesFilters && activeFilters.crop.some(crop => 
        purchase.crop.toLowerCase() === crop.toLowerCase()
      );
    }
    
    if (activeFilters.status && activeFilters.status.length > 0) {
      matchesFilters = matchesFilters && activeFilters.status.includes(purchase.status);
    }
    
    if (activeFilters.date && activeFilters.date.length > 0) {
      const purchaseDate = new Date(purchase.date);
      const today = new Date();
      const matchesDateFilter = activeFilters.date.some(filter => {
        if (filter === 'today') {
          return purchaseDate.toDateString() === today.toDateString();
        }
        if (filter === 'thisWeek') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return purchaseDate >= weekAgo;
        }
        if (filter === 'thisMonth') {
          return purchaseDate.getMonth() === today.getMonth() && 
                 purchaseDate.getFullYear() === today.getFullYear();
        }
        if (filter === 'older') {
          const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
          return purchaseDate < monthAgo;
        }
        return true;
      });
      matchesFilters = matchesFilters && matchesDateFilter;
    }
    
    return matchesSearch && matchesFilters;
  });

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

  const handleChargeToggle = (chargeId: string) => {
    setSelectedCharges(prev => {
      const newCharges = prev.includes(chargeId)
        ? prev.filter(id => id !== chargeId)
        : [...prev, chargeId];
      localStorage.setItem('selectedCharges', JSON.stringify(newCharges));
      return newCharges;
    });
  };

  const handleApplyAllCharges = () => {
    const allChargeIds = availableCharges.map(charge => charge.id);
    setSelectedCharges(allChargeIds);
    localStorage.setItem('selectedCharges', JSON.stringify(allChargeIds));
  };

  const calculateTotalCharges = () => {
    return selectedCharges.reduce((total, chargeId) => {
      const charge = availableCharges.find(c => c.id === chargeId);
      return total + (charge?.amount || 0);
    }, 0);
  };

  const calculateGrandTotal = () => {
    const purchaseTotal = numberOfBags && ratePerBag
      ? parseFloat(numberOfBags) * parseFloat(ratePerBag)
      : 0;
    return purchaseTotal + calculateTotalCharges();
  };

  const isFormValid = () => {
    if (!selectedFarmer || !selectedCrop || !bagType || !numberOfBags || !ratePerBag) {
      return false;
    }
    if (bagType === "custom" && !customBagWeight) {
      return false;
    }
    return true;
  };

  const handleSubmitPurchase = () => {
    if (printInvoice) {
      const purchaseTotal = parseFloat(numberOfBags) * parseFloat(ratePerBag);
      const selectedChargesData = selectedCharges.map(chargeId => {
        const charge = availableCharges.find(c => c.id === chargeId);
        return {
          title: charge?.title || '',
          amount: charge?.amount || 0
        };
      });

      const invoiceId = `PUR-${Date.now()}`;
      
      generatePurchaseInvoice({
        id: invoiceId,
        farmer: selectedFarmer || 'Farmer Name',
        crop: selectedCrop || 'Crop Name',
        quantity: numberOfBags,
        rate: ratePerBag,
        purchaseTotal: purchaseTotal,
        charges: selectedChargesData,
        totalCharges: calculateTotalCharges(),
        grandTotal: calculateGrandTotal(),
        date: purchaseDate
      });
    }
    
    setIsDialogOpen(false);
    setSelectedFarmer("");
    setSelectedCrop("");
    setBagType("");
    setNumberOfBags("");
    setRatePerBag("");
    setPrintInvoice(false);
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
          <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] sm:max-h-fit">
            <DialogHeader>
              <DialogTitle>Add New Purchase</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[calc(90vh-8rem)] sm:max-h-[70vh] overflow-y-auto pr-2">
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

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label>Apply Charges</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-2xl h-7 text-xs"
                    onClick={handleApplyAllCharges}
                  >
                    Apply All
                  </Button>
                </div>
                <div className="space-y-2">
                  {availableCharges.map((charge) => (
                    <div key={charge.id} className="flex items-start space-x-3 p-2 rounded-xl hover:bg-muted/50">
                      <Checkbox
                        id={`charge-${charge.id}`}
                        checked={selectedCharges.includes(charge.id)}
                        onCheckedChange={() => handleChargeToggle(charge.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`charge-${charge.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {charge.title}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">Rs {charge.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedCharges.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Charges:</span>
                      <span className="font-medium">Rs {calculateTotalCharges().toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {(numberOfBags && ratePerBag) && (
                <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Purchase Amount:</span>
                      <span className="font-medium">
                        Rs {(parseFloat(numberOfBags) * parseFloat(ratePerBag)).toLocaleString()}
                      </span>
                    </div>
                    {selectedCharges.length > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Charges:</span>
                        <span className="font-medium">Rs {calculateTotalCharges().toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Grand Total:</span>
                      <span className="text-lg font-bold text-primary">
                        Rs {calculateGrandTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 p-3 rounded-xl bg-muted/30">
                <Checkbox
                  id="print-invoice"
                  checked={printInvoice}
                  onCheckedChange={(checked) => setPrintInvoice(checked as boolean)}
                />
                <label
                  htmlFor="print-invoice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Print invoice after adding purchase
                </label>
              </div>

              <Button 
                className="w-full rounded-2xl" 
                data-testid="button-submit-purchase"
                onClick={handleSubmitPurchase}
                disabled={!isFormValid()}
              >
                Add Purchase
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Farmer Dialog */}
        <Dialog open={isFarmerDialogOpen} onOpenChange={setIsFarmerDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] sm:max-h-fit">
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
          <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] sm:max-h-fit">
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
        <PageFilter filters={purchaseFilters} onFilterChange={setActiveFilters} />
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
