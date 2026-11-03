import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApiRequest } from './api.js';
import { db } from './db.js';

function createMockReqRes({ method = 'GET', url = '/api/health', headers = {}, body = null }) {
  const parsedUrl = new URL(url, 'http://localhost:3000');
  const req = {
    method,
    url,
    headers: {
      'x-user-email': 'student@svmit.ac.in',
      host: 'localhost:3000',
      ...headers
    },
    on(event, handler) {
      if (event === 'data' && body) {
        handler(typeof body === 'string' ? body : JSON.stringify(body));
      }
      if (event === 'end') {
        handler();
      }
      return this;
    }
  };

  let statusCode = 200;
  let resHeaders = {};
  let resBody = '';

  const res = {
    writeHead(status, hdrs) {
      statusCode = status;
      resHeaders = hdrs;
    },
    end(data) {
      if (data) resBody = data;
    }
  };

  return {
    req,
    res,
    pathname: parsedUrl.pathname,
    queryParams: parsedUrl.searchParams,
    get response() {
      return {
        status: statusCode,
        headers: resHeaders,
        json: resBody ? JSON.parse(resBody) : null,
        raw: resBody
      };
    }
  };
}

test('Health endpoint returns ok and database ready', async () => {
  const ctx = createMockReqRes({ method: 'GET', url: '/api/health' });
  const handled = await handleApiRequest(ctx.req, ctx.res, ctx.pathname, ctx.queryParams);
  assert.equal(handled, true);
  assert.equal(ctx.response.status, 200);
  assert.equal(ctx.response.json.status, 'ok');
  assert.equal(ctx.response.json.dbReady, true);
});

test('Talent Feed returns posts with author badge metadata', async () => {
  const ctx = createMockReqRes({ method: 'GET', url: '/api/talent-feed?category=all&sort=latest' });
  const handled = await handleApiRequest(ctx.req, ctx.res, ctx.pathname, ctx.queryParams);
  assert.equal(handled, true);
  assert.equal(ctx.response.status, 200);
  assert.ok(Array.isArray(ctx.response.json.posts));
  assert.ok(ctx.response.json.posts.length >= 3);
  const first = ctx.response.json.posts[0];
  assert.ok(first.creator);
  assert.ok(first.creator.name);
  assert.ok(Array.isArray(first.comments));
});

test('Posting creative work to Talent Feed creates record and syncs badges', async () => {
  const ctx = createMockReqRes({
    method: 'POST',
    url: '/api/talent-feed/post',
    body: {
      caption: 'Acoustic evening chord melody progression',
      hashtags: ['#SVMVibes', '#Acoustic'],
      category: 'singing',
      mediaType: 'image',
      media: ['/assets/svm-cultural-bg.jpg']
    }
  });

  const handled = await handleApiRequest(ctx.req, ctx.res, ctx.pathname, ctx.queryParams);
  assert.equal(handled, true);
  assert.equal(ctx.response.status, 201);
  assert.ok(ctx.response.json.post);
  assert.equal(ctx.response.json.post.category, 'singing');

  // Verify stored in SQLite
  const saved = db.prepare('SELECT * FROM talent_posts WHERE id = ?').get(ctx.response.json.post.id);
  assert.ok(saved);
  assert.equal(saved.category, 'singing');
});

test('Liking a talent post toggles like count and user like state', async () => {
  // 1. Like
  const ctx1 = createMockReqRes({ method: 'POST', url: '/api/talent-feed/post-2/like' });
  await handleApiRequest(ctx1.req, ctx1.res, ctx1.pathname, ctx1.queryParams);
  assert.equal(ctx1.response.status, 200);
  const initialLikes = ctx1.response.json.likes;

  // 2. Unlike (toggle)
  const ctx2 = createMockReqRes({ method: 'POST', url: '/api/talent-feed/post-2/like' });
  await handleApiRequest(ctx2.req, ctx2.res, ctx2.pathname, ctx2.queryParams);
  assert.equal(ctx2.response.status, 200);
  assert.equal(ctx2.response.json.likes, initialLikes - 1);
});

test('Commenting on a talent post persists and increments count', async () => {
  const ctx = createMockReqRes({
    method: 'POST',
    url: '/api/talent-feed/post-1/comment',
    body: { text: 'Incredible depth of field in this photo!' }
  });

  const handled = await handleApiRequest(ctx.req, ctx.res, ctx.pathname, ctx.queryParams);
  assert.equal(handled, true);
  assert.equal(ctx.response.status, 201);
  assert.equal(ctx.response.json.comment.text, 'Incredible depth of field in this photo!');
  assert.ok(ctx.response.json.commentsCount >= 2);
});

test('Achievements API calculates user milestones and badge progress', async () => {
  const ctx = createMockReqRes({ method: 'GET', url: '/api/achievements' });
  const handled = await handleApiRequest(ctx.req, ctx.res, ctx.pathname, ctx.queryParams);
  assert.equal(handled, true);
  assert.equal(ctx.response.status, 200);
  assert.ok(ctx.response.json.summary);
  assert.ok(Array.isArray(ctx.response.json.badges));
  assert.equal(ctx.response.json.badges.length, 12);
});

test('Admin API retrieves students and processes approval updates', async () => {
  const testStudentId = `test_student_${Date.now()}@svmit.ac.in`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO profiles (id, name, email, department, role, approval_status, created_at, updated_at)
    VALUES (?, 'Test Student', ?, 'Computer Science', 'student', 'pending', ?, ?)
  `).run(testStudentId, testStudentId, now, now);

  // 1. Get pending students
  const ctxList = createMockReqRes({
    method: 'GET',
    url: '/api/admin/students?status=pending',
    headers: { 'x-user-email': 'admin@svmit.ac.in' }
  });
  await handleApiRequest(ctxList.req, ctxList.res, ctxList.pathname, ctxList.queryParams);
  assert.equal(ctxList.response.status, 200);
  assert.ok(ctxList.response.json.students.length >= 1);

  // 2. Approve student
  const ctxApprove = createMockReqRes({
    method: 'POST',
    url: `/api/admin/students/${encodeURIComponent(testStudentId)}/status`,
    headers: { 'x-user-email': 'admin@svmit.ac.in' },
    body: { status: 'approved', notes: 'Verified campus credentials.' }
  });
  await handleApiRequest(ctxApprove.req, ctxApprove.res, ctxApprove.pathname, ctxApprove.queryParams);
  assert.equal(ctxApprove.response.status, 200);
  assert.equal(ctxApprove.response.json.status, 'approved');

  // Verify updated in database
  const updated = db.prepare('SELECT approval_status FROM profiles WHERE id = ?').get(testStudentId);
  assert.equal(updated.approval_status, 'approved');
});

test('Admin Announcements API publishes and lists notices', async () => {
  const ctxCreate = createMockReqRes({
    method: 'POST',
    url: '/api/admin/announcements',
    headers: { 'x-user-email': 'admin@svmit.ac.in' },
    body: {
      title: 'Spring Classical Music Workshop',
      category: 'Workshop',
      priority: 'Normal',
      content: 'Masterclass with guest vocalists in the main hall.'
    }
  });

  await handleApiRequest(ctxCreate.req, ctxCreate.res, ctxCreate.pathname, ctxCreate.queryParams);
  assert.equal(ctxCreate.response.status, 201);
  assert.ok(ctxCreate.response.json.announcement.id);

  const ctxGet = createMockReqRes({ method: 'GET', url: '/api/admin/announcements' });
  await handleApiRequest(ctxGet.req, ctxGet.res, ctxGet.pathname, ctxGet.queryParams);
  assert.equal(ctxGet.response.status, 200);
  assert.ok(ctxGet.response.json.announcements.some((a) => a.title === 'Spring Classical Music Workshop'));
});
