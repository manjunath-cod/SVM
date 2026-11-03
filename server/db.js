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
      role TEXT DEFAULT 'student',
      approval_status TEXT DEFAULT 'approved',
      academic_year TEXT DEFAULT '3rd Year',
      creative_interests TEXT DEFAULT '[]',
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

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      progress INTEGER DEFAULT 100,
      featured INTEGER DEFAULT 1,
      notified INTEGER DEFAULT 0,
      UNIQUE(profile_id, badge_id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS talent_posts (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      creator_name TEXT NOT NULL,
      creator_initials TEXT NOT NULL,
      creator_color TEXT NOT NULL,
      category TEXT NOT NULL,
      media_type TEXT NOT NULL,
      media_json TEXT NOT NULL,
      caption TEXT NOT NULL,
      hashtags_json TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      saves_count INTEGER DEFAULT 0,
      trending INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS talent_post_likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(post_id, profile_id),
      FOREIGN KEY (post_id) REFERENCES talent_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS talent_post_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_initials TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES talent_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS talent_post_saves (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(post_id, profile_id),
      FOREIGN KEY (post_id) REFERENCES talent_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS talent_creator_follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL,
      creator_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(follower_id, creator_name),
      FOREIGN KEY (follower_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      content TEXT NOT NULL,
      author_name TEXT NOT NULL,
      archived INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Migrate columns if upgrading an existing SQLite file
  for (const statement of [
    'ALTER TABLE profiles ADD COLUMN avatar_data TEXT',
    "ALTER TABLE profiles ADD COLUMN settings_json TEXT DEFAULT '{}'",
    "ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'student'",
    "ALTER TABLE profiles ADD COLUMN approval_status TEXT DEFAULT 'approved'",
    "ALTER TABLE profiles ADD COLUMN academic_year TEXT DEFAULT '3rd Year'",
    "ALTER TABLE profiles ADD COLUMN creative_interests TEXT DEFAULT '[]'"
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
      role: 'student',
      approval_status: 'approved'
    },
    {
      id: 'admin@svmit.ac.in',
      name: 'SVM Cultural Dean',
      email: 'admin@svmit.ac.in',
      department: 'Cultural Affairs Committee',
      year_of_study: 'Faculty / Staff',
      bio: 'Official Cultural and Creative Arts Directorate at SVM Institute of Technology.',
      semester_goal: 'Foster inclusive campus creative expression and celebrate student talent.',
      availability: 'Office hours 9 AM - 5 PM',
      preferred_roles: JSON.stringify(['mentor', 'coordinator']),
      role: 'admin',
      approval_status: 'approved'
    },
    {
      id: 'kavya.p@svmit.ac.in',
      name: 'Kavya Patil',
      email: 'kavya.p@svmit.ac.in',
      department: 'Electronics & Communication',
      year_of_study: '2nd Year',
      bio: 'Classical and semi-classical vocalist seeking fusion and acoustic collaborations.',
      semester_goal: 'Record an original campus composition.',
      availability: 'Evenings',
      preferred_roles: JSON.stringify(['solo_creator', 'collaborator']),
      role: 'student',
      approval_status: 'pending'
    },
    {
      id: 'siddharth.r@svmit.ac.in',
      name: 'Siddharth Rao',
      email: 'siddharth.r@svmit.ac.in',
      department: 'Mechanical Engineering',
      year_of_study: '3rd Year',
      bio: 'Campus photographer and graphic designer capturing everyday student architecture.',
      semester_goal: 'Lead an exhibition at the annual fest.',
      availability: 'Weekends',
      preferred_roles: JSON.stringify(['solo_creator']),
      role: 'student',
      approval_status: 'pending'
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
      role: 'student',
      approval_status: 'approved'
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
      role: 'student',
      approval_status: 'approved'
    }
  ];

  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO profiles (id, name, email, department, year_of_study, bio, semester_goal, availability, preferred_roles, role, approval_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      s.role,
      s.approval_status,
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

  // Seed initial talent posts if empty
  const postCount = db.prepare('SELECT count(*) as count FROM talent_posts').get();
  if (postCount.count === 0) {
    const demoImage = (id, width = 900, height = 720) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;
    const initialPosts = [
      {
        id: 'post-1',
        profile_id: 'meera.s@svmit.ac.in',
        creator_name: 'Meera Sengupta',
        creator_initials: 'MS',
        creator_color: '#7652F5',
        category: 'photography',
        media_type: 'image',
        media: [demoImage('photo-1516035069371-29a1b244cc32'), demoImage('photo-1500534623283-312aade485b7')],
        caption: 'A quiet morning, framed in warm light. Some places ask you to slow down.',
        hashtags: ['#VisualDiary', '#CampusStories'],
        likes_count: 148,
        saves_count: 32,
        trending: 1,
        comments: [
          { id: 'comm-1', author_name: 'Aarav Sharma', author_initials: 'AS', text: 'The light in this is beautiful!' }
        ]
      },
      {
        id: 'post-2',
        profile_id: 'student@svmit.ac.in',
        creator_name: 'Aarav Sharma',
        creator_initials: 'AS',
        creator_color: '#E17865',
        category: 'singing',
        media_type: 'video',
        media: [demoImage('photo-1511379938547-c1f69419868d', 900, 1100)],
        caption: 'A tiny acoustic take between classes. Headphones recommended.',
        hashtags: ['#Acoustic', '#StudentSessions'],
        likes_count: 216,
        saves_count: 54,
        trending: 1,
        comments: [
          { id: 'comm-2', author_name: 'Meera Sengupta', author_initials: 'MS', text: 'Please share the full version!' },
          { id: 'comm-3', author_name: 'Rohit Kulkarni', author_initials: 'RK', text: 'This made my day.' }
        ]
      },
      {
        id: 'post-3',
        profile_id: 'rohit.k@svmit.ac.in',
        creator_name: 'Rohit Kulkarni',
        creator_initials: 'RK',
        creator_color: '#2D9CDB',
        category: 'art',
        media_type: 'image',
        media: [demoImage('photo-1549490349-8643362247b5')],
        caption: 'A color study from this week. Still experimenting with softer edges.',
        hashtags: ['#StudioNotes', '#ArtInProgress'],
        likes_count: 89,
        saves_count: 18,
        trending: 0,
        comments: []
      }
    ];

    const insertPost = db.prepare(`
      INSERT INTO talent_posts (id, profile_id, creator_name, creator_initials, creator_color, category, media_type, media_json, caption, hashtags_json, likes_count, saves_count, trending, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertComment = db.prepare(`
      INSERT INTO talent_post_comments (id, post_id, profile_id, author_name, author_initials, text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const post of initialPosts) {
      insertPost.run(
        post.id,
        post.profile_id,
        post.creator_name,
        post.creator_initials,
        post.creator_color,
        post.category,
        post.media_type,
        JSON.stringify(post.media),
        post.caption,
        JSON.stringify(post.hashtags),
        post.likes_count,
        post.saves_count,
        post.trending,
        now
      );

      for (const c of post.comments) {
        insertComment.run(c.id, post.id, post.profile_id, c.author_name, c.author_initials, c.text, now);
      }
    }
  }

  // Seed announcements if empty
  const annCount = db.prepare('SELECT count(*) as count FROM announcements').get();
  if (annCount.count === 0) {
    const insertAnn = db.prepare(`
      INSERT INTO announcements (id, title, category, priority, content, author_name, archived, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `);

    const defaultAnnouncements = [
      {
        id: 'ann-1',
        title: 'SVM Annual Cultural Fest: Auditions Open',
        category: 'Auditions',
        priority: 'High',
        content: 'Auditions for singing, drama, classical & western dance, and anchor roles are open until next week. Register through the Opportunities tab.'
      },
      {
        id: 'ann-2',
        title: 'Interdisciplinary Innovation Showcase Registration',
        category: 'Showcase',
        priority: 'Normal',
        content: 'Students creating multimedia works combining music and code or film and engineering are invited to submit their projects for the campus creative showcase.'
      },
      {
        id: 'ann-3',
        title: 'Campus Studio Access & Equipment Guidelines',
        category: 'General',
        priority: 'Normal',
        content: 'Media lab sound booth, mirror dance studio, and darkroom photography tools are open daily from 4:30 PM to 8:30 PM with valid student ID.'
      }
    ];

    for (const ann of defaultAnnouncements) {
      insertAnn.run(ann.id, ann.title, ann.category, ann.priority, ann.content, 'SVM Cultural Dean', now);
    }
  }

  // Seed admin logs if empty
  const logCount = db.prepare('SELECT count(*) as count FROM admin_logs').get();
  if (logCount.count === 0) {
    const insertLog = db.prepare(`
      INSERT INTO admin_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertLog.run(
      'log-1',
      'admin@svmit.ac.in',
      'SVM Cultural Dean',
      'STUDENT_APPROVAL',
      'student',
      'student@svmit.ac.in',
      'Auto-approved primary student account for campus launch verification.',
      now
    );
  }
}

// Initialize on load
initDatabase();

export { db };
