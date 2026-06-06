import { Router } from "express";
import { db, mensalidadesTable, alunosTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function buildVencimento(mes: number, ano: number): string {
  const m = String(mes).padStart(2, "0");
  return `${ano}-${m}-10`;
}

router.get("/mensalidades", async (req, res) => {
  const { alunoId, mes, ano, status } = req.query;

  const conditions: any[] = [];
  if (alunoId) conditions.push(eq(mensalidadesTable.alunoId, Number(alunoId)));
  if (mes) conditions.push(eq(mensalidadesTable.mes, Number(mes)));
  if (ano) conditions.push(eq(mensalidadesTable.ano, Number(ano)));
  if (status && (status === "Pendente" || status === "Pago")) {
    conditions.push(eq(mensalidadesTable.status, status));
  }

  const rows = await db
    .select({
      id: mensalidadesTable.id,
      alunoId: mensalidadesTable.alunoId,
      alunoNome: alunosTable.nome,
      mes: mensalidadesTable.mes,
      ano: mensalidadesTable.ano,
      vencimento: mensalidadesTable.vencimento,
      status: mensalidadesTable.status,
      tipo: mensalidadesTable.tipo,
      valor: mensalidadesTable.valor,
      dataPagamento: mensalidadesTable.dataPagamento,
    })
    .from(mensalidadesTable)
    .leftJoin(alunosTable, eq(mensalidadesTable.alunoId, alunosTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(alunosTable.nome);

  return res.json(rows);
});

router.post("/mensalidades", async (req, res) => {
  const { alunoId, mes, ano, tipo, valor, status, dataPagamento } = req.body;
  if (!alunoId || !mes || !ano || !tipo) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  const vencimento = buildVencimento(Number(mes), Number(ano));

  const [mensalidade] = await db
    .insert(mensalidadesTable)
    .values({
      alunoId: Number(alunoId),
      mes: Number(mes),
      ano: Number(ano),
      vencimento,
      tipo,
      status: status || "Pendente",
      ...(valor !== undefined && valor !== null && valor !== "" ? { valor: String(valor) } : {}),
      ...(dataPagamento ? { dataPagamento } : {}),
    })
    .returning();

  const [row] = await db
    .select({
      id: mensalidadesTable.id,
      alunoId: mensalidadesTable.alunoId,
      alunoNome: alunosTable.nome,
      mes: mensalidadesTable.mes,
      ano: mensalidadesTable.ano,
      vencimento: mensalidadesTable.vencimento,
      status: mensalidadesTable.status,
      tipo: mensalidadesTable.tipo,
      valor: mensalidadesTable.valor,
      dataPagamento: mensalidadesTable.dataPagamento,
    })
    .from(mensalidadesTable)
    .leftJoin(alunosTable, eq(mensalidadesTable.alunoId, alunosTable.id))
    .where(eq(mensalidadesTable.id, mensalidade.id))
    .limit(1);

  return res.status(201).json(row);
});

router.post("/mensalidades/gerar-em-massa", async (req, res) => {
  const { mes, ano } = req.body;
  if (!mes || !ano) {
    return res.status(400).json({ error: "Mês e ano são obrigatórios" });
  }

  const alunos = await db
    .select()
    .from(alunosTable)
    .where(eq(alunosTable.status, "Ativo"));

  const vencimento = buildVencimento(Number(mes), Number(ano));
  let criadas = 0;
  let ignoradas = 0;

  for (const aluno of alunos) {
    const [existing] = await db
      .select()
      .from(mensalidadesTable)
      .where(
        and(
          eq(mensalidadesTable.alunoId, aluno.id),
          eq(mensalidadesTable.mes, Number(mes)),
          eq(mensalidadesTable.ano, Number(ano)),
          eq(mensalidadesTable.tipo, "Mensalidade")
        )
      )
      .limit(1);

    if (existing) {
      ignoradas++;
    } else {
      await db.insert(mensalidadesTable).values({
        alunoId: aluno.id,
        mes: Number(mes),
        ano: Number(ano),
        vencimento,
        tipo: "Mensalidade",
        status: "Pendente",
      });
      criadas++;
    }
  }

  return res.json({
    criadas,
    ignoradas,
    mensagem: `${criadas} mensalidade(s) criada(s), ${ignoradas} ignorada(s) (já existiam).`,
  });
});

router.get("/mensalidades/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: mensalidadesTable.id,
      alunoId: mensalidadesTable.alunoId,
      alunoNome: alunosTable.nome,
      mes: mensalidadesTable.mes,
      ano: mensalidadesTable.ano,
      vencimento: mensalidadesTable.vencimento,
      status: mensalidadesTable.status,
      tipo: mensalidadesTable.tipo,
      valor: mensalidadesTable.valor,
      dataPagamento: mensalidadesTable.dataPagamento,
    })
    .from(mensalidadesTable)
    .leftJoin(alunosTable, eq(mensalidadesTable.alunoId, alunosTable.id))
    .where(eq(mensalidadesTable.id, id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Mensalidade não encontrada" });
  return res.json(row);
});

router.patch("/mensalidades/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status, valor, dataPagamento, tipo } = req.body;

  const [existing] = await db.select().from(mensalidadesTable).where(eq(mensalidadesTable.id, id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Mensalidade não encontrada" });

  await db
    .update(mensalidadesTable)
    .set({
      ...(status && { status }),
      ...(tipo && { tipo }),
      ...(valor !== undefined ? { valor: valor !== null ? String(valor) : null } : {}),
      ...(dataPagamento !== undefined ? { dataPagamento: dataPagamento || null } : {}),
    })
    .where(eq(mensalidadesTable.id, id));

  const [row] = await db
    .select({
      id: mensalidadesTable.id,
      alunoId: mensalidadesTable.alunoId,
      alunoNome: alunosTable.nome,
      mes: mensalidadesTable.mes,
      ano: mensalidadesTable.ano,
      vencimento: mensalidadesTable.vencimento,
      status: mensalidadesTable.status,
      tipo: mensalidadesTable.tipo,
      valor: mensalidadesTable.valor,
      dataPagamento: mensalidadesTable.dataPagamento,
    })
    .from(mensalidadesTable)
    .leftJoin(alunosTable, eq(mensalidadesTable.alunoId, alunosTable.id))
    .where(eq(mensalidadesTable.id, id))
    .limit(1);

  return res.json(row);
});

export default router;
