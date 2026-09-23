import type { SQLiteDatabase } from 'expo-sqlite';
import type { Account, AccountStatus, AccountType, TaxType } from '../types/account';

export const DB_NAME = 'pungcha.db';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        bank TEXT NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        rate REAL NOT NULL,
        taxType TEXT NOT NULL,
        startDate TEXT NOT NULL,
        termMonths INTEGER NOT NULL,
        maturityDate TEXT NOT NULL,
        payDay INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        memo TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    await db.execAsync('PRAGMA user_version = 1');
  }
}

interface AccountRow {
  id: string;
  name: string;
  bank: string;
  type: AccountType;
  amount: number;
  rate: number;
  taxType: TaxType;
  startDate: string;
  termMonths: number;
  maturityDate: string;
  payDay: number | null;
  status: AccountStatus;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToAccount(row: AccountRow): Account {
  return {
    ...row,
    payDay: row.payDay ?? undefined,
    memo: row.memo ?? undefined,
  };
}

export async function listAccounts(db: SQLiteDatabase): Promise<Account[]> {
  const rows = await db.getAllAsync<AccountRow>('SELECT * FROM accounts ORDER BY maturityDate ASC');
  return rows.map(rowToAccount);
}

export async function getAccount(db: SQLiteDatabase, id: string): Promise<Account | null> {
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?', id);
  return row ? rowToAccount(row) : null;
}

export async function insertAccount(db: SQLiteDatabase, account: Account): Promise<void> {
  await db.runAsync(
    `INSERT INTO accounts
      (id, name, bank, type, amount, rate, taxType, startDate, termMonths, maturityDate, payDay, status, memo, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    account.id,
    account.name,
    account.bank,
    account.type,
    account.amount,
    account.rate,
    account.taxType,
    account.startDate,
    account.termMonths,
    account.maturityDate,
    account.payDay ?? null,
    account.status,
    account.memo ?? null,
    account.createdAt,
    account.updatedAt
  );
}

export async function updateAccount(db: SQLiteDatabase, account: Account): Promise<void> {
  await db.runAsync(
    `UPDATE accounts SET
      name = ?, bank = ?, type = ?, amount = ?, rate = ?, taxType = ?,
      startDate = ?, termMonths = ?, maturityDate = ?, payDay = ?, status = ?, memo = ?, updatedAt = ?
     WHERE id = ?`,
    account.name,
    account.bank,
    account.type,
    account.amount,
    account.rate,
    account.taxType,
    account.startDate,
    account.termMonths,
    account.maturityDate,
    account.payDay ?? null,
    account.status,
    account.memo ?? null,
    account.updatedAt,
    account.id
  );
}

export async function deleteAccount(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM accounts WHERE id = ?', id);
}

export async function deleteAllAccounts(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM accounts');
}

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

export async function getAllSettings(db: SQLiteDatabase): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
