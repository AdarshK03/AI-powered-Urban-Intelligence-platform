import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

/**
 * Helper to ensure a crew record exists for the authenticated crew leader
 */
async function getOrCreateCrewForLeader(user) {
  // Check if a crew is explicitly linked to this leader_id
  let res = await query('SELECT * FROM crews WHERE leader_id = $1 LIMIT 1', [user.id]);
  if (res.rows.length > 0) return res.rows[0];

  // Check if organization name matches a crew
  if (user.organisation) {
    res = await query('SELECT * FROM crews WHERE LOWER(name) = LOWER($1) LIMIT 1', [user.organisation.trim()]);
    if (res.rows.length > 0) {
      await query('UPDATE crews SET leader_id = $1 WHERE id = $2', [user.id, res.rows[0].id]);
      return { ...res.rows[0], leader_id: user.id };
    }
  }

  // Create a new crew record for this leader
  const newCrewId = `crew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const crewName = user.organisation?.trim() || `${user.name}'s Field Crew`;
  const city = user.city || 'Pune';

  const insert = await query(
    `INSERT INTO crews (id, name, specialty, leader, members, status, leader_id, city)
     VALUES ($1, $2, 'General Road & Infrastructure Maintenance', $3, 0, 'Available', $4, $5)
     RETURNING *`,
    [newCrewId, crewName, user.name, user.id, city]
  );

  return insert.rows[0];
}

/**
 * Save base64 photo to uploads directory
 */
function saveMemberPhoto(rawUrl, memberId) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  if (!rawUrl.startsWith('data:image/')) return rawUrl;

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const matches = rawUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1].replace('jpeg', 'jpg');
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `member_${memberId}_${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/${fileName}`;
    }
  } catch (err) {
    console.error('Failed to save crew member photo:', err);
  }
  return null;
}

/**
 * GET /api/crew/me
 * Fetch crew details for current logged-in leader
 */
export async function getCrewProfile(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const crew = await getOrCreateCrewForLeader(user);

    // Count live members
    const memberCountRes = await query('SELECT COUNT(*) FROM crew_members WHERE crew_id = $1', [crew.id]);
    const actualMembers = parseInt(memberCountRes.rows[0].count, 10) || 0;

    // Fetch active task if any
    let activeTask = null;
    if (crew.assigned_issue_id) {
      const issueRes = await query('SELECT * FROM issues WHERE id = $1 LIMIT 1', [crew.assigned_issue_id]);
      if (issueRes.rows.length > 0) {
        const row = issueRes.rows[0];
        activeTask = {
          id: row.id,
          referenceNumber: row.reference_number,
          title: row.title,
          description: row.description,
          category: row.category,
          severity: row.severity,
          status: row.status,
          assignmentStatus: row.assignment_status || 'pending',
          city: row.city,
          locationName: row.location_name,
          photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos || [],
        };
      }
    }

    return res.json({
      success: true,
      crew: {
        id: crew.id,
        name: crew.name,
        specialty: crew.specialty,
        leader: crew.leader,
        leaderId: crew.leader_id,
        membersCount: actualMembers,
        status: crew.status,
        city: crew.city || user.city || 'Pune',
        vehicleNumber: crew.vehicle_number || 'MH-12-GOV-01',
        activeTask,
      },
      leader: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city || 'Pune',
        organisation: user.organisation,
      },
    });
  } catch (err) {
    console.error('Error in getCrewProfile:', err);
    return res.status(500).json({ success: false, message: 'Failed to load crew profile.' });
  }
}

/**
 * PATCH /api/crew/status
 * Toggle working status (Available/Active vs Busy)
 */
export async function updateCrewStatus(req, res) {
  try {
    const user = req.user;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    // Normalize: active -> Available, busy -> Busy
    const normalized =
      status.toLowerCase() === 'active' || status.toLowerCase() === 'available'
        ? 'Available'
        : 'Busy';

    const crew = await getOrCreateCrewForLeader(user);

    await query('UPDATE crews SET status = $1 WHERE id = $2', [normalized, crew.id]);

    return res.json({
      success: true,
      message: `Crew status updated to ${normalized}.`,
      status: normalized,
      isActive: normalized === 'Available',
    });
  } catch (err) {
    console.error('Error in updateCrewStatus:', err);
    return res.status(500).json({ success: false, message: 'Failed to update crew status.' });
  }
}

/**
 * GET /api/crew/members
 * Get all members belonging to this crew
 */
export async function getCrewMembers(req, res) {
  try {
    const user = req.user;
    const crew = await getOrCreateCrewForLeader(user);

    const membersRes = await query(
      'SELECT * FROM crew_members WHERE crew_id = $1 ORDER BY created_at ASC',
      [crew.id]
    );

    const members = membersRes.rows.map((m) => ({
      id: m.id,
      name: m.name,
      age: m.age,
      photoUrl: m.photo_url,
      role: m.role_in_crew,
      createdAt: m.created_at,
    }));

    return res.json({
      success: true,
      count: members.length,
      members,
    });
  } catch (err) {
    console.error('Error in getCrewMembers:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch crew members.' });
  }
}

/**
 * POST /api/crew/members
 * Add a new crew member (name, age, photo, role)
 */
export async function addCrewMember(req, res) {
  try {
    const user = req.user;
    const { name, age, photo, role = 'Technician' } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Member name is required.' });
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 80) {
      return res.status(400).json({ success: false, message: 'Age must be a valid number between 18 and 80.' });
    }

    const crew = await getOrCreateCrewForLeader(user);
    const memberId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Save photo to disk if base64 provided
    const savedPhotoUrl = saveMemberPhoto(photo, memberId);

    const insert = await query(
      `INSERT INTO crew_members (id, crew_id, leader_id, name, age, photo_url, role_in_crew)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [memberId, crew.id, user.id, name.trim(), parsedAge, savedPhotoUrl, role.trim() || 'Technician']
    );

    // Update count in crews table
    await query(
      'UPDATE crews SET members = (SELECT COUNT(*) FROM crew_members WHERE crew_id = $1) WHERE id = $1',
      [crew.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Crew member added successfully.',
      member: {
        id: insert.rows[0].id,
        name: insert.rows[0].name,
        age: insert.rows[0].age,
        photoUrl: insert.rows[0].photo_url,
        role: insert.rows[0].role_in_crew,
        createdAt: insert.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error('Error in addCrewMember:', err);
    return res.status(500).json({ success: false, message: 'Failed to add crew member.' });
  }
}

/**
 * DELETE /api/crew/members/:id
 * Remove a crew member
 */
export async function deleteCrewMember(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const crew = await getOrCreateCrewForLeader(user);

    const checkRes = await query(
      'SELECT * FROM crew_members WHERE id = $1 AND crew_id = $2 LIMIT 1',
      [id, crew.id]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Crew member not found in your roster.' });
    }

    const member = checkRes.rows[0];

    // Clean up photo on disk if local
    if (member.photo_url && member.photo_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', member.photo_url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanErr) {
          console.warn('Could not remove member photo file:', cleanErr.message);
        }
      }
    }

    await query('DELETE FROM crew_members WHERE id = $1', [id]);

    // Update count in crews table
    await query(
      'UPDATE crews SET members = (SELECT COUNT(*) FROM crew_members WHERE crew_id = $1) WHERE id = $1',
      [crew.id]
    );

    return res.json({
      success: true,
      message: `${member.name} removed from crew roster.`,
    });
  } catch (err) {
    console.error('Error in deleteCrewMember:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete crew member.' });
  }
}

/**
 * GET /api/crew/notifications
 * Get task assignment notifications for crew leader:
 * Specifically shows task assignments with just the title as requested.
 */
export async function getCrewNotifications(req, res) {
  try {
    const user = req.user;
    const crew = await getOrCreateCrewForLeader(user);

    // 1. Fetch tasks currently assigned to this crew
    const assignedTasks = await query(
      `SELECT id, title, reference_number, severity, category, city, status, assignment_status, created_at, updated_at
       FROM issues
       WHERE assigned_crew = $1 OR id = $2
       ORDER BY updated_at DESC`,
      [crew.name, crew.assigned_issue_id]
    );

    // Format assigned tasks as notifications displaying JUST THE TITLE
    const taskNotifications = assignedTasks.rows.map((row) => ({
      id: `task_notif_${row.id}`,
      issueId: row.id,
      title: row.title, // Shown with just the title as requested
      referenceNumber: row.reference_number,
      severity: row.severity,
      status: row.status,
      assignmentStatus: row.assignment_status || 'pending',
      type: 'task_assignment',
      isPendingAcceptance: row.assignment_status === 'pending' || !row.assignment_status,
      createdAt: row.updated_at || row.created_at,
    }));

    return res.json({
      success: true,
      notifications: taskNotifications,
      count: taskNotifications.length,
      unreadCount: taskNotifications.filter((n) => n.isPendingAcceptance).length,
    });
  } catch (err) {
    console.error('Error in getCrewNotifications:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch crew notifications.' });
  }
}

/**
 * GET /api/crew/tasks
 * Fetch all work orders assigned to this crew
 */
export async function getCrewTasks(req, res) {
  try {
    const user = req.user;
    const crew = await getOrCreateCrewForLeader(user);

    const tasksRes = await query(
      `SELECT * FROM issues
       WHERE assigned_crew = $1 OR id = $2
       ORDER BY updated_at DESC`,
      [crew.name, crew.assigned_issue_id]
    );

    const formattedTasks = tasksRes.rows.map((row) => ({
      id: row.id,
      referenceNumber: row.reference_number,
      title: row.title,
      description: row.description || '',
      category: row.category,
      severity: row.severity,
      status: row.status,
      assignmentStatus: row.assignment_status || 'pending',
      city: row.city,
      locationName: row.location_name || '',
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos || [],
      workDonePhotos: typeof row.work_done_photos === 'string' ? JSON.parse(row.work_done_photos) : row.work_done_photos || [],
      workDoneNotes: row.work_done_notes || '',
      adminFeedback: row.admin_feedback || '',
      workSubmittedAt: row.work_submitted_at ? new Date(row.work_submitted_at).toISOString() : null,
      workApprovedAt: row.work_approved_at ? new Date(row.work_approved_at).toISOString() : null,
      firstAssignedAt: row.first_assigned_at ? new Date(row.first_assigned_at).toISOString() : null,
      reportedAt: (row.reported_at || row.created_at).toISOString(),
      updatedAt: (row.updated_at || row.created_at).toISOString(),
      timeline: typeof row.timeline === 'string' ? JSON.parse(row.timeline) : row.timeline || [],
    }));

    return res.json({
      success: true,
      count: formattedTasks.length,
      tasks: formattedTasks,
    });
  } catch (err) {
    console.error('Error in getCrewTasks:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve crew tasks.' });
  }
}

/**
 * POST /api/crew/tasks/:id/respond
 * Accept or reject admin task request
 */
export async function respondToTask(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { action, reason } = req.body || {};

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "accept" or "reject".' });
    }

    const crew = await getOrCreateCrewForLeader(user);

    const issueRes = await query('SELECT * FROM issues WHERE id = $1 LIMIT 1', [id]);
    if (issueRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const issue = issueRes.rows[0];
    const timeline = typeof issue.timeline === 'string' ? JSON.parse(issue.timeline) : issue.timeline || [];
    const nowIso = new Date().toISOString();

    if (action === 'accept') {
      timeline.push({
        status: 'in_progress',
        label: `Work order accepted by ${crew.name}. Field crew deployed.`,
        at: nowIso,
      });

      await query(
        `UPDATE issues SET
           assignment_status = 'accepted',
           status = 'in_progress',
           assigned_crew = $1,
           timeline = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [crew.name, JSON.stringify(timeline), id]
      );

      // Set crew working status to Busy and link active issue
      await query('UPDATE crews SET status = $1, assigned_issue_id = $2 WHERE id = $3', ['Busy', id, crew.id]);

      // Notify municipal admin
      await query(
        `INSERT INTO notifications (title, message, type, issue_id)
         VALUES ($1, $2, 'info', $3)`,
        [
          `Task Accepted: ${issue.title}`,
          `Crew "${crew.name}" has accepted assignment for ${issue.reference_number}. Crew is now on site.`,
          id,
        ]
      );

      return res.json({
        success: true,
        message: `Task ${issue.reference_number} accepted. Crew status switched to Busy.`,
        assignmentStatus: 'accepted',
      });
    } else {
      // Rejecting task
      timeline.push({
        status: 'reported',
        label: `Assignment declined by ${crew.name}${reason ? ': ' + reason : ''}. Re-queued for assignment.`,
        at: nowIso,
      });

      await query(
        `UPDATE issues SET
           assignment_status = 'rejected',
           assigned_crew = null,
           timeline = $1,
           updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(timeline), id]
      );

      // Free crew if this was their assigned task
      if (crew.assigned_issue_id === id) {
        await query('UPDATE crews SET assigned_issue_id = null, status = $1 WHERE id = $2', ['Available', crew.id]);
      }

      // Notify municipal admin of rejection
      await query(
        `INSERT INTO notifications (title, message, type, issue_id)
         VALUES ($1, $2, 'urgent', $3)`,
        [
          `Task Declined: ${issue.title}`,
          `Crew "${crew.name}" declined assignment for ${issue.reference_number}.${reason ? ' Reason: ' + reason : ''}`,
          id,
        ]
      );

      return res.json({
        success: true,
        message: `Task ${issue.reference_number} declined. Admin notified.`,
        assignmentStatus: 'rejected',
      });
    }
  } catch (err) {
    console.error('Error in respondToTask:', err);
    return res.status(500).json({ success: false, message: 'Failed to respond to task assignment.' });
  }
}

/**
 * POST /api/crew/request-task
 * Crew leader requests to work on an unassigned defect shown on the city map.
 * Strictly restricted to their registered city.
 */
export async function requestTaskAssignment(req, res) {
  try {
    const user = req.user;
    const { issueId, notes } = req.body || {};

    if (!issueId) {
      return res.status(400).json({ success: false, message: 'Issue ID is required.' });
    }

    const crew = await getOrCreateCrewForLeader(user);

    const issueRes = await query('SELECT * FROM issues WHERE id = $1 LIMIT 1', [issueId]);
    if (issueRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reported issue not found.' });
    }

    const issue = issueRes.rows[0];
    const userCity = user.city || crew.city || 'Pune';
    const issueCity = issue.city || 'Pune';

    // REQUIREMENT: Strictly within the crew leader's city
    if (
      userCity &&
      issueCity &&
      issueCity.toLowerCase() !== 'all cities' &&
      issueCity.toLowerCase() !== userCity.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: `Task requests are strictly restricted to your registered city (${userCity}). This defect is in ${issueCity}.`,
      });
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Upsert into crew_task_requests
    await query(
      `INSERT INTO crew_task_requests (id, issue_id, crew_id, leader_id, status, notes)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       ON CONFLICT (issue_id, crew_id) DO UPDATE SET notes = EXCLUDED.notes, created_at = NOW()`,
      [requestId, issueId, crew.id, user.id, notes ? notes.trim() : '']
    );

    // Notify municipal admin
    await query(
      `INSERT INTO notifications (title, message, type, issue_id)
       VALUES ($1, $2, 'info', $3)`,
      [
        `Crew Assignment Request: ${issue.title}`,
        `Crew "${crew.name}" has formally requested assignment for defect "${issue.title}" (${issue.reference_number}) in ${issueCity}.${notes ? ' Note: ' + notes : ''}`,
        issueId,
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Assignment request submitted for "${issue.title}". Municipal administration notified for review.`,
    });
  } catch (err) {
    console.error('Error in requestTaskAssignment:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit task request.' });
  }
}

/**
 * GET /api/crew/my-requests
 * Retrieve all task assignment requests made by this crew leader
 */
export async function getMyTaskRequests(req, res) {
  try {
    const user = req.user;
    const requestsRes = await query(
      `SELECT r.id, r.status, r.notes, r.retry_count, r.admin_notes, r.created_at,
              i.id AS issue_id, i.title, i.reference_number, i.category, i.severity, i.status AS issue_status, i.city, i.location_name
       FROM crew_task_requests r
       JOIN issues i ON r.issue_id = i.id
       WHERE r.leader_id = $1 AND r.status != 'approved'
       ORDER BY r.created_at DESC`,
      [user.id]
    );

    const requests = requestsRes.rows.map((row) => ({
      id: row.id,
      issueId: row.issue_id,
      title: row.title,
      referenceNumber: row.reference_number,
      category: row.category,
      severity: row.severity,
      issueStatus: row.issue_status,
      city: row.city,
      locationName: row.location_name,
      status: row.status,
      notes: row.notes,
      retryCount: row.retry_count || 0,
      adminNotes: row.admin_notes || '',
      createdAt: row.created_at,
    }));

    return res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    console.error('Error in getMyTaskRequests:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch task requests.' });
  }
}

/**
 * POST /api/crew/my-requests/:id/resend
 * Resend a rejected task request back to admin (Allowed only once - retry_count === 0 -> 1)
 */
export async function resendTaskRequest(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { notes } = req.body || {};

    const reqCheck = await query('SELECT * FROM crew_task_requests WHERE id = $1 AND leader_id = $2', [id, user.id]);
    if (reqCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task request not found or not owned by you.' });
    }

    const currentReq = reqCheck.rows[0];

    if (currentReq.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only declined requests can be resubmitted.' });
    }

    if ((currentReq.retry_count || 0) >= 1) {
      return res.status(400).json({
        success: false,
        message: 'You have already used your final retry chance for this request.',
      });
    }

    const updatedNotes = notes && notes.trim() ? notes.trim() : (currentReq.notes || '');

    await query(
      `UPDATE crew_task_requests
       SET status = 'pending',
           retry_count = COALESCE(retry_count, 0) + 1,
           notes = $1,
           created_at = NOW()
       WHERE id = $2`,
      [updatedNotes, id]
    );

    // Notify admin about final resubmission
    const issueRes = await query('SELECT * FROM issues WHERE id = $1', [currentReq.issue_id]);
    const crewRes = await query('SELECT * FROM crews WHERE id = $1', [currentReq.crew_id]);
    const issue = issueRes.rows[0];
    const crew = crewRes.rows[0];

    await query(
      `INSERT INTO notifications (title, message, type, issue_id)
       VALUES ($1, $2, 'info', $3)`,
      [
        `Crew Re-Submitted Request: ${issue?.title || 'Defect'} (Final Chance)`,
        `Crew "${crew?.name || 'Field Crew'}" resubmitted request for defect "${issue?.title || ''}" (${issue?.reference_number || ''}). Updated notes: ${updatedNotes}`,
        currentReq.issue_id,
      ]
    );

    return res.json({
      success: true,
      message: 'Request resubmitted successfully to municipal administration (Final Chance used).',
    });
  } catch (err) {
    console.error('Error in resendTaskRequest:', err);
    return res.status(500).json({ success: false, message: 'Failed to resubmit task request.' });
  }
}

/**
 * DELETE /api/crew/my-requests/:id
 * Remove request completely from leader's tab
 */
export async function deleteTaskRequest(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const deleteRes = await query(
      'DELETE FROM crew_task_requests WHERE id = $1 AND leader_id = $2 RETURNING *',
      [id, user.id]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task request not found or not owned by you.' });
    }

    return res.json({
      success: true,
      message: 'Task request removed completely.',
    });
  } catch (err) {
    console.error('Error in deleteTaskRequest:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove task request.' });
  }
}

/**
 * Helper to process and save work-done photos uploaded by the crew leader
 */
function processWorkDonePhotos(photosList, issueId) {
  if (!Array.isArray(photosList)) return [];

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return photosList.map((photo, idx) => {
    const rawUrl =
      typeof photo === 'string'
        ? photo
        : photo?.url || photo?.dataUrl || '';

    const photoName = photo?.name || `repair_photo_${idx + 1}.jpg`;

    if (typeof rawUrl === 'string' && rawUrl.startsWith('data:image/')) {
      try {
        const matches = rawUrl.match(
          /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/
        );

        if (matches) {
          const ext = matches[1].replace('jpeg', 'jpg');
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${issueId}_workdone_${idx}_${Date.now()}.${ext}`;
          const filePath = path.join(uploadsDir, fileName);

          fs.writeFileSync(filePath, buffer);

          return {
            url: `/uploads/${fileName}`,
            name: photoName,
          };
        }
      } catch (err) {
        console.error('Failed to save uploaded work-done photo to disk:', err);
      }
    }

    return {
      url: rawUrl,
      name: photoName,
    };
  });
}

/**
 * POST /api/crew/tasks/:id/submit-work
 * Crew leader uploads completed repair photos and notes, submitting for municipal admin approval
 */
export async function submitWorkDone(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { photos = [], notes = '' } = req.body || {};

    const crew = await getOrCreateCrewForLeader(user);

    const issueRes = await query('SELECT * FROM issues WHERE id = $1 LIMIT 1', [id]);
    if (issueRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task issue not found.' });
    }

    const issue = issueRes.rows[0];

    // Verify crew assignment
    if (issue.assigned_crew && issue.assigned_crew !== crew.name && crew.assigned_issue_id !== id) {
      return res.status(403).json({ success: false, message: 'Your crew is not assigned to this issue.' });
    }

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one photo of the completed repair work is required.' });
    }

    const savedPhotos = processWorkDonePhotos(photos, id);
    const timeline = typeof issue.timeline === 'string' ? JSON.parse(issue.timeline) : issue.timeline || [];
    const nowIso = new Date().toISOString();

    timeline.push({
      status: 'work_completed',
      label: `Repairs completed by ${crew.name}. Awaiting Municipal Admin inspection & approval.`,
      at: nowIso,
    });

    const updateRes = await query(
      `UPDATE issues SET
         status = 'work_completed',
         assignment_status = 'work_submitted',
         work_done_photos = $1,
         work_done_notes = $2,
         work_submitted_at = NOW(),
         timeline = $3,
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [JSON.stringify(savedPhotos), (notes || '').trim(), JSON.stringify(timeline), id]
    );

    // Notify municipal administration
    await query(
      `INSERT INTO notifications (title, message, type, issue_id)
       VALUES ($1, $2, 'urgent', $3)`,
      [
        `Work Done Submitted: ${issue.title}`,
        `Crew "${crew.name}" has completed repair work for ${issue.reference_number}. Review before/after photos and approve to publish to citizens.`,
        id,
      ]
    );

    return res.json({
      success: true,
      message: 'Work completion report submitted successfully. Awaiting Municipal Admin inspection and approval.',
      issue: updateRes.rows[0],
    });
  } catch (err) {
    console.error('Error in submitWorkDone:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit completed work report.' });
  }
}

