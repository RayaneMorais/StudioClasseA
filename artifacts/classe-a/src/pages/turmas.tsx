import { useState } from "react";
import {
  useListTurmas,
  useCreateTurma,
  getListTurmasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { useLocation } from "wouter";

const statusColors: Record<string, string> = {
  Ativa: "bg-green-100 text-green-800",
  Suspensa: "bg-yellow-100 text-yellow-800",
  Fechada: "bg-red-100 text-red-800",
};

export default function Turmas() {
  const { data: turmas = [], isLoading } = useListTurmas();
  const createTurma = useCreateTurma();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    professor: "",
    diasSemana: "",
    horario: "",
    status: "Ativa" as "Ativa" | "Suspensa" | "Fechada",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTurma.mutate(
      { data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTurmasQueryKey() });
          setOpen(false);
          setForm({ nome: "", professor: "", diasSemana: "", horario: "", status: "Ativa" });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie as turmas da escola</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Turma</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Turma</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Ballet Iniciante"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professor">Professor(a)</Label>
                  <Input
                    id="professor"
                    value={form.professor}
                    onChange={(e) => setForm({ ...form, professor: e.target.value })}
                    placeholder="Nome do professor"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diasSemana">Dias da Semana</Label>
                  <Input
                    id="diasSemana"
                    value={form.diasSemana}
                    onChange={(e) => setForm({ ...form, diasSemana: e.target.value })}
                    placeholder="Ex: Segunda e Quarta"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario">Horário</Label>
                  <Input
                    id="horario"
                    value={form.horario}
                    onChange={(e) => setForm({ ...form, horario: e.target.value })}
                    placeholder="Ex: 14h00 - 15h30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as "Ativa" | "Suspensa" | "Fechada" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativa">Ativa</SelectItem>
                      <SelectItem value="Suspensa">Suspensa</SelectItem>
                      <SelectItem value="Fechada">Fechada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createTurma.isPending}>
                  {createTurma.isPending ? "Salvando..." : "Criar Turma"}
                </Button>
                {createTurma.isError && (
                  <p className="text-sm text-red-500 text-center">Erro ao criar turma.</p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-gray-500">Carregando turmas...</div>
        ) : turmas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhuma turma cadastrada.</p>
            <p className="text-sm mt-1">Clique em "Nova Turma" para começar.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Nome</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Professor(a)</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Dias / Horário</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turmas.map((turma) => (
                  <tr key={turma.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{turma.nome}</td>
                    <td className="px-6 py-4 text-gray-600">{turma.professor}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {turma.diasSemana} · {turma.horario}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[turma.status]}`}
                      >
                        {turma.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/turmas/${turma.id}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
