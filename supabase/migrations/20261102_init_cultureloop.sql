-- SVM CultureLoop Initial Migration for Supabase / PostgreSQL
-- Generated: 2026-11-02
-- Enables RLS and creates tables for Profiles, Passports, Submissions, Evaluations, Opportunities, Events, and Collaborations

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT DEFAULT 'Computer Science & Engineering',
  year_of_study TEXT DEFAULT '3rd Year',
  bio TEXT,
  semester_goal TEXT,
  availability TEXT DEFAULT 'Flexible',
  preferred_roles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by anyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id OR email = auth.jwt() ->> 'email');

CREATE TABLE IF NOT EXISTS passport_interests (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  skill_level TEXT DEFAULT 'beginner',
  confidence_level TEXT DEFAULT 'building',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE passport_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Passport interests are viewable by campus members" ON passport_interests FOR SELECT USING (true);
CREATE POLICY "Students can manage own passport interests" ON passport_interests FOR ALL USING (profile_id = auth.uid()::text OR profile_id = auth.jwt() ->> 'email');

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  experience_level TEXT DEFAULT 'beginner',
  confidence_level TEXT DEFAULT 'exploring',
  visibility TEXT DEFAULT 'campus',
  ai_consent INTEGER DEFAULT 1,
  file_name TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT,
  submission_hash TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public/Campus submissions viewable according to visibility" ON submissions FOR SELECT USING (
  visibility IN ('public', 'campus') OR profile_id = auth.uid()::text OR profile_id = auth.jwt() ->> 'email'
);
CREATE POLICY "Students can manage own submissions" ON submissions FOR ALL USING (
  profile_id = auth.uid()::text OR profile_id = auth.jwt() ->> 'email'
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  submission_id TEXT UNIQUE NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  rubric_scores JSONB,
  overall_score NUMERIC,
  confidence_rating TEXT DEFAULT 'moderate',
  summary TEXT,
  detailed_observations JSONB,
  strengths JSONB,
  areas_for_improvement JSONB,
  practical_exercises JSONB,
  recommended_svm_activities JSONB,
  limitations_disclaimer TEXT,
  media_evaluated INTEGER DEFAULT 0,
  media_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Evaluations viewable by submission owner" ON evaluations FOR SELECT USING (
  profile_id = auth.uid()::text OR profile_id = auth.jwt() ->> 'email'
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  location TEXT,
  schedule TEXT,
  description TEXT,
  prerequisites TEXT,
  organizer TEXT,
  spots_total INTEGER DEFAULT 20,
  deadline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Opportunities viewable by all" ON opportunities FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS opportunity_registrations (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(opportunity_id, profile_id)
);

ALTER TABLE opportunity_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registrations viewable by registrant" ON opportunity_registrations FOR SELECT USING (
  profile_id = auth.uid()::text OR profile_id = auth.jwt() ->> 'email'
);
CREATE POLICY "Students can register for opportunities" ON opportunity_registrations FOR INSERT WITH CHECK (
  profile_id = auth.uid()::text OR profile_id = auth.jwt() ->> 'email'
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  month TEXT NOT NULL,
  time TEXT,
  venue TEXT,
  description TEXT,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON events FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(event_id, profile_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs viewable by attendee" ON event_rsvps FOR ALL USING (
  profile_id = auth.uid()::text OR profile_id = auth.jwt() ->> 'email'
);

CREATE TABLE IF NOT EXISTS collaboration_posts (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_discipline TEXT NOT NULL,
  project_title TEXT NOT NULL,
  description TEXT NOT NULL,
  seeking_disciplines JSONB NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE collaboration_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collaboration posts viewable by all students" ON collaboration_posts FOR SELECT USING (true);
CREATE POLICY "Students can manage own collaboration posts" ON collaboration_posts FOR ALL USING (
  profile_id = auth.uid()::text OR profile_id = auth.jwt() ->> 'email'
);

CREATE TABLE IF NOT EXISTS collaboration_requests (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES collaboration_posts(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests viewable by sender or post owner" ON collaboration_requests FOR SELECT USING (
  sender_id = auth.uid()::text OR sender_id = auth.jwt() ->> 'email'
);
