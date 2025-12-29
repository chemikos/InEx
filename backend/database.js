// ========================================
// InEx – database.js
// ========================================
require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const util = require('util');
const { path: dbPathFromConfig } = require('./config/dbConfig');

// --- Ustalanie ścieżki bazy ---
const dbPath = path.resolve(__dirname, dbPathFromConfig);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Błąd połączenia z bazą danych:', err.message);
  else console.log(`✅ Połączono z bazą danych: ${dbPath}`);
});

// --- Promisyfikacja metod SQLite ---
db.getPromise = util.promisify(db.get);
db.allPromise = util.promisify(db.all);
db.runPromise = function (...args) {
  return new Promise((resolve, reject) => {
    db.run(...args, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// --- Włączenie obsługi kluczy obcych ---
db.run('PRAGMA foreign_keys = ON');

// --- Zapytania CREATE TABLE ---
const tableQueries = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id_profile INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id_category INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fk_profile INTEGER,
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile),
    UNIQUE(name, fk_profile)
  )`,
  `CREATE TABLE IF NOT EXISTS items (
    id_item INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fk_profile INTEGER,
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  )`,
  `CREATE TABLE IF NOT EXISTS labels (
    id_label INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fk_profile INTEGER,
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile),
    UNIQUE(name, fk_profile)
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id_expense INTEGER PRIMARY KEY AUTOINCREMENT,
    fk_item INTEGER,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    fk_profile INTEGER,
    FOREIGN KEY (fk_item) REFERENCES items(id_item),
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  )`,
  `CREATE TABLE IF NOT EXISTS item_category (
    fk_item INTEGER,
    fk_category INTEGER,
    PRIMARY KEY (fk_item, fk_category),
    FOREIGN KEY (fk_item) REFERENCES items(id_item),
    FOREIGN KEY (fk_category) REFERENCES categories(id_category)
  )`,
  `CREATE TABLE IF NOT EXISTS item_label (
    fk_item INTEGER,
    fk_label INTEGER,
    PRIMARY KEY (fk_item, fk_label),
    FOREIGN KEY (fk_item) REFERENCES items(id_item),
    FOREIGN KEY (fk_label) REFERENCES labels(id_label)
  )`,
  `CREATE TABLE IF NOT EXISTS sources (
    id_source INTEGER PRIMARY KEY AUTOINCREMENT,
    fk_profile INTEGER NOT NULL,
    name TEXT NOT NULL,
    UNIQUE (fk_profile, name),
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  )`,
  `CREATE TABLE IF NOT EXISTS incomes (
    id_income INTEGER PRIMARY KEY AUTOINCREMENT,
    fk_profile INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    fk_source INTEGER NOT NULL,
    FOREIGN KEY (fk_source) REFERENCES sources(id_source),
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  )`,
  `CREATE TABLE IF NOT EXISTS daily_summary (
    id_summary INTEGER PRIMARY KEY AUTOINCREMENT,
    fk_profile INTEGER NOT NULL,
    date TEXT NOT NULL,
    total_expense_amount INTEGER NOT NULL DEFAULT 0,
    average_daily_expense INTEGER NOT NULL DEFAULT 0,
    UNIQUE (fk_profile, date),
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  )`,
];

// --- Utworzenie tabel i aktualizacja daily_summary ---
db.serialize(async () => {
  for (const query of tableQueries) {
    db.run(query, (err) => {
      if (err) console.error('❌ Błąd przy tworzeniu tabeli:', err.message);
    });
  }
  console.log('✅ Struktura bazy danych została utworzona.');

  // ------------------------------------------------
  // --- Aktualizacja tabeli daily_summary ---
  // try {
  //   const row = await db.getPromise('SELECT MAX(date) AS lastDate FROM daily_summary');
  //   const safeDate = row?.lastDate || '2000-01-01';

  //   // --- Przygotowanie tabeli pomocniczej numbers ---
  //   await db.runPromise(`CREATE TABLE IF NOT EXISTS numbers (n INTEGER PRIMARY KEY);`);
  //   await db.runPromise(
  //     `WITH RECURSIVE cnt(n) AS (
  //       SELECT 0 UNION ALL SELECT n + 1 FROM cnt WHERE n < 30000
  //     )
  //     INSERT OR IGNORE INTO numbers(n)
  //     SELECT n FROM cnt;`
  //   );

  //   // --- Dodanie brakujących dni TYLKO dla profili z wydatkami ---
  //   await db.runPromise(
  //     `INSERT OR IGNORE INTO daily_summary (fk_profile, date)
  //      SELECT p.id_profile, date(?, '+' || n || ' days')
  //      FROM profiles p
  //      JOIN (SELECT DISTINCT fk_profile FROM expenses) AS e ON e.fk_profile = p.id_profile
  //      JOIN numbers
  //      WHERE date(?, '+' || n || ' days') <= date('now');`,
  //     [safeDate, safeDate]
  //   );

  //   // --- Aktualizacja sum dziennych ---
  //   await db.runPromise(
  //     `UPDATE daily_summary
  //      SET total_expense_amount = (
  //        SELECT COALESCE(SUM(e.amount), 0)
  //        FROM expenses e
  //        WHERE e.fk_profile = daily_summary.fk_profile
  //        AND e.date = daily_summary.date
  //      )
  //      WHERE daily_summary.date >= ?;`,
  //     [safeDate]
  //   );

  //   // --- Aktualizacja średniej kroczącej ---
  //   await db.runPromise(
  //     `UPDATE daily_summary AS d
  //      SET average_daily_expense = (
  //        SELECT CAST(SUM(ds.total_expense_amount) * 1.0 / COUNT(*) AS INTEGER)
  //        FROM daily_summary AS ds
  //        WHERE ds.fk_profile = d.fk_profile
  //        AND ds.date <= d.date
  //      )
  //      WHERE d.date >= ?;`,
  //     [safeDate]
  //   );

  //   console.log(`✅ daily_summary zaktualizowana od ${safeDate}`);
  // } catch (err) {
  //   console.error('⚠️ Błąd przy aktualizacji daily_summary:', err.message);
  // }

  // --- Weryfikacja bazy (jeśli włączona) ---
  if (process.env.VERIFY_DB === 'true') {
    await verifyDatabase(db);
  }
});

// --- Funkcja sanity-check bazy danych ---
async function verifyDatabase(db) {
  try {
    console.log('\n🔍 Weryfikacja struktury bazy danych...\n');

    const tables = await db.allPromise(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
    `);
    const expectedTables = [
      'profiles',
      'categories',
      'items',
      'labels',
      'expenses',
      'item_category',
      'item_label',
      'sources',
      'incomes',
      'daily_summary',
      'numbers',
    ];
    const existingTables = tables.map((t) => t.name);
    const missingTables = expectedTables.filter((t) => !existingTables.includes(t));

    if (missingTables.length > 0) console.warn('⚠️ Brakujące tabele:', missingTables.join(', '));
    else console.log('✅ Wszystkie wymagane tabele istnieją.');

    const counts = {};
    for (const table of expectedTables) {
      const row = await db.getPromise(`SELECT COUNT(*) AS count FROM ${table}`);
      counts[table] = row ? row.count : 0;
    }

    console.log('\n📊 Liczba rekordów:');
    for (const [table, count] of Object.entries(counts)) {
      console.log(`   ${table.padEnd(15)}: ${count}`);
    }

    const rows = await db.allPromise(`
      SELECT p.id_profile, p.name,
             COUNT(DISTINCT e.date) AS expense_days,
             COUNT(DISTINCT d.date) AS summary_days
      FROM profiles p
      LEFT JOIN expenses e ON e.fk_profile = p.id_profile
      LEFT JOIN daily_summary d ON d.fk_profile = p.id_profile
      GROUP BY p.id_profile, p.name;
    `);

    console.log('\n📅 Sprawdzenie spójności profili:');
    rows.forEach((r) => {
      const status =
        r.expense_days === 0
          ? '⚠️ Brak wydatków (OK jeśli nowy profil)'
          : r.summary_days >= r.expense_days
            ? '✅ OK'
            : '⚠️ Niespójność (daily_summary niepełne)';
      console.log(
        `   Profil ${r.id_profile.toString().padEnd(2)} (${r.name.padEnd(15)}) → wydatki: ${r.expense_days
          .toString()
          .padEnd(3)}, podsumowania: ${r.summary_days.toString().padEnd(3)} ${status}`
      );
    });

    console.log('\n🟢 Weryfikacja zakończona.\n');
  } catch (err) {
    console.error('❌ Błąd podczas weryfikacji bazy:', err.message);
  }
}

module.exports = db;
