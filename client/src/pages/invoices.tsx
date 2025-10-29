import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Download, FileText } from "lucide-react";
import { Link } from "wouter";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewToggle } from "@/components/view-toggle";
import { PageFilter, type FilterOption } from "@/components/page-filter";
import { getMockData } from "@shared/schema";
import { generatePurchaseInvoice } from "@/lib/pdf-generator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const invoiceFilters: FilterOption[] = [
  {
    id: "status",
    label: "Payment Status",
    options: [
      { value: "paid", label: "Paid" },
      { value: "unpaid", label: "Unpaid" },
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
  {
    id: "amount",
    label: "Amount Range",
    options: [
      { value: "low", label: "< Rs 10,000" },
      { value: "medium", label: "Rs 10,000 - 50,000" },
      { value: "high", label: "> Rs 50,000" },
    ],
  },
];

export default function Invoices() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const mockData = getMockData();
  const mockInvoices = mockData.invoices;

  const handleDownloadInvoice = (invoice: typeof mockInvoices[0]) => {
    const total = parseFloat(invoice.total.replace(/[^\d.]/g, ''));
    const commission = parseFloat(invoice.commission.replace(/[^\d.]/g, ''));
    const netPayable = parseFloat(invoice.netPayable.replace(/[^\d.]/g, ''));
    
    const invoiceData = {
      id: invoice.id,
      farmer: invoice.farmer,
      items: [
        {
          description: "Mixed Crops",
          dateRange: new Date(invoice.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) + ' - ' + new Date().toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }),
          quantity: 700,
          rate: parseFloat((total / 700).toFixed(2)),
          amount: total
        }
      ],
      purchaseTotal: total,
      charges: [],
      totalCharges: commission,
      grandTotal: netPayable,
      date: invoice.date
    };
    
    generatePurchaseInvoice(invoiceData, "download");
  };

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.farmer.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilters = true;
    
    if (activeFilters.status && activeFilters.status.length > 0) {
      matchesFilters = matchesFilters && activeFilters.status.includes(invoice.status);
    }
    
    if (activeFilters.date && activeFilters.date.length > 0) {
      const invoiceDate = new Date(invoice.date);
      const today = new Date();
      const matchesDateFilter = activeFilters.date.some(filter => {
        if (filter === 'today') {
          return invoiceDate.toDateString() === today.toDateString();
        }
        if (filter === 'thisWeek') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return invoiceDate >= weekAgo;
        }
        if (filter === 'thisMonth') {
          return invoiceDate.getMonth() === today.getMonth() && 
                 invoiceDate.getFullYear() === today.getFullYear();
        }
        if (filter === 'older') {
          const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
          return invoiceDate < monthAgo;
        }
        return true;
      });
      matchesFilters = matchesFilters && matchesDateFilter;
    }
    
    if (activeFilters.amount && activeFilters.amount.length > 0) {
      const total = parseFloat(invoice.total.replace(/[^\d.]/g, ''));
      const matchesAmountFilter = activeFilters.amount.some(filter => {
        if (filter === 'low') return total < 10000;
        if (filter === 'medium') return total >= 10000 && total <= 50000;
        if (filter === 'high') return total > 50000;
        return true;
      });
      matchesFilters = matchesFilters && matchesAmountFilter;
    }
    
    return matchesSearch && matchesFilters;
  });

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
            placeholder="Search invoices by ID or farmer name..."
            className="pl-10 rounded-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-invoices"
          />
        </div>
        <PageFilter filters={invoiceFilters} onFilterChange={setActiveFilters} />
        <ViewToggle />
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="rounded-2xl hover-elevate" data-testid={`card-invoice-${invoice.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg">{invoice.id}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{invoice.farmer}</p>
                  </div>
                  <Badge
                    variant={invoice.status === "paid" ? "default" : "secondary"}
                    className="rounded-full text-xs px-3"
                  >
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Invoice Date</span>
                    <span className="font-medium">
                      {new Date(invoice.date).toLocaleDateString("en-PK", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{invoice.total}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Commission</span>
                    <span className="font-medium text-amber-600 dark:text-amber-500">
                      -{invoice.commission}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold">Net Payable</span>
                    <span className="text-xl font-bold text-primary">{invoice.netPayable}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/invoices/${invoice.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-2xl transition-all active:scale-95" data-testid={`button-view-${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      variant="default" 
                      size="icon" 
                      className="rounded-2xl transition-all active:scale-95"
                      onClick={() => handleDownloadInvoice(invoice)}
                      data-testid={`button-download-${invoice.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Invoice ID</TableHead>
                <TableHead className="font-semibold">Farmer</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-right">Subtotal</TableHead>
                <TableHead className="font-semibold text-right">Commission</TableHead>
                <TableHead className="font-semibold text-right">Net Payable</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="group" data-testid={`row-invoice-${invoice.id}`}>
                  <TableCell className="font-bold">{invoice.id}</TableCell>
                  <TableCell className="font-medium">{invoice.farmer}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.date).toLocaleDateString("en-PK", {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right font-medium">{invoice.total}</TableCell>
                  <TableCell className="text-right font-medium text-amber-600 dark:text-amber-500">
                    -{invoice.commission}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">{invoice.netPayable}</TableCell>
                  <TableCell>
                    <Badge
                      variant={invoice.status === "paid" ? "default" : "secondary"}
                      className="rounded-full text-xs px-3"
                    >
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-2xl h-8 w-8 transition-all active:scale-95"
                          data-testid={`button-view-${invoice.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-2xl h-8 w-8 transition-all active:scale-95"
                        onClick={() => handleDownloadInvoice(invoice)}
                        data-testid={`button-download-${invoice.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredInvoices.length === 0 && (
        <Card className="rounded-2xl p-12">
          <div className="text-center space-y-3">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No invoices found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || Object.keys(activeFilters).length > 0
                ? "Try adjusting your search or filters"
                : "Create your first invoice to get started"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
