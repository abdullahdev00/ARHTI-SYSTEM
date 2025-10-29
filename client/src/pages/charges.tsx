import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, DollarSign } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getMockData } from "@shared/schema";

export default function Charges() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mockData = getMockData();
  const mockCharges = mockData.charges;

  const filteredCharges = mockCharges.filter(charge =>
    charge.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Charges</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl shrink-0" data-testid="button-add-charge">
              <Plus className="mr-2 h-4 w-4" />
              Add Charge
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Charge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Charge Title</Label>
                <Input id="title" placeholder="e.g., Labor Cost" className="rounded-2xl" data-testid="input-charge-title" />
              </div>
              <div>
                <Label htmlFor="amount">Amount (Rs)</Label>
                <Input id="amount" type="number" placeholder="1000" className="rounded-2xl" data-testid="input-charge-amount" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Additional notes" className="rounded-2xl" data-testid="input-charge-notes" />
              </div>
              <Button className="w-full rounded-2xl" data-testid="button-submit-charge">
                Add Charge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search charges..."
            className="pl-10 rounded-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-charges"
          />
        </div>
        <ViewToggle />
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCharges.map((charge) => (
            <Card key={charge.id} className="rounded-2xl hover-elevate" data-testid={`card-charge-${charge.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 hover:bg-primary/20 hover:scale-110">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="mt-3">{charge.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">Rs {charge.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Edited:</span>
                    <span className="font-medium">{new Date(charge.lastEdited).toLocaleDateString("en-IN")}</span>
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
                <TableHead>Charge Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Last Edited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCharges.map((charge) => (
                <TableRow key={charge.id} data-testid={`row-charge-${charge.id}`}>
                  <TableCell className="font-medium">{charge.title}</TableCell>
                  <TableCell className="font-medium">Rs {charge.amount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(charge.lastEdited).toLocaleDateString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
