import { Router } from "express";
import { db, alunosTable, turmasTable, mensalidadesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

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

  const [pendentesResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float`,
    })
    .from(mensalidadesTable)
    .where(eq(mensalidadesTable.status, "Pendente"));

  const [pagasResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float`,
    })
    .from(mensalidadesTable)
    .where(
      and(
        eq(mensalidadesTable.status, "Pago"),
        eq(mensalidadesTable.mes, mes),
        eq(mensalidadesTable.ano, ano)
      )
    );

  const [totalMesResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mensalidadesTable)
    .where(
      and(
        eq(mensalidadesTable.mes, mes),
        eq(mensalidadesTable.ano, ano)
      )
    );

  const totalMes = totalMesResult.count;
    const taxaPagamentoMes = totalMes > 0 ? Math.round((pagasResult.count / totalMes) * 100) : null;

  return res.json({
    totalAlunosAtivos: alunosResult.count,
    totalTurmasAtivas: turmasResult.count,
    mensalidadesPendentes: pendentesResult.count,
    mensalidadesPagasNoMes: pagasResult.count,
    valorTotalPagoNoMes: pagasResult.total,
    valorTotalPendente: pendentesResult.total,
    taxaPagamentoMes,
  });
});

router.get("/dashboard/receita-mensal", async (_req, res) => {
  const now = new Date();
  const result = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();

    const [pagas] = await db
      .select({ total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float` })
      .from(mensalidadesTable)
      .where(
        and(
          eq(mensalidadesTable.status, "Pago"),
          eq(mensalidadesTable.mes, mes),
          eq(mensalidadesTable.ano, ano)
        )
      );

    const [pendentes] = await db
      .select({ total: sql<number>`COALESCE(SUM(valor::numeric), 0)::float` })
      .from(mensalidadesTable)
      .where(
        and(
          eq(mensalidadesTable.status, "Pendente"),
          eq(mensalidadesTable.mes, mes),
          eq(mensalidadesTable.ano, ano)
        )
      );

    result.push({
      mes,
      ano,
      label: `${MESES_PT[mes - 1]}/${String(ano).slice(2)}`,
      receita: pagas.total,
      pendente: pendentes.total,
    });
  }

  return res.json(result);
});

export default router;
