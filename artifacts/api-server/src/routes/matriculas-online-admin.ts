import { Router, type RequestHandler } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  AprovarSolicitacaoMatriculaOnlineBody,
  AprovarSolicitacaoMatriculaOnlineParams,
  AprovarSolicitacaoMatriculaOnlineResponse,
  GetResumoMatriculaOnlineResponse,
  ListarSolicitacoesMatriculaOnlineQueryParams,
  ListarSolicitacoesMatriculaOnlineResponse,
  RejeitarSolicitacaoMatriculaOnlineBody,
  RejeitarSolicitacaoMatriculaOnlineParams,
  RejeitarSolicitacaoMatriculaOnlineResponse,
} from "@workspace/api-zod";
import {
  alunosTable,
  db,
  solicitacoesMatriculaOnlineTable,
  turmasTable,
  usersTable,
} from "@workspace/db";

const router = Router();

const requireAdministrator: RequestHandler = async (req, res, next) => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Acesso restrito à administração." });
    return;
  }

  next();
};

router.use(requireAdministrator);
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/admin/matriculas-online/resumo", async (_req, res): Promise<void> => {
  const [result] = await db
    .select({ pendentes: sql<number>`count(*)` })
    .from(solicitacoesMatriculaOnlineTable)
    .where(eq(solicitacoesMatriculaOnlineTable.status, "Pendente"));

  res.json(GetResumoMatriculaOnlineResponse.parse({ pendentes: Number(result?.pendentes ?? 0) }));
});

router.get("/admin/matriculas-online/solicitacoes", async (req, res): Promise<void> => {
  const parsed = ListarSolicitacoesMatriculaOnlineQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Filtro de situação inválido." });
    return;
  }

  const solicitacoes = await db
    .select()
    .from(solicitacoesMatriculaOnlineTable)
    .where(
      parsed.data.status
        ? eq(solicitacoesMatriculaOnlineTable.status, parsed.data.status)
        : undefined,
    )
    .orderBy(desc(solicitacoesMatriculaOnlineTable.createdAt));

  res.json(ListarSolicitacoesMatriculaOnlineResponse.parse(solicitacoes));
});

router.post("/admin/matriculas-online/solicitacoes/:id/aprovar", async (req, res): Promise<void> => {
  const params = AprovarSolicitacaoMatriculaOnlineParams.safeParse(req.params);
  const body = AprovarSolicitacaoMatriculaOnlineBody.strict().safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Dados para aprovação inválidos." });
    return;
  }

  const actorId = (req as any).session.userId as number;
  const result = await db.transaction(async (tx) => {
    const [solicitacao] = await tx
      .select()
      .from(solicitacoesMatriculaOnlineTable)
      .where(eq(solicitacoesMatriculaOnlineTable.id, params.data.id))
      .limit(1)
      .for("update");

    if (!solicitacao) return { kind: "not-found" as const };
    if (solicitacao.status !== "Pendente") return { kind: "not-pending" as const };

    const [turma] = await tx
      .select({ id: turmasTable.id })
      .from(turmasTable)
      .where(and(eq(turmasTable.id, body.data.turmaId), eq(turmasTable.status, "Ativa")))
      .limit(1);

    if (!turma) return { kind: "invalid-class" as const };

    const possiveisDuplicados = await tx
      .select({
        id: alunosTable.id,
        nome: alunosTable.nome,
        dataNascimento: alunosTable.dataNascimento,
        nomeResponsavel: alunosTable.nomeResponsavel,
        telefoneResponsavel: alunosTable.telefoneResponsavel,
        turmaDescricao: turmasTable.descricao,
        status: alunosTable.status,
      })
      .from(alunosTable)
      .leftJoin(turmasTable, eq(alunosTable.turmaId, turmasTable.id))
      .where(and(
        sql`lower(trim(${alunosTable.nome})) = lower(trim(${solicitacao.nome}))`,
        eq(alunosTable.dataNascimento, solicitacao.dataNascimento),
      ))
      .limit(8);

    if (possiveisDuplicados.length && !body.data.confirmarPossivelDuplicidade) {
      return { kind: "possible-duplicates" as const, possiveisDuplicados };
    }

    const [aluno] = await tx
      .insert(alunosTable)
      .values({
        nome: solicitacao.nome,
        dataNascimento: solicitacao.dataNascimento,
        nomeResponsavel: solicitacao.nomeResponsavel,
        telefoneResponsavel: solicitacao.telefoneResponsavel,
        turmaId: turma.id,
        status: "Ativo",
      })
      .returning({ id: alunosTable.id });

    const [updated] = await tx
      .update(solicitacoesMatriculaOnlineTable)
      .set({
        status: "Aprovada",
        decididoEm: new Date(),
        decididoPor: actorId,
        alunoCriadoId: aluno.id,
        motivoRejeicao: null,
      })
      .where(eq(solicitacoesMatriculaOnlineTable.id, solicitacao.id))
      .returning();

    return { kind: "approved" as const, solicitacao: updated, alunoId: aluno.id };
  });

  if (result.kind === "not-found") {
    res.status(404).json({ error: "Solicitação não encontrada." });
    return;
  }
  if (result.kind === "not-pending") {
    res.status(400).json({ error: "Esta solicitação já foi decidida." });
    return;
  }
  if (result.kind === "invalid-class") {
    res.status(400).json({ error: "Selecione uma turma que esteja ativa." });
    return;
  }
  if (result.kind === "possible-duplicates") {
    res.status(409).json({
      error: "possible_duplicate",
      possiveisDuplicados: result.possiveisDuplicados,
    });
    return;
  }

  res.json(AprovarSolicitacaoMatriculaOnlineResponse.parse({
    solicitacao: result.solicitacao,
    alunoId: result.alunoId,
  }));
});

router.post("/admin/matriculas-online/solicitacoes/:id/rejeitar", async (req, res): Promise<void> => {
  const params = RejeitarSolicitacaoMatriculaOnlineParams.safeParse(req.params);
  const body = RejeitarSolicitacaoMatriculaOnlineBody.strict().safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Dados para rejeição inválidos." });
    return;
  }

  const actorId = (req as any).session.userId as number;
  const result = await db.transaction(async (tx) => {
    const [solicitacao] = await tx
      .select()
      .from(solicitacoesMatriculaOnlineTable)
      .where(eq(solicitacoesMatriculaOnlineTable.id, params.data.id))
      .limit(1)
      .for("update");

    if (!solicitacao) return { kind: "not-found" as const };
    if (solicitacao.status !== "Pendente") return { kind: "not-pending" as const };

    const motivo = body.data.motivo?.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    const [updated] = await tx
      .update(solicitacoesMatriculaOnlineTable)
      .set({
        status: "Rejeitada",
        motivoRejeicao: motivo || null,
        decididoEm: new Date(),
        decididoPor: actorId,
      })
      .where(eq(solicitacoesMatriculaOnlineTable.id, solicitacao.id))
      .returning();

    return { kind: "rejected" as const, solicitacao: updated };
  });

  if (result.kind === "not-found") {
    res.status(404).json({ error: "Solicitação não encontrada." });
    return;
  }
  if (result.kind === "not-pending") {
    res.status(400).json({ error: "Esta solicitação já foi decidida." });
    return;
  }

  res.json(RejeitarSolicitacaoMatriculaOnlineResponse.parse(result.solicitacao));
});

export default router;
