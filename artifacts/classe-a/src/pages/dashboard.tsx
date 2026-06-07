import { useGetDashboardStats, useGetReceitaMensal, getGetReceitaMensalQueryKey, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import {
  Users, GraduationCap, TrendingUp, AlertCircle, BarChart3, CheckCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

function formatBRL(val: number | null | undefined) {
  if (val === null || val === undefined) return "R$ 0,00";
  return `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(val: number | null | undefined) {
  if (val === null || val === undefined) return "—";
  return `${val}%`;
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconClass,
  highlight,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${highlight ? "border-orange-300 bg-orange-50/30" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SplitCard({
  title,
  icon: Icon,
  iconClass,
  rows,
  highlight,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  rows: { label: string; value: string }[];
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${highlight ? "border-orange-300 bg-orange-50/30" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{r.label}</span>
            <span className="text-sm font-semibold text-gray-900">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
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

  const { data: receitaMensal = [] } = useGetReceitaMensal({
    query: { enabled: isAdmin, queryKey: getGetReceitaMensalQueryKey() },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-gray-400 text-sm">Carregando métricas...</div>
      </Layout>
    );
  }

  if (!stats) return null;

  const temPendente =
    (stats.valorMensalidadesPendente ?? 0) + (stats.valorCobrancasPendente ?? 0) > 0;

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-sm text-gray-500 mt-1">Resumo do mês atual</p>
        </div>

        {/* Row 1: operacional */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
            icon={AlertCircle}
            iconClass="bg-yellow-100 text-yellow-600"
            sub="aguardando pagamento"
            highlight={(stats.mensalidadesPendentes ?? 0) > 0}
          />
          <StatCard
            title="Pagas no Mês"
            value={stats.mensalidadesPagasNoMes}
            icon={CheckCircle}
            iconClass="bg-green-100 text-green-600"
            sub="mensalidades confirmadas"
          />
        </div>

        {/* Row 2: financeiro — admin only */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SplitCard
              title="A Receber"
              icon={AlertCircle}
              iconClass="bg-orange-100 text-orange-600"
              highlight={temPendente}
              rows={[
                { label: "Mensalidades pendentes", value: formatBRL(stats.valorMensalidadesPendente) },
                { label: "Cobranças pendentes", value: formatBRL(stats.valorCobrancasPendente) },
              ]}
            />
            <SplitCard
              title="Arrecadado no Mês"
              icon={TrendingUp}
              iconClass="bg-blue-100 text-blue-600"
              rows={[
                { label: "Mensalidades recebidas", value: formatBRL(stats.valorMensalidadesPagas) },
                { label: "Cobranças recebidas", value: formatBRL(stats.valorCobrancasPagas) },
              ]}
            />
            <SplitCard
              title="Taxa de Pagamento"
              icon={BarChart3}
              iconClass="bg-teal-100 text-teal-600"
              rows={[
                { label: "Mensalidades (mês atual)", value: formatPct(stats.taxaMensalidades) },
                { label: "Cobranças (mês atual)", value: formatPct(stats.taxaCobranças) },
              ]}
            />
          </div>
        )}

        {/* Chart — admin only */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-gray-900">Receita Mensal — a partir de Jun/26</h2>
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
                    tickFormatter={(v) =>
                      v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`
                    }
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="receitaMensalidades" name="Mensalidades" fill="#f472b6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="receitaCobranças" name="Cobranças" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
