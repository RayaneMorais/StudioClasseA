import { Router } from "express";
import { db, alunosTable, turmasTable, mensalidadesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

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
    .select({ count: sql<number>`count(*)::int` })
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

  return res.json({
    totalAlunosAtivos: alunosResult.count,
    totalTurmasAtivas: turmasResult.count,
    mensalidadesPendentes: pendentesResult.count,
    mensalidadesPagasNoMes: pagasResult.count,
    valorTotalPagoNoMes: pagasResult.total,
  });
});

export default router;
