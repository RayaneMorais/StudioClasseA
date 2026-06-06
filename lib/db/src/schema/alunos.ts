import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { turmasTable } from "./turmas";

export const alunosTable = pgTable("alunos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  dataNascimento: date("data_nascimento").notNull(),
  nomeResponsavel: text("nome_responsavel").notNull(),
  telefoneResponsavel: text("telefone_responsavel").notNull(),
  turmaId: integer("turma_id").notNull().references(() => turmasTable.id),
  status: text("status", { enum: ["Ativo", "Inativo"] }).notNull().default("Ativo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlunoSchema = createInsertSchema(alunosTable).omit({ id: true, createdAt: true });
export type InsertAluno = z.infer<typeof insertAlunoSchema>;
export type Aluno = typeof alunosTable.$inferSelect;
