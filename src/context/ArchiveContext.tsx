import React, { createContext, useContext, useState, useEffect } from 'react';
import { ArchiveSettings, ArchiveStats } from '../types.ts';

interface ReadingProgress {
  [caseId: string]: {
    completedChapters: number[];
    lastChapterIndex: number;
    updatedAt: string;
  };
}

interface ArchiveContextType {
  settings: ArchiveSettings;
  stats: ArchiveStats | null;
  bookmarks: string[]; // case slugs
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
  readingProgress: ReadingProgress;
  markChapterRead: (caseId: string, chapterIndex: number) => void;
  getCaseProgress: (caseId: string) => number; // 0 to 100%
  refreshSettings: () => Promise<void>;
  refreshStats: () => Promise<void>;
  revealRedactions: boolean;
  setRevealRedactions: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const defaultSettings: ArchiveSettings = {
  archiveTitle: 'THE 302 DOCKET',
  tagline: 'Every case leaves a paper trail.',
  disclaimer:
    'An independent investigative archive inspired by FBI investigative casework and FD-302 documentation. Not affiliated with the FBI or any law enforcement agency.',
  introHeading: 'FD-302: THE INVESTIGATIVE INTERVIEW RECORD',
  introBody:
    'In federal casework, Form FD-302 documents what an investigator heard, observed, and verified during witness and subject interviews. The 302 Docket organizes complex criminal investigations into comprehensive, step-by-step prosecutorial dossiers.',
};

const ArchiveContext = createContext<ArchiveContextType | undefined>(undefined);

export const ArchiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ArchiveSettings>(defaultSettings);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('archive_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readingProgress, setReadingProgress] = useState<ReadingProgress>(() => {
    try {
      const saved = localStorage.getItem('archive_reading_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [revealRedactions, setRevealRedactions] = useState<boolean>(false);

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const refreshStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    refreshSettings();
    refreshStats();
  }, []);

  const toggleBookmark = (slug: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem('archive_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isBookmarked = (slug: string) => bookmarks.includes(slug);

  const markChapterRead = (caseId: string, chapterIndex: number) => {
    setReadingProgress((prev) => {
      const existing = prev[caseId] || { completedChapters: [], lastChapterIndex: 0, updatedAt: '' };
      const completed = Array.from(new Set([...existing.completedChapters, chapterIndex]));
      const next = {
        ...prev,
        [caseId]: {
          completedChapters: completed,
          lastChapterIndex: chapterIndex,
          updatedAt: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem('archive_reading_progress', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const getCaseProgress = (caseId: string) => {
    const record = readingProgress[caseId];
    if (!record || !record.completedChapters.length) return 0;
    // 9 chapters total
    return Math.min(100, Math.round((record.completedChapters.length / 9) * 100));
  };

  return (
    <ArchiveContext.Provider
      value={{
        settings,
        stats,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        readingProgress,
        markChapterRead,
        getCaseProgress,
        refreshSettings,
        refreshStats,
        revealRedactions,
        setRevealRedactions,
      }}
    >
      {children}
    </ArchiveContext.Provider>
  );
};

export const useArchive = () => {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error('useArchive must be used within an ArchiveProvider');
  }
  return context;
};
