import React, { useState } from 'react';
import {
  Users,
  Shield,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Search,
  Scale,
  Maximize2,
  X,
  User,
  Info,
} from 'lucide-react';
import { CaseFile, PersonOfInterest } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface CasePersonsOfInterestViewProps {
  caseData: CaseFile;
}

export const CasePersonsOfInterestView: React.FC<CasePersonsOfInterestViewProps> = ({ caseData }) => {
  const [selectedPerson, setSelectedPerson] = useState<PersonOfInterest | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'convicted' | 'suspects' | 'poi'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Classify each person into distinct legal groups
  const persons = caseData.personsOfInterest || [];

  const convictedIndividuals = persons.filter(
    (p) => p.status === 'Convicted' || p.outcome?.toLowerCase().includes('convicted') || p.outcome?.toLowerCase().includes('sentenced')
  );

  const suspects = persons.filter(
    (p) =>
      p.status === 'Indicted' ||
      p.status === 'Allegations / Charged' ||
      p.status === 'Uncharged Suspect' ||
      (!convictedIndividuals.includes(p) && (p.role.toLowerCase().includes('suspect') || p.role.toLowerCase().includes('defendant')))
  );

  const personsOfInterest = persons.filter(
    (p) => !convictedIndividuals.includes(p) && !suspects.includes(p)
  );

  const handleSelectPerson = (p: PersonOfInterest) => {
    soundEngine.playFileAccess();
    setSelectedPerson(p);
  };

  const getFilteredList = () => {
    let list = persons;
    if (categoryFilter === 'convicted') list = convictedIndividuals;
    if (categoryFilter === 'suspects') list = suspects;
    if (categoryFilter === 'poi') list = personsOfInterest;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.background.toLowerCase().includes(q) ||
          (p.verifiedFindings && p.verifiedFindings.toLowerCase().includes(q))
      );
    }
    return list;
  };

  const displayedPersons = getFilteredList();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="retro-window p-4 flex flex-wrap items-center justify-between gap-4 bg-[#080b0e]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-950/60 border border-red-800 text-red-400">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[10px] text-red-500 uppercase font-bold">
                SUBJECT & ACCUSED DOSSIERS
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1.5">
                {persons.length} PROFILES AUDITED
              </span>
            </div>
            <h3 className="text-base font-bold font-editorial text-zinc-100">
              Persons of Interest, Suspects & Convicted Perpetrators
            </h3>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search individual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/70 border border-zinc-800 text-xs font-tech text-zinc-200 pl-8 pr-3 py-1.5 rounded focus:border-red-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1 bg-black/60 border border-zinc-800 p-1 rounded text-xs font-mono">
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setCategoryFilter('all');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel ${
                categoryFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-100 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ALL ({persons.length})
            </button>
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setCategoryFilter('convicted');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border ${
                categoryFilter === 'convicted'
                  ? 'bg-red-950 text-red-300 border-red-700 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              CONVICTED ({convictedIndividuals.length})
            </button>
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setCategoryFilter('suspects');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border ${
                categoryFilter === 'suspects'
                  ? 'bg-amber-950 text-amber-300 border-amber-700 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              SUSPECTS ({suspects.length})
            </button>
            <button
              onClick={() => {
                soundEngine.playKeyClick();
                setCategoryFilter('poi');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-pixel border ${
                categoryFilter === 'poi'
                  ? 'bg-blue-950 text-blue-300 border-blue-700 font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              WITNESSES / POI ({personsOfInterest.length})
            </button>
          </div>
        </div>
      </div>

      {/* Legal Presumption & Distinction Notice */}
      <div className="p-3 bg-black/50 border border-zinc-800/80 text-xs font-tech text-zinc-400 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-zinc-200">PROSECUTORIAL BURDEN & CONSTITUTIONAL CLASSIFICATION:</strong>{' '}
          Individuals designated as <span className="text-red-400 font-bold">Convicted</span> were found guilty beyond a reasonable doubt in a court of law. Parties classified as <span className="text-amber-400 font-bold">Suspects</span> or <span className="text-blue-400 font-bold">Persons of Interest</span> are presumed innocent unless judicially convicted; their profiles reflect public investigatory records and documented allegations.
        </p>
      </div>

      {/* Grid of Subject Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedPersons.length === 0 ? (
          <div className="col-span-3 p-8 text-center retro-window text-zinc-500 font-tech text-xs">
            NO SUBJECT DOSSIERS MATCHING ACTIVE SELECTION.
          </div>
        ) : (
          displayedPersons.map((p) => {
            const isConvicted = convictedIndividuals.includes(p);
            const isSuspect = suspects.includes(p);

            return (
              <div
                key={p.id}
                onClick={() => handleSelectPerson(p)}
                className={`retro-window p-5 cursor-pointer transition-all flex flex-col justify-between group ${
                  isConvicted
                    ? 'border-red-900/80 bg-[#0c0809] hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : isSuspect
                    ? 'border-amber-900/80 bg-[#0c0a07] hover:border-amber-500'
                    : 'border-zinc-800 bg-[#080a0d] hover:border-blue-500'
                }`}
              >
                <div>
                  {/* Status Tag */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[9px] font-pixel px-2 py-0.5 rounded border uppercase font-bold ${
                        isConvicted
                          ? 'bg-red-950 text-red-300 border-red-700'
                          : isSuspect
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-blue-950 text-blue-300 border-blue-700'
                      }`}
                    >
                      {isConvicted ? 'CONVICTED PERPETRATOR' : isSuspect ? 'FORMAL SUSPECT' : 'PERSON OF INTEREST'}
                    </span>

                    {p.alias && (
                      <span className="text-[10px] font-tech text-zinc-500">
                        AKA: {p.alias}
                      </span>
                    )}
                  </div>

                  {/* Name and Role */}
                  <h4 className="text-base font-bold font-editorial text-zinc-100 group-hover:text-amber-200 transition-colors mb-0.5">
                    {p.name}
                  </h4>
                  <div className="text-xs font-tech text-amber-400 mb-3 font-semibold">
                    {p.role}
                  </div>

                  {/* Summary Snippet */}
                  <p className="text-xs text-zinc-300 font-tech leading-relaxed line-clamp-3 mb-3">
                    {p.background}
                  </p>

                  {/* Verified Findings Preview */}
                  {p.verifiedFindings && (
                    <div className="p-2.5 bg-black/60 border border-zinc-900 rounded text-[11px] font-mono text-zinc-400 mb-3">
                      <span className="text-emerald-400 font-pixel text-[9px] block mb-0.5">
                        DOCUMENTED FINDINGS:
                      </span>
                      <p className="line-clamp-2">{p.verifiedFindings}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Action & Outcome */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-tech">
                  <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                    {p.outcome || p.status}
                  </span>
                  <button className="text-amber-400 font-pixel text-[10px] flex items-center group-hover:translate-x-0.5 transition-transform">
                    EXAMINE DOSSIER <Maximize2 className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expanded Subject Dossier Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="retro-window max-w-2xl w-full p-6 text-zinc-300 space-y-4 shadow-2xl bg-[#080b0f] border-2 border-red-900/80 max-h-[90vh] overflow-y-auto">
            {/* Modal Titlebar */}
            <div className="retro-window-header active flex items-center justify-between p-2.5 bg-zinc-900 border-b border-zinc-700">
              <div className="flex items-center space-x-2 text-xs font-pixel text-zinc-200">
                <User className="w-4 h-4 text-red-500" />
                <span>SUBJECT DOSSIER // {selectedPerson.name.toUpperCase()}</span>
              </div>
              <button
                onClick={() => {
                  soundEngine.playKeyClick();
                  setSelectedPerson(null);
                }}
                className="retro-btn retro-btn-red text-xs px-2.5 py-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <span
                  className={`text-[9px] font-pixel px-2 py-0.5 rounded border uppercase font-bold inline-block mb-1.5 ${
                    selectedPerson.status === 'Convicted' || selectedPerson.outcome?.toLowerCase().includes('convicted')
                      ? 'bg-red-950 text-red-300 border-red-700'
                      : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}
                >
                  CLASSIFICATION: {selectedPerson.status}
                </span>
                <h3 className="text-xl font-bold font-editorial text-zinc-100">
                  {selectedPerson.name}
                </h3>
                <div className="text-xs font-tech text-amber-400">
                  Role: {selectedPerson.role} {selectedPerson.alias && `(AKA: ${selectedPerson.alias})`}
                </div>
              </div>

              <div className="text-right text-xs font-tech text-zinc-500">
                <div>CASE DOCKET: {caseData.caseNumber}</div>
                <div>JURISDICTION: {caseData.overview?.jurisdiction || caseData.location}</div>
              </div>
            </div>

            {/* Biographical & Investigative Story */}
            <div className="space-y-3 font-tech text-xs sm:text-sm">
              <div className="p-3.5 bg-black/60 border border-zinc-800 rounded space-y-1">
                <span className="font-pixel text-[10px] text-zinc-400 uppercase block">
                  Documented Background & Relationship to Casework
                </span>
                <p className="text-zinc-200 leading-relaxed font-mono text-xs">
                  {selectedPerson.background}
                </p>
              </div>

              {/* Verified Facts & Forensic Findings */}
              <div className="p-3.5 bg-[#0a0d10] border border-emerald-950/80 rounded space-y-1">
                <span className="font-pixel text-[10px] text-emerald-400 uppercase block">
                  Verified Forensic Findings & Admitted Records
                </span>
                <p className="text-zinc-200 leading-relaxed font-mono text-xs">
                  {selectedPerson.verifiedFindings || 'Substantiated in official court depositions.'}
                </p>
              </div>

              {/* Allegations vs Defenses */}
              {selectedPerson.allegations && (
                <div className="p-3.5 bg-[#0d0a0a] border border-amber-950/80 rounded space-y-1">
                  <span className="font-pixel text-[10px] text-amber-400 uppercase block">
                    Documented Allegations & Defense Arguments
                  </span>
                  <p className="text-zinc-300 leading-relaxed font-mono text-xs">
                    {selectedPerson.allegations}
                  </p>
                </div>
              )}

              {/* Documented Conviction / Outcome Story */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded space-y-1">
                <span className="font-pixel text-[10px] text-red-400 uppercase block font-bold">
                  Final Legal Adjudication & Documented Story
                </span>
                <p className="text-zinc-100 leading-relaxed font-mono text-xs">
                  {selectedPerson.outcome || 'Judicial proceeding records archived in public federal registry.'}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => {
                  soundEngine.playKeyClick();
                  setSelectedPerson(null);
                }}
                className="retro-btn text-xs px-4 py-1.5"
              >
                DISMISS PROFILE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
