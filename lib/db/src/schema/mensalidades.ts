import { pgTable, serial, text, integer, date, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alunosTable } from "./alunos";

export const mensalidadesTable = pgTable("mensalidades", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").notNull().references(() => alunosTable.id),
  mes: integer("mes").notNull(),
  ano: integer("ano").notNull(),
  vencimento: date("vencimento").notNull(),
  status: text("status", { enum: ["Pendente", "Pago"] }).notNull().default("Pendente"),
  tipo: text("tipo", { enum: ["Mensalidade", "Matricula", "RoupaDeBalett", "Outros"] }).notNull().default("Mensalidade"),
  valor: numeric("valor", { precision: 10, scale: 2 }),
  dataPagamento: date("data_pagamento"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMensalidadeSchema = createInsertSchema(mensalidadesTable).omit({ id: true, createdAt: true });
export type InsertMensalidade = z.infer<typeof insertMensalidadeSchema>;
export type Mensalidade = typeof mensalidadesTable.$inferSelect;
