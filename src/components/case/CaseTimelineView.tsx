import React, { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Calendar,
  Shield,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import { CaseFile, TimelineEvent } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface CaseTimelineViewProps {
  caseData: CaseFile;
}

export const CaseTimelineView: React.FC<CaseTimelineViewProps> = ({ caseData }) => {
  // Combine all chronological events from incident, investigation, breakthrough and courtroom
  const [allEvents, setAllEvents] = useState<(TimelineEvent & { sourcePhase: string })[]>([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [loadingEventIndex, setLoadingEventIndex] = useState<number | null>(null);
  const [retrievalProgress, setRetrievalProgress] = useState<number>(0);
  const [typedReportText, setTypedReportText] = useState<string>('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const list: (TimelineEvent & { sourcePhase: string })[] = [];

    // Incident timeline
    if (caseData.incident?.timeline) {
      caseData.incident.timeline.forEach((ev) => {
        list.push({ ...ev, sourcePhase: 'The Incident' });
      });
    }

    // Investigation timeline
    if (caseData.investigation?.timeline) {
      caseData.investigation.timeline.forEach((ev) => {
        list.push({ ...ev, sourcePhase: 'Field Investigation' });
      });
    }

    // Breakthrough turning points
    if (caseData.breakthrough?.turningPoints) {
      caseData.breakthrough.turningPoints.forEach((tp) => {
        list.push({
          date: tp.date,
          title: tp.title,
          description: tp.detail || tp.description || '',
          source: 'Breakthrough Forensic Milestone',
          sourcePhase: 'Forensic Breakthrough',
        });
      });
    }

    // Courtroom timeline
    if (caseData.courtroom?.trialTimeline) {
      caseData.courtroom.trialTimeline.forEach((ev) => {
        list.push({ ...ev, sourcePhase: 'Courtroom Proceedings' });
      });
    }

    setAllEvents(list);
  }, [caseData]);

  // Handle clicking an entry: brief loading bar and typing effect
  const handleEntryClick = (index: number) => {
    soundEngine.playKeyClick();
    if (selectedEventIndex === index) {
      setSelectedEventIndex(null);
      setLoadingEventIndex(null);
      setTypedReportText('');
      return;
    }

    const event = filteredEvents[index];
    if (!event) return;

    setLoadingEventIndex(index);
    setRetrievalProgress(0);
    setTypedReportText('');

    soundEngine.playFileAccess();

    // Fast simulated tape retrieval progress bar (350ms total)
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setRetrievalProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setLoadingEventIndex(null);
        setSelectedEventIndex(index);

        // Start subtle typewriter reveal
        const fullText = event.description || 'No detailed incident memorandum logged for this timestamp.';
        let charIdx = 0;
        const typeInterval = setInterval(() => {
          charIdx += 4;
          setTypedReportText(fullText.slice(0, charIdx));
          if (charIdx >= fullText.length) {
            clearInterval(typeInterval);
          }
        }, 15);
      }
    }, 70);
  };

  const filteredEvents = allEvents.filter((ev) => {
    if (filterPhase !== 'all' && ev.sourcePhase !== filterPhase) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.date.toLowerCase().includes(q) ||
        (ev.source && ev.source.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="retro-window p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-950/60 border border-red-800 text-red-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-pixel text-[10px] text-red-500 uppercase font-bold">
                  ARCHIVE TIMELINE RECONSTRUCTION
                </span>
                <span className="retro-stamp text-[8px] py-0 px-1.5">FD-302 CHRONO</span>
              </div>
              <h3 className="text-base font-bold font-editorial text-zinc-100">
                Case Chronological Audit Log
              </h3>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/70 border border-zinc-800 text-xs font-tech text-zinc-200 pl-8 pr-3 py-1.5 rounded focus:border-red-600 focus:outline-none"
              />
            </div>

            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="bg-black/70 border border-zinc-800 text-xs font-tech text-zinc-300 px-2.5 py-1.5 rounded focus:border-red-600 focus:outline-none"
            >
              <option value="all">ALL PHASES ({allEvents.length})</option>
              <option value="The Incident">The Incident</option>
              <option value="Field Investigation">Field Investigation</option>
              <option value="Forensic Breakthrough">Forensic Breakthrough</option>
              <option value="Courtroom Proceedings">Courtroom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Terminal Guidance Notice */}
      <div className="p-3 bg-black/50 border border-zinc-800/80 text-xs font-tech text-zinc-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>
            CLICK ANY ENTRY TO RETRIEVE AND EXPAND ITS AUDITED FBI MEMORANDUM & SOURCE RECORD.
          </span>
        </div>
        <span className="text-[10px] font-pixel text-zinc-500">
          SHOWING {filteredEvents.length} OF {allEvents.length} ENTRIES
        </span>
      </div>

      {/* Vertical Timeline List */}
      <div className="relative border-l-2 border-red-950/80 ml-4 sm:ml-6 pl-4 sm:pl-8 space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center retro-window text-zinc-500 font-tech text-xs">
            NO TIMELINE ENTRIES MATCHING ACTIVE FILTER.
          </div>
        ) : (
          filteredEvents.map((ev, index) => {
            const isSelected = selectedEventIndex === index;
            const isLoading = loadingEventIndex === index;

            return (
              <div key={index} className="relative group">
                {/* Node Marker */}
                <div
                  className={`absolute -left-[27px] sm:-left-[43px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)] scale-110'
                      : 'bg-zinc-950 border-zinc-700 group-hover:border-red-500'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-zinc-500 group-hover:bg-red-400'
                    }`}
                  />
                </div>

                {/* Entry Card */}
                <div
                  onClick={() => handleEntryClick(index)}
                  className={`border transition-all cursor-pointer rounded overflow-hidden ${
                    isSelected
                      ? 'bg-[#0b0e11] border-red-700/80 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                      : 'bg-[#080a0c] border-[#21262d] hover:border-zinc-700 hover:bg-[#0c0f13]'
                  }`}
                >
                  {/* Card Summary Header */}
                  <div className="p-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-pixel text-[11px] text-red-400 font-bold px-2 py-0.5 bg-red-950/50 border border-red-900/60 rounded">
                        {ev.date}
                      </span>
                      <span className="text-[10px] font-pixel text-zinc-500 uppercase px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                        {ev.sourcePhase}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-tech text-zinc-500">
                      {ev.source && (
                        <span className="hidden sm:inline-block">
                          SOURCE: <span className="text-zinc-400">{ev.source}</span>
                        </span>
                      )}
                      <span className="text-zinc-400 font-pixel text-[10px] flex items-center">
                        {isSelected ? (
                          <>
                            COLLAPSE [-] <ChevronUp className="w-3.5 h-3.5 ml-1 text-red-400" />
                          </>
                        ) : (
                          <>
                            RETRIEVE REPORT [+] <ChevronDown className="w-3.5 h-3.5 ml-1 text-zinc-500" />
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <h4 className="text-sm sm:text-base font-bold font-editorial text-zinc-100 group-hover:text-amber-200 transition-colors">
                      {ev.title}
                    </h4>
                  </div>

                  {/* Retrieval Progress Bar Animation */}
                  {isLoading && (
                    <div className="p-4 border-t border-zinc-800/80 bg-black/90 font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-emerald-400 font-pixel">
                        <span className="flex items-center">
                          <span className="inline-block w-2 h-2 bg-emerald-400 mr-2 animate-ping" />
                          RETRIEVING CLASSIFIED LOG FROM ARCHIVE STORAGE...
                        </span>
                        <span>{retrievalProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 border border-zinc-800 rounded overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-75"
                          style={{ width: `${retrievalProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expanded Full Report with Typing Effect & FBI OS Frame */}
                  {isSelected && (
                    <div className="border-t border-red-900/60 bg-[#06080a] p-5 space-y-4">
                      {/* Sub-header with Docket stamps */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80 text-[11px] font-tech">
                        <div className="text-zinc-400">
                          <strong className="text-zinc-300">DOCUMENT ID:</strong> REC-CHRONO-
                          {caseData.caseNumber}-{index + 101}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="retro-stamp text-[8px] py-0 px-2 text-emerald-400 border-emerald-800">
                            VERIFIED AUDIT RECORD
                          </span>
                          <span className="text-zinc-500">FORMAT: FD-302 SERIAL</span>
                        </div>
                      </div>

                      {/* Typed Narrative Text */}
                      <div className="p-4 bg-black/80 border border-zinc-800/80 rounded font-tech text-xs sm:text-sm text-zinc-200 leading-relaxed space-y-2">
                        <div className="font-pixel text-[10px] text-amber-400 uppercase tracking-wider mb-1 flex items-center">
                          <FileText className="w-3 h-3 mr-1.5" />
                          EXPANDED INVESTIGATIVE MEMORANDUM:
                        </div>
                        <p className="whitespace-pre-line text-zinc-300 font-mono">
                          {typedReportText}
                          <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />
                        </p>
                      </div>

                      {/* Source Citation & Chain of Custody */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-tech text-zinc-400">
                        <div className="p-2.5 bg-zinc-950/60 border border-zinc-900 rounded">
                          <span className="text-[10px] font-pixel text-zinc-500 uppercase block">
                            Documentary Source / Agency
                          </span>
                          <span className="text-zinc-300">
                            {ev.source || 'State & Federal Investigatory Records / Sworn Deposition'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-zinc-950/60 border border-zinc-900 rounded">
                          <span className="text-[10px] font-pixel text-zinc-500 uppercase block">
                            Case Context & Impact
                          </span>
                          <span className="text-amber-400/90">
                            Recorded in Section {caseData.caseNumber} &bull; Phase: {ev.sourcePhase}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
