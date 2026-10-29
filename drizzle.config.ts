import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Prefer a direct Neon URL for schema migrations; runtime may use the pooled DATABASE_URL.
    url: process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL || "postgresql://example:example@localhost:5432/imibereho_lens",
  },
  strict: true,
  verbose: true,
});
