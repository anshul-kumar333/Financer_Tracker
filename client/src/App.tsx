import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AddTransaction from "@/pages/add-transaction";
import Analytics from "@/pages/analytics";
import Reminders from "@/pages/reminders";
import AuthPage from "@/pages/auth-page";
import Layout from "@/components/layout";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ReminderNotificationContainer } from "./components/notification";
import { PwaInstallPrompt, PwaUpdatePrompt } from "./components/pwa-install-prompt";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/add" component={AddTransaction} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/reminders" component={Reminders} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Router />
          {!isOnline && (
            <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 text-center text-sm">
              You are currently offline. Some features may be limited.
            </div>
          )}
        </Layout>
        <ReminderNotificationContainer />
        <PwaInstallPrompt />
        <PwaUpdatePrompt />
        <Toaster />
      </AuthProvider>

    </QueryClientProvider>
  );
}

export default App;