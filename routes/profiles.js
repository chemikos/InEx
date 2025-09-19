const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. Tworzenie nowego profilu (POST)
router.post('/', (req, res) => {
  const { profileName } = req.body;
  if (!profileName) {
    return res.status(400).json({ error: 'Nazwa profilu jest wymagana.' });
  }

  const sql = 'INSERT INTO profiles (name) VALUES (?)';
  db.run(sql, [profileName], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res
          .status(409)
          .json({ error: 'Profil o tej nazwie już istnieje.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res
      .status(201)
      .json({ profileId: this.lastID, message: 'Profil dodano pomyślnie!' });
  });
});

// 2. Pobieranie wszystkich profili (GET)
router.get('/', (req, res) => {
  db.all('SELECT * FROM profiles ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// 3. Pobieranie pojedynczego profilu (GET)
router.get('/:profileId', (req, res) => {
  const { profileId } = req.params;
  db.get(
    'SELECT * FROM profiles WHERE id_profile = ?',
    [profileId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res
          .status(404)
          .json({ message: 'Profil o podanym ID nie istnieje.' });
      }
      res.status(200).json(row);
    },
  );
});

// 4. Edycja profilu (PUT)
router.put('/:profileId', (req, res) => {
  const { profileId } = req.params;
  const { profileName } = req.body;
  if (!profileName) {
    return res.status(400).json({ error: 'Nazwa profilu jest wymagana.' });
  }

  db.run(
    'UPDATE profiles SET name = ? WHERE id_profile = ?',
    [profileName, profileId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ message: 'Profil o podanym ID nie istnieje.' });
      }
      res.json({ message: 'Profil zaktualizowany pomyślnie.' });
    },
  );
});

// 5. Usuwanie profilu (DELETE)
router.delete('/:profileId', (req, res) => {
  const { profileId } = req.params;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    // Sprawdzenie, czy profil jest używany w jakiejkolwiek tabeli
    const checks = [
      'SELECT COUNT(*) AS count FROM expenses WHERE fk_profile = ?',
      'SELECT COUNT(*) AS count FROM items WHERE fk_profile = ?',
      'SELECT COUNT(*) AS count FROM category WHERE fk_profile = ?',
      'SELECT COUNT(*) AS count FROM labels WHERE fk_profile = ?',
    ];

    let totalCount = 0;
    let completedChecks = 0;

    checks.forEach((sql) => {
      db.get(sql, [profileId], (err, row) => {
        completedChecks++;
        if (err) {
          db.run('ROLLBACK;');
          return res.status(500).json({ error: err.message });
        }
        totalCount += row.count;

        // Po wszystkich sprawdzeniach
        if (completedChecks === checks.length) {
          if (totalCount > 0) {
            db.run('ROLLBACK;');
            return res
              .status(409)
              .json({
                message:
                  'Nie można usunąć profilu, ponieważ istnieją powiązane z nim dane.',
              });
          } else {
            // Jeśli nie ma powiązanych danych, usuń profil
            db.run(
              'DELETE FROM profiles WHERE id_profile = ?',
              [profileId],
              function (err) {
                if (err) {
                  db.run('ROLLBACK;');
                  return res.status(500).json({ error: err.message });
                }
                if (this.changes === 0) {
                  db.run('ROLLBACK;');
                  return res
                    .status(404)
                    .json({ message: 'Profil o podanym ID nie istnieje.' });
                }
                db.run('COMMIT;');
                res.json({ message: 'Profil usunięty pomyślnie.' });
              },
            );
          }
        }
      });
    });
  });
});

module.exports = router;
