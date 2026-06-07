import { Router } from "express";
import { db, alunosTable, turmasTable, mensalidadesTable } from "@workspace/db";
import { eq, and, ne, sql } from "drizzle-orm";

const router = Router();

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

router.get("/dashboard/stats", async (req, res) => {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  const [alunosResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alunosTable)
    .where(eq(alunosTable.status, "Ativo"));

  const [turmasResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(turmasTable)
    .where(eq(turmasTable.status, "Ativa"));

  // Mensalidades pendentes (tipo = Mensalidade)
  const [mensalidadesPendentesResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float`,
    })
    .from(mensalidadesTable)
    .where(and(eq(mensalidadesTable.status, "Pendente"), eq(mensalidadesTable.tipo, "Mensalidade")));

  // Cobranças pendentes (tipo != Mensalidade)
  const [cobrancasPendentesResult] = await db
    .select({
      total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float`,
    })
    .from(mensalidadesTable)
    .where(and(eq(mensalidadesTable.status, "Pendente"), ne(mensalidadesTable.tipo, "Mensalidade")));

  // Mensalidades pagas no mês (tipo = Mensalidade)
  const [mensalidadesPagasResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float`,
    })
    .from(mensalidadesTable)
    .where(and(
      eq(mensalidadesTable.status, "Pago"),
      eq(mensalidadesTable.tipo, "Mensalidade"),
      eq(mensalidadesTable.mes, mes),
      eq(mensalidadesTable.ano, ano)
    ));

  // Cobranças pagas no mês (tipo != Mensalidade)
  const [cobrancasPagasResult] = await db
    .select({
      total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float`,
    })
    .from(mensalidadesTable)
    .where(and(
      eq(mensalidadesTable.status, "Pago"),
      ne(mensalidadesTable.tipo, "Mensalidade"),
      eq(mensalidadesTable.mes, mes),
      eq(mensalidadesTable.ano, ano)
    ));

  // Total mensalidades do mês (para taxa)
  const [totalMensalidadesMes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mensalidadesTable)
    .where(and(
      eq(mensalidadesTable.tipo, "Mensalidade"),
      eq(mensalidadesTable.mes, mes),
      eq(mensalidadesTable.ano, ano)
    ));

  // Total cobranças do mês (para taxa)
  const [totalCobrancasMes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mensalidadesTable)
    .where(and(
      ne(mensalidadesTable.tipo, "Mensalidade"),
      eq(mensalidadesTable.mes, mes),
      eq(mensalidadesTable.ano, ano)
    ));

  const taxaMensalidades = totalMensalidadesMes.count > 0
    ? Math.round((mensalidadesPagasResult.count / totalMensalidadesMes.count) * 100)
    : null;

  const taxaCobranças = totalCobrancasMes.count > 0
    ? Math.round(((totalCobrancasMes.count - 0) / totalCobrancasMes.count) * 100)
    : null;

  // For cobranças taxa we need paid count too
  const [cobrancasPagasCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mensalidadesTable)
    .where(and(
      eq(mensalidadesTable.status, "Pago"),
      ne(mensalidadesTable.tipo, "Mensalidade"),
      eq(mensalidadesTable.mes, mes),
      eq(mensalidadesTable.ano, ano)
    ));

  const taxaCobrancasFinal = totalCobrancasMes.count > 0
    ? Math.round((cobrancasPagasCountResult.count / totalCobrancasMes.count) * 100)
    : null;

  return res.json({
    totalAlunosAtivos: alunosResult.count,
    totalTurmasAtivas: turmasResult.count,
    mensalidadesPendentes: mensalidadesPendentesResult.count,
    mensalidadesPagasNoMes: mensalidadesPagasResult.count,
    valorMensalidadesPendente: mensalidadesPendentesResult.total,
    valorCobrancasPendente: cobrancasPendentesResult.total,
    valorMensalidadesPagas: mensalidadesPagasResult.total,
    valorCobrancasPagas: cobrancasPagasResult.total,
    taxaMensalidades,
    taxaCobranças: taxaCobrancasFinal,
  });
});

router.get("/dashboard/receita-mensal", async (_req, res) => {
  const now = new Date();
  const START_MES = 6;
  const START_ANO = 2026;

  const result = [];
  let ano = START_ANO;
  let mes = START_MES;

  while (ano < now.getFullYear() || (ano === now.getFullYear() && mes <= now.getMonth() + 1)) {
    const [mensalidadesPagas] = await db
      .select({ total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float` })
      .from(mensalidadesTable)
      .where(and(
        eq(mensalidadesTable.status, "Pago"),
        eq(mensalidadesTable.tipo, "Mensalidade"),
        eq(mensalidadesTable.mes, mes),
        eq(mensalidadesTable.ano, ano)
      ));

    const [cobrancasPagas] = await db
      .select({ total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float` })
      .from(mensalidadesTable)
      .where(and(
        eq(mensalidadesTable.status, "Pago"),
        ne(mensalidadesTable.tipo, "Mensalidade"),
        eq(mensalidadesTable.mes, mes),
        eq(mensalidadesTable.ano, ano)
      ));

    result.push({
      mes,
      ano,
      label: `${MESES_PT[mes - 1]}/${String(ano).slice(2)}`,
      receita: mensalidadesPagas.total + cobrancasPagas.total,
      pendente: 0,
      receitaMensalidades: mensalidadesPagas.total,
      receitaCobranças: cobrancasPagas.total,
    });

    mes++;
    if (mes > 12) { mes = 1; ano++; }
  }

  return res.json(result);
});

export default router;
