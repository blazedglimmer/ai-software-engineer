import Database from 'better-sqlite3';
import type { AgentState } from '../agent/state.js';

export class StateStore {
  private readonly db: Database.Database;

  constructor(databasePath = './agent.db') {
    this.db = new Database(databasePath);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  save(id: string, state: AgentState): void {
    const now = new Date().toISOString();

    this.db
      .prepare(
        `
        INSERT INTO agent_runs (
          id,
          state,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          state = excluded.state,
          updated_at = excluded.updated_at
      `
      )
      .run(id, JSON.stringify(state), now, now);
  }

  load(id: string): AgentState | null {
    const row = this.db
      .prepare(
        `
        SELECT state
        FROM agent_runs
        WHERE id = ?
      `
      )
      .get(id) as { state: string } | undefined;

    if (!row) {
      return null;
    }

    return JSON.parse(row.state) as AgentState;
  }
}
