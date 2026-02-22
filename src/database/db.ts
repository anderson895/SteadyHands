import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('steadyhand.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    UNIQUE NOT NULL,
      password      TEXT    NOT NULL,
      name          TEXT    NOT NULL,
      role          TEXT    DEFAULT 'patient',
      daily_goal    INTEGER DEFAULT 5,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      exercise_type   TEXT    NOT NULL,
      exercise_name   TEXT    NOT NULL,
      duration_seconds INTEGER DEFAULT 0,
      accuracy_score  REAL    DEFAULT 0,
      completed       INTEGER DEFAULT 1,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  return db;
};

const getDB = () => {
  if (!db) throw new Error('Database not initialised. Call initDB() first.');
  return db;
};

// ── Users ────────────────────────────────────────────────────────
export const createUser = async (
  username: string,
  password: string,
  name: string,
  role: 'patient' | 'caregiver' = 'patient',
) => {
  const result = await getDB().runAsync(
    'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
    [username, password, name, role],
  );
  return result.lastInsertRowId;
};

export const loginUser = async (username: string, password: string) => {
  return await getDB().getFirstAsync<any>(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
  );
};

export const getUserById = async (id: number) => {
  return await getDB().getFirstAsync<any>('SELECT * FROM users WHERE id = ?', [id]);
};

export const updateDailyGoal = async (userId: number, goal: number) => {
  await getDB().runAsync('UPDATE users SET daily_goal = ? WHERE id = ?', [goal, userId]);
};

// ── Sessions ─────────────────────────────────────────────────────
export const saveSession = async (
  userId: number,
  exerciseType: string,
  exerciseName: string,
  durationSeconds: number,
  accuracyScore: number,
) => {
  const result = await getDB().runAsync(
    `INSERT INTO sessions
       (user_id, exercise_type, exercise_name, duration_seconds, accuracy_score, completed)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [userId, exerciseType, exerciseName, durationSeconds, accuracyScore],
  );
  return result.lastInsertRowId;
};

export const getTodaySessions = async (userId: number) => {
  return await getDB().getAllAsync<any>(
    `SELECT * FROM sessions
     WHERE user_id = ? AND DATE(created_at) = DATE('now')
     ORDER BY created_at DESC`,
    [userId],
  );
};

export const getWeeklySessions = async (userId: number) => {
  return await getDB().getAllAsync<any>(
    `SELECT * FROM sessions
     WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
     ORDER BY created_at DESC`,
    [userId],
  );
};

export const getProgressStats = async (userId: number) => {
  const today = await getDB().getFirstAsync<any>(
    `SELECT
       COUNT(*)             AS total_exercises,
       SUM(duration_seconds) AS total_time,
       AVG(accuracy_score)  AS avg_accuracy
     FROM sessions
     WHERE user_id = ? AND DATE(created_at) = DATE('now')`,
    [userId],
  );
  const weekly = await getDB().getFirstAsync<any>(
    `SELECT
       COUNT(*)             AS total_exercises,
       SUM(duration_seconds) AS total_time,
       AVG(accuracy_score)  AS avg_accuracy
     FROM sessions
     WHERE user_id = ? AND created_at >= datetime('now', '-7 days')`,
    [userId],
  );
  return { today, weekly };
};

export const getAllPatientProgress = async () => {
  return await getDB().getAllAsync<any>(
    `SELECT
       u.*,
       (SELECT COUNT(*)
          FROM sessions s
         WHERE s.user_id = u.id
           AND DATE(s.created_at) = DATE('now'))       AS today_count,
       (SELECT AVG(accuracy_score)
          FROM sessions s
         WHERE s.user_id = u.id
           AND s.created_at >= datetime('now', '-7 days')) AS weekly_accuracy
     FROM users u
     WHERE u.role = 'patient'
     ORDER BY u.name`,
  );
};
