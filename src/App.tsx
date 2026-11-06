/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ArchiveProvider, useArchive } from './context/ArchiveContext.tsx';
import { RetroOSDesktop } from './components/retro/RetroOSDesktop.tsx';
import { RetroBootSequence } from './components/retro/RetroBootSequence.tsx';
import { RetroShutdownSequence } from './components/retro/RetroShutdownSequence.tsx';
import { RetroDesktopEnvironment } from './components/retro/RetroDesktopEnvironment.tsx';
import { RetroSearchTerminal } from './components/retro/RetroSearchTerminal.tsx';
import { FileRetrievalModal } from './components/retro/FileRetrievalModal.tsx';
import { Footer } from './components/Footer.tsx';
import { CaseDetail } from './components/CaseDetail.tsx';
import { BookmarksView } from './components/BookmarksView.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { LoginModal } from './components/admin/LoginModal.tsx';
import { MethodologyModal } from './components/MethodologyModal.tsx';
import { CaseFile } from './types.ts';
import { soundEngine } from './utils/soundEngine.ts';

function ArchiveApp() {
  const { isAuthenticated } = useAuth();
  const { stats, refreshStats } = useArchive();

  // Boot sequence state (runs on first load in session or unless permanently skipped)
  const [bootCompleted, setBootCompleted] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('docket_boot_done') === 'true' ||
      localStorage.getItem('docket_skip_boot_permanent') === 'true'
    );
  });

  // Shutdown sequence state
  const [isShutdown, setIsShutdown] = useState<boolean>(false);

  // CRT scanlines simulation toggle
  const [crtEnabled, setCrtEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('docket_crt_filter');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [currentView, setCurrentView] = useState<'home' | 'case' | 'bookmarks' | 'admin'>('home');
  const [selectedCaseSlug, setSelectedCaseSlug] = useState<string | null>(null);

  // File retrieval animation state
  const [retrievingCase, setRetrievingCase] = useState<{ caseNumber: string; title: string; slug: string } | null>(null);

  // Terminal search modal
  const [isTerminalSearchOpen, setIsTerminalSearchOpen] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Admin login & methodology modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);

  // Cases loaded from DB
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  const toggleCrt = () => {
    const next = !crtEnabled;
    setCrtEnabled(next);
    localStorage.setItem('docket_crt_filter', JSON.stringify(next));
  };

  const handleBootComplete = () => {
    setBootCompleted(true);
    sessionStorage.setItem('docket_boot_done', 'true');
  };

  // Load cases based on active filters
  const loadCases = async () => {
    setIsLoadingCases(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedLocation.trim()) params.append('location', selectedLocation.trim());

      const res = await fetch(`/api/cases?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (err) {
      console.error('Failed to load cases from API:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [searchQuery, selectedCategory, selectedStatus, selectedLocation]);

  // Handle URL hash navigation for deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#case/')) {
        const slug = hash.replace('#case/', '');
        setSelectedCaseSlug(slug);
        setCurrentView('case');
      } else if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '#bookmarks') {
        setCurrentView('bookmarks');
      } else {
        setCurrentView('home');
        setSelectedCaseSlug(null);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectCase = (slug: string) => {
    const targetCase = cases.find((c) => c.slug === slug);
    if (targetCase) {
      setRetrievingCase({
        caseNumber: targetCase.caseNumber,
        title: targetCase.title,
        slug: targetCase.slug,
      });
    } else {
      setSelectedCaseSlug(slug);
      setCurrentView('case');
      window.location.hash = `#case/${slug}`;
    }
  };

  const handleFileRetrievalFinished = () => {
    if (retrievingCase) {
      setSelectedCaseSlug(retrievingCase.slug);
      setCurrentView('case');
      window.location.hash = `#case/${retrievingCase.slug}`;
      setRetrievingCase(null);
    }
  };

  const handleNavigate = (view: string, caseSlug?: string) => {
    if (view === 'case' && caseSlug) {
      handleSelectCase(caseSlug);
    } else if (view === 'admin') {
      if (!isAuthenticated) {
        setIsLoginModalOpen(true);
      } else {
        setCurrentView('admin');
        window.location.hash = '#admin';
      }
    } else if (view === 'bookmarks') {
      setCurrentView('bookmarks');
      window.location.hash = '#bookmarks';
    } else {
      setCurrentView('home');
      setSelectedCaseSlug(null);
      window.location.hash = '';
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedLocation('');
  };

  if (isShutdown) {
    return <RetroShutdownSequence onPowerOn={() => setIsShutdown(false)} />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#07090b] text-[#d1d5db] font-tech ${
        crtEnabled ? 'crt-scanlines crt-vignette' : ''
      }`}
    >
      {/* 90s Startup Boot Sequence */}
      {!bootCompleted && (
        <RetroBootSequence onComplete={handleBootComplete} />
      )}

      {/* Retro OS Top Status Header */}
      <RetroOSDesktop
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenMethodology={() => setIsMethodologyModalOpen(true)}
        crtEnabled={crtEnabled}
        onToggleCrt={toggleCrt}
        onOpenSearch={() => setIsTerminalSearchOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {currentView === 'home' && (
          <RetroDesktopEnvironment
            cases={cases}
            isLoadingCases={isLoadingCases}
            onOpenCaseDossier={handleSelectCase}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onShutdown={() => setIsShutdown(true)}
            crtEnabled={crtEnabled}
            onToggleCrt={toggleCrt}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            onResetFilters={handleResetFilters}
            onOpenTerminal={() => setIsTerminalSearchOpen(true)}
            onOpenMethodology={() => setIsMethodologyModalOpen(true)}
          />
        )}

        {currentView === 'case' && selectedCaseSlug && (
          <div className="pb-16">
            <CaseDetail
              caseSlug={selectedCaseSlug}
              onBack={() => handleNavigate('home')}
              onSelectRelatedCase={handleSelectCase}
            />
          </div>
        )}

        {currentView === 'bookmarks' && (
          <div className="pb-16">
            <BookmarksView
              onBack={() => handleNavigate('home')}
              onSelectCase={handleSelectCase}
            />
          </div>
        )}

        {currentView === 'admin' && (
          <div className="pb-16">
            <AdminDashboard onBackToArchive={() => handleNavigate('home')} />
          </div>
        )}
      </main>

      {/* Footer on non-home views */}
      {currentView !== 'home' && (
        <Footer
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenMethodology={() => setIsMethodologyModalOpen(true)}
        />
      )}

      {/* File Retrieval Glitch Modal */}
      {retrievingCase && (
        <FileRetrievalModal
          caseNumber={retrievingCase.caseNumber}
          title={retrievingCase.title}
          onFinish={handleFileRetrievalFinished}
        />
      )}

      {/* Retro Terminal Search Command Line Modal */}
      <RetroSearchTerminal
        isOpen={isTerminalSearchOpen}
        onClose={() => setIsTerminalSearchOpen(false)}
        cases={cases}
        onSelectCase={handleSelectCase}
      />

      {/* Investigator Access Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          setCurrentView('admin');
          window.location.hash = '#admin';
          refreshStats();
        }}
      />

      {/* Methodology & Ethics Modal */}
      <MethodologyModal
        isOpen={isMethodologyModalOpen}
        onClose={() => setIsMethodologyModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ArchiveProvider>
        <ArchiveApp />
      </ArchiveProvider>
    </AuthProvider>
  );
}
