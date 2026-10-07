import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [_, setLocation] = useLocation();
  
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, senha } }, {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf9fb] p-4 sm:p-6">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Studio Classe A"
            className="mx-auto mb-3 h-28 w-28 object-contain"
          />
          <h1 className="text-lg font-bold tracking-widest text-gray-700 uppercase">Studio Classe A</h1>
          <p className="text-sm text-gray-400 mt-1">Acesso restrito</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input 
              id="senha" 
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-4" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
          
          {loginMutation.isError && (
            <p className="text-sm text-red-500 text-center mt-2">Credenciais inválidas</p>
          )}
        </form>
      </div>
    </div>
  );
}
