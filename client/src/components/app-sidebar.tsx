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
import { Home, Users, ShoppingCart, FileText, Wallet, Receipt, BarChart3, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Dashboard", icon: Home, url: "/", group: "Overview" },
  { title: "Farmers", icon: Users, url: "/farmers", group: "Management" },
  { title: "Purchases", icon: ShoppingCart, url: "/purchases", group: "Management" },
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
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md hover:shadow-lg"
                            : "hover-elevate"
                        }`}
                        data-testid={`nav-${item.title.toLowerCase()}`}
                      >
                        <Link href={item.url}>
                          <item.icon className={`h-4 w-4 ${isActive ? "drop-shadow-sm" : ""}`} />
                          <span className={`font-medium ${isActive ? "font-semibold" : ""}`}>
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
        <div className="rounded-2xl bg-muted/50 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Active Farmers</span>
            <span className="text-sm font-bold text-primary">48</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Pending</span>
            <span className="text-sm font-bold text-accent">PKR 1.2L</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
