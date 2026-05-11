import path from "node:path";
import { config as dotenvConfig } from "dotenv";
import { defineConfig } from "prisma/config";

// Carrega .env.local — único arquivo de runtime (Prisma sozinho lê só .env)
dotenvConfig({ path: ".env.local", override: true });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
