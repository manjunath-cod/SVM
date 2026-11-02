import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { initialOpportunities, initialEvents, initialCollaborations } from './seedData.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'cultureloop.db');
const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for better concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT DEFAULT 'Computer Science & Engineering',
      year_of_study TEXT DEFAULT '3rd Year',
      bio TEXT,
      semester_goal TEXT,
      availability TEXT DEFAULT 'Flexible',
      preferred_roles TEXT DEFAULT '[]',
      avatar_data TEXT,
      settings_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      contact_preference TEXT DEFAULT 'none',
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS passport_interests (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      category TEXT NOT NULL,
      skill_level TEXT DEFAULT 'beginner',
      confidence_level TEXT DEFAULT 'building',
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
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
      file_size INTEGER,
      file_url TEXT,
      submission_hash TEXT,
      status TEXT DEFAULT 'submitted',
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      submission_id TEXT UNIQUE NOT NULL,
      profile_id TEXT NOT NULL,
      category TEXT NOT NULL,
      rubric_scores TEXT,
      overall_score REAL,
      confidence_rating TEXT DEFAULT 'moderate',
      summary TEXT,
      detailed_observations TEXT,
      strengths TEXT,
      areas_for_improvement TEXT,
      practical_exercises TEXT,
      recommended_svm_activities TEXT,
      limitations_disclaimer TEXT,
      media_evaluated INTEGER DEFAULT 0,
      media_notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
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
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunity_registrations (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      status TEXT DEFAULT 'registered',
      created_at TEXT NOT NULL,
      UNIQUE(opportunity_id, profile_id),
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
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
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_rsvps (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(event_id, profile_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collaboration_posts (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_discipline TEXT NOT NULL,
      project_title TEXT NOT NULL,
      description TEXT NOT NULL,
      seeking_disciplines TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collaboration_requests (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES collaboration_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  for (const statement of [
    'ALTER TABLE profiles ADD COLUMN avatar_data TEXT',
    "ALTER TABLE profiles ADD COLUMN settings_json TEXT DEFAULT '{}'"
  ]) {
    try {
      db.exec(statement);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) throw err;
    }
  }

  // Seed default student profiles if missing
  const now = new Date().toISOString();
  const seedStudents = [
    {
      id: 'student@svmit.ac.in',
      name: 'Aarav Sharma',
      email: 'student@svmit.ac.in',
      department: 'Information Science & Engineering',
      year_of_study: '3rd Year',
      bio: 'Documentary filmmaker and acoustic fingerstyle guitarist exploring visual rhythm and campus stories.',
      semester_goal: 'Produce one campus short film and collaborate on live acoustic sets.',
      availability: 'Weekday evenings & weekends',
      preferred_roles: JSON.stringify(['solo_creator', 'ensemble', 'collaborator']),
    },
    {
      id: 'meera.s@svmit.ac.in',
      name: 'Meera Sengupta',
      email: 'meera.s@svmit.ac.in',
      department: 'Biotechnology',
      year_of_study: '2nd Year',
      bio: 'Poet and vocalist exploring spoken word and contemporary rhythmic meter.',
      semester_goal: 'Publish illustrated poetry zine and perform at SVM Unplugged.',
      availability: 'Flexible',
      preferred_roles: JSON.stringify(['writer', 'performer']),
    },
    {
      id: 'rohit.k@svmit.ac.in',
      name: 'Rohit Kulkarni',
      email: 'rohit.k@svmit.ac.in',
      department: 'Mechanical Engineering',
      year_of_study: '4th Year',
      bio: 'Contemporary and semi-classical dancer with a passion for street movement and rhythm.',
      semester_goal: 'Choreograph an interdisciplinary piece for Annual Cultural Fest.',
      availability: 'Weekends',
      preferred_roles: JSON.stringify(['choreographer', 'performer']),
    }
  ];

  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO profiles (id, name, email, department, year_of_study, bio, semester_goal, availability, preferred_roles, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of seedStudents) {
    insertProfile.run(
      s.id,
      s.name,
      s.email,
      s.department,
      s.year_of_study,
      s.bio,
      s.semester_goal,
      s.availability,
      s.preferred_roles,
      now,
      now
    );
  }

  // Initial default passport interests for student@svmit.ac.in
  const passportCheck = db.prepare('SELECT count(*) as count FROM passport_interests WHERE profile_id = ?').get('student@svmit.ac.in');
  if (passportCheck.count === 0) {
    const defaultInterests = [
      { category: 'photography', skill: 'intermediate', confidence: 'collaborating', notes: 'Street & architectural photography' },
      { category: 'music', skill: 'intermediate', confidence: 'building', notes: 'Acoustic guitar and basic digital audio workstation' },
      { category: 'writing', skill: 'beginner', confidence: 'exploring', notes: 'Short stories and observational essays' }
    ];

    for (const item of defaultInterests) {
      db.prepare(`
        INSERT INTO passport_interests (id, profile_id, category, skill_level, confidence_level, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `pass-${Math.random().toString(36).slice(2, 9)}`,
        'student@svmit.ac.in',
        item.category,
        item.skill,
        item.confidence,
        item.notes,
        now
      );
    }
  }

  // Seed opportunities if empty
  const oppCount = db.prepare('SELECT count(*) as count FROM opportunities').get();
  if (oppCount.count === 0) {
    const now = new Date().toISOString();
    const insertOpp = db.prepare(`
      INSERT INTO opportunities (id, title, category, type, difficulty, location, schedule, description, prerequisites, organizer, spots_total, deadline, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const opp of initialOpportunities) {
      insertOpp.run(
        opp.id,
        opp.title,
        opp.category,
        opp.type,
        opp.difficulty,
        opp.location,
        opp.schedule,
        opp.description,
        opp.prerequisites,
        opp.organizer,
        opp.spots_total,
        opp.deadline,
        now
      );
    }
  }

  // Seed events if empty
  const evtCount = db.prepare('SELECT count(*) as count FROM events').get();
  if (evtCount.count === 0) {
    const now = new Date().toISOString();
    const insertEvt = db.prepare(`
      INSERT INTO events (id, title, category, date, month, time, venue, description, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const evt of initialEvents) {
      insertEvt.run(
        evt.id,
        evt.title,
        evt.category,
        evt.date,
        evt.month,
        evt.time,
        evt.venue,
        evt.description,
        evt.type,
        now
      );
    }
  }

  // Seed collaborations if empty
  const colCount = db.prepare('SELECT count(*) as count FROM collaboration_posts').get();
  if (colCount.count === 0) {
    const insertCol = db.prepare(`
      INSERT INTO collaboration_posts (id, profile_id, author_name, author_discipline, project_title, description, seeking_disciplines, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const col of initialCollaborations) {
      insertCol.run(
        col.id,
        col.profile_id,
        col.author_name,
        col.author_discipline,
        col.project_title,
        col.description,
        col.seeking_disciplines,
        col.status,
        col.created_at
      );
    }
  }
}

// Initialize on load
initDatabase();

export { db };
