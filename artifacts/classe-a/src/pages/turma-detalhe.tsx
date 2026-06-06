import { useState, useEffect } from "react";
import {
  useGetTurma,
  useUpdateTurma,
  getGetTurmaQueryKey,
  getListTurmasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function TurmaDetalhe() {
  const [, params] = useRoute("/turmas/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: turma, isLoading } = useGetTurma(id, {
    query: { enabled: !!id, queryKey: getGetTurmaQueryKey(id) },
  });
  const updateTurma = useUpdateTurma();

  const [form, setForm] = useState({
    nome: "",
    professor: "",
    diasSemana: "",
    horario: "",
    status: "Ativa" as "Ativa" | "Suspensa" | "Fechada",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (turma) {
      setForm({
        nome: turma.nome,
        professor: turma.professor,
        diasSemana: turma.diasSemana,
        horario: turma.horario,
        status: turma.status as "Ativa" | "Suspensa" | "Fechada",
      });
    }
  }, [turma]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTurma.mutate(
      { id, data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTurmaQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListTurmasQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  if (isLoading) return <Layout><div className="p-8">Carregando...</div></Layout>;
  if (!turma) return <Layout><div className="p-8 text-gray-500">Turma não encontrada.</div></Layout>;

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto">
        <button
          onClick={() => setLocation("/turmas")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Turmas
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Editar Turma</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Turma</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professor">Professor(a)</Label>
              <Input
                id="professor"
                value={form.professor}
                onChange={(e) => setForm({ ...form, professor: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diasSemana">Dias da Semana</Label>
              <Input
                id="diasSemana"
                value={form.diasSemana}
                onChange={(e) => setForm({ ...form, diasSemana: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario">Horário</Label>
              <Input
                id="horario"
                value={form.horario}
                onChange={(e) => setForm({ ...form, horario: e.target.value })}
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

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={updateTurma.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateTurma.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
              </Button>
              {updateTurma.isError && (
                <p className="text-sm text-red-500 text-center mt-2">Erro ao salvar alterações.</p>
              )}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">Descrição: {turma.descricao}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
