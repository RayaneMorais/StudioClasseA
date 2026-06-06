import { Router } from "express";
import { db, turmasTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function buildDescricao(nome: string, professor: string, diasSemana: string, horario: string) {
  return `${nome} - ${professor} | ${diasSemana} ${horario}`;
}

router.get("/turmas", async (req, res) => {
  const turmas = await db.select().from(turmasTable).orderBy(turmasTable.nome);
  return res.json(turmas);
});

router.post("/turmas", async (req, res) => {
  const { nome, professor, diasSemana, horario, status } = req.body;
  if (!nome || !professor || !diasSemana || !horario || !status) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }
  const descricao = buildDescricao(nome, professor, diasSemana, horario);
  const [turma] = await db
    .insert(turmasTable)
    .values({ nome, professor, diasSemana, horario, descricao, status })
    .returning();
  return res.status(201).json(turma);
});

router.get("/turmas/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [turma] = await db.select().from(turmasTable).where(eq(turmasTable.id, id)).limit(1);
  if (!turma) return res.status(404).json({ error: "Turma não encontrada" });
  return res.json(turma);
});

router.patch("/turmas/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome, professor, diasSemana, horario, status } = req.body;

  const [existing] = await db.select().from(turmasTable).where(eq(turmasTable.id, id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Turma não encontrada" });

  const updatedNome = nome ?? existing.nome;
  const updatedProfessor = professor ?? existing.professor;
  const updatedDias = diasSemana ?? existing.diasSemana;
  const updatedHorario = horario ?? existing.horario;
  const descricao = buildDescricao(updatedNome, updatedProfessor, updatedDias, updatedHorario);

  const [turma] = await db
    .update(turmasTable)
    .set({
      nome: updatedNome,
      professor: updatedProfessor,
      diasSemana: updatedDias,
      horario: updatedHorario,
      descricao,
      ...(status && { status }),
    })
    .where(eq(turmasTable.id, id))
    .returning();

  return res.json(turma);
});

export default router;
