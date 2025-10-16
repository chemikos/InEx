const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/InEx.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Połączono z bazą danych InEx.db.');
});

// //
// db.run(`
//       CREATE TABLE IF NOT EXISTS daily_summary (
//         id_summary INTEGER PRIMARY KEY AUTOINCREMENT,
//         fk_profile INTEGER NOT NULL,
//         date TEXT NOT NULL,
//         total_expense_amount REAL NOT NULL DEFAULT 0.0,
//         average_daily_expense REAL NOT NULL DEFAULT 0.0,
//         UNIQUE (fk_profile, date),
//         FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
//       )
//     `);

// db.run(`
// -- Generowanie 50 pozycji (10 na kategorię)
// INSERT INTO items (fk_profile, name) VALUES
// -- Kategoria 1: Jedzenie
// (1, 'Kawa na wynos'), (1, 'Obiad w pracy'), (1, 'Zakupy spożywcze A'), (1, 'Fast food'), (1, 'Kolacja restauracja'),
// (1, 'Woda mineralna'), (1, 'Śniadanie dom'), (1, 'Ciastko'), (1, 'Sok'), (1, 'Zakupy spożywcze B'),
// -- Kategoria 2: Transport
// (1, 'Bilet autobusowy'), (1, 'Paliwo A'), (1, 'Taksówka'), (1, 'Ubezpieczenie auta'), (1, 'Myjnia samochodowa'),
// (1, 'Parking'), (1, 'Bilet pociąg'), (1, 'Paliwo B'), (1, 'Przejazd autostradą'), (1, 'Rower miejski'),
// -- Kategoria 3: Rozrywka
// (1, 'Bilet do kina'), (1, 'Konsola gry'), (1, 'Subskrypcja A'), (1, 'Książka'), (1, 'Wyjście ze znajomymi'),
// (1, 'Wystawa'), (1, 'Bilet koncert'), (1, 'Klub fitness'), (1, 'Muzeum'), (1, 'Subskrypcja B'),
// -- Kategoria 4: Rachunki
// (1, 'Czynsz'), (1, 'Prąd'), (1, 'Internet'), (1, 'Telefon'), (1, 'Gaz'),
// (1, 'Woda'), (1, 'Opłata za śmieci'), (1, 'Abonament TV'), (1, 'Rata kredytu'), (1, 'Ubezpieczenie mieszkania'),
// -- Kategoria 5: Zdrowie
// (1, 'Wizyta u lekarza A'), (1, 'Leki A'), (1, 'Suplementy'), (1, 'Optyk'), (1, 'Masaż'),
// (1, 'Wizyta u lekarza B'), (1, 'Leki B'), (1, 'Karma dla psa'), (1, 'Apteka'), (1, 'Basen');
//   `);

// db.run(`
// INSERT INTO expenses (fk_item, amount, date, fk_profile) VALUES
// (1, 15.00, '2024-09-15', 1), (2, 25.00, '2024-09-15', 1), (3, 85.00, '2024-09-15', 1),
// (11, 45.50, '2024-09-16', 1), (12, 120.00, '2024-09-16', 1), (13, 30.00, '2024-09-16', 1),
// (21, 5.00, '2024-09-17', 1), (22, 150.00, '2024-09-17', 1),
// (31, 1500.00, '2024-09-18', 1), (32, 120.00, '2024-09-18', 1),
// (41, 180.00, '2024-09-19', 1), (42, 25.00, '2024-09-19', 1), (43, 35.00, '2024-09-19', 1),
// (5, 150.00, '2024-09-20', 1), (15, 60.00, '2024-09-20', 1),
// (25, 30.00, '2024-09-21', 1), (35, 80.00, '2024-09-21', 1),
// (45, 100.00, '2024-09-22', 1), (50, 40.00, '2024-09-22', 1),
// (10, 150.00, '2024-09-23', 1), (20, 25.00, '2024-09-23', 1), (30, 10.00, '2024-09-23', 1),
// (40, 120.00, '2024-09-24', 1);
//   `);

// db.run(`
// INSERT INTO expenses (fk_item, amount, date, fk_profile) VALUES
// (1, 15.00, '2024-09-01', 1), (11, 45.50, '2024-09-01', 1), (21, 5.00, '2024-09-01', 1),
// (2, 25.00, '2024-09-02', 1), (12, 120.00, '2024-09-02', 1), (31, 1500.00, '2024-09-02', 1),
// (3, 85.00, '2024-09-03', 1), (41, 180.00, '2024-09-03', 1),
// (4, 30.00, '2024-09-04', 1), (14, 500.00, '2024-09-04', 1),
// (5, 150.00, '2024-09-05', 1), (25, 30.00, '2024-09-05', 1), (45, 100.00, '2024-09-05', 1),
// (6, 12.00, '2024-09-06', 1), (16, 10.00, '2024-09-06', 1),
// (7, 8.00, '2024-09-07', 1), (17, 45.00, '2024-09-07', 1), (27, 89.99, '2024-09-07', 1),
// (8, 6.00, '2024-09-08', 1), (18, 120.00, '2024-09-08', 1), (38, 99.00, '2024-09-08', 1),
// (9, 75.00, '2024-09-09', 1), (19, 25.00, '2024-09-09', 1);
//   `);

// db.run(`
// INSERT INTO item_label (fk_item, fk_label)
// SELECT id_item, 1 FROM items WHERE id_item BETWEEN 1 AND 40;
//   `);

// db.run(`
// INSERT INTO item_label (fk_item, fk_label)
// SELECT id_item, 2 FROM items WHERE id_item BETWEEN 1 AND 40;
//   `);

// db.run(`
// INSERT INTO item_category (fk_item, fk_category)
// SELECT id_item, CEIL(id_item / 10.0) FROM items WHERE fk_profile = 1;
//   `);

// db.run(`
// INSERT INTO labels (fk_profile, name) VALUES
// (1, 'Weekend'),
// (1, 'Pilne'),
// (1, 'Cashback');
//   `);

//   db.run(`
// INSERT INTO profiles (name) VALUES ('Testowy Profil');
//   `);

//   db.run(`
// INSERT INTO categories (fk_profile, name) VALUES
// (1, 'Jedzenie'),
// (1, 'Transport'),
// (1, 'Rozrywka'),
// (1, 'Rachunki'),
// (1, 'Zdrowie');
//   `);

// db.serialize(() => {
//   // Tworzenie tabeli profili
//   db.run(`
//     CREATE TABLE IF NOT EXISTS profiles (
//       id_profile INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT NOT NULL UNIQUE
//     )
//   `);

//   // Tworzenie tabeli kategorii z fk_profile
//   db.run(`
//     CREATE TABLE IF NOT EXISTS categories (
//       id_category INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT NOT NULL,
//       fk_profile INTEGER,
//       FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile),
//       UNIQUE(name, fk_profile)
//     )
//   `);

//   // Tworzenie tabeli nazw wydatków z fk_profile
//   db.run(`
//     CREATE TABLE IF NOT EXISTS items (
//       id_item INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT NOT NULL,
//       fk_profile INTEGER,
//       FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
//     )
//   `);

//   // Tworzenie tabeli etykiet z fk_profile
//   db.run(`
//     CREATE TABLE IF NOT EXISTS labels (
//       id_label INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT NOT NULL,
//       fk_profile INTEGER,
//       FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
//       UNIQUE(name, fk_profile)
//     )
//   `);

//   // Tworzenie tabeli wydatków z fk_profile
//   db.run(`
//     CREATE TABLE IF NOT EXISTS expenses (
//       id_expense INTEGER PRIMARY KEY AUTOINCREMENT,
//       fk_item INTEGER,
//       amount REAL NOT NULL,
//       date TEXT NOT NULL,
//       fk_profile INTEGER,
//       FOREIGN KEY (fk_item) REFERENCES items(id_item),
//       FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
//     )
//   `);

//   // Tworzenie tabeli item_category
//   db.run(`
//     CREATE TABLE IF NOT EXISTS item_category (
//       fk_item INTEGER,
//       fk_category INTEGER,
//       PRIMARY KEY (fk_item, fk_category),
//       FOREIGN KEY (fk_item) REFERENCES items(id_item),
//       FOREIGN KEY (fk_category) REFERENCES categories(id_category)
//     )
//   `);

//   // Tworzenie tabeli item_label
//   db.run(`
//     CREATE TABLE IF NOT EXISTS item_label (
//       fk_item INTEGER,
//       fk_label INTEGER,
//       PRIMARY KEY (fk_item, fk_label),
//       FOREIGN KEY (fk_item) REFERENCES items(id_item),
//       FOREIGN KEY (fk_label) REFERENCES labels(id_label)
//     )
//   `);

//   // Tworzenie tabeli sources
//   db.run(`
//     CREATE TABLE sources (
//     id_source INTEGER PRIMARY KEY AUTOINCREMENT,
//     fk_profile INTEGER NOT NULL,
//     name TEXT NOT NULL,
//     UNIQUE (fk_profile, name),
//     FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
// );
//   `);

//   // Tworzenie tabeli incomes
//   db.run(`
//     CREATE TABLE incomes (
//     id_income INTEGER PRIMARY KEY AUTOINCREMENT,
//     fk_profile INTEGER NOT NULL,
//     amount REAL NOT NULL,
//     date TEXT NOT NULL,
//     fk_source INTEGER NOT NULL,
//     FOREIGN KEY (fk_source) REFERENCES sources(id_source)
//     FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
// );
// `);

//   // do utworzenia, zrobić też taką tabelę ale bez old
//   db.run(`
//       CREATE TABLE IF NOT EXISTS daily_summary (
//         id_summary INTEGER PRIMARY KEY AUTOINCREMENT,
//         fk_profile INTEGER NOT NULL,
//         date TEXT NOT NULL,
//         total_expense_amount REAL NOT NULL DEFAULT 0.0,
//         average_daily_expense REAL NOT NULL DEFAULT 0.0,
//         UNIQUE (fk_profile, date),
//         FOREIGN KEY (fk_profile) REFERENCES profiles(id_profile)
//       )
//     `);

//   console.log('Struktura bazy danych została utworzona.');
// });

module.exports = db;
