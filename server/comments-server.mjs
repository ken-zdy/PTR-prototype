import cors from "cors";
import express from "express";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const app = express();
const PORT = Number(process.env.COMMENTS_API_PORT || 8787);
const DATA_DIR = path.resolve(process.cwd(), ".local-data");
const DB_PATH = path.join(DATA_DIR, "comments.db");
const DOC_ID = "global-comments";

mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  create table if not exists comment_state (
    id text primary key,
    payload text not null,
    updated_at text not null
  );
`);

const getStmt = db.prepare("select payload, updated_at from comment_state where id = ?");
const upsertStmt = db.prepare(`
  insert into comment_state (id, payload, updated_at)
  values (?, ?, datetime('now'))
  on conflict(id) do update set
    payload = excluded.payload,
    updated_at = datetime('now')
`);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/comments", (_req, res) => {
  try {
    const row = getStmt.get(DOC_ID);
    if (!row) {
      return res.json({ payload: [], updatedAt: null });
    }
    const payload = JSON.parse(row.payload);
    return res.json({ payload, updatedAt: row.updated_at });
  } catch (err) {
    console.error("[comments-api] get failed", err);
    return res.status(500).json({ error: "failed_to_read_comments" });
  }
});

app.put("/api/comments", (req, res) => {
  try {
    const incoming = req.body?.payload;
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: "payload_must_be_array" });
    }
    upsertStmt.run(DOC_ID, JSON.stringify(incoming));
    const row = getStmt.get(DOC_ID);
    return res.json({ ok: true, updatedAt: row?.updated_at ?? null });
  } catch (err) {
    console.error("[comments-api] put failed", err);
    return res.status(500).json({ error: "failed_to_write_comments" });
  }
});

app.listen(PORT, () => {
  console.log(`[comments-api] running at http://localhost:${PORT}`);
  console.log(`[comments-api] sqlite file: ${DB_PATH}`);
});
