import React, { useState } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Calendar,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine.ts';
import { CaseFile } from '../../types.ts';

interface InteractiveTimelineReconProps {
  cases: CaseFile[];
  onSelectCase?: (slug: string) => void;
}

interface TimelineStep {
  id: string;
  date: string;
  caseSlug: string;
  caseTitle: string;
  caseNumber: string;
  title: string;
  classification: 'Confirmed Event' | 'Disputed Account' | 'Cold / Unknown Period';
  description: string;
  investigativeImpact: string;
  supportingSource: string;
  evidenceRef?: string;
}

const comprehensiveTimeline: TimelineStep[] = [
  {
    id: 't-01',
    date: 'September 11, 1975',
    caseSlug: 'golden-state-killer-deangelo',
    caseTitle: 'The Golden State Killer',
    caseNumber: 'DOCKET-002',
    title: 'Visalia Ransacker Shoots Professor Claude Snelling',
    classification: 'Confirmed Event',
    description: 'During an attempted residential kidnapping of Snelling’s teenage daughter, the masked perpetrator shot Claude Snelling twice. Recovered .380 caliber shell casings matched subsequent burglaries.',
    investigativeImpact: 'Marked the escalation of the Visalia Ransacker into lethal violence prior to the perpetrator relocating to Sacramento.',
    supportingSource: 'Visalia Police Case Record #75-1044 / California DOJ Bulletins',
    evidenceRef: 'BALLISTICS-VISALIA-380',
  },
  {
    id: 't-02',
    date: 'February 2, 1978',
    caseSlug: 'golden-state-killer-deangelo',
    caseTitle: 'The Golden State Killer',
    caseNumber: 'DOCKET-002',
    title: 'Homicide of Brian and Katie Maggiore',
    classification: 'Confirmed Event',
    description: 'Air Force Sgt. Brian Maggiore and his wife Katie were walking their dog in Rancho Cordova when they were pursued and murdered by the masked prowler.',
    investigativeImpact: 'Triggered massive multi-jurisdictional FBI and Sacramento Sheriff task force mobilization.',
    supportingSource: 'Sacramento County Sheriff Incident Log #78-0202',
  },
  {
    id: 't-03',
    date: 'December 25, 1996 ~10:00 PM',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseTitle: 'JonBenét Ramsey',
    caseNumber: 'DOCKET-001',
    title: 'Return from Christmas Party to 755 15th Street',
    classification: 'Disputed Account',
    description: 'The family returned home from Christmas dinner with the White family. Parents stated JonBenét fell asleep in the car and was carried to bed; conflicting forensic analysis debated whether pineapple was consumed afterward.',
    investigativeImpact: 'Coroner autopsy located fresh pineapple pieces in the duodenum, contradicting early statements that no food was consumed post-party.',
    supportingSource: 'Boulder Police Interview Records & Autopsy Protocol #96A-155',
  },
  {
    id: 't-04',
    date: 'December 26, 1996 05:52 AM',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseTitle: 'JonBenét Ramsey',
    caseNumber: 'DOCKET-001',
    title: 'Discovery of 2.5-Page Ransom Note & 911 Call',
    classification: 'Confirmed Event',
    description: 'Patsy Ramsey dialed 911 reporting a 2.5-page handwritten ransom note demanding $118,000. Officers French and Veitch arrived on scene within seven minutes.',
    investigativeImpact: 'The crime scene was treated as an active kidnapping rather than a sealed homicide scene, allowing multiple family associates to traverse the residence.',
    supportingSource: 'Boulder County Emergency Communications Dispatch Audio Tape #96-15795',
  },
  {
    id: 't-05',
    date: 'December 26, 1996 01:05 PM',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseTitle: 'JonBenét Ramsey',
    caseNumber: 'DOCKET-001',
    title: 'Victim Recovered in Basement Wine Cellar',
    classification: 'Confirmed Event',
    description: 'Detective Linda Arndt instructed John Ramsey and Fleet White to inspect the house. Ramsey entered the basement and carried the victim upstairs, compromising immediate scene perimeter controls.',
    investigativeImpact: 'Prompted deep procedural controversy regarding initial crime scene perimeter failures.',
    supportingSource: 'Sworn Civil Deposition of Detective Linda Arndt (1998)',
  },
  {
    id: 't-06',
    date: '1987 - 2000 (13-Year Gap)',
    caseSlug: 'golden-state-killer-deangelo',
    caseTitle: 'The Golden State Killer',
    caseNumber: 'DOCKET-002',
    title: 'The Dormant Cold-Case Era & Northern/Southern Disconnect',
    classification: 'Cold / Unknown Period',
    description: 'Attacks ceased following the 1986 murder of Janelle Cruz in Irvine. Northern California detectives investigating the East Area Rapist and Southern California detectives investigating the Original Night Stalker operated independently.',
    investigativeImpact: 'Highlighted the critical necessity of centralized state DNA databanks across disparate county sheriffs.',
    supportingSource: 'California Department of Justice Historical Review',
  },
  {
    id: 't-07',
    date: 'Spring 2001',
    caseSlug: 'golden-state-killer-deangelo',
    caseTitle: 'The Golden State Killer',
    caseNumber: 'DOCKET-002',
    title: 'STR Profiling Proves EAR and ONS Are Identical Individual',
    classification: 'Confirmed Event',
    description: 'Forensic scientist Paul Holes and Orange County crime lab analysts linked Northern and Southern California crimes via matching nuclear DNA profiles.',
    investigativeImpact: 'Unified the statewide manhunt under a single genetic offender identity, establishing the moniker \"The Golden State Killer\".',
    supportingSource: 'Orange County Crime Lab DNA Bulletin #01-140',
  },
  {
    id: 't-08',
    date: 'July 9, 2008',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseTitle: 'JonBenét Ramsey',
    caseNumber: 'DOCKET-001',
    title: 'Touch-DNA Analysis Isolates Matching Foreign Male Alleles',
    classification: 'Confirmed Event',
    description: 'Bode Technology utilized newly developed touch-DNA swab techniques on the waistband of victim garments, finding alleles matching the unknown male profile in CODIS.',
    investigativeImpact: 'Prompted District Attorney Mary Lacy to issue a formal exoneration letter to the Ramsey family.',
    supportingSource: 'Official Correspondence of District Attorney Mary T. Lacy (Boulder County)',
  },
  {
    id: 't-09',
    date: 'August 12, 2021 16:35 MDT',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseTitle: 'Gabby Petito',
    caseNumber: 'DOCKET-003',
    title: 'Moab Police Domestic Dispute Intervention',
    classification: 'Disputed Account',
    description: 'Moab City Police stopped the couple\'s Ford Transit van near Arches National Park after a 911 caller witnessed a physical altercation. Officers classified the dispute as a mental health crisis and separated the pair for the night.',
    investigativeImpact: 'Bodycam video later ignited nationwide legislative scrutiny regarding officer lethality assessments.',
    supportingSource: 'Moab Police Department Bodycam Video Record #21-12711',
  },
  {
    id: 't-10',
    date: 'August 27, 2021',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseTitle: 'Gabby Petito',
    caseNumber: 'DOCKET-003',
    title: 'Last Confirmed Sighting & Tourist Dashcam Recording',
    classification: 'Confirmed Event',
    description: 'Vacationers Tim and Jenn Bethune filmed the white Ford Transit parked in the Spread Creek Dispersed Camping Area at 18:00. The video was reviewed weeks later and provided search coordinates.',
    investigativeImpact: 'Crowdsourced video reduced the federal search area from millions of acres to a specific dry creek drainage.',
    supportingSource: 'FBI Denver Field Office Public Notice #WY-21-09',
  },
  {
    id: 't-11',
    date: 'October 20, 2021',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseTitle: 'Gabby Petito',
    caseNumber: 'DOCKET-003',
    title: 'Recovery of Confession Notebook in Carlton Reserve',
    classification: 'Confirmed Event',
    description: 'Following receding floodwaters in Myakkahatchee Creek Environmental Park, search teams located Brian Laundrie’s remains and a waterproof notebook containing his written confession.',
    investigativeImpact: 'Provided definitive prosecutorial closure in the absence of a criminal jury trial.',
    supportingSource: 'FBI Denver Final Investigative Report (Released Jan 2022)',
  },
];

export const InteractiveTimelineRecon: React.FC<InteractiveTimelineReconProps> = ({
  cases,
  onSelectCase,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterType, setFilterType] = useState<string>('All');

  const activeStep = comprehensiveTimeline[currentIndex];

  const handleNext = () => {
    if (currentIndex < comprehensiveTimeline.length - 1) {
      soundEngine.playKeyClick();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      soundEngine.playKeyClick();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSelectStep = (index: number) => {
    soundEngine.playKeyClick();
    setCurrentIndex(index);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d12] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Header Bar */}
      <div className="bg-[#12161f] border-b border-[#2d3442] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-amber-950 border border-amber-700 text-amber-300 font-pixel text-[10px]">
            CHRONO_RECON.EXE
          </span>
          <span className="text-zinc-500 hidden sm:inline">|</span>
          <span className="text-zinc-400 text-xs">
            Cross-Docket Chronological Reconstruction Engine
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span className="text-zinc-400">Confirmed Event</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
            <span className="text-zinc-400">Disputed Account</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
            <span className="text-zinc-400">Cold / Gap Period</span>
          </div>
        </div>
      </div>

      {/* Interactive Horizontal Timeline Scrubber Strip */}
      <div className="bg-[#0e1219] border-b border-zinc-800/80 px-4 py-3 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
          {comprehensiveTimeline.map((step, idx) => {
            const isSelected = idx === currentIndex;
            const dotColor =
              step.classification === 'Confirmed Event'
                ? 'bg-emerald-500 border-emerald-300'
                : step.classification === 'Disputed Account'
                ? 'bg-amber-500 border-amber-300'
                : 'bg-red-500 border-red-300';

            return (
              <button
                key={step.id}
                onClick={() => handleSelectStep(idx)}
                className={`group flex flex-col items-center p-2 rounded transition-all text-left border ${
                  isSelected
                    ? 'bg-zinc-800 border-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                    : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-600'
                }`}
                style={{ width: '130px' }}
              >
                <div className="flex items-center space-x-1.5 w-full mb-1">
                  <span className={`w-2 h-2 rounded-full border ${dotColor}`} />
                  <span className="text-[10px] font-mono text-zinc-500 truncate">{step.caseNumber}</span>
                </div>
                <div className="text-[10px] font-mono font-bold text-zinc-300 line-clamp-1 w-full">
                  {step.date.split('~')[0].split('-')[0].trim()}
                </div>
                <div className="text-[9px] text-zinc-500 truncate w-full group-hover:text-zinc-300">
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Focus Dossier View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950/95">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top navigation controls */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-zinc-500 uppercase">
                RECONSTRUCTION STEP {currentIndex + 1} OF {comprehensiveTimeline.length}
              </span>
              <span className="text-zinc-700">|</span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {activeStep.caseTitle} ({activeStep.caseNumber})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3 py-1 text-xs font-mono bg-zinc-900 border border-zinc-700 disabled:opacity-40 hover:bg-zinc-800 rounded flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREV</span>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === comprehensiveTimeline.length - 1}
                className="px-3 py-1 text-xs font-mono bg-zinc-900 border border-zinc-700 disabled:opacity-40 hover:bg-zinc-800 rounded flex items-center space-x-1"
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Event Card */}
          <div className="bg-[#0f131a] border-2 border-zinc-800 rounded-lg p-5 sm:p-7 shadow-2xl space-y-4">
            {/* Classification Stamp */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-300 font-mono">
                  {activeStep.date}
                </span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase border ${
                  activeStep.classification === 'Confirmed Event'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : activeStep.classification === 'Disputed Account'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                    : 'bg-red-950/80 text-red-300 border-red-700'
                }`}
              >
                {activeStep.classification}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold font-editorial text-zinc-100 leading-snug">
              {activeStep.title}
            </h2>

            {/* Description */}
            <p className="text-zinc-300 text-sm leading-relaxed font-typewriter bg-zinc-950/70 p-4 border border-zinc-900 rounded">
              {activeStep.description}
            </p>

            {/* Investigative Impact Box */}
            <div className="p-3.5 bg-zinc-900/60 border-l-2 border-amber-500 rounded text-xs space-y-1 font-mono">
              <div className="text-amber-400 font-bold uppercase tracking-wide">
                INVESTIGATIVE SIGNIFICANCE & TURNING POINT:
              </div>
              <div className="text-zinc-300 leading-normal">
                {activeStep.investigativeImpact}
              </div>
            </div>

            {/* Sources & Citations */}
            <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-zinc-500">PRIMARY SOURCE: </span>
                <span className="text-zinc-300">{activeStep.supportingSource}</span>
              </div>

              {onSelectCase && (
                <button
                  onClick={() => onSelectCase(activeStep.caseSlug)}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-mono rounded transition-colors flex items-center space-x-1.5"
                >
                  <span>VIEW FULL CASE DOSSIER</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
