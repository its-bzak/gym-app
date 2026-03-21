import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("gym.db");

export function initDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      created_at TEXT
    );
  `);
}