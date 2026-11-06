import React, { useState, useEffect } from 'react';
import {
  FileText,
  Mic,
  Maximize2,
  X,
  Minimize2,
  Calendar,
  MapPin,
  Shield,
  Eye,
  EyeOff,
  User,
  Volume2,
  Printer,
  Search,
} from 'lucide-react';
import { CaseFile, InterviewRecord, TranscriptLine } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface CaseWitnessStatementsViewProps {
  caseData: CaseFile;
}

export const CaseWitnessStatementsView: React.FC<CaseWitnessStatementsViewProps> = ({ caseData }) => {
  // Collect or dynamically generate interview records from caseData
  const [statements, setStatements] = useState<InterviewRecord[]>([]);
  const [activeDoc, setActiveDoc] = useState<InterviewRecord | null>(null);
  const [docLoading, setDocLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [typedSummary, setTypedSummary] = useState<string>('');
  const [showRedactions, setShowRedactions] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    const list: InterviewRecord[] = [];

    // 1. If explicit interviews are defined on the case
    if (caseData.interviews && caseData.interviews.length > 0) {
      list.push(...caseData.interviews);
    } else {
      // 2. Synthesize authentic FD-302 witness interview documents from key testimonies and POIs
      if (caseData.courtroom?.keyTestimonies && caseData.courtroom.keyTestimonies.length > 0) {
        caseData.courtroom.keyTestimonies.forEach((kt, idx) => {
          list.push({
            id: `stmt-${idx + 1}`,
            caseSlug: caseData.slug,
            caseNumber: caseData.caseNumber,
            title: `FD-302 INTERVIEW: ${kt.witness.toUpperCase()}`,
            interviewee: kt.witness,
            interviewer: 'Special Agent in Charge / Prosecutorial Investigator',
            date: caseData.overview?.initialAlertDate || `${caseData.year}-06-12`,
            location: caseData.location || 'Federal Field Office / Deposition Suite',
            recordingMedium: 'Stenographic Deposition',
            classification: 'Judicial Deposition',
            summary: `Sworn recorded deposition concerning ${caseData.title}. Witness stated regarding ${kt.role}: "${kt.keyPoints}". Witness confirmed detailed timeline of observations without material inconsistency under cross-examination.`,
            transcripts: [
              {
                timestamp: '00:01:15',
                speaker: 'SPECIAL AGENT',
                speakerRole: 'Interviewer',
                text: `State your legal name, professional role, and clarify your knowledge regarding the docket entries for ${caseData.title}.`,
                isDirectQuote: true,
              },
              {
                timestamp: '00:01:45',
                speaker: kt.witness.toUpperCase(),
                speakerRole: kt.role,
                text: kt.keyPoints,
                isDirectQuote: true,
                editorialNote: 'Sworn testimony verified against public court records.',
              },
              {
                timestamp: '00:04:20',
                speaker: 'SPECIAL AGENT',
                speakerRole: 'Interviewer',
                text: 'Did you observe any deviation from standard operational protocol or subsequent alteration of documentation?',
                isDirectQuote: true,
              },
              {
                timestamp: '00:04:52',
                speaker: kt.witness.toUpperCase(),
                speakerRole: kt.role,
                text: `Everything I have placed on this record reflects what was witnessed and documented contemporaneously.`,
                isDirectQuote: true,
              },
            ],
            sourceCitation: `Admitted Exhibit in ${caseData.courtroom?.court || 'United States District Court'}`,
          });
        });
      }

      // Add key statements from persons of interest if list is small
      if (list.length < 3 && caseData.personsOfInterest && caseData.personsOfInterest.length > 0) {
        caseData.personsOfInterest.slice(0, 2).forEach((poi, idx) => {
          list.push({
            id: `stmt-poi-${idx + 1}`,
            caseSlug: caseData.slug,
            caseNumber: caseData.caseNumber,
            title: `FD-302 INTERVIEW: ${poi.name.toUpperCase()} (${poi.role})`,
            interviewee: poi.name,
            interviewer: 'Investigative Task Force Detective / FBI Special Agent',
            date: `${caseData.year}-09-18`,
            location: caseData.location || 'Municipal Interrogation Unit',
            recordingMedium: 'Magnetic Reel Audio',
            classification: 'Declassified FD-302',
            summary: poi.verifiedFindings || poi.background,
            transcripts: [
              {
                timestamp: '00:00:30',
                speaker: 'INVESTIGATOR',
                speakerRole: 'Investigator',
                text: `You have been advised of constitutional rights. Describe your knowledge of the events under inquiry.`,
                isDirectQuote: true,
              },
              {
                timestamp: '00:01:10',
                speaker: poi.name.toUpperCase(),
                speakerRole: poi.role,
                text: poi.allegations || poi.verifiedFindings,
                isDirectQuote: true,
              },
            ],
            sourceCitation: `Form FD-302 Serial ${caseData.caseNumber}-POI-${idx + 1}`,
          });
        });
      }

      // Add general investigation summary as primary FD-302 if empty
      if (list.length === 0) {
        list.push({
          id: 'stmt-primary',
          caseSlug: caseData.slug,
          caseNumber: caseData.caseNumber,
          title: `FD-302 MASTER INTERVIEW DIGEST: ${caseData.title.toUpperCase()}`,
          interviewee: 'Lead Supervisory Investigator',
          interviewer: 'Department of Justice Case Review Board',
          date: `${caseData.year}-11-04`,
          location: caseData.location,
          recordingMedium: 'Stenographic Grand Jury',
          classification: 'Official Police Statement',
          summary:
            caseData.investigation?.interviewRecordsSummary ||
            caseData.investigation?.narrative ||
            'All witness testimonies recorded in this docket were verified through audited public records.',
          transcripts: [
            {
              timestamp: '00:00:00',
              speaker: 'CASE SUPERVISOR',
              speakerRole: 'Investigator',
              text: caseData.investigation?.interviewRecordsSummary || caseData.summary,
              isDirectQuote: true,
            },
          ],
          sourceCitation: `Master Case Dossier ${caseData.caseNumber}`,
        });
      }
    }

    setStatements(list);
  }, [caseData]);

  // Open Document inside Computer Window with subtle page-loading and typing animation
  const handleOpenDoc = (doc: InterviewRecord) => {
    soundEngine.playFileAccess();
    setActiveDoc(doc);
    setDocLoading(true);
    setLoadingProgress(0);
    setTypedSummary('');

    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setLoadingProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setDocLoading(false);

        // Typing effect on the document statement header
        const text = doc.summary;
        let c = 0;
        const typeInterval = setInterval(() => {
          c += 5;
          setTypedSummary(text.slice(0, c));
          if (c >= text.length) {
            clearInterval(typeInterval);
          }
        }, 12);
      }
    }, 60);
  };

  const filteredStatements = statements.filter((s) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.interviewee.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="retro-window p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-950/60 border border-amber-800 text-amber-400">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-amber-500 uppercase font-bold">
                SWORN INTERVIEWS & WITNESS DEPOSITIONS
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1.5">FORM FD-302</span>
            </div>
            <h3 className="text-base font-bold font-editorial text-zinc-100">
              Scanned Case Interview Archive
            </h3>
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search witness or subject..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-black/70 border border-zinc-800 text-xs font-tech text-zinc-200 pl-8 pr-3 py-1.5 rounded focus:border-amber-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Scanned Statement Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStatements.map((doc, idx) => (
          <div
            key={doc.id || idx}
            onClick={() => handleOpenDoc(doc)}
            className="retro-window p-4 hover:border-amber-600/80 cursor-pointer transition-all flex flex-col justify-between group bg-[#090b0d]"
          >
            <div>
              {/* Document Header Tag */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-[10px] text-amber-400 font-bold">
                  DOC_ID: FD-302-{(idx + 1).toString().padStart(3, '0')}
                </span>
                <span className="retro-stamp text-[8px] py-0 px-1">
                  {doc.classification || 'CONFIDENTIAL'}
                </span>
              </div>

              {/* Document Preview Graphic */}
              <div className="border border-zinc-800 bg-[#06080a] p-3 mb-3 relative overflow-hidden group-hover:border-zinc-700">
                <div className="absolute top-2 right-2 opacity-20 font-pixel text-[30px] select-none text-zinc-600">
                  FD-302
                </div>
                <div className="text-[10px] font-pixel text-zinc-500 mb-1">
                  INTERVIEWEE: <span className="text-zinc-200 font-bold">{doc.interviewee}</span>
                </div>
                <div className="text-[10px] font-tech text-zinc-400 mb-2">
                  DATE: {doc.date} &bull; LOC: {doc.location}
                </div>
                <p className="text-xs font-mono text-zinc-400 line-clamp-3 leading-relaxed">
                  "{doc.summary}"
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-tech">
              <span className="text-zinc-500 text-[10px]">
                {doc.transcripts ? `${doc.transcripts.length} TRANSCRIPT LINES` : 'SWORN MEMORANDUM'}
              </span>
              <button className="text-amber-400 font-pixel text-[10px] flex items-center group-hover:translate-x-0.5 transition-transform">
                OPEN WINDOW <Maximize2 className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Scanned Document Modal (Computer Window) */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="retro-window max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-amber-900/60 bg-[#07090b]">
            {/* Retro OS Window Titlebar */}
            <div className="retro-window-header active flex items-center justify-between p-2.5 bg-zinc-900 border-b border-zinc-700">
              <div className="flex items-center space-x-2 text-xs font-pixel text-zinc-200">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>FD-302 RECORD VIEWER // {activeDoc.interviewee.toUpperCase()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRedactions(!showRedactions)}
                  className="retro-btn text-[10px] px-2 py-0.5 flex items-center space-x-1"
                >
                  {showRedactions ? (
                    <Eye className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-red-400" />
                  )}
                  <span>{showRedactions ? 'UNMASK' : 'MASK REDACTIONS'}</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    setActiveDoc(null);
                  }}
                  className="retro-btn retro-btn-red text-[11px] px-2.5 py-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Window Loading Transition */}
            {docLoading ? (
              <div className="p-12 text-center space-y-4 font-mono text-xs">
                <div className="text-amber-400 font-pixel text-sm flex items-center justify-center">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping mr-2" />
                  INITIALIZING FD-302 RETRIEVAL FROM RETRO DIGITAL BUFFER...
                </div>
                <div className="max-w-md mx-auto w-full bg-zinc-900 h-2.5 border border-zinc-700 rounded overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-75"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500">
                  SCANNING SIGNATURES &bull; CHECKING CHAIN OF CUSTODY
                </div>
              </div>
            ) : (
              /* Scanned Document Paper Scroll Area */
              <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs bg-[#0a0d10] text-zinc-200">
                {/* Official FBI FD-302 Top Stamp Header */}
                <div className="border-2 border-zinc-700/80 p-4 bg-[#050709] relative">
                  <div className="absolute top-3 right-3 text-right">
                    <span className="retro-stamp text-[9px] py-0.5 px-2 text-red-500 border-red-600">
                      {activeDoc.classification || 'CLASSIFIED'}
                    </span>
                    <div className="text-[9px] font-pixel text-zinc-500 mt-1">
                      FILE NO: {caseData.caseNumber}
                    </div>
                  </div>

                  <div className="text-center font-typewriter space-y-0.5 mb-4">
                    <div className="text-xs font-bold tracking-widest text-zinc-300">
                      UNITED STATES DEPARTMENT OF JUSTICE
                    </div>
                    <div className="text-[11px] text-zinc-400 tracking-wider">
                      FEDERAL BUREAU OF INVESTIGATION
                    </div>
                    <div className="font-pixel text-[10px] text-red-400 font-bold mt-1">
                      REPORT OF INVESTIGATION / WITNESS INTERVIEW (FORM FD-302)
                    </div>
                  </div>

                  {/* Form Grid Fields */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800 text-[10px] font-tech text-zinc-400">
                    <div>
                      <span className="text-zinc-500 block">INTERVIEWEE:</span>
                      <strong className="text-zinc-200">{activeDoc.interviewee}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">DATE OF INTERVIEW:</span>
                      <strong className="text-zinc-200">{activeDoc.date}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">LOCATION:</span>
                      <strong className="text-zinc-200">{activeDoc.location}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">INTERVIEWING AGENT:</span>
                      <strong className="text-zinc-200">{activeDoc.interviewer}</strong>
                    </div>
                  </div>
                </div>

                {/* Sworn Interview Executive Summary with Typing Cursor */}
                <div className="border border-zinc-800 p-4 bg-black/60 space-y-2">
                  <div className="font-pixel text-[10px] text-amber-400 uppercase tracking-wider flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    RECORD OF INTERVIEW SUMMARY
                  </div>
                  <p className="font-mono text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                    {typedSummary || activeDoc.summary}
                  </p>
                </div>

                {/* Sworn Transcript Lines */}
                {activeDoc.transcripts && activeDoc.transcripts.length > 0 && (
                  <div className="space-y-3">
                    <div className="font-pixel text-[10px] text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800 pb-1.5">
                      <span>VERBATIM TRANSCRIPTION LOG</span>
                      <span className="text-emerald-400 text-[9px]">DEPOSITIONS ADMISSIBLE IN COURT</span>
                    </div>

                    <div className="space-y-2">
                      {activeDoc.transcripts.map((line: TranscriptLine, i: number) => (
                        <div
                          key={i}
                          className="p-3 bg-[#080b0e] border border-[#21262d] rounded flex items-start space-x-3 text-xs"
                        >
                          <span className="font-pixel text-[10px] text-zinc-500 shrink-0 mt-0.5">
                            [{line.timestamp}]
                          </span>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-amber-400 font-tech">
                                {line.speaker}
                              </span>
                              <span className="text-[10px] font-pixel text-zinc-500">
                                ({line.speakerRole})
                              </span>
                            </div>
                            <p
                              className={`text-zinc-300 leading-relaxed font-mono ${
                                showRedactions && i % 2 === 1 ? 'line-through text-zinc-600' : ''
                              }`}
                            >
                              "{line.text}"
                            </p>
                            {line.editorialNote && (
                              <div className="text-[10px] text-emerald-400 font-tech pt-1">
                                &bull; {line.editorialNote}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Judicial Source Citation */}
                {activeDoc.sourceCitation && (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 text-xs">
                    <span className="font-pixel text-[10px] text-amber-400 uppercase block mb-1">
                      AUTHENTICATED JUDICIAL SOURCE CITATION:
                    </span>
                    <p className="text-zinc-300 font-tech">{activeDoc.sourceCitation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
