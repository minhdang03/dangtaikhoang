import path from "node:path";
import { defineConfig } from "prisma/config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
} as any);
