import { db, count, query, update } from "./db";
import { hashPassword } from "./password";

/**
 * Initializes the SQLite schema and seeds it with the sample data from the
 * original MySQL dump (cp4776_tradingapp.sql).
 */
export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      email    TEXT UNIQUE NOT NULL,
      name     TEXT NOT NULL,
      password TEXT NOT NULL,
      cash     REAL NOT NULL DEFAULT 50000,
      equity   REAL
    );

    CREATE TABLE IF NOT EXISTS symbols (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol        TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      bid           REAL NOT NULL,
      ask           REAL NOT NULL,
      open          REAL NOT NULL,
      previousClose REAL NOT NULL,
      lastTrade     REAL NOT NULL,
      high          REAL NOT NULL,
      low           REAL NOT NULL,
      volume        INTEGER NOT NULL,
      high52        REAL NOT NULL,
      low52         REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portfolios (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      userId   INTEGER,
      symbol   TEXT,
      qty      INTEGER,
      avgprice REAL,
      date     TEXT,
      UNIQUE (userId, symbol),
      FOREIGN KEY (symbol) REFERENCES symbols (symbol),
      FOREIGN KEY (userId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      price  REAL NOT NULL,
      qty    INTEGER NOT NULL,
      type   TEXT NOT NULL,
      date   TEXT NOT NULL,
      FOREIGN KEY (symbol) REFERENCES symbols (symbol),
      FOREIGN KEY (userId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS passresets (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      userID        INTEGER UNIQUE NOT NULL,
      secretToken   TEXT NOT NULL,
      expiryDateTime TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT,
      openPrice  REAL,
      high       REAL,
      low        REAL,
      closePrice REAL,
      volume     INTEGER
    );
  `);

  // One-time migration: the legacy DB dump stored seed passwords in plain
  // text. Hash any such row in place (its stored value is the real password),
  // so a pre-existing database keeps working now that plain-text support is
  // removed.
  const plainRows = query(
    "SELECT id, password FROM users WHERE password NOT LIKE '$2%'",
  );
  for (const row of plainRows) {
    update(
      "users",
      { password: hashPassword(row.password as string) },
      "id = ?",
      row.id,
    );
  }

  if (count("users") > 0) return;

  const insertUser = db.prepare(
    "INSERT INTO users (id, email, name, password, cash, equity) VALUES (?, ?, ?, ?, ?, ?)",
  );
  // Passwords are stored as bcrypt hashes only (never plain text). These are
  // precomputed hashes of the demo passwords; regenerate if a demo password
  // changes: `node -e "console.log(require('bcryptjs').hashSync('PW',10))"`.
  // `auth.test.ts` asserts logins with the plaintext demo passwords, so keep
  // the two in sync.
  insertUser.run(1, "grish@gmail.com", "grisha", "$2a$10$hcAPdCOhy2feLWkXL2V9R.721LsllGVT7O4BTzE.nCdWXcNFfQG12", 49831.0, 55198.45);
  insertUser.run(2, "Forza11879@gmail.com", "Forza", "$2a$10$zN9mTByDyFw7tM6IVU60m.Llo80xfT6bsRPthK.QpZq1lYR1ErkMO", 49878.8, 49989.3);
  insertUser.run(3, "ipd9@gmail.com", "ipd9", "$2a$10$v.5017WgxyGhdkA0K9nYMuJJ55awZRNmjJ/zrHxoMrws55yYEaUbW", 50000.0, 50000.0);

  const insertSymbol = db.prepare(
    `INSERT INTO symbols
     (id, symbol, name, bid, ask, open, previousClose, lastTrade, high, low, volume, high52, low52)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const symbols: Array<[number, string, string, number, number, number, number, number, number, number, number, number, number]> = [
    [1, "AAPL", "Apple Inc.", 153.3, 153.5, 154.0, 153.87, 153.61, 154.24, 153.31, 21927637, 156.65, 91.5],
    [5, "TSLA", "Tesla, Inc.", 325.33, 325.93, 317.28, 316.83, 325.14, 325.49, 316.31, 7802199, 327.66, 178.19],
    [7, "F", "Ford Motor Company", 0, 0, 10.85, 10.86, 10.93, 10.94, 10.81, 28176454, 14.04, 10.67],
    [8, "EBAY", "eBay Inc.", 34.72, 35.08, 35.26, 35.22, 34.9, 35.26, 34.66, 6622496, 35.3, 22.3],
    [9, "JPM", "JP Morgan Chase & Co. Common St", 0, 0, 85.99, 85.71, 85.35, 86.08, 85.08, 12238543, 93.98, 57.05],
    [19, "GOOG", "Alphabet Inc.", 963.2, 971.39, 969.7, 969.54, 971.47, 974.98, 965.03, 1252010, 974.98, 663.28],
    [20, "FAS", "Direxion Financial Bull 3X Shar", 0, 0, 44.53, 44.86, 44.7, 44.93, 44.3, 1120326, 51.11, 21.14],
    [219, "XLF", "SPDR Select Sector Fund - Finan", 0, 0, 23.56, 23.62, 23.61, 23.68, 23.56, 42601706, 25.3, 17.32],
    [220, "ADSK", "Autodesk, Inc.", 110.5, 113.01, 114.24, 113.89, 113.03, 114.42, 112.87, 2109782, 114.68, 49.82],
    [221, "QQQ", "PowerShares QQQ Trust, Series 1", 141.3, 141.33, 141.0, 140.97, 141.22, 141.28, 140.81, 13851582, 141.33, 101.75],
    [1153, "WFC", "Wells Fargo & Company", 0, 0, 52.63, 52.78, 52.41, 52.81, 52.37, 14247740, 59.99, 43.55],
    [1155, "GE", "General Electric Company", 0, 0, 27.46, 27.49, 27.45, 27.55, 27.29, 30624045, 33.0, 27.1],
  ];
  for (const s of symbols) insertSymbol.run(...s);

  const insertPortfolio = db.prepare(
    "INSERT INTO portfolios (id, userId, symbol, qty, avgprice, date) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const portfolios: Array<[number, number, string, number, number, string | null]> = [
    [1, 1, "FAS", 5, 0.0, null],
    [3, 1, "F", 12, 10.88, null],
    [5, 1, "EBAY", 80, 33.83, null],
    [6, 1, "TSLA", 5, 100.0, null],
    [7, 1, "GOOG", 1, 100.0, null],
    [9, 2, "ADSK", 1, 113.01, null],
  ];
  for (const p of portfolios) insertPortfolio.run(...p);

  const insertTransaction = db.prepare(
    "INSERT INTO transactions (id, userId, symbol, price, qty, type, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const transactions: Array<[number, number, string, number, number, string, string]> = [
    [1, 1, "EBAY", 34.0, 15, "buy", "0000-00-00 00:00:00"],
    [2, 1, "EBAY", 33.83, 5, "buy", "0000-00-00 00:00:00"],
    [3, 1, "EBAY", 33.83, 5, "bought", "2017-05-21 00:00:00"],
    [4, 1, "EBAY", 33.83, 10, "bought", "2017-05-21 00:00:00"],
    [5, 1, "EBAY", 33.83, 5, "bought", "2017-05-21 00:00:00"],
    [6, 2, "GOOG", 971.39, 1, "buy", "2017-05-29 10:43:56"],
    [7, 2, "GOOG", 963.2, 1, "sell", "2017-05-29 10:44:17"],
    [8, 2, "ADSK", 113.01, 1, "buy", "2017-05-29 12:14:03"],
  ];
  for (const t of transactions) insertTransaction.run(...t);

  // sync sequences
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','symbols','portfolios','transactions')");
  for (const t of ["users", "symbols", "portfolios", "transactions"]) {
    const max = query(`SELECT COALESCE(MAX(id),0) AS m FROM ${t}`)[0].m as number;
    if (max > 0) db.exec(`UPDATE sqlite_sequence SET seq = ${max} WHERE name = '${t}'`);
  }
}

export function resetDb(): void {
  db.exec("DELETE FROM passresets");
  db.exec("DELETE FROM history");
  db.exec("DELETE FROM transactions");
  db.exec("DELETE FROM portfolios");
  db.exec("DELETE FROM symbols");
  db.exec("DELETE FROM users");
  initDb();
}