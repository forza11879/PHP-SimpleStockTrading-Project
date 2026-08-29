process.env.DB_PATH = ":memory:";

const { initDb } = await import("@/src/lib/schema");
initDb();

export {};