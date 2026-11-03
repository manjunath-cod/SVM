import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from './db.js';
import { evaluateSubmissionWithGemini } from './gemini.js';
import { getGeminiApiKey } from './env.js';
import { SERVER_SVM_BADGES, getUserStats, syncUserAchievements } from './badges.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helpers for JSON responses and request body parsing
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-email'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // 35MB limit on JSON body (allows 25MB base64 files)
      if (body.length > 38 * 1024 * 1024) {
        reject(new Error('Payload too large. Maximum file upload limit is 25 MB.'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function getCurrentUser(req) {
  // Check header or fallback to default student
  const headerEmail = req.headers['x-user-email'];
  const email = (headerEmail && typeof headerEmail === 'string') ? headerEmail : 'student@svmit.ac.in';
  let profile = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
  if (!profile) {
    const now = new Date().toISOString();
    const id = email;
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    db.prepare(`
      INSERT INTO profiles (id, name, email, department, year_of_study, bio, semester_goal, availability, preferred_roles, created_at, updated_at)
      VALUES (?, ?, ?, 'Computer Science & Engineering', '2nd Year', 'Creative explorer at SVM.', 'Explore new creative disciplines.', 'Flexible', '[]', ?, ?)
    `).run(id, name, email, now, now);
    profile = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
  }
  return profile;
}

function buildAchievementsResponse(userId) {
  syncUserAchievements(userId);
  const rows = db.prepare('SELECT * FROM user_achievements WHERE profile_id = ?').all(userId);
  const earnedMap = new Map();
  rows.forEach((r) => earnedMap.set(r.badge_id, r));

  const stats = getUserStats(userId);
  let totalXp = 0;
  let badgesEarned = 0;

  const badges = SERVER_SVM_BADGES.map((b) => {
    const earned = earnedMap.get(b.id);
    const isUnlocked = Boolean(earned);
    if (isUnlocked) {
      totalXp += b.xp;
      badgesEarned++;
    }
    const progress = isUnlocked ? 100 : b.calcProgress(stats);

    return {
      id: b.id,
      name: b.name,
      image: b.image,
      category: b.category,
      filterCategory: b.filterCategory,
      requirement: b.requirement,
      description: b.description,
      xp: b.xp,
      criteria: b.requirement,
      unlocked: isUnlocked,
      unlocked_at: earned ? earned.unlocked_at : null,
      progress,
      featured: earned ? Boolean(earned.featured) : false,
      notified: earned ? Boolean(earned.notified) : true
    };
  });

  const recentUnlocks = badges.filter((b) => b.unlocked && !b.notified);

  return {
    summary: {
      badgesEarned,
      totalBadges: 12,
      totalXp,
      weeklyXp: Math.min(totalXp, 350),
      verifiedMilestones: stats.activityCount,
      certificatesEarned: badgesEarned >= 8 ? 2 : badgesEarned >= 4 ? 1 : 0
    },
    badges,
    recentUnlocks
  };
}


function formatTalentPost(row, currentUserId) {
  let media = [];
  try { media = JSON.parse(row.media_json || '[]'); } catch { media = []; }
  let hashtags = [];
  try { hashtags = JSON.parse(row.hashtags_json || '[]'); } catch { hashtags = []; }
  
  const comments = db.prepare(`
    SELECT id, post_id, author_name as name, author_initials as initials, text, created_at
    FROM talent_post_comments
    WHERE post_id = ?
    ORDER BY created_at ASC
  `).all(row.id);

  const authorBadges = db.prepare(`
    SELECT ua.badge_id as id, ua.unlocked_at
    FROM user_achievements ua
    WHERE ua.profile_id = ? AND ua.featured = 1
    ORDER BY ua.unlocked_at ASC LIMIT 2
  `).all(row.profile_id).map((ab) => {
    const badgeDef = SERVER_SVM_BADGES.find((b) => b.id === ab.id);
    return {
      id: ab.id,
      name: badgeDef?.name || ab.id,
      image: badgeDef?.image || `/images/badges/${ab.id}.png`
    };
  });

  const badgeCountRow = db.prepare('SELECT count(*) as count FROM user_achievements WHERE profile_id = ?').get(row.profile_id);
  const badgeCount = badgeCountRow?.count || 0;

  let isLiked = false;
  let isSaved = false;
  let isFollowing = false;
  if (currentUserId) {
    const likeRow = db.prepare('SELECT 1 FROM talent_post_likes WHERE post_id = ? AND profile_id = ?').get(row.id, currentUserId);
    isLiked = Boolean(likeRow);
    const saveRow = db.prepare('SELECT 1 FROM talent_post_saves WHERE post_id = ? AND profile_id = ?').get(row.id, currentUserId);
    isSaved = Boolean(saveRow);
    const followRow = db.prepare('SELECT 1 FROM talent_creator_follows WHERE follower_id = ? AND creator_name = ?').get(currentUserId, row.creator_name);
    isFollowing = Boolean(followRow);
  }

  const dateObj = new Date(row.created_at);
  const now = new Date();
  const diffHours = Math.floor((now - dateObj) / 3600000);
  let timestamp = 'Just now';
  if (diffHours >= 24) {
    timestamp = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } else if (diffHours >= 1) {
    timestamp = `${diffHours}h ago`;
  }

  return {
    id: row.id,
    creator: {
      name: row.creator_name,
      initials: row.creator_initials,
      color: row.creator_color,
      badges: authorBadges,
      badgeCount
    },
    timestamp,
    category: row.category,
    mediaType: row.media_type,
    media,
    caption: row.caption,
    hashtags,
    likes: row.likes_count,
    comments,
    saves: row.saves_count,
    trending: Boolean(row.trending),
    isLiked,
    isSaved,
    isFollowing
  };
}

export async function handleApiRequest(req, res, pathname, queryParams) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-email'
    });
    res.end();
    return true;
  }

  // 1. Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    const apiKey = getGeminiApiKey();
    sendJson(res, 200, {
      status: 'ok',
      dbReady: true,
      geminiConfigured: Boolean(apiKey),
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // 2. Auth Session
  if (pathname === '/api/auth/session') {
    if (req.method === 'GET') {
      const user = getCurrentUser(req);
      sendJson(res, 200, { user });
      return true;
    }
    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const email = body.email || 'student@svmit.ac.in';
      let user = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
      if (!user) {
        const now = new Date().toISOString();
        const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        db.prepare(`
          INSERT INTO profiles (id, name, email, department, year_of_study, bio, semester_goal, availability, preferred_roles, created_at, updated_at)
          VALUES (?, ?, ?, 'Computer Science & Engineering', '2nd Year', 'Creative explorer at SVM.', 'Try one new creative format', 'Flexible', '[]', ?, ?)
        `).run(email, name, email, now, now);
        user = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
      }
      sendJson(res, 200, { user });
      return true;
    }
  }

  // 3. Profile
  if (pathname === '/api/profile' || pathname === '/api/settings' || pathname === '/api/feedback') {
    const user = getCurrentUser(req);
    if (pathname === '/api/profile') {
    if (req.method === 'GET') {
      sendJson(res, 200, { profile: user });
      return true;
    }
    if (req.method === 'PUT') {
      const body = await parseJsonBody(req);
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE profiles SET
          name = COALESCE(?, name),
          department = COALESCE(?, department),
          year_of_study = COALESCE(?, year_of_study),
          bio = COALESCE(?, bio),
          semester_goal = COALESCE(?, semester_goal),
          availability = COALESCE(?, availability),
          preferred_roles = COALESCE(?, preferred_roles),
          avatar_data = COALESCE(?, avatar_data),
          updated_at = ?
        WHERE id = ?
      `).run(
        body.name ?? null,
        body.department ?? null,
        body.year_of_study ?? null,
        body.bio ?? null,
        body.semester_goal ?? null,
        body.availability ?? null,
        body.preferred_roles === undefined
          ? null
          : (typeof body.preferred_roles === 'object' ? JSON.stringify(body.preferred_roles) : body.preferred_roles),
        body.avatar_data ?? null,
        now,
        user.id
      );
      const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.id);
      sendJson(res, 200, { profile: updated });
      return true;
    }
    }

    // 3b. Settings and preferences
    if (pathname === '/api/settings') {
      const user = getCurrentUser(req);
      if (req.method === 'GET') {
        let settings = {};
        try {
          settings = JSON.parse(user.settings_json || '{}');
        } catch {
          settings = {};
        }
        sendJson(res, 200, { profile: user, settings });
        return true;
      }
      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        const settings = body.settings && typeof body.settings === 'object' ? body.settings : {};
        const now = new Date().toISOString();
        db.prepare(`
          UPDATE profiles
          SET settings_json = ?, avatar_data = COALESCE(?, avatar_data), updated_at = ?
          WHERE id = ?
        `).run(JSON.stringify(settings), body.avatar_data ?? null, now, user.id);
        const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.id);
        sendJson(res, 200, { profile: updated, settings });
        return true;
      }
    }

    // 3c. Feedback
    if (pathname === '/api/feedback' && req.method === 'POST') {
      const user = getCurrentUser(req);
      const body = await parseJsonBody(req);
      const category = String(body.category || '').trim();
      const subject = String(body.subject || '').trim();
      const description = String(body.description || '').trim();
      const allowedCategories = ['bug', 'feature', 'ux', 'general', 'other'];
      if (!allowedCategories.includes(category) || !subject || !description) {
        sendJson(res, 400, { error: 'Category, subject, and description are required.' });
        return true;
      }
      const id = `feedback-${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO feedback (id, profile_id, category, subject, description, contact_preference, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, user.id, category, subject, description, body.contact_preference || 'none', new Date().toISOString());
      sendJson(res, 201, { feedback: { id }, message: 'Feedback submitted successfully.' });
      return true;
    }
  }

  // 4. Creative Passport
  if (pathname === '/api/passport') {
    const user = getCurrentUser(req);
    if (req.method === 'GET') {
      const interests = db.prepare('SELECT * FROM passport_interests WHERE profile_id = ?').all(user.id);
      const submissions = db.prepare('SELECT * FROM submissions WHERE profile_id = ? ORDER BY created_at DESC').all(user.id);
      const evaluations = db.prepare('SELECT * FROM evaluations WHERE profile_id = ? ORDER BY created_at DESC').all(user.id);
      const registrations = db.prepare(`
        SELECT o.* FROM opportunities o
        INNER JOIN opportunity_registrations r ON o.id = r.opportunity_id
        WHERE r.profile_id = ?
      `).all(user.id);
      const rsvps = db.prepare(`
        SELECT e.* FROM events e
        INNER JOIN event_rsvps r ON e.id = r.event_id
        WHERE r.profile_id = ?
      `).all(user.id);

      // Calculate completeness percentage based on actual filled fields
      let score = 20; // base student account
      if (interests.length >= 1) score += 20;
      if (interests.length >= 3) score += 10;
      if (user.bio && user.bio.length > 20) score += 15;
      if (user.semester_goal) score += 10;
      if (submissions.length > 0) score += 15;
      if (registrations.length > 0 || rsvps.length > 0) score += 10;
      const completionPercentage = Math.min(score, 100);

      sendJson(res, 200, {
        profile: user,
        interests,
        submissions,
        evaluations: evaluations.map((e) => ({
          ...e,
          rubric_scores: JSON.parse(e.rubric_scores || '[]'),
          detailed_observations: JSON.parse(e.detailed_observations || '[]'),
          strengths: JSON.parse(e.strengths || '[]'),
          areas_for_improvement: JSON.parse(e.areas_for_improvement || '[]'),
          practical_exercises: JSON.parse(e.practical_exercises || '[]'),
          recommended_svm_activities: JSON.parse(e.recommended_svm_activities || '[]')
        })),
        registrations,
        rsvps,
        completionPercentage
      });
      return true;
    }

    if (req.method === 'PUT') {
      const body = await parseJsonBody(req);
      const now = new Date().toISOString();

      // Update profile fields
      db.prepare(`
        UPDATE profiles SET
          bio = COALESCE(?, bio),
          semester_goal = COALESCE(?, semester_goal),
          availability = COALESCE(?, availability),
          updated_at = ?
        WHERE id = ?
      `).run(body.bio, body.semester_goal, body.availability, now, user.id);

      // Replace interests
      if (Array.isArray(body.interests)) {
        db.prepare('DELETE FROM passport_interests WHERE profile_id = ?').run(user.id);
        const insertInt = db.prepare(`
          INSERT INTO passport_interests (id, profile_id, category, skill_level, confidence_level, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of body.interests) {
          insertInt.run(
            `pass-${Math.random().toString(36).slice(2, 9)}`,
            user.id,
            typeof item === 'string' ? item : item.category,
            item.skill_level || 'beginner',
            item.confidence_level || 'building',
            item.notes || '',
            now
          );
        }
      }

      const updatedInterests = db.prepare('SELECT * FROM passport_interests WHERE profile_id = ?').all(user.id);
      const updatedProfile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.id);
      sendJson(res, 200, { profile: updatedProfile, interests: updatedInterests, message: 'Creative Passport saved successfully.' });
      return true;
    }
  }

  // 5. Showcase: Upload Creative Work & Submit for AI Evaluation
  if (pathname === '/api/showcase/upload' && req.method === 'POST') {
    const user = getCurrentUser(req);
    const body = await parseJsonBody(req);

    const {
      title,
      category,
      description,
      experience_level = 'beginner',
      confidence_level = 'exploring',
      visibility = 'campus',
      ai_consent = 1,
      fileName,
      fileType,
      fileSize,
      fileBase64
    } = body;

    if (!title || !title.trim()) {
      sendJson(res, 400, { error: 'Please provide a title for your submission.' });
      return true;
    }
    if (!category || !category.trim()) {
      sendJson(res, 400, { error: 'Please select a creative category.' });
      return true;
    }

    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let savedFilePath = null;
    let fileUrl = null;
    let submissionHash = null;

    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 26 * 1024 * 1024) {
        sendJson(res, 400, { error: 'Uploaded file exceeds the 25 MB size limit.' });
        return true;
      }

      // Compute hash for duplicate prevention
      submissionHash = crypto.createHash('sha256').update(buffer).digest('hex');

      // Check for duplicate submission by the same student
      const duplicate = db.prepare(`
        SELECT id, title, created_at FROM submissions
        WHERE profile_id = ? AND submission_hash = ?
      `).get(user.id, submissionHash);

      if (duplicate) {
        sendJson(res, 409, {
          error: `Duplicate submission detected: You have already submitted this exact file as "${duplicate.title}" on ${duplicate.created_at.slice(0, 10)}. Please upload a distinct piece of work.`,
          duplicateId: duplicate.id
        });
        return true;
      }

      const safeName = (fileName || 'submission').replace(/[^a-zA-Z0-9._-]/g, '_');
      const diskFileName = `${submissionId}-${safeName}`;
      savedFilePath = path.join(UPLOADS_DIR, diskFileName);
      fs.writeFileSync(savedFilePath, buffer);
      fileUrl = `/api/media/${diskFileName}`;
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO submissions (
        id, profile_id, title, category, description,
        experience_level, confidence_level, visibility, ai_consent,
        file_name, file_path, file_type, file_size, file_url, submission_hash, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      submissionId,
      user.id,
      title.trim(),
      category.trim().toLowerCase(),
      description ? description.trim() : '',
      experience_level,
      confidence_level,
      visibility,
      ai_consent ? 1 : 0,
      fileName || null,
      savedFilePath,
      fileType || null,
      fileSize || (savedFilePath ? fs.statSync(savedFilePath).size : 0),
      fileUrl,
      submissionHash,
      ai_consent ? 'evaluating' : 'submitted',
      now
    );

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);

    // If AI evaluation was consented, perform evaluation
    let evaluationResult = null;
    if (ai_consent) {
      try {
        evaluationResult = await evaluateSubmissionWithGemini(submission, user);
        const evalId = `eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        db.prepare(`
          INSERT INTO evaluations (
            id, submission_id, profile_id, category,
            rubric_scores, overall_score, confidence_rating, summary,
            detailed_observations, strengths, areas_for_improvement,
            practical_exercises, recommended_svm_activities, limitations_disclaimer,
            media_evaluated, media_notes, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          evalId,
          submissionId,
          user.id,
          submission.category,
          JSON.stringify(evaluationResult.rubricScores || []),
          evaluationResult.overallScore,
          evaluationResult.confidenceRating || 'moderate',
          evaluationResult.summary,
          JSON.stringify(evaluationResult.detailedObservations || []),
          JSON.stringify(evaluationResult.strengths || []),
          JSON.stringify(evaluationResult.areasForImprovement || []),
          JSON.stringify(evaluationResult.practicalExercises || []),
          JSON.stringify(evaluationResult.recommendedSvmActivities || []),
          evaluationResult.limitationsDisclaimer,
          evaluationResult.mediaEvaluated ? 1 : 0,
          evaluationResult.mediaNotes,
          new Date().toISOString()
        );

        db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run('evaluated', submissionId);
      } catch (err) {
        console.error('[showcase] Evaluation execution error:', err);
        db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run('error', submissionId);
      }
    }

    const finalSub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);
    const finalEval = db.prepare('SELECT * FROM evaluations WHERE submission_id = ?').get(submissionId);

    sendJson(res, 201, {
      submission: finalSub,
      evaluation: finalEval ? {
        ...finalEval,
        rubric_scores: JSON.parse(finalEval.rubric_scores || '[]'),
        detailed_observations: JSON.parse(finalEval.detailed_observations || '[]'),
        strengths: JSON.parse(finalEval.strengths || '[]'),
        areas_for_improvement: JSON.parse(finalEval.areas_for_improvement || '[]'),
        practical_exercises: JSON.parse(finalEval.practical_exercises || '[]'),
        recommended_svm_activities: JSON.parse(finalEval.recommended_svm_activities || '[]')
      } : null
    });
    return true;
  }

  // 6. Showcase: Query Submissions
  if ((pathname === '/api/showcase/submissions' || pathname === '/api/submissions') && req.method === 'GET') {
    const user = getCurrentUser(req);
    const scope = queryParams.get('scope') || 'all';
    const category = queryParams.get('category');

    let query = '';
    const params = [];

    if (scope === 'user') {
      query = 'SELECT s.*, p.name as author_name, p.department as author_department FROM submissions s JOIN profiles p ON s.profile_id = p.id WHERE s.profile_id = ?';
      params.push(user.id);
    } else {
      query = `
        SELECT s.*, p.name as author_name, p.department as author_department
        FROM submissions s
        JOIN profiles p ON s.profile_id = p.id
        WHERE (s.visibility IN ('campus', 'public') OR s.profile_id = ?)
      `;
      params.push(user.id);
    }

    if (category && category !== 'all') {
      query += ' AND s.category = ?';
      params.push(category.toLowerCase());
    }

    query += ' ORDER BY s.created_at DESC';

    const submissions = db.prepare(query).all(...params);

    // Attach evaluation summary and author achievements if exists
    const enriched = submissions.map((sub) => {
      const evaluation = db.prepare('SELECT * FROM evaluations WHERE submission_id = ?').get(sub.id);
      const authorBadges = db.prepare(`
        SELECT badge_id, unlocked_at FROM user_achievements
        WHERE profile_id = ? AND featured = 1
        ORDER BY unlocked_at ASC LIMIT 3
      `).all(sub.profile_id);
      const badgeCountRow = db.prepare('SELECT count(*) as count FROM user_achievements WHERE profile_id = ?').get(sub.profile_id);

      return {
        ...sub,
        author_badges: authorBadges,
        author_badge_count: badgeCountRow?.count || 0,
        evaluation: evaluation ? {
          id: evaluation.id,
          overall_score: evaluation.overall_score,
          summary: evaluation.summary,
          confidence_rating: evaluation.confidence_rating,
          strengths: JSON.parse(evaluation.strengths || '[]'),
          media_evaluated: evaluation.media_evaluated
        } : null
      };
    });

    sendJson(res, 200, { submissions: enriched });
    return true;
  }

  // 7. Showcase: Get single submission with full evaluation
  if ((pathname.startsWith('/api/showcase/submission/') || (pathname.startsWith('/api/submissions/') && !pathname.endsWith('/evaluate'))) && req.method === 'GET') {
    const submissionId = pathname.replace('/api/showcase/submission/', '').replace('/api/submissions/', '');
    const submission = db.prepare(`
      SELECT s.*, p.name as author_name, p.department as author_department, p.year_of_study
      FROM submissions s
      JOIN profiles p ON s.profile_id = p.id
      WHERE s.id = ?
    `).get(submissionId);

    if (!submission) {
      sendJson(res, 404, { error: 'Submission not found' });
      return true;
    }

    const evaluation = db.prepare('SELECT * FROM evaluations WHERE submission_id = ?').get(submissionId);

    sendJson(res, 200, {
      submission,
      evaluation: evaluation ? {
        ...evaluation,
        rubric_scores: JSON.parse(evaluation.rubric_scores || '[]'),
        detailed_observations: JSON.parse(evaluation.detailed_observations || '[]'),
        strengths: JSON.parse(evaluation.strengths || '[]'),
        areas_for_improvement: JSON.parse(evaluation.areas_for_improvement || '[]'),
        practical_exercises: JSON.parse(evaluation.practical_exercises || '[]'),
        recommended_svm_activities: JSON.parse(evaluation.recommended_svm_activities || '[]')
      } : null
    });
    return true;
  }

  // 8. Showcase: Re-evaluate Submission with Gemini
  if ((pathname.startsWith('/api/showcase/evaluate/') || (pathname.startsWith('/api/submissions/') && pathname.endsWith('/evaluate'))) && req.method === 'POST') {
    const submissionId = pathname.replace('/api/showcase/evaluate/', '').replace('/api/submissions/', '').replace('/evaluate', '');
    const user = getCurrentUser(req);

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);
    if (!submission) {
      sendJson(res, 404, { error: 'Submission not found' });
      return true;
    }

    db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run('evaluating', submissionId);
    const evaluationResult = await evaluateSubmissionWithGemini(submission, user);

    // Upsert evaluation
    const existing = db.prepare('SELECT id FROM evaluations WHERE submission_id = ?').get(submissionId);
    const evalId = existing ? existing.id : `eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (existing) {
      db.prepare(`
        UPDATE evaluations SET
          rubric_scores = ?,
          overall_score = ?,
          confidence_rating = ?,
          summary = ?,
          detailed_observations = ?,
          strengths = ?,
          areas_for_improvement = ?,
          practical_exercises = ?,
          recommended_svm_activities = ?,
          limitations_disclaimer = ?,
          media_evaluated = ?,
          media_notes = ?
        WHERE id = ?
      `).run(
        JSON.stringify(evaluationResult.rubricScores || []),
        evaluationResult.overallScore,
        evaluationResult.confidenceRating || 'moderate',
        evaluationResult.summary,
        JSON.stringify(evaluationResult.detailedObservations || []),
        JSON.stringify(evaluationResult.strengths || []),
        JSON.stringify(evaluationResult.areasForImprovement || []),
        JSON.stringify(evaluationResult.practicalExercises || []),
        JSON.stringify(evaluationResult.recommendedSvmActivities || []),
        evaluationResult.limitationsDisclaimer,
        evaluationResult.mediaEvaluated ? 1 : 0,
        evaluationResult.mediaNotes,
        evalId
      );
    } else {
      db.prepare(`
        INSERT INTO evaluations (
          id, submission_id, profile_id, category,
          rubric_scores, overall_score, confidence_rating, summary,
          detailed_observations, strengths, areas_for_improvement,
          practical_exercises, recommended_svm_activities, limitations_disclaimer,
          media_evaluated, media_notes, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        evalId,
        submissionId,
        user.id,
        submission.category,
        JSON.stringify(evaluationResult.rubricScores || []),
        evaluationResult.overallScore,
        evaluationResult.confidenceRating || 'moderate',
        evaluationResult.summary,
        JSON.stringify(evaluationResult.detailedObservations || []),
        JSON.stringify(evaluationResult.strengths || []),
        JSON.stringify(evaluationResult.areasForImprovement || []),
        JSON.stringify(evaluationResult.practicalExercises || []),
        JSON.stringify(evaluationResult.recommendedSvmActivities || []),
        evaluationResult.limitationsDisclaimer,
        evaluationResult.mediaEvaluated ? 1 : 0,
        evaluationResult.mediaNotes,
        new Date().toISOString()
      );
    }

    db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run('evaluated', submissionId);
    const updatedEval = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evalId);

    sendJson(res, 200, {
      evaluation: {
        ...updatedEval,
        rubric_scores: JSON.parse(updatedEval.rubric_scores || '[]'),
        detailed_observations: JSON.parse(updatedEval.detailed_observations || '[]'),
        strengths: JSON.parse(updatedEval.strengths || '[]'),
        areas_for_improvement: JSON.parse(updatedEval.areas_for_improvement || '[]'),
        practical_exercises: JSON.parse(updatedEval.practical_exercises || '[]'),
        recommended_svm_activities: JSON.parse(updatedEval.recommended_svm_activities || '[]')
      }
    });
    return true;
  }

  // 9. Opportunities
  if (pathname === '/api/opportunities' && req.method === 'GET') {
    const user = getCurrentUser(req);
    const category = queryParams.get('category');
    const type = queryParams.get('type');
    const search = queryParams.get('search');

    let query = `
      SELECT o.*,
             (SELECT count(*) FROM opportunity_registrations WHERE opportunity_id = o.id) as registered_count,
             (SELECT status FROM opportunity_registrations WHERE opportunity_id = o.id AND profile_id = ?) as user_registration_status
      FROM opportunities o
      WHERE 1=1
    `;
    const params = [user.id];

    if (category && category !== 'all') {
      query += ' AND o.category = ?';
      params.push(category.toLowerCase());
    }
    if (type && type !== 'all') {
      query += ' AND o.type = ?';
      params.push(type.toLowerCase());
    }
    if (search && search.trim()) {
      query += ' AND (o.title LIKE ? OR o.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY o.deadline ASC';
    const opportunities = db.prepare(query).all(...params);

    sendJson(res, 200, { opportunities });
    return true;
  }

  // 10. Register for Opportunity
  if (pathname.startsWith('/api/opportunities/') && pathname.endsWith('/register') && req.method === 'POST') {
    const oppId = pathname.replace('/api/opportunities/', '').replace('/register', '');
    const user = getCurrentUser(req);

    const existing = db.prepare(`
      SELECT * FROM opportunity_registrations WHERE opportunity_id = ? AND profile_id = ?
    `).get(oppId, user.id);

    if (existing) {
      // Toggle unregister
      db.prepare('DELETE FROM opportunity_registrations WHERE id = ?').run(existing.id);
      sendJson(res, 200, { registered: false, message: 'Registration cancelled.' });
    } else {
      const regId = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      db.prepare(`
        INSERT INTO opportunity_registrations (id, opportunity_id, profile_id, status, created_at)
        VALUES (?, ?, ?, 'registered', ?)
      `).run(regId, oppId, user.id, new Date().toISOString());
      sendJson(res, 201, { registered: true, message: 'Successfully registered for opportunity!' });
    }
    return true;
  }

  // 11. Events
  if (pathname === '/api/events' && req.method === 'GET') {
    const user = getCurrentUser(req);
    const events = db.prepare(`
      SELECT e.*,
             (SELECT count(*) FROM event_rsvps WHERE event_id = e.id) as rsvp_count,
             (SELECT 1 FROM event_rsvps WHERE event_id = e.id AND profile_id = ?) as user_rsvpd
      FROM events e
      ORDER BY e.date ASC
    `).all(user.id);

    sendJson(res, 200, { events });
    return true;
  }

  // 12. RSVP for Event
  if (pathname.startsWith('/api/events/') && pathname.endsWith('/rsvp') && req.method === 'POST') {
    const eventId = pathname.replace('/api/events/', '').replace('/rsvp', '');
    const user = getCurrentUser(req);

    const existing = db.prepare(`
      SELECT * FROM event_rsvps WHERE event_id = ? AND profile_id = ?
    `).get(eventId, user.id);

    if (existing) {
      db.prepare('DELETE FROM event_rsvps WHERE id = ?').run(existing.id);
      sendJson(res, 200, { rsvpd: false, message: 'RSVP removed.' });
    } else {
      const rsvpId = `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      db.prepare(`
        INSERT INTO event_rsvps (id, event_id, profile_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(rsvpId, eventId, user.id, new Date().toISOString());
      sendJson(res, 201, { rsvpd: true, message: 'RSVP confirmed! See you at the event.' });
    }
    return true;
  }

  // 13. Collaborations Hub
  if (pathname === '/api/collaborations') {
    const user = getCurrentUser(req);

    if (req.method === 'GET') {
      const discipline = queryParams.get('discipline');
      let query = `
        SELECT c.*, p.department as author_department,
               (SELECT count(*) FROM collaboration_requests WHERE post_id = c.id) as requests_count,
               (SELECT status FROM collaboration_requests WHERE post_id = c.id AND sender_id = ?) as user_request_status
        FROM collaboration_posts c
        JOIN profiles p ON c.profile_id = p.id
        WHERE c.status != 'archived'
      `;
      const params = [user.id];

      if (discipline && discipline !== 'all') {
        query += ' AND (c.author_discipline = ? OR c.seeking_disciplines LIKE ?)';
        params.push(discipline.toLowerCase(), `%${discipline.toLowerCase()}%`);
      }

      query += ' ORDER BY c.created_at DESC';
      const posts = db.prepare(query).all(...params);

      sendJson(res, 200, {
        posts: posts.map((p) => ({
          ...p,
          seeking_disciplines: JSON.parse(p.seeking_disciplines || '[]')
        }))
      });
      return true;
    }

    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { project_title, description, seeking_disciplines, author_discipline } = body;

      if (!project_title || !description) {
        sendJson(res, 400, { error: 'Project title and description are required.' });
        return true;
      }

      const postId = `collab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      db.prepare(`
        INSERT INTO collaboration_posts (id, profile_id, author_name, author_discipline, project_title, description, seeking_disciplines, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
      `).run(
        postId,
        user.id,
        user.name,
        author_discipline || 'multidisciplinary',
        project_title.trim(),
        description.trim(),
        JSON.stringify(Array.isArray(seeking_disciplines) ? seeking_disciplines : [seeking_disciplines]),
        new Date().toISOString()
      );

      const created = db.prepare('SELECT * FROM collaboration_posts WHERE id = ?').get(postId);
      sendJson(res, 201, {
        post: {
          ...created,
          seeking_disciplines: JSON.parse(created.seeking_disciplines)
        }
      });
      return true;
    }
  }

  // 14. Send Collaboration Request
  if (pathname.startsWith('/api/collaborations/') && pathname.endsWith('/request') && req.method === 'POST') {
    const postId = pathname.replace('/api/collaborations/', '').replace('/request', '');
    const user = getCurrentUser(req);
    const body = await parseJsonBody(req);

    const post = db.prepare('SELECT * FROM collaboration_posts WHERE id = ?').get(postId);
    if (!post) {
      sendJson(res, 404, { error: 'Collaboration post not found' });
      return true;
    }

    if (post.profile_id === user.id) {
      sendJson(res, 400, { error: 'You cannot send a collaboration request to your own post.' });
      return true;
    }

    const reqId = `creq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(`
      INSERT INTO collaboration_requests (id, post_id, sender_id, sender_name, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      reqId,
      postId,
      user.id,
      user.name,
      body.message || `Hi ${post.author_name}, I'd love to collaborate on "${post.project_title}"!`,
      new Date().toISOString()
    );

    sendJson(res, 201, { message: 'Collaboration request sent successfully!' });
    return true;
  }

  // 15. Serve Media Files
  if (pathname.startsWith('/api/media/') && req.method === 'GET') {
    const filename = pathname.replace('/api/media/', '');
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return true;
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };

    const contentType = mimeMap[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return true;
  }

  // 16. Official Achievements Showcase API
  if (pathname === '/api/achievements' && req.method === 'GET') {
    const user = getCurrentUser(req);
    const data = buildAchievementsResponse(user.id);
    sendJson(res, 200, data);
    return true;
  }

  if (pathname === '/api/achievements/verify' && req.method === 'POST') {
    const user = getCurrentUser(req);
    syncUserAchievements(user.id);
    const data = buildAchievementsResponse(user.id);
    sendJson(res, 200, { ...data, message: 'Achievements verified and updated successfully.' });
    return true;
  }

  if (pathname === '/api/achievements/toggle-feature' && req.method === 'POST') {
    const user = getCurrentUser(req);
    const body = await parseJsonBody(req);
    const badgeId = body.badgeId;

    if (!badgeId) {
      sendJson(res, 400, { error: 'badgeId is required' });
      return true;
    }

    const row = db.prepare('SELECT * FROM user_achievements WHERE profile_id = ? AND badge_id = ?').get(user.id, badgeId);
    if (!row) {
      sendJson(res, 404, { error: 'Badge has not been unlocked yet.' });
      return true;
    }

    const newFeatured = row.featured ? 0 : 1;
    db.prepare('UPDATE user_achievements SET featured = ? WHERE profile_id = ? AND badge_id = ?')
      .run(newFeatured, user.id, badgeId);

    sendJson(res, 200, { badgeId, featured: Boolean(newFeatured) });
    return true;
  }

  if (pathname === '/api/achievements/mark-notified' && req.method === 'POST') {
    const user = getCurrentUser(req);
    const body = await parseJsonBody(req);
    const badgeId = body.badgeId;

    if (badgeId) {
      db.prepare('UPDATE user_achievements SET notified = 1 WHERE profile_id = ? AND badge_id = ?')
        .run(user.id, badgeId);
    } else {
      db.prepare('UPDATE user_achievements SET notified = 1 WHERE profile_id = ?')
        .run(user.id);
    }

    sendJson(res, 200, { success: true });
    return true;
  }


  // 17. Student Talent Community Feed API
  if (pathname === '/api/talent-feed' && req.method === 'GET') {
    const user = getCurrentUser(req);
    const category = queryParams.get('category') || 'all';
    const query = queryParams.get('query') || '';
    const sort = queryParams.get('sort') || 'latest';

    let sql = 'SELECT * FROM talent_posts WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      if (category === 'trending') {
        sql += ' AND trending = 1';
      } else {
        sql += ' AND category = ?';
        params.push(category);
      }
    }

    if (query && query.trim()) {
      sql += ' AND (creator_name LIKE ? OR caption LIKE ? OR hashtags_json LIKE ?)';
      const term = `%${query.trim()}%`;
      params.push(term, term, term);
    }

    if (sort === 'liked') {
      sql += ' ORDER BY likes_count DESC, created_at DESC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const rows = db.prepare(sql).all(...params);
    let posts = rows.map((r) => formatTalentPost(r, user.id));

    if (sort === 'discussed') {
      posts.sort((a, b) => b.comments.length - a.comments.length);
    }

    sendJson(res, 200, { posts });
    return true;
  }

  if (pathname === '/api/talent-feed/post' && req.method === 'POST') {
    const user = getCurrentUser(req);
    const body = await parseJsonBody(req);
    const { caption, hashtags, category, mediaType, fileBase64, fileName, preview } = body;

    let mediaUrls = [];
    if (fileBase64 && fileName) {
      const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = path.extname(fileName) || (mediaType === 'video' ? '.mp4' : '.jpg');
      const safeName = `talent-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
      const savePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(savePath, buffer);
      mediaUrls.push(`/api/media/${safeName}`);
    } else if (preview) {
      mediaUrls.push(preview);
    } else if (Array.isArray(body.media) && body.media.length > 0) {
      mediaUrls = body.media;
    }

    const postId = `post-${Date.now()}`;
    const initials = (user.name || 'You').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    const tags = Array.isArray(hashtags)
      ? hashtags
      : typeof hashtags === 'string'
        ? hashtags.split(/[,s]+/).filter(Boolean).map((t) => t.startsWith('#') ? t : `#${t}`)
        : [];

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO talent_posts (id, profile_id, creator_name, creator_initials, creator_color, category, media_type, media_json, caption, hashtags_json, likes_count, saves_count, trending, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
    `).run(
      postId,
      user.id,
      user.name,
      initials,
      '#7652F5',
      category || 'singing',
      mediaType || 'image',
      JSON.stringify(mediaUrls),
      caption || '',
      JSON.stringify(tags),
      now
    );

    syncUserAchievements(user.id);
    const row = db.prepare('SELECT * FROM talent_posts WHERE id = ?').get(postId);
    const post = formatTalentPost(row, user.id);
    sendJson(res, 201, { success: true, post });
    return true;
  }

  if (pathname.startsWith('/api/talent-feed/') && pathname.endsWith('/like') && req.method === 'POST') {
    const user = getCurrentUser(req);
    const postId = pathname.replace('/api/talent-feed/', '').replace('/like', '');
    const post = db.prepare('SELECT * FROM talent_posts WHERE id = ?').get(postId);
    if (!post) {
      sendJson(res, 404, { error: 'Post not found' });
      return true;
    }

    const existing = db.prepare('SELECT id FROM talent_post_likes WHERE post_id = ? AND profile_id = ?').get(postId, user.id);
    let liked = false;
    let nextLikes = post.likes_count;

    if (existing) {
      db.prepare('DELETE FROM talent_post_likes WHERE id = ?').run(existing.id);
      nextLikes = Math.max(0, post.likes_count - 1);
      db.prepare('UPDATE talent_posts SET likes_count = ? WHERE id = ?').run(nextLikes, postId);
      liked = false;
    } else {
      const likeId = `like-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      db.prepare('INSERT INTO talent_post_likes (id, post_id, profile_id, created_at) VALUES (?, ?, ?, ?)').run(likeId, postId, user.id, new Date().toISOString());
      nextLikes = post.likes_count + 1;
      db.prepare('UPDATE talent_posts SET likes_count = ? WHERE id = ?').run(nextLikes, postId);
      liked = true;
    }

    sendJson(res, 200, { success: true, post_id: postId, likes: nextLikes, liked });
    return true;
  }

  if (pathname.startsWith('/api/talent-feed/') && pathname.endsWith('/comment') && req.method === 'POST') {
    const user = getCurrentUser(req);
    const postId = pathname.replace('/api/talent-feed/', '').replace('/comment', '');
    const body = await parseJsonBody(req);

    if (!body.text || !body.text.trim()) {
      sendJson(res, 400, { error: 'Comment text is required' });
      return true;
    }

    const post = db.prepare('SELECT id FROM talent_posts WHERE id = ?').get(postId);
    if (!post) {
      sendJson(res, 404, { error: 'Post not found' });
      return true;
    }

    const commentId = `comm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const initials = (user.name || 'You').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO talent_post_comments (id, post_id, profile_id, author_name, author_initials, text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(commentId, postId, user.id, user.name || 'You', initials, body.text.trim(), now);

    const countRow = db.prepare('SELECT count(*) as count FROM talent_post_comments WHERE post_id = ?').get(postId);

    sendJson(res, 201, {
      success: true,
      comment: {
        id: commentId,
        name: user.name || 'You',
        initials,
        text: body.text.trim(),
        created_at: now
      },
      commentsCount: countRow?.count || 1
    });
    return true;
  }

  if (pathname.startsWith('/api/talent-feed/') && pathname.endsWith('/save') && req.method === 'POST') {
    const user = getCurrentUser(req);
    const postId = pathname.replace('/api/talent-feed/', '').replace('/save', '');
    const post = db.prepare('SELECT * FROM talent_posts WHERE id = ?').get(postId);
    if (!post) {
      sendJson(res, 404, { error: 'Post not found' });
      return true;
    }

    const existing = db.prepare('SELECT id FROM talent_post_saves WHERE post_id = ? AND profile_id = ?').get(postId, user.id);
    let saved = false;

    if (existing) {
      db.prepare('DELETE FROM talent_post_saves WHERE id = ?').run(existing.id);
      db.prepare('UPDATE talent_posts SET saves_count = MAX(0, saves_count - 1) WHERE id = ?').run(postId);
      saved = false;
    } else {
      const saveId = `save-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      db.prepare('INSERT INTO talent_post_saves (id, post_id, profile_id, created_at) VALUES (?, ?, ?, ?)').run(saveId, postId, user.id, new Date().toISOString());
      db.prepare('UPDATE talent_posts SET saves_count = saves_count + 1 WHERE id = ?').run(postId);
      saved = true;
    }

    sendJson(res, 200, { success: true, post_id: postId, saved });
    return true;
  }

  if (pathname.startsWith('/api/talent-feed/creators/') && pathname.endsWith('/follow') && req.method === 'POST') {
    const user = getCurrentUser(req);
    const creatorName = decodeURIComponent(pathname.replace('/api/talent-feed/creators/', '').replace('/follow', ''));

    const existing = db.prepare('SELECT id FROM talent_creator_follows WHERE follower_id = ? AND creator_name = ?').get(user.id, creatorName);
    let following = false;

    if (existing) {
      db.prepare('DELETE FROM talent_creator_follows WHERE id = ?').run(existing.id);
      following = false;
    } else {
      const followId = `fol-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      db.prepare('INSERT INTO talent_creator_follows (id, follower_id, creator_name, created_at) VALUES (?, ?, ?, ?)').run(followId, user.id, creatorName, new Date().toISOString());
      following = true;
    }

    sendJson(res, 200, { success: true, creator_name: creatorName, following });
    return true;
  }

  if (pathname === '/api/talent-feed/popular' && req.method === 'GET') {
    const rows = db.prepare('SELECT * FROM talent_posts ORDER BY likes_count DESC LIMIT 3').all();
    const popular = rows.map((r) => formatTalentPost(r, null));
    sendJson(res, 200, { popular });
    return true;
  }

  if (pathname === '/api/talent-feed/creators' && req.method === 'GET') {
    const user = getCurrentUser(req);
    const creators = [
      { name: 'Meera Sengupta', initials: 'MS', color: '#7652F5', category: 'Photography & Poetry', bio: 'Finding stories in ordinary places.', profile_id: 'meera.s@svmit.ac.in' },
      { name: 'Aarav Sharma', initials: 'AS', color: '#E17865', category: 'Music & Film', bio: 'Learning, layering and sharing melodies.', profile_id: 'student@svmit.ac.in' },
      { name: 'Rohit Kulkarni', initials: 'RK', color: '#2D9CDB', category: 'Art & Dance', bio: 'Sketchbooks, color studies and body rhythm.', profile_id: 'rohit.k@svmit.ac.in' },
      { name: 'Kavya Patil', initials: 'KP', color: '#43A47A', category: 'Vocals', bio: 'Classical and contemporary vocal exploration.', profile_id: 'kavya.p@svmit.ac.in' }
    ];

    const enriched = creators.map((c) => {
      const badges = db.prepare(`
        SELECT ua.badge_id as id, ua.unlocked_at
        FROM user_achievements ua
        WHERE ua.profile_id = ? AND ua.featured = 1
        LIMIT 2
      `).all(c.profile_id).map((ab) => {
        const badgeDef = SERVER_SVM_BADGES.find((b) => b.id === ab.id);
        return { id: ab.id, name: badgeDef?.name || ab.id, image: badgeDef?.image || `/images/badges/${ab.id}.png` };
      });

      const badgeCountRow = db.prepare('SELECT count(*) as count FROM user_achievements WHERE profile_id = ?').get(c.profile_id);
      const isFollowing = db.prepare('SELECT 1 FROM talent_creator_follows WHERE follower_id = ? AND creator_name = ?').get(user.id, c.name);

      return {
        ...c,
        badges,
        badgeCount: badgeCountRow?.count || 0,
        following: Boolean(isFollowing)
      };
    });

    sendJson(res, 200, { creators: enriched });
    return true;
  }

  // 18. Admin Directorate & Approval Workflow API
  if (pathname === '/api/admin/students' && req.method === 'GET') {
    const status = queryParams.get('status');
    let sql = "SELECT id, name, email, department, academic_year, role, approval_status, created_at FROM profiles WHERE role != 'admin'";
    const params = [];
    if (status) {
      sql += ' AND approval_status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    const students = db.prepare(sql).all(...params);
    sendJson(res, 200, { students });
    return true;
  }

  if (pathname.startsWith('/api/admin/students/') && pathname.endsWith('/status') && req.method === 'POST') {
    const studentId = decodeURIComponent(pathname.replace('/api/admin/students/', '').replace('/status', ''));
    const body = await parseJsonBody(req);
    const { status, notes } = body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      sendJson(res, 400, { error: 'Invalid approval status' });
      return true;
    }

    db.prepare('UPDATE profiles SET approval_status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), studentId);

    const logId = `log-${Date.now()}`;
    db.prepare(`
      INSERT INTO admin_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, ?, 'student', ?, ?, ?)
    `).run(
      logId,
      'admin@svmit.ac.in',
      'SVM Cultural Directorate',
      `STUDENT_${status.toUpperCase()}`,
      studentId,
      notes || `Status updated to ${status}`,
      new Date().toISOString()
    );

    sendJson(res, 200, { success: true, studentId, status });
    return true;
  }

  if (pathname === '/api/admin/announcements') {
    if (req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM announcements WHERE archived = 0 ORDER BY created_at DESC').all();
      sendJson(res, 200, { announcements: rows });
      return true;
    }

    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { title, category, priority, content } = body;
      if (!title || !content) {
        sendJson(res, 400, { error: 'Title and content are required' });
        return true;
      }
      const annId = `ann-${Date.now()}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO announcements (id, title, category, priority, content, author_name, archived, created_at)
        VALUES (?, ?, ?, ?, ?, 'SVM Cultural Directorate', 0, ?)
      `).run(annId, title, category || 'Auditions', priority || 'Normal', content, now);

      sendJson(res, 201, { success: true, announcement: { id: annId, title, category, priority, content, created_at: now } });
      return true;
    }
  }

  if (pathname.startsWith('/api/admin/announcements/') && req.method === 'DELETE') {
    const annId = pathname.replace('/api/admin/announcements/', '');
    db.prepare('UPDATE announcements SET archived = 1 WHERE id = ?').run(annId);
    sendJson(res, 200, { success: true, id: annId });
    return true;
  }

  if (pathname === '/api/admin/logs' && req.method === 'GET') {
    const logs = db.prepare('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50').all();
    sendJson(res, 200, { logs });
    return true;
  }

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { email } = body;
    const admin = db.prepare("SELECT * FROM profiles WHERE email = ? AND role = 'admin'").get(email || 'admin@svmit.ac.in');
    if (!admin) {
      sendJson(res, 401, { error: 'Invalid admin credentials or not authorized as admin.' });
      return true;
    }
    sendJson(res, 200, { success: true, user: admin });
    return true;
  }

  // Unhandled /api route
  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: `Endpoint ${req.method} ${pathname} not found` });
    return true;
  }

  return false;
}
