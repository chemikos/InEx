const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./InEx.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Połączono z bazą danych InEx.db.');
});

db.serialize(() => {
  // // Tworzenie tabeli profili
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS profiles (
  //     id_profile INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT NOT NULL UNIQUE
  //   )
  // `);

  // // Tworzenie tabeli kategorii z fk_profile
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS categories (
  //     id_category INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT NOT NULL,
  //     fk_profile INTEGER,
  //     FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile),
  //     UNIQUE(name, fk_profile)
  //   )
  // `);

  // // Tworzenie tabeli nazw wydatków z fk_profile
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS items (
  //     id_item INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT NOT NULL,
  //     fk_profile INTEGER,
  //     FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  //   )
  // `);

  // // Tworzenie tabeli etykiet z fk_profile
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS labels (
  //     id_label INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT NOT NULL,
  //     fk_profile INTEGER,
  //     FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  //     UNIQUE(name, fk_profile)
  //   )
  // `);

  // // Tworzenie tabeli wydatków z fk_profile
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS expenses (
  //     id_expense INTEGER PRIMARY KEY AUTOINCREMENT,
  //     fk_item INTEGER,
  //     amount REAL NOT NULL,
  //     date TEXT NOT NULL,
  //     fk_profile INTEGER,
  //     FOREIGN KEY (fk_item) REFERENCES items(id_item),
  //     FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
  //   )
  // `);

  // // Tworzenie tabeli item_category
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS item_category (
  //     fk_item INTEGER,
  //     fk_category INTEGER,
  //     PRIMARY KEY (fk_item, fk_category),
  //     FOREIGN KEY (fk_item) REFERENCES items(id_item),
  //     FOREIGN KEY (fk_category) REFERENCES category(id_category)
  //   )
  // `);

  // // Tworzenie tabeli item_label
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS item_label (
  //     fk_item INTEGER,
  //     fk_label INTEGER,
  //     PRIMARY KEY (fk_item, fk_label),
  //     FOREIGN KEY (fk_item) REFERENCES items(id_item),
  //     FOREIGN KEY (fk_label) REFERENCES labels(id_label)
  //   )
  // `);

  console.log('Struktura bazy danych została utworzona.');
});

module.exports = db;
