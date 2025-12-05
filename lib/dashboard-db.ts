import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DASHBOARD_DB_PATH || path.join(process.cwd(), 'fms-dashboard-master', 'backend', 'database', 'telefonie.db')

// Stelle sicher, dass das Datenbank-Verzeichnis existiert
const DB_DIR = path.dirname(DB_PATH)
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

// Öffne Datenbankverbindung
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Dashboard-Datenbank:', err.message)
  } else {
    console.log('Verbindung zur Dashboard SQLite Datenbank hergestellt.')
    // Aktiviere Foreign Keys
    db.run("PRAGMA foreign_keys = ON", (err) => {
      if (err) {
        console.error('Fehler beim Aktivieren von Foreign Keys:', err.message)
      }
    })
  }
})

// Promise-basierte Wrapper für Datenbankoperationen
export const dbGet = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

export const dbAll = (query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export const dbRun = (query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID || 0, changes: this.changes || 0 })
    })
  })
}

export { db }

