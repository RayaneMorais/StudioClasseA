import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const PgSession = connectPgSimple(session);
const isProd = process.env.NODE_ENV === "production";

const app: Express = express();

if (isProd) {
  app.set("trust proxy", 1);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "sessions",
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || "classe-a-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProd ? "lax" : false,
    },
  })
);

app.use("/api", router);
app.use("/api", (error: any, req: any, res: any, _next: any) => {
  const status = Number(error?.status ?? error?.statusCode);
  if (error?.type === "entity.too.large" || status === 413) {
    res.status(413).json({ error: "A solicitação excede o tamanho permitido." });
    return;
  }
  if (error?.type === "entity.parse.failed" || status === 400) {
    res.status(400).json({ error: "O corpo da solicitação é inválido." });
    return;
  }

  req.log?.error({ error: { message: error?.message } }, "API request failed");
  res.status(500).json({ error: "Não foi possível concluir a solicitação." });
});

if (isProd) {
  const frontendDist = path.resolve(process.cwd(), "artifacts/classe-a/dist/public");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }
}

export default app;
