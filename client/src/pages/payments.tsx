import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
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
import { StatCard } from "@/components/stat-card";

const mockPayments = [
  { id: "1", name: "Factory A", invoice: "INV-001", amount: "Rs 12,500", type: "incoming", status: "completed", date: "2024-10-27" },
  { id: "2", name: "Ram Singh", invoice: "INV-001", amount: "Rs 11,875", type: "outgoing", status: "completed", date: "2024-10-27" },
  { id: "3", name: "Factory B", invoice: "INV-002", amount: "Rs 10,500", type: "incoming", status: "pending", date: "2024-10-26" },
];

export default function Payments() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPayments = mockPayments.filter(payment =>
    payment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.invoice.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const receivedFromFactory = "Rs 2,45,000";
  const paidToFarmers = "Rs 2,15,500";
  const pendingAmount = "Rs 29,500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Payments</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl shrink-0" data-testid="button-add-payment">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Payment Type</Label>
                <Select>
                  <SelectTrigger className="rounded-2xl" data-testid="select-payment-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="incoming">Incoming (Received)</SelectItem>
                    <SelectItem value="outgoing">Outgoing (Paid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Factory or Farmer name" className="rounded-2xl" data-testid="input-payment-name" />
              </div>
              <div>
                <Label htmlFor="amount">Amount (Rs)</Label>
                <Input id="amount" type="number" placeholder="10000" className="rounded-2xl" data-testid="input-payment-amount" />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" className="rounded-2xl" data-testid="input-payment-date" />
              </div>
              <Button className="w-full rounded-2xl" data-testid="button-submit-payment">
                Add Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Received from Factory"
          value={receivedFromFactory}
          icon={ArrowDownLeft}
          trend={{ value: "15%", positive: true }}
        />
        <StatCard
          title="Paid to Farmers"
          value={paidToFarmers}
          icon={ArrowUpRight}
        />
        <StatCard
          title="Pending Amount"
          value={pendingAmount}
          icon={Wallet}
          trend={{ value: "5%", positive: false }}
        />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            className="pl-10 rounded-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-payments"
          />
        </div>
        <ViewToggle />
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="rounded-2xl hover-elevate" data-testid={`card-payment-${payment.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 hover:bg-primary/20 hover:scale-110">
                    {payment.type === "incoming" ? (
                      <ArrowDownLeft className="h-5 w-5 text-primary" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <Badge
                    variant={payment.status === "completed" ? "default" : "secondary"}
                    className="rounded-2xl"
                  >
                    {payment.status}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{payment.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice:</span>
                    <span className="font-medium">{payment.invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{payment.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge
                      variant={payment.type === "incoming" ? "default" : "secondary"}
                      className="rounded-2xl"
                    >
                      {payment.type === "incoming" ? (
                        <><ArrowDownLeft className="h-3 w-3 mr-1" /> Incoming</>
                      ) : (
                        <><ArrowUpRight className="h-3 w-3 mr-1" /> Outgoing</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date(payment.date).toLocaleDateString("en-IN")}</span>
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
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                  <TableCell className="font-medium">{payment.name}</TableCell>
                  <TableCell>{payment.invoice}</TableCell>
                  <TableCell className="font-medium">{payment.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={payment.type === "incoming" ? "default" : "secondary"}
                      className="rounded-2xl"
                    >
                      {payment.type === "incoming" ? (
                        <><ArrowDownLeft className="h-3 w-3 mr-1" /> Incoming</>
                      ) : (
                        <><ArrowUpRight className="h-3 w-3 mr-1" /> Outgoing</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={payment.status === "completed" ? "default" : "secondary"}
                      className="rounded-2xl"
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(payment.date).toLocaleDateString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
