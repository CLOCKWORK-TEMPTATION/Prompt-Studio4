import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/Layout";

import Studio from "@/pages/Studio";
import Templates from "@/pages/Templates";
import Techniques from "@/pages/Techniques";
import Runs from "@/pages/Runs";
import Settings from "@/pages/Settings";
import Compare from "@/pages/Compare";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/studio" />} />
        <Route path="/studio" component={Studio} />
        <Route path="/templates" component={Templates} />
        <Route path="/techniques" component={Techniques} />
        <Route path="/compare" component={Compare} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/runs" component={Runs} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
