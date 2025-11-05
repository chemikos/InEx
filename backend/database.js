// ========================================
// InEx – database.js
// ========================================
require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { path: dbPathFromConfig } = require('./config/dbConfig');

// --- Ustalanie ścieżki bazy ---
const dbPath = path.resolve(__dirname, dbPathFromConfig);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Błąd połączenia z bazą danych:', err.message);
  else console.log(`✅ Połączono z bazą danych: ${dbPath}`);
});

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
    amount REAL NOT NULL,
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
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    fk_source INTEGER NOT NULL,
    FOREIGN KEY (fk_source) REFERENCES sources(id_source),
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  )`,

  `CREATE TABLE IF NOT EXISTS daily_summary (
    id_summary INTEGER PRIMARY KEY AUTOINCREMENT,
    fk_profile INTEGER NOT NULL,
    date TEXT NOT NULL,
    total_expense_amount REAL NOT NULL DEFAULT 0.0,
    average_daily_expense REAL NOT NULL DEFAULT 0.0,
    UNIQUE (fk_profile, date),
    FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  )`,
];

// --- Utworzenie tabel ---
db.serialize(() => {
  tableQueries.forEach((query) => {
    db.run(query, (err) => {
      if (err) console.error('❌ Błąd przy tworzeniu tabeli:', err.message);
    });
  });
  console.log('✅ Struktura bazy danych została utworzona.');
});

module.exports = db;
