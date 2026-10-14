import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

function processUploadedPhotos(photosList, issueId) {
  if (!Array.isArray(photosList)) return [];
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return photosList.map((photo, idx) => {
    const rawUrl = typeof photo === 'string' ? photo : (photo?.url || photo?.dataUrl || '');
    const photoName = photo?.name || `photo_${idx + 1}.jpg`;

    if (typeof rawUrl === 'string' && rawUrl.startsWith('data:image/')) {
      try {
        const matches = rawUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1].replace('jpeg', 'jpg');
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${issueId}_img_${idx}_${Date.now()}.${ext}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, buffer);
          return {
            url: `/uploads/${fileName}`,
            name: photoName,
          };
        }
      } catch (err) {
        console.error('Failed to save uploaded photo to disk:', err);
      }
    }

    return {
      url: rawUrl,
      name: photoName,
    };
  });
}

function formatIssue(row, comments = [], userSupported = false) {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    title: row.title,
    description: row.description || '',
    category: row.category,
    severity: row.severity,
    status: row.status,
    city: row.city || 'New Delhi',
    locationName: row.location_name || '',
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    mapPos: typeof row.map_pos === 'string' ? JSON.parse(row.map_pos) : row.map_pos || null,
    photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos || [],
    supportCount: parseInt(row.support_count, 10) || 0,
    similarCount: parseInt(row.similar_count, 10) || 0,
    reporterId: row.reporter_id || null,
    reporterName: row.reporter_name || null,
    department: row.department || null,
    assignedCrew: row.assigned_crew || null,
    aiConfidence: row.ai_confidence ? parseFloat(row.ai_confidence) : null,
    timeline: typeof row.timeline === 'string' ? JSON.parse(row.timeline) : row.timeline || [],
    beforeAfter: typeof row.before_after === 'string' ? JSON.parse(row.before_after) : row.before_after || null,
    isDemo: !!row.is_demo,
    createdByUser: !!row.created_by_user,
    reportedAt: (row.reported_at || row.created_at).toISOString(),
    updatedAt: (row.updated_at || row.created_at).toISOString(),
    comments: comments.map((c) => ({
      id: c.id,
      author: c.author_name,
      text: c.text,
      at: new Date(c.created_at).toISOString(),
    })),
    hasSupported: userSupported,
  };
}

/**
 * Get all issues with optional filtering
 */
export async function getIssues(req, res) {
  try {
    const { city, category, severity, status, query: searchQ, reporterId } = req.query || {};

    let sql = 'SELECT * FROM issues WHERE 1=1';
    const params = [];
    let idx = 1;

    if (city && city !== 'all') {
      sql += ` AND LOWER(city) = LOWER($${idx++})`;
      params.push(city);
    }

    if (category && category !== 'all') {
      sql += ` AND category = $${idx++}`;
      params.push(category);
    }

    if (severity && severity !== 'all') {
      sql += ` AND severity = $${idx++}`;
      params.push(severity);
    }

    if (status && status !== 'all') {
      if (status === 'resolved') {
        sql += ` AND status = 'resolved'`;
      } else if (status === 'open') {
        sql += ` AND status != 'resolved'`;
      } else {
        sql += ` AND status = $${idx++}`;
        params.push(status);
      }
    }

    if (reporterId) {
      sql += ` AND reporter_id = $${idx++}`;
      params.push(reporterId);
    }

    if (searchQ && searchQ.trim()) {
      sql += ` AND (LOWER(title) LIKE $${idx} OR LOWER(description) LIKE $${idx} OR LOWER(location_name) LIKE $${idx})`;
      params.push(`%${searchQ.trim().toLowerCase()}%`);
      idx++;
    }

    sql += ' ORDER BY created_at DESC';

    const issuesRes = await query(sql, params);

    // Fetch all comments for these issues
    const commentsRes = await query('SELECT * FROM issue_comments ORDER BY created_at ASC');
    const commentsByIssue = {};
    for (const c of commentsRes.rows) {
      if (!commentsByIssue[c.issue_id]) commentsByIssue[c.issue_id] = [];
      commentsByIssue[c.issue_id].push(c);
    }

    // Check user supports if logged in
    let userSupports = new Set();
    if (req.user) {
      const supRes = await query('SELECT issue_id FROM issue_supports WHERE user_id = $1', [req.user.id]);
      userSupports = new Set(supRes.rows.map((r) => r.issue_id));
    }

    const formatted = issuesRes.rows.map((row) =>
      formatIssue(row, commentsByIssue[row.id] || [], userSupports.has(row.id))
    );

    return res.json({
      success: true,
      count: formatted.length,
      issues: formatted,
    });
  } catch (err) {
    console.error('Error in getIssues:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve issues.' });
  }
}

/**
 * Get issue by ID
 */
export async function getIssueById(req, res) {
  try {
    const { id } = req.params;
    const issueRes = await query('SELECT * FROM issues WHERE id = $1 LIMIT 1', [id]);

    if (!issueRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const commentsRes = await query(
      'SELECT * FROM issue_comments WHERE issue_id = $1 ORDER BY created_at ASC',
      [id]
    );

    let userSupported = false;
    if (req.user) {
      const supRes = await query(
        'SELECT 1 FROM issue_supports WHERE issue_id = $1 AND user_id = $2 LIMIT 1',
        [id, req.user.id]
      );
      userSupported = supRes.rows.length > 0;
    }

    return res.json({
      success: true,
      issue: formatIssue(issueRes.rows[0], commentsRes.rows, userSupported),
    });
  } catch (err) {
    console.error('Error in getIssueById:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve issue details.' });
  }
}

/**
 * Create a new civic issue report
 */
export async function createIssue(req, res) {
  try {
    const {
      title,
      description,
      category,
      severity = 'medium',
      city = 'New Delhi',
      locationName,
      latitude,
      longitude,
      mapPos,
      photos = [],
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Issue title is required.' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    // Generate unique reference number: UI-2026-XXXX
    const countRes = await query('SELECT COUNT(*) FROM issues');
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    const referenceNumber = `UI-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
    const id = `iss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const reporterId = req.user ? req.user.id : null;
    const reporterName = req.user ? req.user.name : 'Citizen User';

    const timeline = [
      {
        status: 'reported',
        label: req.user ? `Reported by ${req.user.name}` : 'Reported by citizen',
        at: nowIso,
      },
    ];

    // Compute mock AI confidence score between 91.0 and 99.2
    const aiConfidence = (90 + Math.random() * 9).toFixed(1);

    const insertSql = `
      INSERT INTO issues (
        id, reference_number, title, description, category, severity, status,
        city, location_name, latitude, longitude, map_pos, photos,
        support_count, similar_count, reporter_id, reporter_name, ai_confidence,
        timeline, is_demo, created_by_user, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'reported',
        $7, $8, $9, $10, $11, $12,
        0, 0, $13, $14, $15,
        $16, false, true, NOW(), NOW()
      ) RETURNING *
    `;

    // Safely save user-uploaded photos to server storage and persist in database
    const savedPhotos = processUploadedPhotos(photos, id);

    const insertRes = await query(insertSql, [
      id,
      referenceNumber,
      title.trim(),
      description ? description.trim() : '',
      category,
      severity,
      city,
      locationName ? locationName.trim() : city,
      latitude ?? null,
      longitude ?? null,
      mapPos ? JSON.stringify(mapPos) : null,
      JSON.stringify(savedPhotos),
      reporterId,
      reporterName,
      aiConfidence,
      JSON.stringify(timeline),
    ]);

    // Create municipal notification for admins
    await query(
      `INSERT INTO notifications (title, message, type, issue_id)
       VALUES ($1, $2, $3, $4)`,
      [
        `New Civic Report: ${title.trim()}`,
        `Reported in ${city} (${locationName || 'General zone'}) with ${severity.toUpperCase()} priority. Reference: ${referenceNumber}`,
        severity === 'high' ? 'urgent' : 'info',
        id,
      ]
    );

    const formatted = formatIssue(insertRes.rows[0], [], false);

    return res.status(201).json({
      success: true,
      message: 'Issue reported successfully.',
      issue: formatted,
    });
  } catch (err) {
    console.error('Error in createIssue:', err);
    return res.status(500).json({ success: false, message: 'Failed to create issue report.' });
  }
}

/**
 * Toggle or add support (upvote)
 */
export async function supportIssue(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : req.body.userId || 'anon_user';

    // Check if already supported
    const existing = await query(
      'SELECT 1 FROM issue_supports WHERE issue_id = $1 AND user_id = $2',
      [id, userId]
    );

    let supported = false;
    if (existing.rows.length > 0) {
      // Remove upvote
      await query('DELETE FROM issue_supports WHERE issue_id = $1 AND user_id = $2', [id, userId]);
      await query('UPDATE issues SET support_count = GREATEST(0, support_count - 1), updated_at = NOW() WHERE id = $1', [id]);
      supported = false;
    } else {
      // Add upvote
      await query('INSERT INTO issue_supports (issue_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, userId]);
      await query('UPDATE issues SET support_count = support_count + 1, updated_at = NOW() WHERE id = $1', [id]);
      supported = true;
    }

    const updatedIssue = await query('SELECT support_count FROM issues WHERE id = $1', [id]);
    const supportCount = updatedIssue.rows.length ? updatedIssue.rows[0].support_count : 0;

    return res.json({
      success: true,
      supported,
      supportCount,
    });
  } catch (err) {
    console.error('Error in supportIssue:', err);
    return res.status(500).json({ success: false, message: 'Failed to update support status.' });
  }
}

/**
 * Add comment to an issue
 */
export async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { text, author } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const commentId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const authorName = req.user ? req.user.name : author?.trim() || 'Citizen';
    const userId = req.user ? req.user.id : null;

    await query(
      `INSERT INTO issue_comments (id, issue_id, user_id, author_name, text)
       VALUES ($1, $2, $3, $4, $5)`,
      [commentId, id, userId, authorName, text.trim()]
    );

    const commentsRes = await query(
      'SELECT * FROM issue_comments WHERE issue_id = $1 ORDER BY created_at ASC',
      [id]
    );

    return res.status(201).json({
      success: true,
      comment: {
        id: commentId,
        author: authorName,
        text: text.trim(),
        at: new Date().toISOString(),
      },
      comments: commentsRes.rows.map((c) => ({
        id: c.id,
        author: c.author_name,
        text: c.text,
        at: new Date(c.created_at).toISOString(),
      })),
    });
  } catch (err) {
    console.error('Error in addComment:', err);
    return res.status(500).json({ success: false, message: 'Failed to post comment.' });
  }
}

/**
 * Update issue status and milestones (Admin / Authority)
 */
export async function updateIssueStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, label, department, assignedCrew } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, message: 'New status is required.' });
    }

    const currentRes = await query('SELECT * FROM issues WHERE id = $1', [id]);
    if (!currentRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const current = currentRes.rows[0];
    const timeline = typeof current.timeline === 'string' ? JSON.parse(current.timeline) : current.timeline || [];

    const statusLabels = {
      reported: 'Reported by citizen',
      verified: 'Verified by authority',
      assigned: department ? `Assigned to ${department}` : 'Assigned to field division',
      in_progress: assignedCrew ? `Work in progress by ${assignedCrew}` : 'Work in progress',
      resolved: 'Work completed and resolved',
    };

    const newMilestone = {
      status,
      label: label || statusLabels[status] || `Status updated to ${status}`,
      at: new Date().toISOString(),
    };

    timeline.push(newMilestone);

    const updateSql = `
      UPDATE issues SET
        status = $1,
        timeline = $2,
        department = COALESCE($3, department),
        assigned_crew = COALESCE($4, assigned_crew),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const updated = await query(updateSql, [
      status,
      JSON.stringify(timeline),
      department || null,
      assignedCrew || null,
      id,
    ]);

    return res.json({
      success: true,
      message: `Issue status updated to ${status}.`,
      issue: formatIssue(updated.rows[0], []),
    });
  } catch (err) {
    console.error('Error in updateIssueStatus:', err);
    return res.status(500).json({ success: false, message: 'Failed to update issue status.' });
  }
}

/**
 * Delete issue
 */
export async function deleteIssue(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM issues WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Issue deleted successfully.' });
  } catch (err) {
    console.error('Error in deleteIssue:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete issue.' });
  }
}
