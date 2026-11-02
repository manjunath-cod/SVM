// Server-side Official SVM Badge Definitions & Verification Logic
import { db } from './db.js';

export const SERVER_SVM_BADGES = [
  {
    id: 'first-step',
    name: 'First Step',
    image: '/images/badges/first-step.png',
    category: 'Beginner',
    filterCategory: 'beginner',
    requirement: 'Complete the first verified creative activity.',
    description: 'Took your very first step into the SVM creative world by submitting your work or joining an activity.',
    xp: 100,
    check: (stats) => stats.submissionCount >= 1 || stats.activityCount >= 1,
    calcProgress: (stats) => (stats.submissionCount >= 1 || stats.activityCount >= 1 ? 100 : Math.min(90, stats.passportCount * 25))
  },
  {
    id: 'brave-beginner',
    name: 'Brave Beginner',
    image: '/images/badges/brave-beginner.png',
    category: 'Confidence',
    filterCategory: 'beginner',
    requirement: 'Complete the first verified creative submission or beginner challenge.',
    description: 'Showed creative bravery by sharing work and embracing early mentorship.',
    xp: 150,
    check: (stats) => stats.submissionCount >= 1,
    calcProgress: (stats) => (stats.submissionCount >= 1 ? 100 : 0)
  },
  {
    id: 'creative-explorer',
    name: 'Creative Explorer',
    image: '/images/badges/creative-explorer.png',
    category: 'Exploration',
    filterCategory: 'creativity',
    requirement: 'Participate in verified activities across three different creative categories.',
    description: 'Expanded your artistic horizons across 3 distinct creative disciplines.',
    xp: 200,
    check: (stats) => stats.distinctCategories >= 3,
    calcProgress: (stats) => Math.min(100, Math.round((stats.distinctCategories / 3) * 100))
  },
  {
    id: 'rising-star',
    name: 'Rising Star',
    image: '/images/badges/rising-star.png',
    category: 'Growth',
    filterCategory: 'creativity',
    requirement: 'Demonstrate consistent verified improvement and participation over a defined period.',
    description: 'Demonstrated artistic growth, dedication, and quality across evaluated milestones.',
    xp: 250,
    check: (stats) => (stats.evalCount >= 1 && stats.maxScore >= 7.0) || stats.submissionCount >= 2,
    calcProgress: (stats) => {
      if ((stats.evalCount >= 1 && stats.maxScore >= 7.0) || stats.submissionCount >= 2) return 100;
      if (stats.submissionCount === 1) return 50;
      return 0;
    }
  },
  {
    id: 'voice-of-svm',
    name: 'Voice of SVM',
    image: '/images/badges/voice-of-svm.png',
    category: 'Singing',
    filterCategory: 'creativity',
    requirement: 'Participate in a verified singing activity.',
    description: 'Brought vocal melody, harmony, and presence to SVM.',
    xp: 200,
    check: (stats) => stats.categories.has('singing') || stats.categories.has('music'),
    calcProgress: (stats) => (stats.categories.has('singing') || stats.categories.has('music') ? 100 : 0)
  },
  {
    id: 'rhythm-keeper',
    name: 'Rhythm Keeper',
    image: '/images/badges/rhythm-keeper.png',
    category: 'Dance',
    filterCategory: 'creativity',
    requirement: 'Participate in a verified dance activity.',
    description: 'Mastered rhythm, body expression, and dynamic motion in dance.',
    xp: 200,
    check: (stats) => stats.categories.has('dance'),
    calcProgress: (stats) => (stats.categories.has('dance') ? 100 : 0)
  },
  {
    id: 'frame-artist',
    name: 'Frame Artist',
    image: '/images/badges/frame-artist.png',
    category: 'Photography',
    filterCategory: 'creativity',
    requirement: 'Submit verified photography work.',
    description: 'Captured stillness, perspective, and visual narrative through your lens.',
    xp: 200,
    check: (stats) => stats.categories.has('photography') || stats.categories.has('videography'),
    calcProgress: (stats) => (stats.categories.has('photography') || stats.categories.has('videography') ? 100 : 0)
  },
  {
    id: 'word-weaver',
    name: 'Word Weaver',
    image: '/images/badges/word-weaver.png',
    category: 'Literature',
    filterCategory: 'creativity',
    requirement: 'Complete a verified writing or poetry activity.',
    description: 'Crafted thoughts into poetic lines, stories, or compelling narratives.',
    xp: 200,
    check: (stats) => stats.categories.has('writing') || stats.categories.has('poetry'),
    calcProgress: (stats) => (stats.categories.has('writing') || stats.categories.has('poetry') ? 100 : 0)
  },
  {
    id: 'canvas-creator',
    name: 'Canvas Creator',
    image: '/images/badges/canvas-creator.png',
    category: 'Art and Design',
    filterCategory: 'creativity',
    requirement: 'Showcase verified artwork or graphic design.',
    description: 'Brought visual imagination to life through brush, color, or digital canvas.',
    xp: 200,
    check: (stats) => stats.categories.has('painting') || stats.categories.has('graphic_design'),
    calcProgress: (stats) => (stats.categories.has('painting') || stats.categories.has('graphic_design') ? 100 : 0)
  },
  {
    id: 'melody-maker',
    name: 'Melody Maker',
    image: '/images/badges/melody-maker.png',
    category: 'Instrumental Music',
    filterCategory: 'creativity',
    requirement: 'Participate in a verified instrumental music activity.',
    description: 'Created musical harmony and acoustic expression through your instrument.',
    xp: 200,
    check: (stats) => stats.categories.has('instrumental_music') || stats.categories.has('music'),
    calcProgress: (stats) => (stats.categories.has('instrumental_music') || stats.categories.has('music') ? 100 : 0)
  },
  {
    id: 'team-spirit',
    name: 'Team Spirit',
    image: '/images/badges/team-spirit.png',
    category: 'Collaboration',
    filterCategory: 'collaboration',
    requirement: 'Complete a verified collaborative project.',
    description: 'Connected creators together to build something bigger as an ensemble.',
    xp: 250,
    check: (stats) => stats.collabCount >= 1,
    calcProgress: (stats) => (stats.collabCount >= 1 ? 100 : 0)
  },
  {
    id: 'culture-contributor',
    name: 'Culture Contributor',
    image: '/images/badges/culture-contributor.png',
    category: 'Community',
    filterCategory: 'community',
    requirement: 'Make a verified contribution to an SVM cultural activity or event.',
    description: 'Active participant and supporter of the campus cultural ecosystem.',
    xp: 150,
    check: (stats) => (stats.rsvpCount + stats.oppRegCount) >= 1,
    calcProgress: (stats) => (stats.rsvpCount + stats.oppRegCount >= 1 ? 100 : 0)
  }
];

export function getUserStats(profileId) {
  const subs = db.prepare('SELECT id, category FROM submissions WHERE profile_id = ?').all(profileId);
  const passport = db.prepare('SELECT category FROM passport_interests WHERE profile_id = ?').all(profileId);
  const evals = db.prepare('SELECT overall_score FROM evaluations WHERE profile_id = ?').all(profileId);
  const rsvps = db.prepare('SELECT count(*) as cnt FROM event_rsvps WHERE profile_id = ?').get(profileId);
  const oppRegs = db.prepare('SELECT count(*) as cnt FROM opportunity_registrations WHERE profile_id = ?').get(profileId);
  const collabPosts = db.prepare('SELECT count(*) as cnt FROM collaboration_posts WHERE profile_id = ?').get(profileId);
  const collabReqs = db.prepare('SELECT count(*) as cnt FROM collaboration_requests WHERE sender_id = ?').get(profileId);

  const categories = new Set();
  subs.forEach((s) => categories.add(s.category));
  passport.forEach((p) => categories.add(p.category));

  const maxScore = evals.reduce((max, e) => Math.max(max, e.overall_score || 0), 0);
  const rsvpCount = rsvps?.cnt || 0;
  const oppRegCount = oppRegs?.cnt || 0;
  const collabCount = (collabPosts?.cnt || 0) + (collabReqs?.cnt || 0);

  return {
    submissionCount: subs.length,
    passportCount: passport.length,
    distinctCategories: categories.size,
    categories,
    evalCount: evals.length,
    maxScore,
    rsvpCount,
    oppRegCount,
    collabCount,
    activityCount: subs.length + rsvpCount + oppRegCount + collabCount
  };
}

export function syncUserAchievements(profileId) {
  const stats = getUserStats(profileId);
  const now = new Date().toISOString();

  // Fetch already awarded badges
  const existingRows = db.prepare('SELECT * FROM user_achievements WHERE profile_id = ?').all(profileId);
  const existingMap = new Map();
  existingRows.forEach((r) => existingMap.set(r.badge_id, r));

  const newlyUnlocked = [];

  for (const b of SERVER_SVM_BADGES) {
    const isEligible = b.check(stats);
    const progress = b.calcProgress(stats);

    if (isEligible) {
      if (!existingMap.has(b.id)) {
        // Award badge
        const id = `ach_${profileId}_${b.id}`;
        db.prepare(`
          INSERT INTO user_achievements (id, profile_id, badge_id, unlocked_at, progress, featured, notified)
          VALUES (?, ?, ?, ?, 100, 1, 0)
        `).run(id, profileId, b.id, now);

        newlyUnlocked.push({
          ...b,
          unlocked: true,
          unlocked_at: now,
          progress: 100,
          featured: 1
        });
      } else {
        // Update progress to 100 if needed
        db.prepare('UPDATE user_achievements SET progress = 100 WHERE profile_id = ? AND badge_id = ?')
          .run(profileId, b.id);
      }
    } else {
      // Not yet earned - if record exists without unlock date, update progress
      if (!existingMap.has(b.id)) {
        // Optionally track progress
      }
    }
  }

  return newlyUnlocked;
}

