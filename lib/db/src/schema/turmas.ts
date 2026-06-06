import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const turmasTable = pgTable("turmas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  professor: text("professor").notNull(),
  diasSemana: text("dias_semana").notNull(),
  horario: text("horario").notNull(),
  descricao: text("descricao").notNull(),
  status: text("status", { enum: ["Ativa", "Suspensa", "Fechada"] }).notNull().default("Ativa"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTurmaSchema = createInsertSchema(turmasTable).omit({ id: true, createdAt: true });
export type InsertTurma = z.infer<typeof insertTurmaSchema>;
export type Turma = typeof turmasTable.$inferSelect;
