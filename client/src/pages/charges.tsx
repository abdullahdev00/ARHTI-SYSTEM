import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
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

const mockCharges = [
  { id: "1", title: "Labor Cost", amount: "Rs 2,000", type: "Labor", date: "2024-10-27", appliedTo: "Purchase #12" },
  { id: "2", title: "Transport Fee", amount: "Rs 1,500", type: "Transport", date: "2024-10-26", appliedTo: "Purchase #11" },
  { id: "3", title: "Mandi Tax", amount: "Rs 800", type: "Misc", date: "2024-10-25", appliedTo: "Batch #5" },
];

export default function Charges() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredCharges = mockCharges.filter(charge =>
    charge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    charge.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Charges</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl" data-testid="button-add-charge">
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
                <Label htmlFor="type">Charge Type</Label>
                <Select>
                  <SelectTrigger className="rounded-2xl" data-testid="select-charge-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="misc">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="appliedTo">Applied To</Label>
                <Input id="appliedTo" placeholder="e.g., Purchase #12" className="rounded-2xl" data-testid="input-applied-to" />
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search charges..."
          className="pl-10 rounded-2xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-charges"
        />
      </div>

      <Card className="rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Charge Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applied To</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCharges.map((charge) => (
              <TableRow key={charge.id} data-testid={`row-charge-${charge.id}`}>
                <TableCell className="font-medium">{charge.title}</TableCell>
                <TableCell className="font-medium">{charge.amount}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-2xl">
                    {charge.type}
                  </Badge>
                </TableCell>
                <TableCell>{charge.appliedTo}</TableCell>
                <TableCell>{new Date(charge.date).toLocaleDateString("en-IN")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
