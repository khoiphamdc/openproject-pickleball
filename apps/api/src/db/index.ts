import Database from 'better-sqlite3';
import { env } from '../config/env.js';
import fs from 'node:fs';
import path from 'node:path';

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });

export const db: Database.Database = new Database(env.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function runMigrations() {
  const sql = fs.readFileSync(
    new URL('./migrations/001_init.sql', import.meta.url),
    'utf-8'
  );
  db.exec(sql);
}