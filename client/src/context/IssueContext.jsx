import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const IssueContext = createContext(null);

export function IssueProvider({ children }) {
  const { user, token } = useAuth();
  const [issues, setIssues] = useState([]);
  const [city, setCity] = useState(user?.city || 'Pune');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync city when user profile loads or changes
  useEffect(() => {
    if (user?.city) {
      setCity(user.city);
    }
  }, [user?.city]);

  // Fetch issues from the live PostgreSQL backend
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const cityParam = city === 'All Cities' ? 'all' : city;
      const res = await fetch(`/api/issues?city=${encodeURIComponent(cityParam)}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch issues.`);
      const data = await res.json();
      if (data.success && Array.isArray(data.issues)) {
        setIssues(data.issues);
      }
    } catch (err) {
      console.error('Failed to load issues from backend:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [city, token]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const getIssue = useCallback(
    (id) => issues.find((i) => i.id === id || i.referenceNumber === id),
    [issues]
  );

  const addIssue = useCallback(
    async (data) => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resolvedCity = data.city || (city !== 'All Cities' ? city : user?.city || 'Pune');
        const payload = {
          ...data,
          city: resolvedCity,
        };

        const res = await fetch('/api/issues', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to submit issue report.');
        }

        const createdIssue = json.issue;
        setIssues((prev) => [createdIssue, ...prev]);
        return createdIssue;
      } catch (err) {
        console.error('Error adding issue:', err);
        throw err;
      }
    },
    [city, token]
  );

  const [notifications, setNotifications] = useState({
    commentsOnMyReports: [],
    recentIssues: [],
    totalUnread: 0,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/issues/feed/notifications', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications({
            commentsOnMyReports: data.commentsOnMyReports || [],
            recentIssues: data.recentIssues || [],
            totalUnread: data.totalUnread || 0,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const supportIssue = useCallback(
    async (id, voteType = 'up') => {
      let previousIssue = null;

      // Instant optimistic UI update: reflects immediately on button click
      setIssues((prev) =>
        prev.map((i) => {
          if (i.id === id) {
            previousIssue = { ...i };
            const currentVote = i.userVote || (i.hasSupported ? 'up' : null);
            let nextVote = null;
            let delta = 0;

            if (currentVote === voteType) {
              // Toggling current vote off
              nextVote = null;
              delta = voteType === 'up' ? -1 : 1;
            } else if (currentVote === 'up' && voteType === 'down') {
              nextVote = 'down';
              delta = -2;
            } else if (currentVote === 'down' && voteType === 'up') {
              nextVote = 'up';
              delta = 2;
            } else {
              nextVote = voteType;
              delta = voteType === 'up' ? 1 : -1;
            }

            return {
              ...i,
              userVote: nextVote,
              hasSupported: nextVote === 'up',
              supportCount: Math.max(0, (i.supportCount || 0) + delta),
            };
          }
          return i;
        })
      );

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/issues/${id}/support`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId: user?.id, voteType }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          // Reconcile with authoritative server counts
          setIssues((prev) =>
            prev.map((i) =>
              i.id === id
                ? {
                    ...i,
                    hasSupported: json.hasSupported,
                    userVote: json.userVote,
                    supportCount: json.supportCount,
                  }
                : i
            )
          );
          return json;
        } else {
          // Revert optimistic update on server error
          if (previousIssue) {
            setIssues((prev) =>
              prev.map((i) => (i.id === id ? previousIssue : i))
            );
          }
          throw new Error(json.message || 'Failed to submit vote.');
        }
      } catch (err) {
        // Revert optimistic update on network error
        if (previousIssue) {
          setIssues((prev) =>
            prev.map((i) => (i.id === id ? previousIssue : i))
          );
        }
        console.error('Error voting on issue:', err);
        throw err;
      }
    },
    [token, user?.id]
  );

  const hasSupported = useCallback(
    (id) => {
      const target = issues.find((i) => i.id === id);
      return target ? !!target.hasSupported : false;
    },
    [issues]
  );

  const getUserVote = useCallback(
    (id) => {
      const target = issues.find((i) => i.id === id);
      return target?.userVote || (target?.hasSupported ? 'up' : null);
    },
    [issues]
  );

  const addComment = useCallback(
    async (id, text) => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/issues/${encodeURIComponent(id)}/comments`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text,
            author: user?.name || 'Citizen',
          }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setIssues((prev) =>
            prev.map((i) =>
              i.id === id || i.referenceNumber === id || (json.issueId && i.id === json.issueId)
                ? {
                    ...i,
                    comments: json.comments,
                  }
                : i
            )
          );
          fetchNotifications();
          return json;
        } else {
          throw new Error(json.message || 'Failed to post comment.');
        }
      } catch (err) {
        console.error('Error posting comment:', err);
        throw err;
      }
    },
    [token, user?.name, fetchNotifications]
  );

  const deleteIssue = useCallback(
    async (id) => {
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/issues/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers,
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to delete issue report.');
        }

        setIssues((prev) => prev.filter((i) => i.id !== id && i.referenceNumber !== id));
        fetchNotifications();
        return true;
      } catch (err) {
        console.error('Error deleting issue report:', err);
        throw err;
      }
    },
    [token, fetchNotifications]
  );

  const value = useMemo(
    () => ({
      issues,
      city,
      setCity,
      isLoading,
      error,
      refreshIssues: fetchIssues,
      getIssue,
      addIssue,
      supportIssue,
      hasSupported,
      getUserVote,
      addComment,
      deleteIssue,
      notifications,
      refreshNotifications: fetchNotifications,
    }),
    [
      issues,
      city,
      isLoading,
      error,
      fetchIssues,
      getIssue,
      addIssue,
      supportIssue,
      hasSupported,
      getUserVote,
      addComment,
      deleteIssue,
      notifications,
      fetchNotifications,
    ]
  );

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
}

export function useIssues() {
  const ctx = useContext(IssueContext);
  if (!ctx) throw new Error('useIssues must be used inside <IssueProvider>');
  return ctx;
}