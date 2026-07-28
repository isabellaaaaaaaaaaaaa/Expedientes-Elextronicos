/*
# Create audit_logs table for the Bitácora module

## Purpose
Stores immutable audit records for every significant action in the SAM medical
records system — status changes, record creation, edits, deletions, logins, etc.
Records are INSERT-only: no UPDATE or DELETE policies are defined, so once a
row is written it cannot be modified or removed through the Supabase API.

## 1. New Tables

### `audit_logs`
| Column           | Type      | Description                                                   |
|------------------|-----------|---------------------------------------------------------------|
| id               | uuid PK   | Auto-generated unique identifier                              |
| user_name        | text      | Username of the person who performed the action               |
| user_role        | text      | Role of the user (Administrador / Doctora / Enfermera / Auditor) |
| action           | text      | Description of the action performed                           |
| expedient_id     | text      | ID of the expedient involved (nullable)                       |
| employee_id      | text      | ID of the employee affected (nullable)                        |
| employee_name    | text      | Full name of the affected employee (denormalized for display) |
| field            | text      | Name of the field that changed (nullable, for field-level logs) |
| old_value        | text      | Previous value (nullable)                                     |
| new_value        | text      | New value (nullable)                                          |
| ip_address       | text      | Simulated IP address of the client                            |
| created_at       | timestamptz | Timestamp with time zone of the action (defaults to now())  |

## 2. Indexes
- `idx_audit_logs_created_at` — descending on created_at for chronological sorting
- `idx_audit_logs_user_name` — for filtering by user
- `idx_audit_logs_employee_id` — for filtering by affected employee
- `idx_audit_logs_expedient_id` — for filtering by expedient

## 3. Security (RLS)
- RLS enabled on `audit_logs`.
- SELECT + INSERT allowed for `anon, authenticated` (single-tenant app, no sign-in screen).
- NO UPDATE or DELETE policies — records are immutable once written.
*/

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name     text NOT NULL,
  user_role     text NOT NULL DEFAULT '',
  action        text NOT NULL,
  expedient_id  text,
  employee_id   text,
  employee_name text,
  field         text,
  old_value     text,
  new_value     text,
  ip_address    text NOT NULL DEFAULT '0.0.0.0',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone (single-tenant, no auth screen) can read audit logs
DROP POLICY IF EXISTS "audit_logs_select_all" ON audit_logs;
CREATE POLICY "audit_logs_select_all"
ON audit_logs FOR SELECT
TO anon, authenticated USING (true);

-- INSERT: anyone can create audit log entries
DROP POLICY IF EXISTS "audit_logs_insert_all" ON audit_logs;
CREATE POLICY "audit_logs_insert_all"
ON audit_logs FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- Intentionally NO UPDATE or DELETE policies — audit records are immutable.

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_name ON audit_logs (user_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_employee_id ON audit_logs (employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_expedient_id ON audit_logs (expedient_id);
