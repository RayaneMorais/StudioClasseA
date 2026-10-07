import { useState } from "react";
import {
  useListAlunos,
  useCreateAluno,
  useListTurmas,
  getListAlunosQueryKey,
  listAlunos,
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
import { Plus, Pencil, Download } from "lucide-react";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";

const statusColors: Record<string, string> = {
  Ativo: "bg-green-100 text-green-800",
  Inativo: "bg-gray-100 text-gray-600",
};

export default function Alunos() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [filtroStatus, setFiltroStatus] = useState<"all" | "Ativo" | "Inativo">("all");
  const [filtroTurma, setFiltroTurma] = useState<string>("all");

  const params: Record<string, string | number> = {};
  if (filtroStatus !== "all") params.status = filtroStatus;
  if (filtroTurma !== "all") params.turmaId = Number(filtroTurma);

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

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const todos = await listAlunos();
      const linhas = todos.map((a) => ({
        "Nome": a.nome,
        "Data de Nascimento": formatDate(a.dataNascimento),
        "Responsável": a.nomeResponsavel,
        "Telefone": a.telefoneResponsavel,
        "Turma": a.turmaDescricao ?? "",
        "Status": a.status,
      }));
      const ws = XLSX.utils.json_to_sheet(linhas);
      ws["!cols"] = [
        { wch: 30 }, { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 30 }, { wch: 10 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alunos");
      XLSX.writeFile(wb, `alunos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Cadastros</p>
            <h1 className="text-2xl font-bold text-gray-900">Alunas</h1>
            <p className="mt-1 text-sm text-gray-500">Gerencie as alunas matriculadas.</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" className="min-w-0 flex-1 sm:flex-none" onClick={handleExport} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{exporting ? "Exportando..." : "Exportar Excel"}</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Novo Aluno</span>
                <span className="sm:hidden">Novo</span>
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
                    autoComplete="name"
                    onChange={(e) => setForm({ ...form, nomeResponsavel: e.target.value })}
                    placeholder="Nome completo do responsável"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone do Responsável</Label>
                  <Input
                    value={form.telefoneResponsavel}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
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
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as "all" | "Ativo" | "Inativo")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroTurma} onValueChange={setFiltroTurma}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as turmas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              {turmas.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.descricao}
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
          <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
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
          <div className="grid gap-3 md:hidden">
            {alunos.map((aluno) => (
              <div key={aluno.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{aluno.nome}</p>
                    <p className="mt-1 text-xs text-gray-500">{aluno.turmaDescricao || "Sem turma"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[aluno.status]}`}>
                    {aluno.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs">
                  <div><p className="text-gray-400">Responsável</p><p className="mt-1 font-medium text-gray-700">{aluno.nomeResponsavel}</p></div>
                  <div><p className="text-gray-400">Telefone</p><p className="mt-1 font-medium text-gray-700">{aluno.telefoneResponsavel}</p></div>
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={() => setLocation(`/alunos/${aluno.id}`)}>
                  <Pencil className="mr-2 h-4 w-4" /> Abrir detalhes
                </Button>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </Layout>
  );
}
