import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye } from "lucide-react";
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

const mockInvoices = [
  { id: "INV-001", farmer: "Ram Singh", date: "2024-10-27", total: "₹12,500", commission: "₹625", netPayable: "₹11,875", status: "paid" },
  { id: "INV-002", farmer: "Mohan Kumar", date: "2024-10-26", total: "₹10,500", commission: "₹525", netPayable: "₹9,975", status: "unpaid" },
  { id: "INV-003", farmer: "Vijay Sharma", date: "2024-10-25", total: "₹8,800", commission: "₹440", netPayable: "₹8,360", status: "paid" },
];

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);

  const filteredInvoices = mockInvoices.filter(invoice =>
    invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.farmer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Invoices</h1>
        <Button className="rounded-2xl" data-testid="button-create-invoice">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          className="pl-10 rounded-2xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-invoices"
        />
      </div>

      <Card className="rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Farmer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Net Payable</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.farmer}</TableCell>
                <TableCell>{new Date(invoice.date).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>{invoice.total}</TableCell>
                <TableCell>{invoice.commission}</TableCell>
                <TableCell className="font-medium">{invoice.netPayable}</TableCell>
                <TableCell>
                  <Badge
                    variant={invoice.status === "paid" ? "default" : "secondary"}
                    className="rounded-2xl"
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-2xl"
                        onClick={() => setSelectedInvoice(invoice)}
                        data-testid={`button-view-${invoice.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Invoice Details</DialogTitle>
                      </DialogHeader>
                      {selectedInvoice && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Invoice ID</p>
                              <p className="font-medium">{selectedInvoice.id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Farmer</p>
                              <p className="font-medium">{selectedInvoice.farmer}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-medium">{new Date(selectedInvoice.date).toLocaleDateString("en-IN")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <Badge variant={selectedInvoice.status === "paid" ? "default" : "secondary"} className="rounded-2xl">
                                {selectedInvoice.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Amount:</span>
                              <span className="font-medium">{selectedInvoice.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Commission (5%):</span>
                              <span className="font-medium">-{selectedInvoice.commission}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                              <span>Net Payable:</span>
                              <span>{selectedInvoice.netPayable}</span>
                            </div>
                          </div>
                          {selectedInvoice.status === "unpaid" && (
                            <Button className="w-full rounded-2xl" data-testid="button-mark-paid">
                              Mark as Paid
                            </Button>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
