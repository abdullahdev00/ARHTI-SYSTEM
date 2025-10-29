import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl" data-testid="button-export-pdf">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="rounded-2xl" data-testid="button-export-excel">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-muted rounded-2xl">
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold mt-1">PKR 2,45,000</p>
            </div>
            <div className="p-4 bg-muted rounded-2xl">
              <p className="text-sm text-muted-foreground">Total Commission</p>
              <p className="text-2xl font-bold mt-1">PKR 12,250</p>
            </div>
            <div className="p-4 bg-muted rounded-2xl">
              <p className="text-sm text-muted-foreground">Total Charges</p>
              <p className="text-2xl font-bold mt-1">PKR 8,500</p>
            </div>
            <div className="p-4 bg-muted rounded-2xl">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className="text-2xl font-bold mt-1 text-primary">PKR 3,750</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Top Performing Crops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { crop: "Wheat", amount: "PKR 85,000", percentage: 35 },
                { crop: "Rice", amount: "PKR 65,000", percentage: 27 },
                { crop: "Bajra", amount: "PKR 55,000", percentage: 22 },
                { crop: "Cotton", amount: "PKR 40,000", percentage: 16 },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.crop}</span>
                    <span className="text-muted-foreground">{item.amount}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Charges Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "Labor", amount: "PKR 4,200", percentage: 50 },
                { type: "Transport", amount: "PKR 2,800", percentage: 33 },
                { type: "Miscellaneous", amount: "PKR 1,500", percentage: 17 },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.type}</span>
                    <span className="text-muted-foreground">{item.amount}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-chart-2 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
