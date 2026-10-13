import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEMO_ISSUES } from '../data/demoIssues';
import { useAuth } from './AuthContext';
 
// Shared issue store. Everything lives in React state, so a page refresh resets it.
// TODO: replace these functions with API calls when the Node/Express backend exists.
const IssueContext = createContext(null);
 
export function IssueProvider({ children }) {
  const { user } = useAuth();
  const [issues, setIssues] = useState(DEMO_ISSUES);
  const [supportedIds, setSupportedIds] = useState([]);
  const [city, setCity] = useState('New Delhi');
 
  const getIssue = useCallback((id) => issues.find((i) => i.id === id), [issues]);
 
  const addIssue = useCallback(
    (data) => {
      const n = issues.filter((i) => i.createdByUser).length + 1;
      const nowIso = new Date().toISOString();
      const issue = {
        description: '', latitude: null, longitude: null, mapPos: null, photos: [],
        ...data,
        id: `iss-u${n}`,
        referenceNumber: `UI-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`,
        city,
        status: 'reported',
        supportCount: 0,
        similarCount: 0,
        reportedAt: nowIso,
        updatedAt: nowIso,
        timeline: [{ status: 'reported', label: 'Reported by citizen (demo)', at: nowIso }],
        beforeAfter: null,
        comments: [],
        isDemo: true,
        createdByUser: true,
        reporterId: user?.id ?? null,
      };
      setIssues((prev) => [issue, ...prev]);
      return issue;
    },
    [issues, city, user?.id],
  );
 
  const supportIssue = useCallback(
    (id) => {
      if (supportedIds.includes(id)) return false;
      setSupportedIds((s) => [...s, id]);
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, supportCount: i.supportCount + 1 } : i)));
      return true;
    },
    [supportedIds],
  );
 
  const hasSupported = useCallback((id) => supportedIds.includes(id), [supportedIds]);
 
  const addComment = useCallback((id, text) => {
    const comment = { id: `c-${Date.now()}`, author: 'You (demo)', text, at: new Date().toISOString() };
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, comments: [...i.comments, comment] } : i)));
  }, []);
 
  const value = useMemo(
    () => ({ issues, city, setCity, getIssue, addIssue, supportIssue, hasSupported, addComment }),
    [issues, city, getIssue, addIssue, supportIssue, hasSupported, addComment],
  );
 
  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
}
 
export function useIssues() {
  const ctx = useContext(IssueContext);
  if (!ctx) throw new Error('useIssues must be used inside <IssueProvider>');
  return ctx;
}