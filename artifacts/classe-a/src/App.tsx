import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Turmas from "./pages/turmas";
import TurmaDetalhe from "./pages/turma-detalhe";
import Alunos from "./pages/alunos";
import AlunoDetalhe from "./pages/aluno-detalhe";
import Mensalidades from "./pages/mensalidades";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation("/login");
    }
  }, [user, isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/turmas/:id">
        <ProtectedRoute component={TurmaDetalhe} />
      </Route>
      <Route path="/turmas">
        <ProtectedRoute component={Turmas} />
      </Route>
      <Route path="/alunos/:id">
        <ProtectedRoute component={AlunoDetalhe} />
      </Route>
      <Route path="/alunos">
        <ProtectedRoute component={Alunos} />
      </Route>
      <Route path="/mensalidades">
        <ProtectedRoute component={Mensalidades} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
