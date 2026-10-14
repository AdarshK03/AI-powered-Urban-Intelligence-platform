import { query } from '../config/db.js';

/**
 * Get dynamic administrative overview statistics computed from PostgreSQL
 */
export async function getOverviewStats(req, res) {
  try {
    const { period = 'Last 30 Days' } = req.query || {};

    let days = 30;
    if (period === 'Last 24 Hours') days = 1;
    if (period === 'Last 7 Days') days = 7;
    if (period === 'Last 90 Days') days = 90;

    // Filter by period if needed, or get overall
    const timeFilter = `created_at >= NOW() - INTERVAL '${days} days'`;

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

    const reports = reportsRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      location: row.location_name || row.city,
      category: categoryLabels[row.category] || row.category,
      categoryRaw: row.category,
      priority: row.severity.charAt(0).toUpperCase() + row.severity.slice(1),
      status: row.status === 'in_progress' ? 'In Progress' : row.status.charAt(0).toUpperCase() + row.status.slice(1),
      reportedOn: new Date(row.reported_at || row.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      department: row.department || 'Public Works Department (PWD)',
      details: row.description || '',
      assignedCrew: row.assigned_crew || null,
      aiConfidence: row.ai_confidence ? parseFloat(row.ai_confidence) : 95.0,
      referenceNumber: row.reference_number,
      supportCount: row.support_count,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      lat: row.latitude ? parseFloat(row.latitude) : null,
      lng: row.longitude ? parseFloat(row.longitude) : null,
    }));

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
      await query(
        `UPDATE issues SET assigned_crew = $1, status = 'in_progress', updated_at = NOW() WHERE id = $2`,
        [crewName, issueId]
      );
    }

    return res.json({ success: true, crew: updated.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not assign crew.' });
  }
}

/**
 * Manage notifications
 */
export async function getNotifications(req, res) {
  try {
    const resNotifs = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
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
    await query('UPDATE notifications SET unread = false');
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not mark all notifications as read.' });
  }
}
