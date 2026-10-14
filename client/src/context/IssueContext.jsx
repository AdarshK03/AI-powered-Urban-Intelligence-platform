import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const IssueContext = createContext(null);

export function IssueProvider({ children }) {
  const { user, token } = useAuth();
  const [issues, setIssues] = useState([]);
  const [city, setCity] = useState('All Cities');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const payload = {
          ...data,
          city: data.city || city,
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

  const supportIssue = useCallback(
    async (id) => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/issues/${id}/support`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId: user?.id }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setIssues((prev) =>
            prev.map((i) =>
              i.id === id
                ? {
                    ...i,
                    hasSupported: json.supported,
                    supportCount: json.supportCount,
                  }
                : i
            )
          );
          return json.supported;
        }
      } catch (err) {
        console.error('Error toggling support:', err);
      }
      return false;
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

  const addComment = useCallback(
    async (id, text) => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/issues/${id}/comments`, {
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
              i.id === id
                ? {
                    ...i,
                    comments: json.comments,
                  }
                : i
            )
          );
          return json.comment;
        }
      } catch (err) {
        console.error('Error posting comment:', err);
      }
    },
    [token, user?.name]
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
      addComment,
    }),
    [issues, city, isLoading, error, fetchIssues, getIssue, addIssue, supportIssue, hasSupported, addComment]
  );

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
}

export function useIssues() {
  const ctx = useContext(IssueContext);
  if (!ctx) throw new Error('useIssues must be used inside <IssueProvider>');
  return ctx;
}