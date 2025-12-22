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
import Analytics from "@/pages/Analytics";
import AdvancedEditor from "@/pages/AdvancedEditor";
import Collaboration from "@/pages/Collaboration";
import SDKGenerator from "@/pages/SDKGenerator";
import CloudDeployment from "@/pages/CloudDeployment";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/studio" />} />
        <Route path="/studio" component={Studio} />
        <Route path="/advanced-editor" component={AdvancedEditor} />
        <Route path="/collaboration" component={Collaboration} />
        <Route path="/templates" component={Templates} />
        <Route path="/techniques" component={Techniques} />
        <Route path="/runs" component={Runs} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/sdk-generator" component={SDKGenerator} />
        <Route path="/cloud-deployment" component={CloudDeployment} />
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
