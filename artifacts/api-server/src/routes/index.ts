import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import turmasRouter from "./turmas";
import alunosRouter from "./alunos";
import mensalidadesRouter from "./mensalidades";
import dashboardRouter from "./dashboard";
import matriculasOnlinePublicRouter from "./matriculas-online-public";
import matriculasOnlineAdminRouter from "./matriculas-online-admin";

const router: IRouter = Router();

router.use("/public", matriculasOnlinePublicRouter);

const requireAuth = (req: any, res: any, next: any) => {
  const publicPaths = ["/auth/login", "/auth/logout", "/healthz"];
  if (publicPaths.includes(req.path)) return next();
  if (!req.session?.userId) return res.status(401).json({ error: "Não autenticado" });
  next();
};

router.use(requireAuth);
router.use(healthRouter);
router.use(authRouter);
router.use(turmasRouter);
router.use(alunosRouter);
router.use(mensalidadesRouter);
router.use(dashboardRouter);
router.use(matriculasOnlineAdminRouter);

export default router;
