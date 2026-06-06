import { useState } from "react";
import {
  useListAlunos,
  useCreateAluno,
  useListTurmas,
  getListAlunosQueryKey,
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
import { Plus, Pencil } from "lucide-react";
import { useLocation } from "wouter";

const statusColors: Record<string, string> = {
  Ativo: "bg-green-100 text-green-800",
  Inativo: "bg-gray-100 text-gray-600",
};

export default function Alunos() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [filtroStatus, setFiltroStatus] = useState<"" | "Ativo" | "Inativo">("");
  const [filtroTurma, setFiltroTurma] = useState<string>("");

  const params: Record<string, string | number> = {};
  if (filtroStatus) params.status = filtroStatus;
  if (filtroTurma) params.turmaId = Number(filtroTurma);

  const { data: alunos = [], isLoading } = useListAlunos(
    Object.keys(params).length > 0 ? params : undefined
  );
  const { data: turmas = [] } = useListTurmas();
  const createAluno = useCreateAluno();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    dataNascimento: "",
    nomeResponsavel: "",
    telefoneResponsavel: "",
    turmaId: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.turmaId) return;
    createAluno.mutate(
      { data: { ...form, turmaId: Number(form.turmaId) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAlunosQueryKey() });
          setOpen(false);
          setForm({ nome: "", dataNascimento: "", nomeResponsavel: "", telefoneResponsavel: "", turmaId: 0 });
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie os alunos matriculados</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Aluno</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome do Aluno</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome completo"
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
                    placeholder="Nome completo do responsável"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone do Responsável</Label>
                  <Input
                    value={form.telefoneResponsavel}
                    onChange={(e) => setForm({ ...form, telefoneResponsavel: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Turma</Label>
                  <Select
                    value={String(form.turmaId || "")}
                    onValueChange={(v) => setForm({ ...form, turmaId: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a turma" />
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
                <Button type="submit" className="w-full" disabled={createAluno.isPending || !form.turmaId}>
                  {createAluno.isPending ? "Salvando..." : "Cadastrar Aluno"}
                </Button>
                {createAluno.isError && (
                  <p className="text-sm text-red-500 text-center">Erro ao cadastrar aluno.</p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 mb-6">
          <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as "" | "Ativo" | "Inativo")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroTurma} onValueChange={setFiltroTurma}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as turmas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as turmas</SelectItem>
              {turmas.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-gray-500">Carregando alunos...</div>
        ) : alunos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhum aluno encontrado.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Nome</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Nascimento</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Responsável</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Turma</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{aluno.nome}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(aluno.dataNascimento)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>{aluno.nomeResponsavel}</div>
                      <div className="text-xs text-gray-400">{aluno.telefoneResponsavel}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{aluno.turmaDescricao}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[aluno.status]}`}
                      >
                        {aluno.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/alunos/${aluno.id}`)}
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
