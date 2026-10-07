import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { alunosTable } from "./alunos";
import { usersTable } from "./users";

export const solicitacoesMatriculaOnlineTable = pgTable("solicitacoes_matricula_online", {
  id: serial("id").primaryKey(),
  protocolo: text("protocolo").notNull().unique(),
  nome: text("nome").notNull(),
  dataNascimento: date("data_nascimento").notNull(),
  nomeResponsavel: text("nome_responsavel").notNull(),
  telefoneResponsavel: text("telefone_responsavel").notNull(),
  turmaInteresse: text("turma_interesse").notNull(),
  consentimentoEm: timestamp("consentimento_em", { withTimezone: true }).notNull(),
  status: text("status", { enum: ["Pendente", "Aprovada", "Rejeitada"] }).notNull().default("Pendente"),
  motivoRejeicao: text("motivo_rejeicao"),
  decididoEm: timestamp("decidido_em", { withTimezone: true }),
  decididoPor: integer("decidido_por").references(() => usersTable.id),
  alunoCriadoId: integer("aluno_criado_id").references(() => alunosTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSolicitacaoMatriculaOnlineSchema = createInsertSchema(solicitacoesMatriculaOnlineTable)
  .omit({ id: true, createdAt: true });
export type InsertSolicitacaoMatriculaOnline = z.infer<typeof insertSolicitacaoMatriculaOnlineSchema>;
export type SolicitacaoMatriculaOnline = typeof solicitacoesMatriculaOnlineTable.$inferSelect;
