import { query } from '../config/db.js';

/**
 * Get dynamic administrative overview statistics computed from PostgreSQL
 */
export async function getOverviewStats(req, res) {
  try {
    const { period = 'Last 30 Days' } = req.query || {};

    let timeInterval = "INTERVAL '30 days'";
    if (period === 'Last 1 Hour') timeInterval = "INTERVAL '1 hour'";
    else if (period === 'Last 24 Hours') timeInterval = "INTERVAL '24 hours'";
    else if (period === 'Last 7 Days') timeInterval = "INTERVAL '7 days'";
    else if (period === 'Last 90 Days') timeInterval = "INTERVAL '90 days'";

    // Filter by period if needed, or get overall
    const timeFilter = `created_at >= NOW() - ${timeInterval}`;

    // 1. Overview counts
    const countsRes = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'reported') AS pending,
        COUNT(*) FILTER (WHERE status IN ('verified', 'assigned', 'in_progress')) AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
      FROM issues
    `);

    const counts = countsRes.rows[0];
    const total = parseInt(counts.total, 10) || 0;
    const pending = parseInt(counts.pending, 10) || 0;
    const inProgress = parseInt(counts.in_progress, 10) || 0;
    const resolved = parseInt(counts.resolved, 10) || 0;

    // 2. Category distribution
    const catRes = await query(`
      SELECT category, COUNT(*) as count
      FROM issues
      GROUP BY category
      ORDER BY count DESC
    `);

    const categoryColors = {
      pothole: '#0284c7',
      road: '#f97316',
      drain: '#ef4444',
      light: '#6366f1',
      footpath: '#a855f7',
      water: '#fb923c',
      signal: '#10b981',
      other: '#c084fc',
      under_review: '#eab308',
    };

    const categoryLabels = {
      pothole: 'Pothole',
      road: 'Broken Road',
      drain: 'Open Drain',
      light: 'Street Light',
      footpath: 'Footpath',
      water: 'Water Logging',
      signal: 'Traffic Signal',
      other: 'Others',
      under_review: 'Under Review',
    };

    const categories = catRes.rows.map((r) => {
      const c = parseInt(r.count, 10);
      const pct = total > 0 ? Math.round((c / total) * 100) : 0;
      return {
        id: r.category,
        name: categoryLabels[r.category] || r.category,
        percentage: pct,
        color: categoryColors[r.category] || '#0284c7',
        count: c,
      };
    });

    // 3. Priorities distribution
    const prioRes = await query(`
      SELECT severity, COUNT(*) as count
      FROM issues
      GROUP BY severity
    `);

    const prioMap = { high: 0, medium: 0, low: 0 };
    for (const r of prioRes.rows) {
      prioMap[r.severity.toLowerCase()] = parseInt(r.count, 10);
    }

    const priorities = [
      {
        name: 'High',
        count: prioMap.high,
        color: '#ef4444',
        percentWidth: total > 0 ? Math.round((prioMap.high / total) * 100) : 0,
      },
      {
        name: 'Medium',
        count: prioMap.medium,
        color: '#f59e0b',
        percentWidth: total > 0 ? Math.round((prioMap.medium / total) * 100) : 0,
      },
      {
        name: 'Low',
        count: prioMap.low,
        color: '#10b981',
        percentWidth: total > 0 ? Math.round((prioMap.low / total) * 100) : 0,
      },
    ];

    // 4. Latest reports for the admin table
    const reportsRes = await query(`
      SELECT * FROM issues ORDER BY created_at DESC LIMIT 50
    `);

    const reports = reportsRes.rows.map((row) => {
      const city = (!row.city || row.city === 'All Cities') ? 'Pune' : row.city;
      return {
        id: row.id,
        title: row.title,
        location: row.location_name || city,
        locationName: row.location_name,
        city,
        createdAt: row.created_at,
        category: categoryLabels[row.category] || row.category,
        categoryRaw: row.category,
        priority: row.severity.charAt(0).toUpperCase() + row.severity.slice(1),
        status:
          row.status === 'in_progress'
            ? 'In Progress'
            : row.status === 'work_completed'
            ? 'Work Completed'
            : row.status.charAt(0).toUpperCase() + row.status.slice(1),
        reportedOn: new Date(row.reported_at || row.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        department: row.department || 'Public Works Department (PWD)',
        details: row.description || '',
        assignedCrew: row.assigned_crew || null,
        aiConfidence: row.ai_confidence ? parseFloat(row.ai_confidence) : null,
        aiNeedsReview: !!row.ai_needs_review,
        aiPredictedClass: row.ai_predicted_class || null,
        photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos || [],
        rawStatus: row.status,
        assignmentStatus: row.assignment_status || 'pending',
        workDonePhotos: typeof row.work_done_photos === 'string' ? JSON.parse(row.work_done_photos) : row.work_done_photos || [],
        workDoneNotes: row.work_done_notes || '',
        workSubmittedAt: row.work_submitted_at ? new Date(row.work_submitted_at).toISOString() : null,
        workApprovedAt: row.work_approved_at ? new Date(row.work_approved_at).toISOString() : null,
        firstAssignedAt: row.first_assigned_at ? new Date(row.first_assigned_at).toISOString() : null,
        adminFeedback: row.admin_feedback || '',
        crewRatingAvg: row.crew_rating_avg ? parseFloat(row.crew_rating_avg) : 0,
        crewRatingCount: parseInt(row.crew_rating_count, 10) || 0,
        timeline: typeof row.timeline === 'string' ? JSON.parse(row.timeline) : row.timeline || [],
        beforeAfter: typeof row.before_after === 'string' ? JSON.parse(row.before_after) : row.before_after || null,
        referenceNumber: row.reference_number,
        supportCount: row.support_count,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        lat: row.latitude ? parseFloat(row.latitude) : null,
        lng: row.longitude ? parseFloat(row.longitude) : null,
      };
    });

    return res.json({
      success: true,
      stats: {
        total,
        totalTrend: '12%',
        pending,
        pendingTrend: '5%',
        inProgress,
        inProgressTrend: '8%',
        resolved,
        resolvedTrend: '20%',
      },
      categories,
      priorities,
      reports,
    });
  } catch (err) {
    console.error('Error in getOverviewStats:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute admin stats.' });
  }
}

/**
 * Manage departments
 */
export async function getDepartments(req, res) {
  try {
    const resDepts = await query('SELECT * FROM departments ORDER BY name ASC');
    const departments = resDepts.rows.map((d) => ({
      id: d.id,
      name: d.name,
      shortCode: d.short_code,
      officer: d.officer,
      email: d.email,
      phone: d.phone,
      avgResponseHours: d.avg_response_hours,
    }));
    return res.json({ success: true, count: departments.length, departments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch departments.' });
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, shortCode, officer, email, phone, avgResponseHours = 12 } = req.body || {};
    if (!name || !shortCode) {
      return res.status(400).json({ success: false, message: 'Name and short code required.' });
    }
    const id = `dept-${Date.now()}`;
    const insert = await query(
      `INSERT INTO departments (id, name, short_code, officer, email, phone, avg_response_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, name, shortCode, officer, email, phone, avgResponseHours]
    );
    return res.status(201).json({ success: true, department: insert.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not create department.' });
  }
}

/**
 * Manage crews
 */
export async function getCrews(req, res) {
  try {
    const resCrews = await query('SELECT * FROM crews ORDER BY name ASC');
    const crews = resCrews.rows.map((c) => ({
      id: c.id,
      name: c.name,
      specialty: c.specialty,
      leader: c.leader,
      members: c.members,
      status: c.status,
      assignedIssueId: c.assigned_issue_id,
      vehicleNumber: c.vehicle_number,
    }));
    return res.json({ success: true, count: crews.length, crews });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch crews.' });
  }
}

export async function assignCrew(req, res) {
  try {
    const { id } = req.params;
    const { issueId, status = 'Dispatched' } = req.body || {};

    const updated = await query(
      `UPDATE crews SET assigned_issue_id = $1, status = $2 WHERE id = $3 RETURNING *`,
      [issueId, status, id]
    );

    if (issueId) {
      const crewName = updated.rows[0]?.name;
      const crewLeaderId = updated.rows[0]?.leader_id;

      const issueRes = await query('SELECT title, reference_number, timeline FROM issues WHERE id = $1', [issueId]);
      const issueTitle = issueRes.rows[0]?.title || 'Road defect';
      const timeline = typeof issueRes.rows[0]?.timeline === 'string'
        ? JSON.parse(issueRes.rows[0].timeline)
        : issueRes.rows[0]?.timeline || [];

      timeline.push({
        status: 'assigned',
        label: `Work order dispatched to ${crewName}. Awaiting crew leader acceptance.`,
        at: new Date().toISOString(),
      });

      await query(
        `UPDATE issues SET
           assigned_crew = $1,
           assignment_status = 'pending',
           status = 'in_progress',
           first_assigned_at = COALESCE(first_assigned_at, NOW()),
           timeline = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [crewName, JSON.stringify(timeline), issueId]
      );

      // Create notification with just the title for the crew
      await query(
        `INSERT INTO notifications (title, message, type, issue_id, recipient_id, recipient_role)
         VALUES ($1, $2, 'task_assignment', $3, $4, 'crew')`,
        [
          issueTitle,
          `Municipal Admin dispatched task to your crew.`,
          issueId,
          crewLeaderId || null,
        ]
      );
    }

    return res.json({ success: true, crew: updated.rows[0] });
  } catch (err) {
    console.error('Error in assignCrew:', err);
    return res.status(500).json({ success: false, message: 'Could not assign crew.' });
  }
}

/**
 * Manage notifications
 */
export async function getNotifications(req, res) {
  try {
    const resNotifs = await query(
      "SELECT * FROM notifications WHERE recipient_role IS NULL OR recipient_role = 'admin' ORDER BY created_at DESC LIMIT 50"
    );
    const notifications = resNotifs.rows.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      unread: n.unread,
      issueId: n.issue_id,
      time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    return res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    console.error('Error in getNotifications:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch notifications.' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    await query('UPDATE notifications SET unread = false WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not mark notification as read.' });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await query("UPDATE notifications SET unread = false WHERE recipient_role IS NULL OR recipient_role = 'admin'");
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not mark all notifications as read.' });
  }
}

export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM notifications WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Notification deleted permanently.' });
  } catch (err) {
    console.error('Error in deleteNotification:', err);
    return res.status(500).json({ success: false, message: 'Could not delete notification.' });
  }
}

export async function clearAllNotifications(req, res) {
  try {
    await query("DELETE FROM notifications WHERE recipient_role IS NULL OR recipient_role = 'admin'");
    return res.json({ success: true, message: 'All admin notifications deleted permanently.' });
  } catch (err) {
    console.error('Error in clearAllNotifications:', err);
    return res.status(500).json({ success: false, message: 'Could not clear notifications.' });
  }
}

/**
 * Manage Crew Assignment Requests (Admin Review)
 */
export async function getCrewTaskRequests(req, res) {
  try {
    const requestsRes = await query(`
      SELECT 
        r.id,
        r.issue_id,
        r.crew_id,
        r.leader_id,
        r.status,
        r.notes,
        r.retry_count,
        r.admin_notes,
        r.created_at,
        c.name AS crew_name,
        c.leader AS crew_leader_name,
        c.specialty AS crew_specialty,
        c.status AS crew_status,
        i.title AS issue_title,
        i.reference_number,
        i.category AS issue_category,
        i.severity AS issue_severity,
        i.city AS issue_city,
        i.location_name AS issue_location_name,
        i.status AS issue_status
      FROM crew_task_requests r
      JOIN crews c ON r.crew_id = c.id
      JOIN issues i ON r.issue_id = i.id
      ORDER BY r.created_at DESC
    `);
    return res.json({ success: true, requests: requestsRes.rows });
  } catch (err) {
    console.error('Error in getCrewTaskRequests:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch crew task requests.' });
  }
}

export async function respondToCrewTaskRequest(req, res) {
  try {
    const { id } = req.params;
    const { action, adminNotes } = req.body || {};

    const reqCheck = await query('SELECT * FROM crew_task_requests WHERE id = $1', [id]);
    if (reqCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task request not found.' });
    }
    const taskReq = reqCheck.rows[0];

    const crewCheck = await query('SELECT * FROM crews WHERE id = $1', [taskReq.crew_id]);
    const issueCheck = await query('SELECT * FROM issues WHERE id = $1', [taskReq.issue_id]);
    const crew = crewCheck.rows[0];
    const issue = issueCheck.rows[0];

    if (action === 'approve') {
      // 1. Mark request as approved
      await query(
        "UPDATE crew_task_requests SET status = 'approved', admin_notes = $1 WHERE id = $2",
        [adminNotes || 'Request approved by municipal administrator.', id]
      );

      // 2. Assign issue to crew and set in_progress
      const timeline = Array.isArray(issue?.timeline) ? issue.timeline : [];
      timeline.push({
        status: 'assigned',
        label: `Assigned to ${crew?.name || 'Field Crew'} upon leader request approval.`,
        at: new Date().toISOString(),
      });

      await query(
        `UPDATE issues SET
           assigned_crew = $1,
           assignment_status = 'accepted',
           status = 'in_progress',
           first_assigned_at = COALESCE(first_assigned_at, NOW()),
           timeline = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [crew?.name || 'Field Crew', JSON.stringify(timeline), taskReq.issue_id]
      );

      // 3. Mark crew status to Busy
      await query(
        "UPDATE crews SET assigned_issue_id = $1, status = 'Busy' WHERE id = $2",
        [taskReq.issue_id, taskReq.crew_id]
      );

      // 4. Notify crew leader (concise title for the crew panel)
      await query(
        `INSERT INTO notifications (title, message, type, issue_id, recipient_id, recipient_role)
         VALUES ($1, $2, 'task_assignment', $3, $4, 'crew')`,
        [
          issue?.title || 'Assignment Request Approved',
          `Your assignment request for defect ${issue?.reference_number || ''} was approved by Municipal Admin. Work order is now In Progress.`,
          taskReq.issue_id,
          taskReq.leader_id,
        ]
      );

      return res.json({
        success: true,
        message: `Task request approved. Issue assigned to ${crew?.name} and marked In Progress.`,
      });
    } else if (action === 'reject') {
      // 1. Mark request as rejected with admin notes
      const feedbackNotes = adminNotes && adminNotes.trim() ? adminNotes.trim() : 'Declined by municipal administration.';
      await query(
        "UPDATE crew_task_requests SET status = 'rejected', admin_notes = $1 WHERE id = $2",
        [feedbackNotes, id]
      );

      // 2. Notify crew leader
      await query(
        `INSERT INTO notifications (title, message, type, issue_id, recipient_id, recipient_role)
         VALUES ($1, $2, 'task_rejected', $3, $4, 'crew')`,
        [
          `Request Declined: ${issue?.title || 'Defect Request'}`,
          `Admin note: ${feedbackNotes}. You may re-submit with revised details (one final chance) or remove the request.`,
          taskReq.issue_id,
          taskReq.leader_id,
        ]
      );

      return res.json({
        success: true,
        message: 'Task request declined. Crew leader has been notified.',
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be "approve" or "reject".' });
    }
  } catch (err) {
    console.error('Error in respondToCrewTaskRequest:', err);
    return res.status(500).json({ success: false, message: 'Failed to respond to task request.' });
  }
}

/**
 * Classify or reassign issue defect category (Admin)
 */
export async function classifyIssue(req, res) {
  try {
    const { id } = req.params;
    const { category } = req.body || {};

    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Defect category is required.' });
    }

    const cleanCategory = category.trim().toLowerCase();

    const issueRes = await query('SELECT * FROM issues WHERE id = $1 LIMIT 1', [id]);
    if (!issueRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const current = issueRes.rows[0];
    const timeline =
      typeof current.timeline === 'string'
        ? JSON.parse(current.timeline)
        : current.timeline || [];

    const categoryNames = {
      pothole: 'Pothole',
      road: 'Broken Road',
      drain: 'Open Drain',
      light: 'Street Light',
      signal: 'Traffic Signal',
      footpath: 'Footpath',
      water: 'Water Logging',
      other: 'Others',
    };

    const label = categoryNames[cleanCategory] || cleanCategory;

    timeline.push({
      status: current.status,
      label: `Defect classified as "${label}" by Municipal Administrator`,
      at: new Date().toISOString(),
    });

    const updateRes = await query(
      `UPDATE issues
       SET category = $1, ai_needs_review = false, timeline = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [cleanCategory, JSON.stringify(timeline), id]
    );

    return res.json({
      success: true,
      message: `Issue classified as ${label}.`,
      issue: updateRes.rows[0],
      category: cleanCategory,
      categoryLabel: label,
    });
  } catch (err) {
    console.error('Error in classifyIssue:', err);
    return res.status(500).json({ success: false, message: 'Failed to classify issue.' });
  }
}

/**
 * POST /api/admin/issues/:id/review-work
 * Municipal Admin reviews completed work by crew:
 * action: 'approve' (publishes before/after to citizens, marks resolved, frees crew)
 * action: 'request_rework' (keeps in_progress, sends feedback notes to crew)
 */
export async function reviewWorkDone(req, res) {
  try {
    const { id } = req.params;
    const { action, feedbackNotes } = req.body || {};

    if (!action || !['approve', 'request_rework'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "request_rework".' });
    }

    const issueRes = await query('SELECT * FROM issues WHERE id = $1 LIMIT 1', [id]);
    if (issueRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const issue = issueRes.rows[0];
    const timeline = typeof issue.timeline === 'string' ? JSON.parse(issue.timeline) : issue.timeline || [];
    const nowIso = new Date().toISOString();

    // Find crew leader to notify
    const crewRes = await query('SELECT * FROM crews WHERE name = $1 LIMIT 1', [issue.assigned_crew]);
    const crew = crewRes.rows[0] || null;

    if (action === 'approve') {
      const citizenPhotos = typeof issue.photos === 'string' ? JSON.parse(issue.photos) : issue.photos || [];
      const repairPhotos = typeof issue.work_done_photos === 'string' ? JSON.parse(issue.work_done_photos) : issue.work_done_photos || [];

      const beforeImg = citizenPhotos[0]?.url || (typeof citizenPhotos[0] === 'string' ? citizenPhotos[0] : null);
      const afterImg = repairPhotos[0]?.url || (typeof repairPhotos[0] === 'string' ? repairPhotos[0] : null);

      const beforeAfter = {
        before: beforeImg,
        after: afterImg,
        notes: issue.work_done_notes || 'Repairs verified and approved by Municipal Administration.',
      };

      timeline.push({
        status: 'resolved',
        label: 'Repairs inspected, approved, and published to Public Citizen Registry by Municipal Administration.',
        at: nowIso,
      });

      const updatedIssue = await query(
        `UPDATE issues SET
           status = 'resolved',
           assignment_status = 'approved',
           work_approved_at = NOW(),
           before_after = $1,
           timeline = $2,
           updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [JSON.stringify(beforeAfter), JSON.stringify(timeline), id]
      );

      // Free the crew
      if (crew) {
        await query(
          "UPDATE crews SET assigned_issue_id = null, status = 'Available' WHERE id = $1",
          [crew.id]
        );
      }

      // Notify Crew Leader
      if (crew?.leader_id) {
        await query(
          `INSERT INTO notifications (title, message, type, issue_id, recipient_id, recipient_role)
           VALUES ($1, $2, 'task_assignment', $3, $4, 'crew')`,
          [
            `Repairs Approved: ${issue.title}`,
            `Municipal Administration has inspected and approved your repair work for ${issue.reference_number}. The work has been published to the citizen portal.`,
            id,
            crew.leader_id,
          ]
        );
      }

      // Notify Citizen Reporter
      if (issue.reporter_id) {
        await query(
          `INSERT INTO notifications (title, message, type, issue_id, recipient_id, recipient_role)
           VALUES ($1, $2, 'info', $3, $4, 'citizen')`,
          [
            `Repairs Completed: ${issue.title}`,
            `The civic issue you reported (${issue.reference_number}) has been repaired by ${issue.assigned_crew || 'Municipal Crew'}. Tap to view resolution evidence and rate the crew's work!`,
            id,
            issue.reporter_id,
          ]
        );
      }

      return res.json({
        success: true,
        message: 'Work completion approved and published to Citizen Portal. Issue marked as Resolved.',
        issue: updatedIssue.rows[0],
      });
    } else if (action === 'request_rework') {
      const feedback = feedbackNotes && feedbackNotes.trim() ? feedbackNotes.trim() : 'Additional repair work is needed to meet municipal standards.';

      timeline.push({
        status: 'in_progress',
        label: `Inspection feedback: Admin requested rework. Reason: ${feedback}`,
        at: nowIso,
      });

      const updatedIssue = await query(
        `UPDATE issues SET
           status = 'in_progress',
           assignment_status = 'rework_required',
           admin_feedback = $1,
           timeline = $2,
           updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [feedback, JSON.stringify(timeline), id]
      );

      // Notify Crew Leader with urgent priority
      if (crew?.leader_id) {
        await query(
          `INSERT INTO notifications (title, message, type, issue_id, recipient_id, recipient_role)
           VALUES ($1, $2, 'urgent', $3, $4, 'crew')`,
          [
            `Rework Requested: ${issue.title}`,
            `Admin inspection note: "${feedback}". Please address the required fixes and resubmit completed work.`,
            id,
            crew.leader_id,
          ]
        );
      }

      return res.json({
        success: true,
        message: 'Rework request sent to crew leader with instructions.',
        issue: updatedIssue.rows[0],
      });
    }
  } catch (err) {
    console.error('Error in reviewWorkDone:', err);
    return res.status(500).json({ success: false, message: 'Failed to process work review.' });
  }
}

