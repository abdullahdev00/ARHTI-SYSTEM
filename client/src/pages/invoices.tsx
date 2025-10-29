import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, LayoutGrid, List } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);

  const filteredInvoices = mockInvoices.filter(invoice =>
    invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.farmer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Invoices</h1>
        <Button className="rounded-2xl shrink-0" data-testid="button-create-invoice">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-10 rounded-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-invoices"
          />
        </div>
        <div className="flex gap-2 shrink-0">
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
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="rounded-2xl hover-elevate" data-testid={`card-invoice-${invoice.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{invoice.id}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{invoice.farmer}</p>
                  </div>
                  <Badge
                    variant={invoice.status === "paid" ? "default" : "secondary"}
                    className="rounded-2xl"
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(invoice.date).toLocaleDateString("en-PK")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">{invoice.total}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Net Payable</p>
                  <p className="text-lg font-bold text-primary">{invoice.netPayable}</p>
                </div>
                <Link href={`/invoices/${invoice.id}`}>
                  <Button variant="outline" className="w-full rounded-2xl" data-testid={`button-view-${invoice.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Invoice
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
