import React, { useState } from 'react';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Clock,
  Search,
  Fingerprint,
  Users,
  CheckCircle2,
  Scale,
  Gavel,
  History,
  Eye,
  AlertCircle,
  Mic,
  Upload,
} from 'lucide-react';
import {
  CaseFile,
  CrimeCategory,
  CaseStatus,
  EvidenceItem,
  PersonOfInterest,
  TimelineEvent,
  CaseMediaItem,
} from '../../types.ts';

interface CaseEditorProps {
  initialCase?: CaseFile | null;
  onSaveSuccess: (saved: CaseFile) => void;
  onCancel: () => void;
  onPreview: (c: CaseFile) => void;
}

const CATEGORIES: CrimeCategory[] = [
  'Special Victims / Sexual Offences',
  'Crimes Against Children',
  'Homicide',
  'Missing Persons',
  'Kidnapping',
  'Organised Crime',
  'Other Investigations',
];

const STATUSES: CaseStatus[] = [
  'Convicted',
  'Solved',
  'Cold Case / Unresolved',
  'Trial / Pending Appeal',
  'Active Investigation',
];

export const CaseEditor: React.FC<CaseEditorProps> = ({
  initialCase,
  onSaveSuccess,
  onCancel,
  onPreview,
}) => {
  const [activeTab, setActiveTab] = useState<string>('metadata');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [caseData, setCaseData] = useState<CaseFile>(() => {
    if (initialCase) return initialCase;

    return {
      id: 'case-' + Date.now(),
      slug: '',
      caseNumber: `FD-302-US-${Math.floor(10000 + Math.random() * 90000)}`,
      title: '',
      subtitle: '',
      category: 'Special Victims / Sexual Offences',
      location: '',
      year: new Date().getFullYear(),
      status: 'Active Investigation',
      isPublished: true,
      isFeatured: false,
      contentWarnings: ['Factual investigative casework'],
      summary: '',
      bannerImageUrl: '',
      overview: {
        background: '',
        victimInfo: '',
        jurisdiction: '',
        initialAlertDate: '',
      },
      incident: {
        narrative: '',
        timeline: [],
      },
      investigation: {
        narrative: '',
        procedureNotes: '',
        interviewRecordsSummary: '',
        timeline: [],
      },
      evidence: [],
      personsOfInterest: [],
      breakthrough: {
        narrative: '',
        turningPoints: [],
      },
      courtroom: {
        court: '',
        presidingJudge: '',
        charges: ['18 U.S.C. § ...'],
        prosecutionArgument: '',
        defenseArgument: '',
        keyTestimonies: [],
        trialTimeline: [],
      },
      verdict: {
        verdictDate: '',
        pleaOrVerdict: '',
        sentencing: '',
        appealsAndRulings: '',
      },
      aftermath: {
        legalReforms: [],
        institutionalImpact: '',
        victimAdvocacy: '',
        currentStatus: '',
      },
      reflectionPrompts: [],
      citations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!caseData.title.trim()) {
      setError('Case title is required.');
      return;
    }

    if (!caseData.caseNumber.trim()) {
      setError('Case number (FD-302 ID) is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isNew = !initialCase;
      const url = isNew ? '/api/admin/cases' : `/api/admin/cases/${caseData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save case dossier');
      }

      const saved = await res.json();
      onSaveSuccess(saved);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper additions for dynamic arrays
  const addIncidentTimelineEvent = () => {
    setCaseData({
      ...caseData,
      incident: {
        ...caseData.incident,
        timeline: [
          ...caseData.incident.timeline,
          { date: '', title: '', description: '', source: '' },
        ],
      },
    });
  };

  const addEvidenceItem = () => {
    const newEv: EvidenceItem = {
      id: 'ev-' + Date.now(),
      exhibitNumber: `EXHIBIT-${caseData.evidence.length + 1}`,
      title: 'New Forensic Exhibit',
      type: 'document',
      classification: 'Confidential',
      description: '',
      significance: '',
    };
    setCaseData({ ...caseData, evidence: [...caseData.evidence, newEv] });
  };

  const addPoiItem = () => {
    const newPoi: PersonOfInterest = {
      id: 'poi-' + Date.now(),
      name: '',
      role: 'Subject / Person of Interest',
      status: 'Allegations / Charged',
      background: '',
      verifiedFindings: '',
      allegations: '',
      outcome: '',
    };
    setCaseData({ ...caseData, personsOfInterest: [...caseData.personsOfInterest, newPoi] });
  };

  const addTurningPoint = () => {
    setCaseData({
      ...caseData,
      breakthrough: {
        ...caseData.breakthrough,
        turningPoints: [
          ...caseData.breakthrough.turningPoints,
          { date: '', title: '', detail: '' },
        ],
      },
    });
  };

  const addCitation = () => {
    setCaseData({
      ...caseData,
      citations: [...caseData.citations, { title: '', source: '', date: '' }],
    });
  };

  const addMediaItem = () => {
    const newMedia: CaseMediaItem = {
      id: 'media-' + Date.now(),
      title: 'New Forensic Audio / Photographic Evidence',
      mediaType: 'audio',
      url: '',
      description: '',
      source: 'Official Custodial Record / Wiretap Audio',
      duration: '03:45',
      classification: 'Declassified FD-302 Case Material',
      recoveredAt: `${caseData.year}-01-01`,
    };
    setCaseData({
      ...caseData,
      mediaItems: [...(caseData.mediaItems || []), newMedia],
    });
  };

  const handleMediaUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Upload failed');
      }

      const uploaded = await res.json();
      const currentList = [...(caseData.mediaItems || [])];
      currentList[index] = {
        ...currentList[index],
        url: uploaded.url,
        title: currentList[index].title.startsWith('New Forensic') ? uploaded.originalName : currentList[index].title,
      };
      setCaseData({ ...caseData, mediaItems: currentList });
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 rounded"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="font-typewriter text-xs text-red-500 font-bold uppercase">
              {initialCase ? 'EDIT CASE DOSSIER' : 'CREATE NEW CASE DOSSIER'}
            </span>
            <h2 className="text-xl font-bold font-editorial text-zinc-100">
              {caseData.title || 'Untitled Case File'}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onPreview(caseData)}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono rounded flex items-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>PREVIEW DOSSIER</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-100 text-xs font-mono font-bold rounded flex items-center space-x-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'COMMITTING TO DB...' : 'SAVE & PUBLISH'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-mono rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Navigation Tabs */}
      <div className="border border-zinc-800 bg-zinc-950 rounded p-1 flex flex-wrap gap-1 text-xs font-mono">
        {[
          { id: 'metadata', label: '1. Metadata & Status', icon: FileText },
          { id: 'overview', label: '2. Overview & Victims', icon: FileText },
          { id: 'incident', label: '3. The Incident', icon: Clock },
          { id: 'investigation', label: '4. Investigation', icon: Search },
          { id: 'evidence', label: `5. Evidence (${caseData.evidence.length})`, icon: Fingerprint },
          { id: 'poi', label: `6. Persons (${caseData.personsOfInterest.length})`, icon: Users },
          { id: 'breakthrough', label: '7. Breakthrough', icon: CheckCircle2 },
          { id: 'courtroom', label: '8. Courtroom', icon: Scale },
          { id: 'verdict', label: '9. Verdict & Aftermath', icon: Gavel },
          { id: 'citations', label: '10. Citations & Ethics', icon: History },
          { id: 'media', label: `11. Audio & Media (${(caseData.mediaItems || []).length})`, icon: Mic },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded transition-colors flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-zinc-800 text-red-400 font-bold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Metadata */}
        {activeTab === 'metadata' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
              Primary Case Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  CASE NUMBER (FD-302 RECORD ID) *
                </label>
                <input
                  type="text"
                  required
                  value={caseData.caseNumber}
                  onChange={(e) => setCaseData({ ...caseData, caseNumber: e.target.value })}
                  placeholder="e.g. FD-302-MI-84920"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  CRIME CATEGORY *
                </label>
                <select
                  value={caseData.category}
                  onChange={(e) => setCaseData({ ...caseData, category: e.target.value as CrimeCategory })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:border-red-600"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  CASE STATUS *
                </label>
                <select
                  value={caseData.status}
                  onChange={(e) => setCaseData({ ...caseData, status: e.target.value as CaseStatus })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:border-red-600"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  CASE TITLE *
                </label>
                <input
                  type="text"
                  required
                  value={caseData.title}
                  onChange={(e) => setCaseData({ ...caseData, title: e.target.value })}
                  placeholder="e.g. The USA Gymnastics & MSU Medical Casework"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-editorial focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  CASE SUBTITLE / INVESTIGATIVE SCOPE
                </label>
                <input
                  type="text"
                  value={caseData.subtitle}
                  onChange={(e) => setCaseData({ ...caseData, subtitle: e.target.value })}
                  placeholder="e.g. Investigation into systemic medical abuse..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-serif focus:border-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  YEAR OF PRINCIPAL CASEWORK
                </label>
                <input
                  type="number"
                  value={caseData.year}
                  onChange={(e) => setCaseData({ ...caseData, year: parseInt(e.target.value, 10) || 2026 })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  PRIMARY LOCATION / JURISDICTION
                </label>
                <input
                  type="text"
                  value={caseData.location}
                  onChange={(e) => setCaseData({ ...caseData, location: e.target.value })}
                  placeholder="e.g. Lansing, MI & Indianapolis, IN"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  HEADER IMAGE URL
                </label>
                <input
                  type="text"
                  value={caseData.bannerImageUrl || ''}
                  onChange={(e) => setCaseData({ ...caseData, bannerImageUrl: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                EXECUTIVE SUMMARY (HOMEPAGE SYNOPSIS)
              </label>
              <textarea
                rows={3}
                value={caseData.summary}
                onChange={(e) => setCaseData({ ...caseData, summary: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui focus:border-red-600"
              />
            </div>

            <div className="flex items-center space-x-6 pt-3 border-t border-zinc-800 text-xs font-mono">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseData.isPublished}
                  onChange={(e) => setCaseData({ ...caseData, isPublished: e.target.checked })}
                  className="rounded bg-zinc-900 border-zinc-700 text-red-600 focus:ring-0"
                />
                <span className="text-zinc-300">PUBLISHED IN PUBLIC REPOSITORY</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseData.isFeatured}
                  onChange={(e) => setCaseData({ ...caseData, isFeatured: e.target.checked })}
                  className="rounded bg-zinc-900 border-zinc-700 text-red-600 focus:ring-0"
                />
                <span className="text-zinc-300">FEATURE ON HOMEPAGE SPOTLIGHT</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: Chapter 1 Overview */}
        {activeTab === 'overview' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
              Chapter 1: Case Overview & Background
            </h3>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                BACKGROUND & HISTORICAL CONTEXT
              </label>
              <textarea
                rows={4}
                value={caseData.overview.background}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    overview: { ...caseData.overview, background: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                VICTIM & SURVIVOR INFORMATION (FACTUAL / RESPECTFUL)
              </label>
              <textarea
                rows={3}
                value={caseData.overview.victimInfo}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    overview: { ...caseData.overview, victimInfo: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  FORMAL JURISDICTION
                </label>
                <input
                  type="text"
                  value={caseData.overview.jurisdiction}
                  onChange={(e) =>
                    setCaseData({
                      ...caseData,
                      overview: { ...caseData.overview, jurisdiction: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  INITIAL ALERT / REFERRAL DATE
                </label>
                <input
                  type="text"
                  value={caseData.overview.initialAlertDate}
                  onChange={(e) =>
                    setCaseData({
                      ...caseData,
                      overview: { ...caseData.overview, initialAlertDate: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:border-red-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Chapter 2 Incident */}
        {activeTab === 'incident' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
              Chapter 2: The Incident
            </h3>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                FACTUAL CHRONOLOGICAL ACCOUNT
              </label>
              <textarea
                rows={5}
                value={caseData.incident.narrative}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    incident: { ...caseData.incident, narrative: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui focus:border-red-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-zinc-300 uppercase">
                  Incident Timeline Milestones ({caseData.incident.timeline.length})
                </span>
                <button
                  type="button"
                  onClick={addIncidentTimelineEvent}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 rounded flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD MILESTONE</span>
                </button>
              </div>

              <div className="space-y-3">
                {caseData.incident.timeline.map((ev, i) => (
                  <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        placeholder="Date (e.g. October 12, 1999)"
                        value={ev.date}
                        onChange={(e) => {
                          const updated = [...caseData.incident.timeline];
                          updated[i].date = e.target.value;
                          setCaseData({
                            ...caseData,
                            incident: { ...caseData.incident, timeline: updated },
                          });
                        }}
                        className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-red-400 font-mono w-48"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = caseData.incident.timeline.filter((_, idx) => idx !== i);
                          setCaseData({
                            ...caseData,
                            incident: { ...caseData.incident, timeline: updated },
                          });
                        }}
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Milestone Title"
                      value={ev.title}
                      onChange={(e) => {
                        const updated = [...caseData.incident.timeline];
                        updated[i].title = e.target.value;
                        setCaseData({
                          ...caseData,
                          incident: { ...caseData.incident, timeline: updated },
                        });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-editorial"
                    />

                    <textarea
                      rows={2}
                      placeholder="Milestone Detail"
                      value={ev.description}
                      onChange={(e) => {
                        const updated = [...caseData.incident.timeline];
                        updated[i].description = e.target.value;
                        setCaseData({
                          ...caseData,
                          incident: { ...caseData.incident, timeline: updated },
                        });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400 font-ui"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Chapter 3 Investigation */}
        {activeTab === 'investigation' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
              Chapter 3: The Investigation & Field Procedures
            </h3>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                INVESTIGATIVE NARRATIVE
              </label>
              <textarea
                rows={5}
                value={caseData.investigation.narrative}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    investigation: { ...caseData.investigation, narrative: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  PROCEDURAL NOTES & PROTOCOLS
                </label>
                <textarea
                  rows={3}
                  value={caseData.investigation.procedureNotes}
                  onChange={(e) =>
                    setCaseData({
                      ...caseData,
                      investigation: { ...caseData.investigation, procedureNotes: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  FD-302 INTERVIEW TRANSCRIPT SUMMARY
                </label>
                <textarea
                  rows={3}
                  value={caseData.investigation.interviewRecordsSummary}
                  onChange={(e) =>
                    setCaseData({
                      ...caseData,
                      investigation: {
                        ...caseData.investigation,
                        interviewRecordsSummary: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:border-red-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Chapter 4 Evidence */}
        {activeTab === 'evidence' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
                Chapter 4: Evidence Vault & Exhibits
              </h3>
              <button
                type="button"
                onClick={addEvidenceItem}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-xs font-mono text-red-100 rounded flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>LOG NEW EXHIBIT</span>
              </button>
            </div>

            <div className="space-y-4">
              {caseData.evidence.map((ev, i) => (
                <div key={ev.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Exhibit #"
                      value={ev.exhibitNumber}
                      onChange={(e) => {
                        const updated = [...caseData.evidence];
                        updated[i].exhibitNumber = e.target.value;
                        setCaseData({ ...caseData, evidence: updated });
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-red-400 font-mono w-40"
                    />

                    <select
                      value={ev.classification}
                      onChange={(e) => {
                        const updated = [...caseData.evidence];
                        updated[i].classification = e.target.value as any;
                        setCaseData({ ...caseData, evidence: updated });
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 font-mono"
                    >
                      <option value="Confidential">Confidential</option>
                      <option value="Declassified">Declassified</option>
                      <option value="Grand Jury Exhibit">Grand Jury Exhibit</option>
                      <option value="Public Record">Public Record</option>
                      <option value="FD-302 Record">FD-302 Record</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = caseData.evidence.filter((_, idx) => idx !== i);
                        setCaseData({ ...caseData, evidence: updated });
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Exhibit Title"
                    value={ev.title}
                    onChange={(e) => {
                      const updated = [...caseData.evidence];
                      updated[i].title = e.target.value;
                      setCaseData({ ...caseData, evidence: updated });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-100 font-editorial"
                  />

                  <textarea
                    rows={2}
                    placeholder="Exhibit Forensic Description"
                    value={ev.description}
                    onChange={(e) => {
                      const updated = [...caseData.evidence];
                      updated[i].description = e.target.value;
                      setCaseData({ ...caseData, evidence: updated });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 font-ui"
                  />

                  <textarea
                    rows={2}
                    placeholder="Investigative Significance"
                    value={ev.significance}
                    onChange={(e) => {
                      const updated = [...caseData.evidence];
                      updated[i].significance = e.target.value;
                      setCaseData({ ...caseData, evidence: updated });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-amber-300 font-ui"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Chapter 5 Persons of Interest */}
        {activeTab === 'poi' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
                Chapter 5: Persons of Interest & Subjects
              </h3>
              <button
                type="button"
                onClick={addPoiItem}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-xs font-mono text-red-100 rounded flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD SUBJECT</span>
              </button>
            </div>

            <div className="space-y-4">
              {caseData.personsOfInterest.map((poi, i) => (
                <div key={poi.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={poi.name}
                      onChange={(e) => {
                        const updated = [...caseData.personsOfInterest];
                        updated[i].name = e.target.value;
                        setCaseData({ ...caseData, personsOfInterest: updated });
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-100 font-editorial flex-1"
                    />

                    <select
                      value={poi.status}
                      onChange={(e) => {
                        const updated = [...caseData.personsOfInterest];
                        updated[i].status = e.target.value as any;
                        setCaseData({ ...caseData, personsOfInterest: updated });
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-red-400 font-mono"
                    >
                      <option value="Convicted">Convicted</option>
                      <option value="Allegations / Charged">Allegations / Charged</option>
                      <option value="Indicted">Indicted</option>
                      <option value="Material Witness">Material Witness</option>
                      <option value="Exonerated">Exonerated</option>
                      <option value="Deceased">Deceased</option>
                      <option value="Uncharged Suspect">Uncharged Suspect</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = caseData.personsOfInterest.filter((_, idx) => idx !== i);
                        setCaseData({ ...caseData, personsOfInterest: updated });
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Role (e.g. Primary Defendant / Chief Medical Officer)"
                    value={poi.role}
                    onChange={(e) => {
                      const updated = [...caseData.personsOfInterest];
                      updated[i].role = e.target.value;
                      setCaseData({ ...caseData, personsOfInterest: updated });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-amber-400 font-mono"
                  />

                  <textarea
                    rows={2}
                    placeholder="Judicially Verified Findings"
                    value={poi.verifiedFindings}
                    onChange={(e) => {
                      const updated = [...caseData.personsOfInterest];
                      updated[i].verifiedFindings = e.target.value;
                      setCaseData({ ...caseData, personsOfInterest: updated });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 font-ui"
                  />

                  <textarea
                    rows={2}
                    placeholder="Final Legal Outcome & Disposition"
                    value={poi.outcome}
                    onChange={(e) => {
                      const updated = [...caseData.personsOfInterest];
                      updated[i].outcome = e.target.value;
                      setCaseData({ ...caseData, personsOfInterest: updated });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: Chapter 6 Breakthrough */}
        {activeTab === 'breakthrough' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
              Chapter 6: The Breakthrough
            </h3>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                BREAKTHROUGH NARRATIVE
              </label>
              <textarea
                rows={5}
                value={caseData.breakthrough.narrative}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    breakthrough: { ...caseData.breakthrough, narrative: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui focus:border-red-600"
              />
            </div>
          </div>
        )}

        {/* TAB 8: Chapter 7 Courtroom */}
        {activeTab === 'courtroom' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
              Chapter 7: The Courtroom & Trial
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  COURT VENUE & JURISDICTION
                </label>
                <input
                  type="text"
                  value={caseData.courtroom.court}
                  onChange={(e) =>
                    setCaseData({
                      ...caseData,
                      courtroom: { ...caseData.courtroom, court: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-editorial"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  PRESIDING JUDGE
                </label>
                <input
                  type="text"
                  value={caseData.courtroom.presidingJudge}
                  onChange={(e) =>
                    setCaseData({
                      ...caseData,
                      courtroom: { ...caseData.courtroom, presidingJudge: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                PROSECUTION ARGUMENT
              </label>
              <textarea
                rows={3}
                value={caseData.courtroom.prosecutionArgument}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    courtroom: { ...caseData.courtroom, prosecutionArgument: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                DEFENSE ARGUMENT
              </label>
              <textarea
                rows={3}
                value={caseData.courtroom.defenseArgument}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    courtroom: { ...caseData.courtroom, defenseArgument: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui"
              />
            </div>
          </div>
        )}

        {/* TAB 9: Chapter 8 & 9 Verdict and Aftermath */}
        {activeTab === 'verdict' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
              Chapters 8 & 9: Verdict, Sentencing & Legislative Precedent
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  DATE OF VERDICT
                </label>
                <input
                  type="text"
                  value={caseData.verdict.verdictDate}
                  onChange={(e) =>
                    setCaseData({
                      ...caseData,
                      verdict: { ...caseData.verdict, verdictDate: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  FORMAL SENTENCING
                </label>
                <input
                  type="text"
                  value={caseData.verdict.sentencing}
                  onChange={(e) =>
                    setCaseData({
                      ...caseData,
                      verdict: { ...caseData.verdict, sentencing: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-red-400 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                INSTITUTIONAL & LEGAL AFTERMATH
              </label>
              <textarea
                rows={3}
                value={caseData.aftermath.institutionalImpact}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    aftermath: { ...caseData.aftermath, institutionalImpact: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-ui"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                CURRENT PERPETRATOR / CASE STATUS
              </label>
              <input
                type="text"
                value={caseData.aftermath.currentStatus}
                onChange={(e) =>
                  setCaseData({
                    ...caseData,
                    aftermath: { ...caseData.aftermath, currentStatus: e.target.value },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 font-mono"
              />
            </div>
          </div>
        )}

        {/* TAB 10: Citations */}
        {activeTab === 'citations' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
                Audited Public Citations & Court Dockets
              </h3>
              <button
                type="button"
                onClick={addCitation}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 rounded flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD CITATION</span>
              </button>
            </div>

            <div className="space-y-3">
              {caseData.citations.map((cit, i) => (
                <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Citation Title"
                      value={cit.title}
                      onChange={(e) => {
                        const updated = [...caseData.citations];
                        updated[i].title = e.target.value;
                        setCaseData({ ...caseData, citations: updated });
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-semibold flex-1 mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = caseData.citations.filter((_, idx) => idx !== i);
                        setCaseData({ ...caseData, citations: updated });
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Source / Court Docket"
                      value={cit.source}
                      onChange={(e) => {
                        const updated = [...caseData.citations];
                        updated[i].source = e.target.value;
                        setCaseData({ ...caseData, citations: updated });
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Year / Date"
                      value={cit.date || ''}
                      onChange={(e) => {
                        const updated = [...caseData.citations];
                        updated[i].date = e.target.value;
                        setCaseData({ ...caseData, citations: updated });
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: Audio & Media Vault */}
        {activeTab === 'media' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono text-amber-500 uppercase font-bold">
                  Custodial Media, Audio Recordings & Photographs
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Upload audio clips, wiretaps, bodycam audio, interrogation tapes, or photographic exhibits. Each item will be playable in the interactive retro reel-to-reel media player.
                </p>
              </div>
              <button
                type="button"
                onClick={addMediaItem}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-mono rounded flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ATTACH MEDIA ITEM</span>
              </button>
            </div>

            {(!caseData.mediaItems || caseData.mediaItems.length === 0) && (
              <div className="p-8 border border-dashed border-zinc-800 rounded text-center text-xs text-zinc-500 font-mono">
                No custodial audio or media files attached yet. Click &quot;ATTACH MEDIA ITEM&quot; above to add tape reels, wiretaps, or photographic evidence.
              </div>
            )}

            <div className="space-y-4">
              {(caseData.mediaItems || []).map((media, i) => (
                <div
                  key={media.id || i}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      ITEM #{i + 1} &mdash; [{media.mediaType.toUpperCase()}]
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (caseData.mediaItems || []).filter((_, idx) => idx !== i);
                        setCaseData({ ...caseData, mediaItems: updated });
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      title="Remove media item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        EXHIBIT / TAPE TITLE *
                      </label>
                      <input
                        type="text"
                        value={media.title}
                        onChange={(e) => {
                          const updated = [...(caseData.mediaItems || [])];
                          updated[i].title = e.target.value;
                          setCaseData({ ...caseData, mediaItems: updated });
                        }}
                        placeholder="e.g. Wiretap Reel #14B — Recorded Phone Line"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        MEDIA TYPE
                      </label>
                      <select
                        value={media.mediaType}
                        onChange={(e) => {
                          const updated = [...(caseData.mediaItems || [])];
                          updated[i].mediaType = e.target.value as any;
                          setCaseData({ ...caseData, mediaItems: updated });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                      >
                        <option value="audio">Audio Recording</option>
                        <option value="wiretap">Intercepted Wiretap</option>
                        <option value="recording">Interrogation Recording</option>
                        <option value="image">Photographic Exhibit</option>
                        <option value="video">Surveillance Video</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        FILE URL / ASSET PATH
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={media.url}
                          onChange={(e) => {
                            const updated = [...(caseData.mediaItems || [])];
                            updated[i].url = e.target.value;
                            setCaseData({ ...caseData, mediaItems: updated });
                          }}
                          placeholder="/uploads/tape.mp3 or https://..."
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                        />
                        <label className="cursor-pointer px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono rounded flex items-center space-x-1 shrink-0">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>UPLOAD</span>
                          <input
                            type="file"
                            accept="audio/*,image/*,video/*"
                            className="hidden"
                            onChange={(e) => handleMediaUpload(i, e)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          DURATION (MM:SS)
                        </label>
                        <input
                          type="text"
                          value={media.duration || ''}
                          onChange={(e) => {
                            const updated = [...(caseData.mediaItems || [])];
                            updated[i].duration = e.target.value;
                            setCaseData({ ...caseData, mediaItems: updated });
                          }}
                          placeholder="e.g. 04:18"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          RECOVERED DATE
                        </label>
                        <input
                          type="text"
                          value={media.recoveredAt || ''}
                          onChange={(e) => {
                            const updated = [...(caseData.mediaItems || [])];
                            updated[i].recoveredAt = e.target.value;
                            setCaseData({ ...caseData, mediaItems: updated });
                          }}
                          placeholder="YYYY-MM-DD"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        OFFICIAL SOURCE / CUSTODY RECORD
                      </label>
                      <input
                        type="text"
                        value={media.source}
                        onChange={(e) => {
                          const updated = [...(caseData.mediaItems || [])];
                          updated[i].source = e.target.value;
                          setCaseData({ ...caseData, mediaItems: updated });
                        }}
                        placeholder="e.g. Admitted Trial Exhibit GX-21 / FBI Vault"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        SECURITY CLASSIFICATION
                      </label>
                      <input
                        type="text"
                        value={media.classification || ''}
                        onChange={(e) => {
                          const updated = [...(caseData.mediaItems || [])];
                          updated[i].classification = e.target.value;
                          setCaseData({ ...caseData, mediaItems: updated });
                        }}
                        placeholder="e.g. Declassified FD-302 Evidence / Admitted Exhibit"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      TRANSCRIPT SUMMARY & FORENSIC CONTEXT
                    </label>
                    <textarea
                      rows={2}
                      value={media.description}
                      onChange={(e) => {
                        const updated = [...(caseData.mediaItems || [])];
                        updated[i].description = e.target.value;
                        setCaseData({ ...caseData, mediaItems: updated });
                      }}
                      placeholder="Context of this recording, authenticated speakers, and factual relevance to the investigation..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono rounded"
          >
            DISCARD CHANGES
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-100 text-xs font-mono font-bold rounded flex items-center space-x-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'SAVING...' : 'COMMIT DOSSIER TO DATABASE'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
