import { useState } from "react";
import {
  useListMensalidades,
  useUpdateMensalidade,
  useCreateMensalidade,
  useListAlunos,
  useGetMe,
  getListMensalidadesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, Clock, Plus } from "lucide-react";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TIPOS = [
  { value: "Matricula", label: "Matrícula" },
  { value: "RoupaDeBalett", label: "Roupa de Ballet" },
  { value: "Outros", label: "Outros" },
];

const TIPO_LABEL: Record<string, string> = {
  Matricula: "Matrícula",
  RoupaDeBalett: "Roupa de Ballet",
  Outros: "Outros",
};

function formatBRL(val: string | number | null | undefined) {
  if (val === null || val === undefined || val === "") return "—";
  return `R$ ${Number(val).toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

export default function Cobranças() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  const isAtendente = me?.role === "atendente";
  const now = new Date();

  const [filtroMes, setFiltroMes] = useState(String(now.getMonth() + 1));
  const [filtroAno, setFiltroAno] = useState(String(now.getFullYear()));
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState("all");

  const params: Record<string, string | number> = {
    mes: Number(filtroMes),
    ano: Number(filtroAno),
  };
  if (filtroTipo !== "all") params.tipo = filtroTipo;
  if (filtroStatus !== "all") params.status = filtroStatus;

  const { data: cobranças = [], isLoading } = useListMensalidades(params);
  const cobrançasFiltradas = cobranças.filter(
    (c) => c.tipo !== "Mensalidade"
  );

  const { data: alunos = [] } = useListAlunos({ status: "Ativo" });
  const updateCobrança = useUpdateMensalidade();
  const createCobrança = useCreateMensalidade();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    alunoId: "",
    tipo: "Matricula",
    descricao: "",
    valor: "",
    mes: String(now.getMonth() + 1),
    ano: String(now.getFullYear()),
  });

  function invalidateList() {
    queryClient.invalidateQueries({ queryKey: getListMensalidadesQueryKey() });
  }

  function handleToggleStatus(id: number, status: string) {
    const novoStatus = status === "Pago" ? "Pendente" : "Pago";
    const dataPagamento = novoStatus === "Pago"
      ? new Date().toISOString().split("T")[0]
      : null;
    updateCobrança.mutate(
      { id, data: { status: novoStatus as "Pago" | "Pendente", dataPagamento } },
      { onSuccess: invalidateList }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.alunoId || !form.tipo) return;
    createCobrança.mutate(
      {
        data: {
          alunoId: Number(form.alunoId),
          tipo: form.tipo as "Matricula" | "RoupaDeBalett" | "Outros",
          descricao: form.descricao || undefined,
          valor: form.valor ? Number(form.valor) : undefined,
          mes: Number(form.mes),
          ano: Number(form.ano),
          status: "Pendente",
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ alunoId: "", tipo: "Matricula", descricao: "", valor: "", mes: String(now.getMonth() + 1), ano: String(now.getFullYear()) });
          invalidateList();
        },
      }
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cobranças</h1>
            <p className="text-sm text-gray-500 mt-1">Matrículas, roupas de ballet e outros pagamentos avulsos</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Cobrança</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div>
                  <Label>Aluno</Label>
                  <Select value={form.alunoId} onValueChange={(v) => setForm((f) => ({ ...f, alunoId: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Input
                    className="mt-1"
                    placeholder="Ex: Kit roupa turma 2025, Taxa de matrícula..."
                    value={form.descricao}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label>Mês</Label>
                    <Select value={form.mes} onValueChange={(v) => setForm((f) => ({ ...f, mes: v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((m, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Ano</Label>
                    <Select value={form.ano} onValueChange={(v) => setForm((f) => ({ ...f, ano: v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {anos.map((a) => (
                          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createCobrança.isPending || !form.alunoId}>
                  {createCobrança.isPending ? "Salvando..." : "Registrar Cobrança"}
                </Button>
                {createCobrança.isError && (
                  <p className="text-sm text-red-500 text-center">Erro ao registrar cobrança.</p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroAno} onValueChange={setFiltroAno}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-gray-500">Carregando cobranças...</div>
        ) : cobrançasFiltradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhuma cobrança encontrada.</p>
            <p className="text-sm mt-1">Use "Nova Cobrança" para registrar matrículas, roupas ou outros pagamentos.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Aluno</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Tipo</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Descrição</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Mês/Ano</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Vencimento</th>
                  {!isAtendente && <th className="text-left px-6 py-3 text-gray-500 font-medium">Valor</th>}
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Pagamento</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cobrançasFiltradas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.alunoNome}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {TIPO_LABEL[c.tipo] ?? c.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{c.descricao ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{MESES[c.mes - 1]} {c.ano}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(c.vencimento)}</td>
                    {!isAtendente && <td className="px-6 py-4 text-gray-600">{formatBRL(c.valor)}</td>}
                    <td className="px-6 py-4 text-gray-600">{formatDate(c.dataPagamento)}</td>
                    <td className="px-6 py-4">
                      {c.status === "Pago" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        disabled={updateCobrança.isPending}
                        className="text-xs"
                      >
                        {c.status === "Pago" ? "Marcar Pendente" : "Marcar Pago"}
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
