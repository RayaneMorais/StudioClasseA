import { useState, useEffect } from "react";
import {
  useGetAluno,
  useUpdateAluno,
  useListTurmas,
  getGetAlunoQueryKey,
  getListAlunosQueryKey,
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
import { ArrowLeft, Save, UserX } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function AlunoDetalhe() {
  const [, params] = useRoute("/alunos/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: aluno, isLoading } = useGetAluno(id, {
    query: { enabled: !!id, queryKey: getGetAlunoQueryKey(id) },
  });
  const { data: turmas = [] } = useListTurmas();
  const updateAluno = useUpdateAluno();

  const [form, setForm] = useState({
    nome: "",
    dataNascimento: "",
    nomeResponsavel: "",
    telefoneResponsavel: "",
    turmaId: 0,
    status: "Ativo" as "Ativo" | "Inativo",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (aluno) {
      setForm({
        nome: aluno.nome,
        dataNascimento: aluno.dataNascimento,
        nomeResponsavel: aluno.nomeResponsavel,
        telefoneResponsavel: aluno.telefoneResponsavel,
        turmaId: aluno.turmaId,
        status: aluno.status as "Ativo" | "Inativo",
      });
    }
  }, [aluno]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAluno.mutate(
      { id, data: { ...form, turmaId: Number(form.turmaId) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAlunoQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListAlunosQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  const handleInativar = () => {
    if (!confirm("Tem certeza que deseja inativar este aluno?")) return;
    updateAluno.mutate(
      { id, data: { status: "Inativo" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAlunoQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListAlunosQueryKey() });
          setForm((f) => ({ ...f, status: "Inativo" }));
        },
      }
    );
  };

  if (isLoading) return <Layout><div className="p-8">Carregando...</div></Layout>;
  if (!aluno) return <Layout><div className="p-8 text-gray-500">Aluno não encontrado.</div></Layout>;

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto">
        <button
          onClick={() => setLocation("/alunos")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Alunos
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Editar Aluno</h1>
            {form.status === "Ativo" && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleInativar}
                disabled={updateAluno.isPending}
              >
                <UserX className="w-4 h-4 mr-2" />
                Inativar Aluno
              </Button>
            )}
          </div>

          {form.status === "Inativo" && (
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600">
              Este aluno está <strong>Inativo</strong>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Aluno</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={form.dataNascimento}
                onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Responsável</Label>
              <Input
                value={form.nomeResponsavel}
                onChange={(e) => setForm({ ...form, nomeResponsavel: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone do Responsável</Label>
              <Input
                value={form.telefoneResponsavel}
                onChange={(e) => setForm({ ...form, telefoneResponsavel: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select
                value={String(form.turmaId)}
                onValueChange={(v) => setForm({ ...form, turmaId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={updateAluno.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateAluno.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
              </Button>
              {updateAluno.isError && (
                <p className="text-sm text-red-500 text-center mt-2">Erro ao salvar.</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
