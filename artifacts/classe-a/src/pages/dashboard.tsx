import { useGetDashboardStats, useGetReceitaMensal, getGetReceitaMensalQueryKey, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import {
  Users, CreditCard, CheckCircle, GraduationCap, TrendingUp, AlertCircle, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from "recharts";

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  sub,
  highlight,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-6 ${highlight ? "border-yellow-300 bg-yellow-50/40" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatBRL(val: number | null | undefined) {
  if (val === null || val === undefined) return "R$ 0,00";
  return `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.fill }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-medium">{formatBRL(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: me } = useGetMe();
  const isAdmin = me?.role === "admin";

  const { data: receitaMensal = [] } = useGetReceitaMensal({ query: { enabled: isAdmin, queryKey: getGetReceitaMensalQueryKey() } });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-gray-400 text-sm">Carregando métricas...</div>
        </div>
      </Layout>
    );
  }

  if (!stats) return null;

  const ultimosMeses = receitaMensal.slice(-6);
  const receitaMedia = ultimosMeses.length > 0
    ? ultimosMeses.reduce((s, m) => s + m.receita, 0) / ultimosMeses.length
    : 0;

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-sm text-gray-500 mt-1">Resumo do mês atual</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <StatCard
            title="Alunos Ativos"
            value={stats.totalAlunosAtivos}
            icon={Users}
            iconClass="bg-primary/10 text-primary"
            sub="matriculados"
          />
          <StatCard
            title="Turmas Ativas"
            value={stats.totalTurmasAtivas}
            icon={GraduationCap}
            iconClass="bg-purple-100 text-purple-600"
            sub="em andamento"
          />
          <StatCard
            title="Mensalidades Pendentes"
            value={stats.mensalidadesPendentes}
            icon={CreditCard}
            iconClass="bg-yellow-100 text-yellow-600"
            sub="aguardando pagamento"
            highlight={(stats.mensalidadesPendentes ?? 0) > 0}
          />
          <StatCard
            title="Pagas no Mês"
            value={stats.mensalidadesPagasNoMes}
            icon={CheckCircle}
            iconClass="bg-green-100 text-green-600"
            sub="confirmadas"
          />
          {isAdmin && (
            <StatCard
              title="Receita do Mês"
              value={formatBRL(stats.valorTotalPagoNoMes)}
              icon={TrendingUp}
              iconClass="bg-blue-100 text-blue-600"
              sub="arrecadado"
            />
          )}
        </div>

        {isAdmin && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatCard
                title="A Receber (Total)"
                value={formatBRL(stats.valorTotalPendente)}
                icon={AlertCircle}
                iconClass="bg-orange-100 text-orange-600"
                sub="todas as pendências"
                highlight={(stats.valorTotalPendente ?? 0) > 0}
              />
              <StatCard
                title="Taxa de Pagamento"
                value={stats.taxaPagamentoMes !== null && stats.taxaPagamentoMes !== undefined
                  ? `${stats.taxaPagamentoMes}%`
                  : "—"}
                icon={BarChart3}
                iconClass="bg-teal-100 text-teal-600"
                sub="pago vs. total do mês"
              />
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-center">
                <p className="text-sm font-medium text-gray-500 mb-1">Média Mensal (6m)</p>
                <p className="text-3xl font-bold text-gray-900">{formatBRL(receitaMedia)}</p>
                <p className="text-xs text-gray-400 mt-1">últimos 6 meses arrecadados</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-gray-900">Receita Mensal — últimos 12 meses</h2>
              </div>
              {receitaMensal.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  Sem dados suficientes para exibir o gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={receitaMensal} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      width={56}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    {receitaMedia > 0 && (
                      <ReferenceLine
                        y={receitaMedia}
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        label={{ value: "Média", position: "insideTopRight", fontSize: 11, fill: "#94a3b8" }}
                      />
                    )}
                    <Bar dataKey="receita" name="Recebido" fill="#f472b6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="pendente" name="Pendente" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
