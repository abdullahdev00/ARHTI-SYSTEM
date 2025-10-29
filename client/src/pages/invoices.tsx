import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye } from "lucide-react";
import { Link } from "wouter";
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
  { id: "INV-001", farmer: "Ram Singh", date: "2024-10-27", total: "Rs 12,500", commission: "Rs 625", netPayable: "Rs 11,875", status: "paid" },
  { id: "INV-002", farmer: "Mohan Kumar", date: "2024-10-26", total: "Rs 10,500", commission: "Rs 525", netPayable: "Rs 9,975", status: "unpaid" },
  { id: "INV-003", farmer: "Vijay Sharma", date: "2024-10-25", total: "Rs 8,800", commission: "Rs 440", netPayable: "Rs 8,360", status: "paid" },
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
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
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-2xl"
                      data-testid={`button-view-${invoice.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
