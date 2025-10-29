import { Home, Users, FileText, CreditCard, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, DollarSign, BarChart3, Settings } from "lucide-react";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Farmers", url: "/farmers", icon: Users },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Payments", url: "/payments", icon: CreditCard },
];

const moreNavItems = [
  { title: "Purchases", url: "/purchases", icon: ShoppingCart },
  { title: "Charges", url: "/charges", icon: DollarSign },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <nav className="bg-card border border-card-border rounded-2xl shadow-lg backdrop-blur-lg p-2">
        <div className="flex items-center justify-around gap-1">
          {mainNavItems.map((item) => (
            <Link key={item.title} href={item.url}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "flex flex-col items-center justify-center h-auto py-2 px-3 rounded-xl",
                  location === item.url && "bg-primary/10 text-primary"
                )}
                data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.title}</span>
              </Button>
            </Link>
          ))}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col items-center justify-center h-auto py-2 px-3 rounded-xl"
                data-testid="mobile-nav-more"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-xs mt-1">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>More Options</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 py-4">
                {moreNavItems.map((item) => (
                  <Link key={item.title} href={item.url}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start rounded-xl",
                        location === item.url && "bg-primary/10 text-primary"
                      )}
                      data-testid={`sheet-nav-${item.title.toLowerCase()}`}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.title}
                    </Button>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
