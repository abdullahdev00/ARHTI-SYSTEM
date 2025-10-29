import { useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Palette } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const businessData = {
  fullName: "Muhammad Ali",
  email: "muhammad.ali@business.pk",
  phone: "+92 300 1234567",
  businessName: "Ali Trading Company",
  address: "Mandi Road, Muzaffargarh, Punjab",
  registrationNo: "REG-2024-001",
};

export default function InvoicePreview() {
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = params?.id || "INV-001";
  const [printMode, setPrintMode] = useState<"color" | "bw">("color");

  const invoice = {
    id: invoiceId,
    invoiceNumber: `RBZFBV-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
    date: "2024-10-27",
    dueDate: "2024-11-25",
    farmer: {
      name: "Ram Singh",
      phone: "03001234567",
      address: "Village Kot Addu, Muzaffargarh, Punjab",
    },
    items: [
      { 
        description: "Wheat (40kg bags)", 
        dateRange: "Oct 20 - Oct 27, 2024",
        quantity: 500, 
        rate: 25, 
        amount: 12500,
        discount: 0
      },
      { 
        description: "Rice (60kg bags)", 
        dateRange: "Oct 20 - Oct 27, 2024",
        quantity: 200, 
        rate: 35, 
        amount: 7000,
        discount: 0
      },
    ],
    subtotal: 19500,
    commission: 975,
    charges: 500,
    amountDue: 18025,
    status: "paid",
  };

  const handlePrint = (mode: "color" | "bw") => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownload = () => {
    console.log("Download PDF triggered");
  };

  const isColorMode = printMode === "color";

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          body { 
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .print\\:p-8 {
            padding: 2rem !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          .print-bw * {
            color: black !important;
            background: white !important;
            border-color: #e5e7eb !important;
          }
          .print-bw .watermark {
            color: #9ca3af !important;
          }
        }
      `}</style>

      <div className="print:hidden sticky top-0 z-50 bg-background border-b backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon" className="rounded-2xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-2xl">
                    <Palette className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl">
                  <DropdownMenuItem onClick={() => handlePrint("color")} className="cursor-pointer">
                    <Printer className="mr-2 h-4 w-4" />
                    Print (Color)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrint("bw")} className="cursor-pointer">
                    <Printer className="mr-2 h-4 w-4" />
                    Print (Black & White)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                className="rounded-2xl"
                onClick={() => handlePrint("color")}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 print:p-0">
        <Card className={`rounded-2xl shadow-xl print:shadow-none print:border-none print:rounded-none transition-all duration-300 print:max-w-none ${printMode === "bw" ? "print-bw" : ""}`}>
          <CardContent className="p-8 md:p-12 print:p-8">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{businessData.businessName}</h1>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{businessData.fullName}</p>
                  <p className="text-muted-foreground">{businessData.email}</p>
                  <p className="text-muted-foreground">{businessData.phone}</p>
                  <p className="text-muted-foreground mt-2">{businessData.address}</p>
                  <p className="text-muted-foreground">Registration: {businessData.registrationNo}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-muted-foreground">INVOICE</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold mb-2">Bill to:</h3>
                <div className="text-sm">
                  <p className="font-medium">{invoice.farmer.name}</p>
                  <p className="text-muted-foreground">{invoice.farmer.phone}</p>
                  <p className="text-muted-foreground">{invoice.farmer.address}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice number</span>
                  <span className="font-medium">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice date</span>
                  <span className="font-medium">
                    {new Date(invoice.date).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due date</span>
                  <span className="font-medium">
                    {new Date(invoice.dueDate).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-semibold">Amount due</span>
                  <span className="font-bold">Rs {invoice.amountDue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3 text-sm font-semibold text-muted-foreground">Description</th>
                    <th className="text-right py-3 text-sm font-semibold text-muted-foreground">Quantity</th>
                    <th className="text-right py-3 text-sm font-semibold text-muted-foreground">Rate</th>
                    <th className="text-right py-3 text-sm font-semibold text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.dateRange}</p>
                        </div>
                      </td>
                      <td className="py-4 text-right text-sm">{item.quantity.toLocaleString()}</td>
                      <td className="py-4 text-right text-sm">Rs {item.rate.toLocaleString()}</td>
                      <td className="py-4 text-right text-sm font-medium">
                        Rs {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {invoice.items.map((item, idx) => 
                    item.discount > 0 ? (
                      <tr key={`discount-${idx}`}>
                        <td className="py-2 pl-6 text-sm text-muted-foreground" colSpan={3}>
                          Discount
                        </td>
                        <td className="py-2 text-right text-sm">
                          Rs {item.discount.toLocaleString()}
                        </td>
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">Rs {invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-t">
                  <span className="font-semibold">Amount due</span>
                  <span className="font-bold">Rs {invoice.amountDue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold mb-2">Memo:</p>
              <div className="min-h-[60px] border-b"></div>
            </div>

            <div className="mt-16 pt-6 border-t">
              <div className="watermark text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold">{businessData.businessName} - POS System</p>
                <p>Contact: {businessData.email} | {businessData.phone}</p>
                <p className="text-xs">Powered by Mandi Management System</p>
              </div>
            </div>

            <div className="print:hidden mt-6 flex items-center justify-between p-4 bg-muted rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={invoice.status === "paid" ? "default" : "secondary"}
                  className="rounded-full"
                >
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Page 1 of 1
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
