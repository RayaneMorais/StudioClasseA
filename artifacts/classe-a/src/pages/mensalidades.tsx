import { useState } from "react";
import {
  useListMensalidades,
  useUpdateMensalidade,
  useCreateMensalidade,
  useGerarMensalidadesEmMassa,
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
import { Plus, RefreshCw, CheckCircle, Clock } from "lucide-react";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TIPOS_LABEL: Record<string, string> = {
  Mensalidade: "Mensalidade",
  Matricula: "Matrícula",
  RoupaDeBalett: "Roupa de Ballet",
  Outros: "Outros",
};

function formatBRL(val: number | string | null | undefined) {
  if (val === null || val === undefined || val === "") return "-";
  return `R$ ${Number(val).toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function Mensalidades() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  const isAtendente = me?.role === "atendente";
  const now = new Date();

  const [filtroMes, setFiltroMes] = useState(String(now.getMonth() + 1));
  const [filtroAno, setFiltroAno] = useState(String(now.getFullYear()));
  const [filtroStatus, setFiltroStatus] = useState("all");

  const params: Record<string, string | number> = { tipo: "Mensalidade" };
  if (filtroMes) params.mes = Number(filtroMes);
  if (filtroAno) params.ano = Number(filtroAno);
  if (filtroStatus !== "all") params.status = filtroStatus;

  const { data: mensalidades = [], isLoading } = useListMensalidades(params);
  const { data: alunos = [] } = useListAlunos({ status: "Ativo" });
  const updateMensalidade = useUpdateMensalidade();
  const createMensalidade = useCreateMensalidade();
  const gerarEmMassa = useGerarMensalidadesEmMassa();

  const [openNova, setOpenNova] = useState(false);
  const [openMassa, setOpenMassa] = useState(false);
  const [massaMsg, setMassaMsg] = useState("");

  const [form, setForm] = useState({
    alunoId: 0,
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
    tipo: "Mensalidade" as "Mensalidade" | "Matricula" | "RoupaDeBalett" | "Outros",
    valor: "",
    status: "Pendente" as "Pendente" | "Pago",
    dataPagamento: "",
  });

  const [massaForm, setMassaForm] = useState({
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
  });

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Pago" ? "Pendente" : "Pago";
    const dataPagamento = newStatus === "Pago" ? new Date().toISOString().split("T")[0] : null;
    updateMensalidade.mutate(
      { id, data: { status: newStatus, dataPagamento } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMensalidadesQueryKey(params) });
        },
      }
    );
  };

  const handleCreateMensalidade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.alunoId) return;
    createMensalidade.mutate(
      {
        data: {
          alunoId: form.alunoId,
          mes: form.mes,
          ano: form.ano,
          tipo: form.tipo,
          valor: form.valor ? Number(form.valor) : null,
          status: form.status,
          dataPagamento: form.dataPagamento || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMensalidadesQueryKey() });
          setOpenNova(false);
        },
      }
    );
  };

  const handleGerarEmMassa = (e: React.FormEvent) => {
    e.preventDefault();
    gerarEmMassa.mutate(
      { data: { mes: massaForm.mes, ano: massaForm.ano } },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getListMensalidadesQueryKey() });
          setMassaMsg(result.mensagem || `${result.criadas} criadas, ${result.ignoradas} ignoradas.`);
          setTimeout(() => {
            setOpenMassa(false);
            setMassaMsg("");
          }, 2000);
        },
      }
    );
  };

  const anos = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mensalidades</h1>
            <p className="text-sm text-gray-500 mt-1">Controle financeiro mensal dos alunos</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={openMassa} onOpenChange={setOpenMassa}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar em Massa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Gerar Mensalidades em Massa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGerarEmMassa} className="space-y-4 mt-4">
                  <p className="text-sm text-gray-600">
                    Gera mensalidades para todos os alunos ativos no mês/ano selecionado (ignora duplicatas).
                  </p>
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Select
                      value={String(massaForm.mes)}
                      onValueChange={(v) => setMassaForm({ ...massaForm, mes: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((m, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Select
                      value={String(massaForm.ano)}
                      onValueChange={(v) => setMassaForm({ ...massaForm, ano: Number(v) })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {massaMsg && <p className="text-sm text-green-600 text-center">{massaMsg}</p>}
                  <Button type="submit" className="w-full" disabled={gerarEmMassa.isPending}>
                    {gerarEmMassa.isPending ? "Gerando..." : "Gerar Mensalidades"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openNova} onOpenChange={setOpenNova}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Mensalidade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Mensalidade</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateMensalidade} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Aluno</Label>
                    <Select
                      value={String(form.alunoId || "")}
                      onValueChange={(v) => setForm({ ...form, alunoId: Number(v) })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                      <SelectContent>
                        {alunos.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Mês</Label>
                      <Select
                        value={String(form.mes)}
                        onValueChange={(v) => setForm({ ...form, mes: Number(v) })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MESES.map((m, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Select
                        value={String(form.ano)}
                        onValueChange={(v) => setForm({ ...form, ano: Number(v) })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={form.tipo}
                      onValueChange={(v) => setForm({ ...form, tipo: v as typeof form.tipo })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                        <SelectItem value="Matricula">Matrícula</SelectItem>
                        <SelectItem value="RoupaDeBalett">Roupa de Ballet</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (opcional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      value={form.valor}
                      onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v as "Pendente" | "Pago" })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.status === "Pago" && (
                    <div className="space-y-2">
                      <Label>Data de Pagamento</Label>
                      <Input
                        type="date"
                        value={form.dataPagamento}
                        onChange={(e) => setForm({ ...form, dataPagamento: e.target.value })}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={createMensalidade.isPending || !form.alunoId}>
                    {createMensalidade.isPending ? "Salvando..." : "Criar Mensalidade"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
          <div className="text-gray-500">Carregando mensalidades...</div>
        ) : mensalidades.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhuma mensalidade encontrada.</p>
            <p className="text-sm mt-1">Use "Gerar em Massa" para criar mensalidades do mês.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Aluno</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Mês/Ano</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Tipo</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Vencimento</th>
                  {!isAtendente && <th className="text-left px-6 py-3 text-gray-500 font-medium">Valor</th>}
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Pagamento</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mensalidades.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{m.alunoNome}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {MESES[m.mes - 1]} {m.ano}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{TIPOS_LABEL[m.tipo]}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(m.vencimento)}</td>
                    {!isAtendente && <td className="px-6 py-4 text-gray-600">{formatBRL(m.valor)}</td>}
                    <td className="px-6 py-4 text-gray-600">{formatDate(m.dataPagamento)}</td>
                    <td className="px-6 py-4">
                      {m.status === "Pago" ? (
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
                        onClick={() => handleToggleStatus(m.id, m.status)}
                        disabled={updateMensalidade.isPending}
                        className="text-xs"
                      >
                        {m.status === "Pago" ? "Marcar Pendente" : "Marcar Pago"}
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
