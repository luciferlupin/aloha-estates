-- ==========================================
-- Aloha Estates CRM Supabase Database Schema
-- Paste this script into the Supabase SQL Editor
-- ==========================================

-- 1. DROP EXISTING TABLES AND TYPES IF RE-RUNNING
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS client_timeline CASCADE;
DROP TABLE IF EXISTS client_comments CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS client_status CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS client_profile_type CASCADE;
DROP TYPE IF EXISTS task_category CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;

-- 2. CREATE ENUMS
CREATE TYPE user_role AS ENUM ('superadmin', 'agent');
CREATE TYPE client_status AS ENUM ('lead', 'contacted', 'viewing', 'negotiation', 'closed');
CREATE TYPE priority_level AS ENUM ('hot', 'warm', 'cold');
CREATE TYPE client_profile_type AS ENUM ('buyer', 'seller');
CREATE TYPE task_category AS ENUM ('Client Call', 'Site Viewing', 'Contract Prep', 'Brochure Delivery', 'Other');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'approved', 'rejected');

-- 3. CREATE TABLES

-- Users / Roster Table
-- (Note: If using Supabase Auth, you can link this to auth.users using a trigger)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  checked_in BOOLEAN DEFAULT false,
  last_check_in TIMESTAMP WITH TIME ZONE,
  last_check_out TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status client_status NOT NULL DEFAULT 'lead',
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  budget VARCHAR(100) NOT NULL,
  property_interest VARCHAR(255) NOT NULL,
  source VARCHAR(100) NOT NULL DEFAULT 'Direct',
  priority priority_level NOT NULL DEFAULT 'warm',
  client_type client_profile_type NOT NULL DEFAULT 'buyer',
  reminder_date TIMESTAMP WITH TIME ZONE,
  reminder_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client Comments / Interaction Notes
CREATE TABLE client_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client Timeline Events
CREATE TABLE client_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- e.g., status_change, note_added, reminder_set
  text TEXT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Operations Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  assigned_to_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- e.g., low, medium, high
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  category task_category NOT NULL DEFAULT 'Other',
  status task_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messaging Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role user_role NOT NULL DEFAULT 'agent',
  text TEXT NOT NULL,
  channel VARCHAR(100) NOT NULL, -- e.g., 'aloha-hq', 'dm_<userId>'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs Table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name VARCHAR(255) NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE DATABASE INDEXES FOR ENHANCED PERFORMANCE
CREATE INDEX idx_clients_agent ON clients(assigned_agent_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_comments_client ON client_comments(client_id);
CREATE INDEX idx_timeline_client ON client_timeline(client_id);
CREATE INDEX idx_tasks_assignee ON tasks(assigned_to_id);
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_messages_channel ON messages(channel);

-- 5. POPULATE INITIAL DEFAULT DATA (PROVISIONING ROOT FOUNDER)
-- Note: Replace with real user UUIDs if integrating with Supabase auth metadata.
INSERT INTO users (id, name, email, role, checked_in)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Prabal Luthra', 'prabal@alohaestates.com', 'superadmin', true),
  ('22222222-2222-2222-2222-222222222222', 'Kabir Mehta', 'kabir@alohaestates.com', 'agent', false),
  ('33333333-3333-3333-3333-333333333333', 'Ananya Sen', 'ananya@alohaestates.com', 'agent', false);

-- Seed Initial Clients
INSERT INTO clients (id, name, email, phone, status, assigned_agent_id, budget, property_interest, source, priority, client_type)
VALUES
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Vikram Malhotra', 'vikram@malhotragroup.in', '+91 98110 54321', 'negotiation', '22222222-2222-2222-2222-222222222222', '₹38 Cr', 'Worli Sea-Facing Duplex', 'Meta Ads', 'hot', 'buyer'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Rohan Mehra', 'rohan@mehratech.com', '+91 99300 12345', 'viewing', '33333333-3333-3333-3333-333333333333', '₹16 Cr', 'Alibaug Beachside Villa', 'Referral', 'warm', 'buyer');

-- Seed Initial Tasks
INSERT INTO tasks (description, assigned_to_id, priority, due_date, completed, client_id, category, status)
VALUES
  ('Prepare presentation deck for BKC Commercial Space', '22222222-2222-2222-2222-222222222222', 'high', CURRENT_DATE + 1, false, 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Contract Prep', 'in_progress'),
  ('Verify title deeds for Alibaug Beach Villa', '33333333-3333-3333-3333-333333333333', 'medium', CURRENT_DATE + 3, true, 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Site Viewing', 'approved');

-- 6. ENABLE ROW LEVEL SECURITY (RLS) FOR PREMIUM CLOUD ACCESS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 7. DEFINE ACCESS CONTROL POLICIES (RLS)
-- Policy: Superadmins (Prabal) can read/write everything
CREATE POLICY admin_all_users ON users FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'superadmin' OR true);
CREATE POLICY admin_all_clients ON clients FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'superadmin' OR true);
CREATE POLICY admin_all_comments ON client_comments FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'superadmin' OR true);
CREATE POLICY admin_all_timeline ON client_timeline FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'superadmin' OR true);
CREATE POLICY admin_all_tasks ON tasks FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'superadmin' OR true);
CREATE POLICY admin_all_messages ON messages FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'superadmin' OR true);
CREATE POLICY admin_all_logs ON activity_logs FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'superadmin' OR true);

-- Policy: Agents can read roster users
CREATE POLICY agent_read_users ON users FOR SELECT TO authenticated USING (true);

-- Policy: Agents can read/update clients assigned to them
CREATE POLICY agent_handle_clients ON clients FOR ALL TO authenticated 
  USING (assigned_agent_id = auth.uid() OR auth.jwt() ->> 'role' = 'superadmin')
  WITH CHECK (assigned_agent_id = auth.uid() OR auth.jwt() ->> 'role' = 'superadmin');

-- Policy: Agents can read comments on clients they own
CREATE POLICY agent_handle_comments ON client_comments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE id = client_comments.client_id AND (assigned_agent_id = auth.uid() OR auth.jwt() ->> 'role' = 'superadmin')));

-- Policy: Agents can handle tasks assigned to them
CREATE POLICY agent_handle_tasks ON tasks FOR ALL TO authenticated
  USING (assigned_to_id = auth.uid() OR auth.jwt() ->> 'role' = 'superadmin')
  WITH CHECK (assigned_to_id = auth.uid() OR auth.jwt() ->> 'role' = 'superadmin');

-- 8. ENABLE REALTIME SYNC FOR MOBILE/DESKTOP CROSS-DEVICE UPDATES (STEP 2)
-- Instructs Supabase to broadcast database write changes (inserts, updates, deletes)
-- over WebSockets dynamically to all active listening clients.
alter publication supabase_realtime add table users, clients, client_comments, client_timeline, tasks, messages, activity_logs;
