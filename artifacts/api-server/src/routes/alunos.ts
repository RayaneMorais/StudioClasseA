import { Router } from "express";
import { db, alunosTable, turmasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/alunos", async (req, res) => {
  const { status, turmaId } = req.query;

  const conditions: any[] = [];
  if (status && (status === "Ativo" || status === "Inativo")) {
    conditions.push(eq(alunosTable.status, status));
  }
  if (turmaId) {
    conditions.push(eq(alunosTable.turmaId, Number(turmaId)));
  }

  const rows = await db
    .select({
      id: alunosTable.id,
      nome: alunosTable.nome,
      dataNascimento: alunosTable.dataNascimento,
      nomeResponsavel: alunosTable.nomeResponsavel,
      telefoneResponsavel: alunosTable.telefoneResponsavel,
      turmaId: alunosTable.turmaId,
      turmaDescricao: turmasTable.descricao,
      status: alunosTable.status,
      createdAt: alunosTable.createdAt,
    })
    .from(alunosTable)
    .leftJoin(turmasTable, eq(alunosTable.turmaId, turmasTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(alunosTable.nome);

  return res.json(rows);
});

router.post("/alunos", async (req, res) => {
  const { nome, dataNascimento, nomeResponsavel, telefoneResponsavel, turmaId } = req.body;
  if (!nome || !dataNascimento || !nomeResponsavel || !telefoneResponsavel || !turmaId) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  const [aluno] = await db
    .insert(alunosTable)
    .values({ nome, dataNascimento, nomeResponsavel, telefoneResponsavel, turmaId: Number(turmaId) })
    .returning();

  const [row] = await db
    .select({
      id: alunosTable.id,
      nome: alunosTable.nome,
      dataNascimento: alunosTable.dataNascimento,
      nomeResponsavel: alunosTable.nomeResponsavel,
      telefoneResponsavel: alunosTable.telefoneResponsavel,
      turmaId: alunosTable.turmaId,
      turmaDescricao: turmasTable.descricao,
      status: alunosTable.status,
      createdAt: alunosTable.createdAt,
    })
    .from(alunosTable)
    .leftJoin(turmasTable, eq(alunosTable.turmaId, turmasTable.id))
    .where(eq(alunosTable.id, aluno.id))
    .limit(1);

  return res.status(201).json(row);
});

router.get("/alunos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: alunosTable.id,
      nome: alunosTable.nome,
      dataNascimento: alunosTable.dataNascimento,
      nomeResponsavel: alunosTable.nomeResponsavel,
      telefoneResponsavel: alunosTable.telefoneResponsavel,
      turmaId: alunosTable.turmaId,
      turmaDescricao: turmasTable.descricao,
      status: alunosTable.status,
      createdAt: alunosTable.createdAt,
    })
    .from(alunosTable)
    .leftJoin(turmasTable, eq(alunosTable.turmaId, turmasTable.id))
    .where(eq(alunosTable.id, id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Aluno não encontrado" });
  return res.json(row);
});

router.patch("/alunos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome, dataNascimento, nomeResponsavel, telefoneResponsavel, turmaId, status } = req.body;

  const [existing] = await db.select().from(alunosTable).where(eq(alunosTable.id, id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Aluno não encontrado" });

  await db
    .update(alunosTable)
    .set({
      ...(nome && { nome }),
      ...(dataNascimento && { dataNascimento }),
      ...(nomeResponsavel && { nomeResponsavel }),
      ...(telefoneResponsavel && { telefoneResponsavel }),
      ...(turmaId && { turmaId: Number(turmaId) }),
      ...(status && { status }),
    })
    .where(eq(alunosTable.id, id));

  const [row] = await db
    .select({
      id: alunosTable.id,
      nome: alunosTable.nome,
      dataNascimento: alunosTable.dataNascimento,
      nomeResponsavel: alunosTable.nomeResponsavel,
      telefoneResponsavel: alunosTable.telefoneResponsavel,
      turmaId: alunosTable.turmaId,
      turmaDescricao: turmasTable.descricao,
      status: alunosTable.status,
      createdAt: alunosTable.createdAt,
    })
    .from(alunosTable)
    .leftJoin(turmasTable, eq(alunosTable.turmaId, turmasTable.id))
    .where(eq(alunosTable.id, id))
    .limit(1);

  return res.json(row);
});

export default router;
