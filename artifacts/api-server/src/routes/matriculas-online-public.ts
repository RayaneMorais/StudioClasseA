import { randomBytes } from "node:crypto";
import { Router, type RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db, turmasTable, solicitacoesMatriculaOnlineTable } from "@workspace/db";
import {
  CriarSolicitacaoMatriculaOnlineBody,
  CriarSolicitacaoMatriculaOnlineResponse,
  GetOpcoesMatriculaOnlineResponse,
} from "@workspace/api-zod";

const router = Router();
const submissionWindowMs = 15 * 60 * 1000;
const maxSubmissionsPerWindow = 5;
const submissionAttempts = new Map<string, { count: number; resetAt: number }>();

const submissionRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  for (const [key, entry] of submissionAttempts) {
    if (entry.resetAt <= now) submissionAttempts.delete(key);
  }

  const key = req.ip || req.socket.remoteAddress || "unknown";
  let entry = submissionAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + submissionWindowMs };
    submissionAttempts.set(key, entry);
  }

  if (entry.count >= maxSubmissionsPerWindow) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
    res.status(429).json({ error: "Muitas tentativas. Aguarde antes de enviar novamente." });
    return;
  }

  entry.count += 1;
  next();
};

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function publicClassLabel(turma: { nome: string; diasSemana: string; horario: string }): string {
  return [turma.nome, turma.diasSemana, turma.horario]
    .map((value) => value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" · ")
    .slice(0, 200);
}

function makeProtocol(): string {
  return `CLA-${new Date().getFullYear()}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

function cleanField(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

router.get("/matriculas-online/opcoes", async (_req, res): Promise<void> => {
  const turmas = await db
    .select({ nome: turmasTable.nome, diasSemana: turmasTable.diasSemana, horario: turmasTable.horario })
    .from(turmasTable)
    .where(eq(turmasTable.status, "Ativa"))
    .orderBy(turmasTable.nome);

  const options = [...new Set(turmas
    .map((turma) => publicClassLabel(turma))
    .filter(Boolean))]
    .map((label) => ({ valor: label, rotulo: label }));
  options.push({ valor: "Quero conversar com a equipe", rotulo: "Quero conversar com a equipe" });

  res.json(GetOpcoesMatriculaOnlineResponse.parse({ opcoes: options }));
});

router.post("/matriculas-online/solicitacoes", submissionRateLimit, async (req, res): Promise<void> => {
  const parsed = CriarSolicitacaoMatriculaOnlineBody.strict().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Confira os campos do formulário e tente novamente." });
    return;
  }

  if (parsed.data.website?.trim()) {
    res.status(201).json(CriarSolicitacaoMatriculaOnlineResponse.parse({ protocolo: makeProtocol() }));
    return;
  }

  const nome = cleanField(parsed.data.nome);
  const nomeResponsavel = cleanField(parsed.data.nomeResponsavel);
  const telefoneResponsavel = cleanField(parsed.data.telefoneResponsavel);
  const turmaInteresse = cleanField(parsed.data.turmaInteresse);
  const telefoneDigitos = telefoneResponsavel.replace(/\D/g, "");

  if (
    nome.length < 2 ||
    nomeResponsavel.length < 2 ||
    telefoneDigitos.length < 10 ||
    telefoneDigitos.length > 13 ||
    parsed.data.dataNascimento.getTime() > Date.now()
  ) {
    res.status(400).json({ error: "Confira os campos do formulário e tente novamente." });
    return;
  }

  const turmasAtivas = await db
    .select({ nome: turmasTable.nome, diasSemana: turmasTable.diasSemana, horario: turmasTable.horario })
    .from(turmasTable)
    .where(eq(turmasTable.status, "Ativa"));
  const escolhasPermitidas = new Set([
    ...turmasAtivas.map((turma) => publicClassLabel(turma)),
    "Quero conversar com a equipe",
  ]);

  if (!escolhasPermitidas.has(turmaInteresse)) {
    res.status(400).json({ error: "Selecione uma das opções de turma disponíveis." });
    return;
  }

  const [solicitacao] = await db
    .insert(solicitacoesMatriculaOnlineTable)
    .values({
      protocolo: makeProtocol(),
      nome,
      dataNascimento: parsed.data.dataNascimento.toISOString().slice(0, 10),
      nomeResponsavel,
      telefoneResponsavel,
      turmaInteresse,
      consentimentoEm: new Date(),
    })
    .returning({ protocolo: solicitacoesMatriculaOnlineTable.protocolo });

  res.status(201).json(CriarSolicitacaoMatriculaOnlineResponse.parse(solicitacao));
});

export default router;
