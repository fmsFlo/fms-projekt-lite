/*
  # Migration zu Supabase Auth

  1. Änderungen
    - Fügt `auth_user_id` Spalte zur User-Tabelle hinzu (Foreign Key zu auth.users)
    - Entfernt `passwordHash`, `resetToken`, `resetTokenExpires` (von Supabase Auth verwaltet)
    - Erstellt Foreign Key Constraint zu auth.users
    
  2. Sicherheit
    - Bestehende User-Daten bleiben erhalten
    - Auth-User müssen nach Migration manuell in Supabase Auth angelegt werden
    - RLS Policies bleiben unverändert
    
  3. Wichtige Hinweise
    - Nach dieser Migration müssen Admin-User über Supabase Auth neu angelegt werden
    - Die auth_user_id muss dann manuell mit den bestehenden User-Records verknüpft werden
    - Email bleibt als Referenz in der User-Tabelle
*/

-- Schritt 1: Füge auth_user_id Spalte hinzu (nullable, wird später ausgefüllt)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE "User" ADD COLUMN auth_user_id uuid;
  END IF;
END $$;

-- Schritt 2: Entferne alte Auth-Spalten (nur wenn sie existieren)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'passwordHash'
  ) THEN
    ALTER TABLE "User" DROP COLUMN "passwordHash";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'resetToken'
  ) THEN
    ALTER TABLE "User" DROP COLUMN "resetToken";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'resetTokenExpires'
  ) THEN
    ALTER TABLE "User" DROP COLUMN "resetTokenExpires";
  END IF;
END $$;

-- Schritt 3: Erstelle Foreign Key zu auth.users (wenn noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'User_auth_user_id_fkey'
    AND table_name = 'User'
  ) THEN
    ALTER TABLE "User" 
    ADD CONSTRAINT "User_auth_user_id_fkey" 
    FOREIGN KEY (auth_user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Schritt 4: Erstelle Index auf auth_user_id für Performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'User'
    AND indexname = 'User_auth_user_id_idx'
  ) THEN
    CREATE INDEX "User_auth_user_id_idx" ON "User"(auth_user_id);
  END IF;
END $$;

-- Schritt 5: Erstelle unique constraint auf auth_user_id (ein Supabase Auth User = ein App User)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'User_auth_user_id_key'
    AND table_name = 'User'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_auth_user_id_key" UNIQUE (auth_user_id);
  END IF;
END $$;