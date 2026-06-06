import { useGetDashboardStats, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Users, CreditCard, CheckCircle, GraduationCap, TrendingUp } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
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
  return `R$ ${Number(val).toFixed(2).replace(".", ",")}`;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: me } = useGetMe();
  const isAtendente = me?.role === "atendente";

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

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
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
          />
          <StatCard
            title="Pagas no Mês"
            value={stats.mensalidadesPagasNoMes}
            icon={CheckCircle}
            iconClass="bg-green-100 text-green-600"
            sub="confirmadas"
          />
          {!isAtendente && (
            <StatCard
              title="Receita do Mês"
              value={formatBRL(stats.valorTotalPagoNoMes)}
              icon={TrendingUp}
              iconClass="bg-blue-100 text-blue-600"
              sub="arrecadado"
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
