import { Home, Users, FileText, CreditCard, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Farmers", url: "/farmers", icon: Users },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "More", url: "/more", icon: MoreHorizontal },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden animate-fade-in-up">
      <nav className="bg-card/95 border border-card-border rounded-2xl shadow-xl backdrop-blur-lg p-2">
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
        </div>
      </nav>
    </div>
  );
}
