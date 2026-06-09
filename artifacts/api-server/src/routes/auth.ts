import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  let user;
  try {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    user = result[0];
  } catch (err: any) {
    req.log.error({
      msg: "DB query failed on login",
      error: err?.message,
      cause: err?.cause?.message ?? err?.cause,
      code: err?.code ?? err?.cause?.code,
    });
    return res.status(500).json({ error: "Erro ao conectar ao banco de dados" });
  }

  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const valid = await bcrypt.compare(senha, user.senhaHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  (req as any).session.userId = user.id;

  return res.json({ id: user.id, email: user.email, nome: user.nome, role: user.role });
});

router.post("/auth/logout", (req, res) => {
  (req as any).session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res) => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "Usuário não encontrado" });
  }

  return res.json({ id: user.id, email: user.email, nome: user.nome, role: user.role });
});

export default router;
