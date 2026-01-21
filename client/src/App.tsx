import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import Home from "@/pages/home";
import Editor from "@/pages/editor";
import ManualEditorPage from "@/pages/manual-editor-page";
import Generate from "@/pages/generate";
import Account from "@/pages/account";
import Pricing from "@/pages/pricing";
import Examples from "@/pages/examples";
import Login from "@/pages/login";
import BuyCredits from "@/pages/buy-credits";
import PaymentSuccess from "@/pages/payment-success";
import Admin from "@/pages/admin";
import Terms from "@/pages/terms";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/editor/:id" component={Editor} />
      <Route path="/manual-editor" component={ManualEditorPage} />
      <Route path="/manual-editor/:id" component={ManualEditorPage} />
      <Route path="/generate" component={Generate} />
      <Route path="/account" component={Account} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/examples" component={Examples} />
      <Route path="/login" component={Login} />
      <Route path="/buy-credits" component={BuyCredits} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/admin" component={Admin} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <TooltipProvider>
            <ScrollToTop />
            <Toaster />
            <Router />
          </TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
