import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, DollarSign, BarChart3, Settings, Package, Share2 } from "lucide-react";

const moreItems = [
  { title: "Stock", url: "/stock", icon: Package, description: "View and manage inventory stock" },
  { title: "Purchases", url: "/purchases", icon: ShoppingCart, description: "Manage all purchase records" },
  { title: "Charges", url: "/charges", icon: DollarSign, description: "Track additional charges and fees" },
  { title: "Reports", url: "/reports", icon: BarChart3, description: "View business analytics and reports" },
  { title: "Affiliate Program", url: "/affiliate", icon: Share2, description: "Earn by referring others" },
  { title: "Settings", url: "/settings", icon: Settings, description: "Configure application settings" },
];

export default function More() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">More</h1>
        <p className="text-muted-foreground mt-2">Additional features and settings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {moreItems.map((item) => (
          <Link key={item.title} href={item.url}>
            <Card className="rounded-2xl hover-elevate cursor-pointer transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
