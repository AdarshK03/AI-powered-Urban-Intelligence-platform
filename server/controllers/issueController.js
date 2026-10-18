import { predictIssueImage } from "../services/aiModelService.js";
import { createImageHashes } from '../utils/imageHash.js';
import { assessSeverity } from '../utils/severityAssessment.js';
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
    const rawUrl =
      typeof photo === 'string'
        ? photo
        : photo?.url || photo?.dataUrl || '';

    const photoName = photo?.name || `photo_${idx + 1}.jpg`;

    if (typeof rawUrl === 'string' && rawUrl.startsWith('data:image/')) {
      try {
        const matches = rawUrl.match(
          /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/
        );

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

function formatIssue(row, comments = [], userVote = null) {
  const isUpvoted = userVote === 'up' || userVote === true;

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
    mapPos:
      typeof row.map_pos === 'string'
        ? JSON.parse(row.map_pos)
        : row.map_pos || null,
    photos:
      typeof row.photos === 'string'
        ? JSON.parse(row.photos)
        : row.photos || [],
    supportCount: parseInt(row.support_count, 10) || 0,
    similarCount: parseInt(row.similar_count, 10) || 0,
    reporterId: row.reporter_id || null,
    reporterName: row.reporter_name || null,
    department: row.department || null,
    assignedCrew: row.assigned_crew || null,
    aiConfidence: row.ai_confidence
      ? parseFloat(row.ai_confidence)
      : null,
    timeline:
      typeof row.timeline === 'string'
        ? JSON.parse(row.timeline)
        : row.timeline || [],
    beforeAfter:
      typeof row.before_after === 'string'
        ? JSON.parse(row.before_after)
        : row.before_after || null,
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
    hasSupported: isUpvoted,
    userVote:
      typeof userVote === 'string'
        ? userVote
        : isUpvoted
          ? 'up'
          : null,
  };
}

/**
 * Get all issues with optional filtering
 */
export async function getIssues(req, res) {
  try {
    const {
      city,
      category,
      severity,
      status,
      query: searchQ,
      reporterId,
    } = req.query || {};

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
      sql += ` AND (
        LOWER(title) LIKE $${idx}
        OR LOWER(description) LIKE $${idx}
        OR LOWER(location_name) LIKE $${idx}
      )`;

      params.push(`%${searchQ.trim().toLowerCase()}%`);
      idx++;
    }

    sql += ' ORDER BY created_at DESC';

    const issuesRes = await query(sql, params);

    const commentsRes = await query(
      'SELECT * FROM issue_comments ORDER BY created_at ASC'
    );

    const commentsByIssue = {};

    for (const c of commentsRes.rows) {
      if (!commentsByIssue[c.issue_id]) {
        commentsByIssue[c.issue_id] = [];
      }

      commentsByIssue[c.issue_id].push(c);
    }

    const userVotes = {};

    if (req.user) {
      const supRes = await query(
        'SELECT issue_id, vote_type FROM issue_supports WHERE user_id = $1',
        [req.user.id]
      );

      for (const r of supRes.rows) {
        userVotes[r.issue_id] = r.vote_type || 'up';
      }
    }

    const formatted = issuesRes.rows.map((row) =>
      formatIssue(
        row,
        commentsByIssue[row.id] || [],
        userVotes[row.id] || null
      )
    );

    return res.json({
      success: true,
      count: formatted.length,
      issues: formatted,
    });
  } catch (err) {
    console.error('Error in getIssues:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve issues.',
    });
  }
}

/**
 * Get issue by ID
 */
export async function getIssueById(req, res) {
  try {
    const { id } = req.params;

    const issueRes = await query(
      'SELECT * FROM issues WHERE id = $1 LIMIT 1',
      [id]
    );

    if (!issueRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const commentsRes = await query(
      'SELECT * FROM issue_comments WHERE issue_id = $1 ORDER BY created_at ASC',
      [id]
    );

    let userVote = null;

    if (req.user) {
      const supRes = await query(
        'SELECT vote_type FROM issue_supports WHERE issue_id = $1 AND user_id = $2 LIMIT 1',
        [id, req.user.id]
      );

      if (supRes.rows.length > 0) {
        userVote = supRes.rows[0].vote_type || 'up';
      }
    }

    return res.json({
      success: true,
      issue: formatIssue(issueRes.rows[0], commentsRes.rows, userVote),
    });
  } catch (err) {
    console.error('Error in getIssueById:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve issue details.',
    });
  }
}

/**
 * Create a new civic issue report
 * Includes severity assessment and exact duplicate-photo detection.
 */
export async function createIssue(req, res) {
  try {
    const {
      title,
      description,
      category,
      severity = 'medium',
      city,
      locationName,
      latitude,
      longitude,
      mapPos,
      photos = [],
    } = req.body || {};

    // Authentication
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to report an issue.',
      });
    }

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Issue title is required.',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required.',
      });
    }

    if (!Array.isArray(photos)) {
      return res.status(400).json({
        success: false,
        message: 'Photos must be provided as an array.',
      });
    }

    // Assess severity
    const severityAssessment = assessSeverity({
      category,
      title,
      description,
      citizenSeverity: severity,
    });

    const finalSeverity = severityAssessment.severity;

    // Resolve city
    let resolvedCity = (city || '').trim();

    if (
      !resolvedCity ||
      resolvedCity === 'All Cities' ||
      resolvedCity.toLowerCase() === 'all'
    ) {
      if (locationName && /pune/i.test(locationName)) {
        resolvedCity = 'Pune';
      } else if (req.user.city) {
        resolvedCity = req.user.city;
      } else {
        resolvedCity = 'Pune';
      }
    }

    const reporterId = req.user.id;
    const reporterName = req.user.name || 'Citizen User';

    // Hash photos before saving them or creating a report.
    const imageHashes = [];

    for (const photo of photos) {
      const imageData =
        typeof photo === 'string'
          ? photo
          : photo?.dataUrl || photo?.url || '';

      // Only hash Base64-uploaded images.
      if (!imageData.startsWith('data:image/')) {
        continue;
      }

      const hashes = await createImageHashes(imageData);

      if (hashes) {
        imageHashes.push(hashes);
      }
    }

    // Reject a photo that is already registered.
    // The existing report is never modified by this check.
    for (const { exactHash } of imageHashes) {
      const duplicateRes = await query(
        `SELECT
           i.id,
           i.reference_number,
           i.title,
           i.status
         FROM issue_photo_hashes h
         JOIN issues i ON i.id = h.issue_id
         WHERE h.image_hash = $1
         LIMIT 1`,
        [exactHash]
      );

      if (duplicateRes.rows.length > 0) {
        const original = duplicateRes.rows[0];

        return res.status(409).json({
          success: false,
          duplicate: true,
          message:
            'This photo has already been submitted. Please open the existing report instead of creating a duplicate.',
          originalReport: {
            id: original.id,
            referenceNumber: original.reference_number,
            title: original.title,
            status: original.status,
          },
        });
      }
    }

    
  // Run YOLO prediction after duplicate checking.
  let aiPrediction = null;

  const firstImageData = photos
    .map((photo) =>
      typeof photo === "string"
        ? photo
        : photo?.dataUrl || photo?.url || ""
    )
    .find(
      (image) =>
        typeof image === "string" &&
        image.startsWith("data:image/")
    );

  if (firstImageData) {
    try {
      aiPrediction = await predictIssueImage(firstImageData);

      console.log("YOLO prediction:", {
        predictedClass: aiPrediction.predictedClass,
        confidencePercent: aiPrediction.confidencePercent,
      });
    } catch (aiError) {
      // AI failure should not prevent a citizen from reporting an issue.
      console.error("YOLO prediction failed:", aiError.message);
    }
  }


    // Generate report reference and ID.
    const countRes = await query('SELECT COUNT(*) FROM issues');
    const seq = parseInt(countRes.rows[0].count, 10) + 1;

    const referenceNumber =
      `UI-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

    const id =
      `iss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const nowIso = new Date().toISOString();

    const timeline = [
      {
        status: 'reported',
        label: `Reported by ${reporterName}`,
        at: nowIso,
      },
    ];

    // Save uploaded photos only after duplicate checking.
    const savedPhotos = processUploadedPhotos(photos, id);

    const insertSql = `
      INSERT INTO issues (
        id,
        reference_number,
        title,
        description,
        category,
        severity,
        status,
        city,
        location_name,
        latitude,
        longitude,
        map_pos,
        photos,
        support_count,
        similar_count,
        reporter_id,
        reporter_name,
        ai_confidence,
        timeline,
        is_demo,
        created_by_user,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, 'reported',
        $7, $8, $9, $10, $11, $12,
        0, 0, $13, $14, $15,
        $16, false, true, NOW(), NOW()
      )
      RETURNING *
    `;

    
const insertRes = await query(insertSql, [
  id,
  referenceNumber,
  title.trim(),
  description ? description.trim() : '',
  category,
  finalSeverity,
  resolvedCity,
  locationName ? locationName.trim() : resolvedCity,
  latitude ?? null,
  longitude ?? null,
  mapPos ? JSON.stringify(mapPos) : null,
  JSON.stringify(savedPhotos),
  reporterId,
  reporterName,
  aiPrediction?.confidencePercent ?? null,
  JSON.stringify(timeline),
]);


    // Register photo hashes against the newly created report.
    for (const { exactHash } of imageHashes) {
      await query(
        `INSERT INTO issue_photo_hashes (issue_id, image_hash)
         VALUES ($1, $2)
         ON CONFLICT (image_hash) DO NOTHING`,
        [id, exactHash]
      );
    }

    // Notify administrators.
    await query(
      `INSERT INTO notifications (title, message, type, issue_id)
       VALUES ($1, $2, $3, $4)`,
      [
        `New Civic Report: ${title.trim()}`,
        `Reported in ${resolvedCity} (${locationName || 'General zone'}) with ${finalSeverity.toUpperCase()} priority. Reference: ${referenceNumber}`,
        finalSeverity === 'high' ? 'urgent' : 'info',
        id,
      ]
    );

    const formatted = formatIssue(insertRes.rows[0], [], false);

return res.status(201).json({
  success: true,
  message: 'Issue reported successfully.',
  issue: formatted,
  aiPrediction: aiPrediction
    ? {
        predictedClass: aiPrediction.predictedClass,
        confidence: aiPrediction.confidence,
        confidencePercent: aiPrediction.confidencePercent,
        needsReview: aiPrediction.needsReview,
      }
    : null,
});
  } catch (err) {
    console.error('Error in createIssue:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to create issue report.',
    });
  }
}

/**
 * Vote on issue (Upvote / Downvote)
 * Author cannot vote on their own report.
 */
export async function supportIssue(req, res) {
  try {
    const { id } = req.params;
    const { voteType = 'up' } = req.body || {};
    const userId = req.user ? req.user.id : req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to vote.',
      });
    }

    const issueRes = await query(
      'SELECT reporter_id, support_count, city FROM issues WHERE id = $1 LIMIT 1',
      [id]
    );

    if (!issueRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const issue = issueRes.rows[0];

    if (issue.reporter_id && issue.reporter_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own reported issue.',
      });
    }

    let userCity = req.user?.city;

    if (!userCity) {
      const uRes = await query(
        'SELECT city FROM users WHERE id = $1 LIMIT 1',
        [userId]
      );

      userCity = uRes.rows[0]?.city || 'Pune';
    }

    if (
      userCity &&
      issue.city &&
      issue.city.toLowerCase() !== 'all cities' &&
      issue.city.toLowerCase() !== userCity.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: `Voting is restricted to residents of ${issue.city}. Your registered city is ${userCity}.`,
      });
    }

    await query(
      `ALTER TABLE issue_supports
       ADD COLUMN IF NOT EXISTS vote_type VARCHAR(10) DEFAULT 'up'`
    ).catch(() => {});

    const existing = await query(
      'SELECT vote_type FROM issue_supports WHERE issue_id = $1 AND user_id = $2 LIMIT 1',
      [id, userId]
    );

    let finalVote = null;

    if (existing.rows.length > 0) {
      const currentVote = existing.rows[0].vote_type || 'up';

      if (currentVote === voteType) {
        await query(
          'DELETE FROM issue_supports WHERE issue_id = $1 AND user_id = $2',
          [id, userId]
        );

        finalVote = null;
      } else {
        await query(
          `UPDATE issue_supports
           SET vote_type = $1, created_at = NOW()
           WHERE issue_id = $2 AND user_id = $3`,
          [voteType, id, userId]
        );

        finalVote = voteType;
      }
    } else {
      await query(
        `INSERT INTO issue_supports (issue_id, user_id, vote_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (issue_id, user_id)
         DO UPDATE SET vote_type = EXCLUDED.vote_type`,
        [id, userId, voteType]
      );

      finalVote = voteType;
    }

    const countRes = await query(
      `SELECT
         COUNT(*) FILTER (
           WHERE vote_type = 'up' OR vote_type IS NULL
         ) AS up_count,
         COUNT(*) FILTER (
           WHERE vote_type = 'down'
         ) AS down_count
       FROM issue_supports
       WHERE issue_id = $1`,
      [id]
    );

    const upCount = parseInt(countRes.rows[0].up_count, 10) || 0;
    const downCount = parseInt(countRes.rows[0].down_count, 10) || 0;
    const netScore = Math.max(0, upCount - downCount);

    await query(
      'UPDATE issues SET support_count = $1, updated_at = NOW() WHERE id = $2',
      [netScore, id]
    );

    return res.json({
      success: true,
      userVote: finalVote,
      hasSupported: finalVote === 'up',
      supportCount: netScore,
      upCount,
      downCount,
    });
  } catch (err) {
    console.error('Error in supportIssue:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to process vote.',
    });
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
      return res.status(400).json({
        success: false,
        message: 'Comment text is required.',
      });
    }

    const commentId =
      `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const authorName = req.user
      ? req.user.name
      : author?.trim() || 'Citizen';

    const userId = req.user ? req.user.id : null;

    await query(
      `INSERT INTO issue_comments
       (id, issue_id, user_id, author_name, text)
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

    return res.status(500).json({
      success: false,
      message: 'Failed to post comment.',
    });
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
      return res.status(400).json({
        success: false,
        message: 'New status is required.',
      });
    }

    const currentRes = await query(
      'SELECT * FROM issues WHERE id = $1',
      [id]
    );

    if (!currentRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const current = currentRes.rows[0];

    const timeline =
      typeof current.timeline === 'string'
        ? JSON.parse(current.timeline)
        : current.timeline || [];

    const statusLabels = {
      reported: 'Reported by citizen',
      verified: 'Verified by authority',
      assigned: department
        ? `Assigned to ${department}`
        : 'Assigned to field division',
      in_progress: assignedCrew
        ? `Work in progress by ${assignedCrew}`
        : 'Work in progress',
      resolved: 'Work completed and resolved',
    };

    timeline.push({
      status,
      label: label || statusLabels[status] || `Status updated to ${status}`,
      at: new Date().toISOString(),
    });

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

    return res.status(500).json({
      success: false,
      message: 'Failed to update issue status.',
    });
  }
}

/**
 * Delete issue (Permitted for the citizen author or municipal admin)
 */
export async function deleteIssue(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user.id : null;
    const currentUserRole = req.user ? req.user.role : null;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to remove a report.',
      });
    }

    const issueRes = await query(
      'SELECT id, reporter_id, photos FROM issues WHERE id = $1 LIMIT 1',
      [id]
    );

    if (!issueRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Issue report not found.',
      });
    }

    const issue = issueRes.rows[0];

    if (
      issue.reporter_id !== currentUserId &&
      currentUserRole !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only remove reports that you posted.',
      });
    }

    // Clean up uploaded photo files.
    try {
      const photos = Array.isArray(issue.photos)
        ? issue.photos
        : JSON.parse(issue.photos || '[]');

      for (const p of photos) {
        if (p.url && p.url.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '..', p.url);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (cleanupErr) {
      console.warn(
        'Could not clean up uploaded photos on delete:',
        cleanupErr.message
      );
    }

    await query('DELETE FROM issue_comments WHERE issue_id = $1', [id]);
    await query('DELETE FROM issue_supports WHERE issue_id = $1', [id]);
    await query('DELETE FROM notifications WHERE issue_id = $1', [id]);
    await query('DELETE FROM issues WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Civic issue report has been permanently removed.',
    });
  } catch (err) {
    console.error('Error in deleteIssue:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete issue report.',
    });
  }
}

/**
 * Get notifications feed for citizen portal:
 * Comments and votes on the user's own reports.
 */
export async function getNotifications(req, res) {
  try {
    const currentUserId = req.user ? req.user.id : null;
    let commentsOnMyReports = [];
    let votesOnMyReports = [];

    if (currentUserId) {
      const commentsRes = await query(
        `SELECT
           c.id AS comment_id,
           c.text AS comment_text,
           c.author_name AS comment_author,
           c.created_at AS comment_created_at,
           i.id AS issue_id,
           i.title AS issue_title,
           i.reference_number AS issue_reference,
           i.category AS issue_category
         FROM issue_comments c
         JOIN issues i ON c.issue_id = i.id
         WHERE i.reporter_id = $1
           AND (c.user_id != $1 OR c.user_id IS NULL)
         ORDER BY c.created_at DESC
         LIMIT 20`,
        [currentUserId]
      );

      commentsOnMyReports = commentsRes.rows.map((row) => ({
        id: `notif_c_${row.comment_id}`,
        type: 'comment',
        priority: 'high',
        isCommentOnMyReport: true,
        issueId: row.issue_id,
        issueTitle: row.issue_title,
        referenceNumber: row.issue_reference,
        author: row.comment_author,
        message: `${row.comment_author} commented on your report: "${
          row.comment_text.length > 55
            ? row.comment_text.substring(0, 55) + '...'
            : row.comment_text
        }"`,
        createdAt: row.comment_created_at,
      }));

      const votesRes = await query(
        `SELECT
           s.id AS support_id,
           s.vote_type,
           s.created_at AS vote_created_at,
           s.user_id AS voter_id,
           u.name AS voter_name,
           i.id AS issue_id,
           i.title AS issue_title,
           i.reference_number AS issue_reference
         FROM issue_supports s
         JOIN issues i ON s.issue_id = i.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE i.reporter_id = $1
           AND s.user_id != $1
         ORDER BY s.created_at DESC
         LIMIT 20`,
        [currentUserId]
      );

      votesOnMyReports = votesRes.rows.map((row) => {
        const isUp = (row.vote_type || 'up') === 'up';
        const voterName = row.voter_name || 'A citizen';

        return {
          id: `notif_v_${row.support_id}`,
          type: 'vote',
          voteType: row.vote_type || 'up',
          priority: 'high',
          isVoteOnMyReport: true,
          issueId: row.issue_id,
          issueTitle: row.issue_title,
          referenceNumber: row.issue_reference,
          author: voterName,
          message: `${voterName} ${
            isUp ? 'upvoted (supported)' : 'downvoted'
          } your report: "${row.issue_title}"`,
          createdAt: row.vote_created_at,
        };
      });
    }

    const allNotifications = [
      ...commentsOnMyReports,
      ...votesOnMyReports,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      notifications: allNotifications,
      commentsOnMyReports,
      votesOnMyReports,
      totalUnread: allNotifications.length,
    });
  } catch (err) {
    console.error('Error in getNotifications:', err);

    return res.status(500).json({
      success: false,
      message: 'Could not fetch notifications.',
    });
  }
}