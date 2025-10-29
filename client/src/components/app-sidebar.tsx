import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Home, Users, ShoppingCart, FileText, Wallet, Receipt, BarChart3, Settings, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Dashboard", icon: Home, url: "/", group: "Overview" },
  { title: "Farmers", icon: Users, url: "/farmers", group: "Management" },
  { title: "Purchases", icon: ShoppingCart, url: "/purchases", group: "Management" },
  { title: "Stock", icon: Package, url: "/stock", group: "Management" },
  { title: "Invoices", icon: FileText, url: "/invoices", group: "Management" },
  { title: "Payments", icon: Wallet, url: "/payments", group: "Finance" },
  { title: "Charges", icon: Receipt, url: "/charges", group: "Finance" },
  { title: "Reports", icon: BarChart3, url: "/reports", group: "Analytics" },
  { title: "Settings", icon: Settings, url: "/settings", group: "System" },
];

const groups = [
  { name: "Overview", items: menuItems.filter(i => i.group === "Overview") },
  { name: "Management", items: menuItems.filter(i => i.group === "Management") },
  { name: "Finance", items: menuItems.filter(i => i.group === "Finance") },
  { name: "Analytics", items: menuItems.filter(i => i.group === "Analytics") },
  { name: "System", items: menuItems.filter(i => i.group === "System") },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r backdrop-blur-lg">
      <SidebarHeader className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Arhti Business</h2>
            <p className="text-xs text-muted-foreground">Mandi Management</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Today's Commission</span>
            <Badge variant="secondary" className="rounded-full text-xs font-semibold">
              PKR 2,450
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {groups.map((group) => (
          <SidebarGroup key={group.name}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
              {group.name}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : "hover:bg-accent"
                        }`}
                        data-testid={`nav-${item.title.toLowerCase()}`}
                      >
                        <Link href={item.url}>
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          <span className={`font-medium ${isActive ? "font-semibold text-primary" : ""}`}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="rounded-2xl bg-muted/50 p-3">
          <p className="text-xs text-center text-muted-foreground">Arhti Business v1.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
