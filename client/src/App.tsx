import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import Dashboard from "@/pages/dashboard";
import Farmers from "@/pages/farmers";
import Purchases from "@/pages/purchases";
import Invoices from "@/pages/invoices";
import InvoicePreview from "@/pages/invoice-preview";
import Payments from "@/pages/payments";
import Charges from "@/pages/charges";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/farmers" component={Farmers} />
      <Route path="/purchases" component={Purchases} />
      <Route path="/invoices/:id" component={InvoicePreview} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/payments" component={Payments} />
      <Route path="/charges" component={Charges} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="arhti-ui-theme">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full overflow-hidden">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="hidden md:flex items-center justify-between px-6 py-4 border-b shrink-0">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <header className="flex md:hidden items-center justify-between px-4 py-4 border-b shrink-0">
                  <h2 className="text-lg font-semibold">Arhti Business</h2>
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto px-4 md:px-6 py-6 pb-20 md:pb-6">
                  <div className="max-w-7xl mx-auto">
                    <Router />
                  </div>
                </main>
              </div>
            </div>
            <MobileNav />
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
