import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ViewModeProvider } from "@/hooks/use-view-mode";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { UserProfile } from "@/components/user-profile";
import Dashboard from "@/pages/dashboard";
import Farmers from "@/pages/farmers";
import Purchases from "@/pages/purchases";
import Stock from "@/pages/stock";
import Invoices from "@/pages/invoices";
import InvoicePreview from "@/pages/invoice-preview";
import Payments from "@/pages/payments";
import Charges from "@/pages/charges";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import More from "@/pages/more";
import Affiliate from "@/pages/affiliate";
import Signup from "@/pages/signup";
import Signin from "@/pages/signin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/farmers" component={Farmers} />
      <Route path="/purchases" component={Purchases} />
      <Route path="/stock" component={Stock} />
      <Route path="/invoices/:id" component={InvoicePreview} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/payments" component={Payments} />
      <Route path="/charges" component={Charges} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/more" component={More} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/signup" component={Signup} />
      <Route path="/signin" component={Signin} />
      <Route component={NotFound} />
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
        <ViewModeProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full overflow-hidden">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="hidden md:flex items-center justify-between px-6 py-3 border-b shrink-0 bg-background/95 backdrop-blur-lg">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                  </div>
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <UserProfile />
                  </div>
                </header>
                <header className="flex md:hidden items-center justify-between px-4 py-3 border-b shrink-0 bg-background/95 backdrop-blur-lg">
                  <h2 className="text-lg font-semibold">Arhti Business</h2>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <UserProfile />
                  </div>
                </header>
                <main className="flex-1 overflow-auto px-4 md:px-6 py-6 pb-28 md:pb-6">
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
        </ViewModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
