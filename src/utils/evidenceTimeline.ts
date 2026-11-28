import { CaseFile, EvidenceItem, MediaItem, PersonOfInterest } from '../types.ts';
import { getEvidenceImage } from '../data/exhibitImages.ts';

export interface ScrubberChronoNode {
  id: string;
  sortTimestamp: number;
  displayDate: string;
  yearLabel: string;
  kind: 'evidence' | 'reanalysis' | 'incident' | 'investigation' | 'breakthrough' | 'courtroom' | 'verdict' | 'uploaded';
  phaseLabel: string;
  exhibitNumber?: string;
  title: string;
  surfaceSummary: string;
  classification: string;
  custodian: string;
  imageUrl?: string;
  imageCaption?: string;
  hiddenDetails: {
    forensicSignificance: string;
    sealedSnippet?: string;
    linkedSubjects: { name: string; status: string; finding: string }[];
    legalAndProceduralNote: string;
    anomalyOrBreakthrough: string;
  };
  sourceEvidenceId?: string;
}

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
  spring: 3,
  summer: 6,
  fall: 9,
  autumn: 9,
  winter: 0,
};

/**
 * Parses natural-language forensic date strings into sortable millisecond timestamps.
 */
export function parseChronoTimestamp(raw: string | undefined, fallbackYear: number): number {
  if (!raw || !raw.trim()) {
    return Date.UTC(fallbackYear, 0, 1);
  }

  const text = raw.trim();

  // ISO format YYYY-MM-DD
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  // Extract 4-digit year
  const yearMatch = text.match(/\b(18|19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : fallbackYear;

  // Extract month name
  let month = 0;
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(MONTH_MAP)) {
    if (new RegExp(`\\b${key}\\b`).test(lower)) {
      month = val;
      break;
    }
  }

  // Extract day of month if present (1-31) after month name or before comma
  let day = 1;
  const dayAfterMonth = lower.match(/(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\b/);
  if (dayAfterMonth) {
    day = Math.min(28, Math.max(1, Number(dayAfterMonth[1])));
  }

  // Extract time (e.g. 06:00 AM / 10:00 PM)
  let hours = 0;
  let mins = 0;
  const timeMatch = lower.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (timeMatch) {
    hours = Number(timeMatch[1]);
    mins = Number(timeMatch[2]);
    if (timeMatch[3] === 'pm' && hours < 12) hours += 12;
    if (timeMatch[3] === 'am' && hours === 12) hours = 0;
  }

  return Date.UTC(year, month, day, hours, mins);
}

function matchLinkedSubjects(text: string, pois: PersonOfInterest[]): { name: string; status: string; finding: string }[] {
  const lower = text.toLowerCase();
  const matched = pois.filter((p) => {
    const tokens = p.name
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3 && t !== 'unknown' && t !== 'male' && t !== 'subject');
    return tokens.some((tok) => lower.includes(tok));
  });

  const pool = matched.length > 0 ? matched : pois.slice(0, 1);
  return pool.slice(0, 2).map((p) => ({
    name: p.name,
    status: p.status,
    finding: p.verifiedFindings || p.outcome || p.background,
  }));
}

/**
 * Builds an evidence-anchored chronological timeline for a CaseFile,
 * expanding compound evidence recovery/re-analysis dates (e.g. "1997 & 2008",
 * "March 1980 / Re-analyzed 2018") and integrating surrounding case milestones.
 */
export function buildEvidenceChronoTimeline(
  caseData: CaseFile,
  uploadedMedia: MediaItem[] = []
): ScrubberChronoNode[] {
  const nodes: ScrubberChronoNode[] = [];
  const fallbackYear = caseData.year || 1990;

  // 1. Primary Evidence Items (anchored by recoveredAt dates)
  caseData.evidence.forEach((ev: EvidenceItem, idx: number) => {
    const rawDate = ev.recoveredAt || `${fallbackYear}`;
    const segments = rawDate
      .split(/\s*(?:\/|&)\s*/)
      .map((s) => s.trim())
      .filter(Boolean);

    const primarySegment = segments[0] || rawDate;
    const primaryTs = parseChronoTimestamp(primarySegment, fallbackYear);
    const imgInfo = getEvidenceImage(ev);
    const combinedText = `${ev.title} ${ev.description} ${ev.significance}`;
    const linkedSubjects = matchLinkedSubjects(combinedText, caseData.personsOfInterest || []);

    const isConfidential = ev.classification === 'Confidential' || ev.classification === 'Grand Jury Exhibit';

    nodes.push({
      id: `chrono-ev-${ev.id || idx}`,
      sortTimestamp: primaryTs,
      displayDate: primarySegment,
      yearLabel: String(new Date(primaryTs).getUTCFullYear()),
      kind: 'evidence',
      phaseLabel: `EXHIBIT ${ev.exhibitNumber || `EX-${idx + 1}`}`,
      exhibitNumber: ev.exhibitNumber,
      title: ev.title,
      surfaceSummary: ev.description,
      classification: ev.classification,
      custodian: ev.recoveredBy || 'Forensic Evidence Custodian',
      imageUrl: imgInfo.url,
      imageCaption: imgInfo.caption,
      sourceEvidenceId: ev.id,
      hiddenDetails: {
        forensicSignificance: ev.significance,
        sealedSnippet:
          ev.redactedSnippet ||
          (isConfidential
            ? `Sealed Chain-of-Custody Note (${ev.exhibitNumber}): Logged under ${ev.classification} rules with custody verification by ${ev.recoveredBy || 'Lead Agency'}.`
            : undefined),
        linkedSubjects,
        legalAndProceduralNote:
          caseData.verdict?.unresolvedLegalQuestions ||
          caseData.investigation?.procedureNotes ||
          `Admissibility governed by applicable rules of evidence under ${caseData.overview.jurisdiction}.`,
        anomalyOrBreakthrough:
          segments.length > 1
            ? `Later forensic/legal development recorded at "${segments[1]}" — advance timeline scrubber to trace follow-up action.`
            : caseData.breakthrough?.narrative?.slice(0, 220) + (caseData.breakthrough?.narrative?.length > 220 ? '...' : ''),
      },
    });

    // If evidence item has a second distinct dated milestone (e.g. "2008", "Re-analyzed 2018", "Released September 2021")
    if (segments.length > 1) {
      const secondarySegment = segments[1];
      const secondaryTs = parseChronoTimestamp(secondarySegment, fallbackYear);
      if (Math.abs(secondaryTs - primaryTs) > 86400000 * 14) {
        nodes.push({
          id: `chrono-ev-re-${ev.id || idx}`,
          sortTimestamp: secondaryTs,
          displayDate: secondarySegment,
          yearLabel: String(new Date(secondaryTs).getUTCFullYear()),
          kind: 'reanalysis',
          phaseLabel: `RE-EXAMINATION · ${ev.exhibitNumber || `EX-${idx + 1}`}`,
          exhibitNumber: ev.exhibitNumber,
          title: `Follow-Up Forensic / Judicial Action: ${ev.title}`,
          surfaceSummary: `Subsequent re-examination or formal release of ${ev.exhibitNumber || 'Exhibit'} (${secondarySegment}), originally recovered ${primarySegment}.`,
          classification: ev.classification,
          custodian: ev.recoveredBy || 'Forensic Review Unit',
          imageUrl: imgInfo.url,
          imageCaption: imgInfo.caption,
          sourceEvidenceId: ev.id,
          hiddenDetails: {
            forensicSignificance: ev.significance,
            sealedSnippet:
              ev.redactedSnippet ||
              `Longitudinal Comparison: Linking original collection (${primarySegment}) with follow-up analysis (${secondarySegment}).`,
            linkedSubjects,
            legalAndProceduralNote:
              caseData.verdict?.appealsAndRulings ||
              caseData.verdict?.unresolvedLegalQuestions ||
              caseData.investigation?.procedureNotes,
            anomalyOrBreakthrough:
              caseData.breakthrough?.turningPoints?.[0]?.detail ||
              caseData.breakthrough?.narrative ||
              'Follow-up laboratory analysis altered the evidentiary posture of the docket.',
          },
        });
      }
    }
  });

  // 2. Uploaded User Media Exhibits with Case Dates
  uploadedMedia.forEach((m, idx) => {
    const dateLabel = m.uploadedAt ? m.uploadedAt.split('T')[0] : `${fallbackYear}`;
    const ts = parseChronoTimestamp(dateLabel, fallbackYear);
    nodes.push({
      id: `chrono-upl-${m.id}`,
      sortTimestamp: ts,
      displayDate: dateLabel,
      yearLabel: String(new Date(ts).getUTCFullYear()),
      kind: 'uploaded',
      phaseLabel: `VAULT UPLOAD · #${idx + 1}`,
      exhibitNumber: `UPL-${idx + 1}`,
      title: m.title || m.originalName,
      surfaceSummary: m.description || `Investigator-uploaded digital exhibit (${m.originalName}).`,
      classification: 'Investigator Attachment',
      custodian: 'Archive Media Vault',
      imageUrl: m.mimeType?.startsWith('image/') ? m.url : undefined,
      imageCaption: m.originalName,
      hiddenDetails: {
        forensicSignificance: m.transcript
          ? `Transcript Extract: "${m.transcript.slice(0, 260)}${m.transcript.length > 260 ? '...' : ''}"`
          : `Digital asset stored in Media Vault (${Math.round(m.size / 1024)} KB, ${m.mimeType}).`,
        linkedSubjects: matchLinkedSubjects(`${m.title || ''} ${m.description || ''}`, caseData.personsOfInterest || []),
        legalAndProceduralNote: `Logged to ${caseData.caseNumber} supplemental docket repository.`,
        anomalyOrBreakthrough: 'Available inside Evidence Room, Document Vault, and Evidence Pinboard.',
      },
    });
  });

  // 3. Incident Milestones
  caseData.incident?.timeline?.forEach((ev, idx) => {
    const ts = parseChronoTimestamp(ev.date, fallbackYear);
    nodes.push({
      id: `chrono-inc-${idx}`,
      sortTimestamp: ts,
      displayDate: ev.date,
      yearLabel: String(new Date(ts).getUTCFullYear()),
      kind: 'incident',
      phaseLabel: 'INCIDENT LOG',
      title: ev.title,
      surfaceSummary: `Logged event at ${ev.date} (${ev.source || 'Primary Incident Record'}). Scrub or unseal to inspect full evidentiary account.`,
      classification: 'Chronological Event',
      custodian: ev.source || caseData.overview.jurisdiction,
      hiddenDetails: {
        forensicSignificance: ev.description,
        linkedSubjects: matchLinkedSubjects(`${ev.title} ${ev.description}`, caseData.personsOfInterest || []),
        legalAndProceduralNote: caseData.investigation?.interviewRecordsSummary || caseData.overview.background,
        anomalyOrBreakthrough: caseData.incident?.narrative?.slice(0, 240) + '...',
      },
    });
  });

  // 4. Investigation Milestones
  caseData.investigation?.timeline?.forEach((ev, idx) => {
    const ts = parseChronoTimestamp(ev.date, fallbackYear);
    nodes.push({
      id: `chrono-inv-${idx}`,
      sortTimestamp: ts,
      displayDate: ev.date,
      yearLabel: String(new Date(ts).getUTCFullYear()),
      kind: 'investigation',
      phaseLabel: 'FIELD INQUIRY',
      title: ev.title,
      surfaceSummary: `Investigative milestone dated ${ev.date}. Inspect hidden record for procedural & agency details.`,
      classification: 'FD-302 Chronology',
      custodian: ev.source || 'Investigating Agency',
      hiddenDetails: {
        forensicSignificance: ev.description,
        linkedSubjects: matchLinkedSubjects(`${ev.title} ${ev.description}`, caseData.personsOfInterest || []),
        legalAndProceduralNote: caseData.investigation?.procedureNotes || 'Standard field investigative protocol.',
        anomalyOrBreakthrough: caseData.investigation?.interviewRecordsSummary,
      },
    });
  });

  // 5. Breakthrough Turning Points
  caseData.breakthrough?.turningPoints?.forEach((tp, idx) => {
    const ts = parseChronoTimestamp(tp.date, fallbackYear);
    const detailText = tp.detail || tp.description || '';
    nodes.push({
      id: `chrono-brk-${idx}`,
      sortTimestamp: ts,
      displayDate: tp.date,
      yearLabel: String(new Date(ts).getUTCFullYear()),
      kind: 'breakthrough',
      phaseLabel: 'BREAKTHROUGH',
      title: tp.title,
      surfaceSummary: `Pivotal investigative shift recorded ${tp.date}. Unseal to inspect forensic nexus.`,
      classification: 'Key Turning Point',
      custodian: 'Lead Investigative Task Force',
      hiddenDetails: {
        forensicSignificance: detailText,
        linkedSubjects: matchLinkedSubjects(`${tp.title} ${detailText}`, caseData.personsOfInterest || []),
        legalAndProceduralNote: caseData.breakthrough?.narrative,
        anomalyOrBreakthrough: caseData.courtroom?.prosecutionArgument || 'Catalyzed decisive evidentiary progression.',
      },
    });
  });

  // 6. Courtroom & Verdict Milestones
  caseData.courtroom?.trialTimeline?.forEach((ev, idx) => {
    const ts = parseChronoTimestamp(ev.date, fallbackYear);
    nodes.push({
      id: `chrono-crt-${idx}`,
      sortTimestamp: ts,
      displayDate: ev.date,
      yearLabel: String(new Date(ts).getUTCFullYear()),
      kind: 'courtroom',
      phaseLabel: 'JUDICIAL DOCKET',
      title: ev.title,
      surfaceSummary: `Judicial proceeding dated ${ev.date} in ${caseData.courtroom.court}.`,
      classification: 'Court Docket',
      custodian: caseData.courtroom.presidingJudge || caseData.courtroom.court,
      hiddenDetails: {
        forensicSignificance: ev.description,
        linkedSubjects: matchLinkedSubjects(`${ev.title} ${ev.description}`, caseData.personsOfInterest || []),
        legalAndProceduralNote: caseData.courtroom?.defenseArgument || caseData.verdict?.appealsAndRulings,
        anomalyOrBreakthrough: caseData.verdict?.pleaOrVerdict,
      },
    });
  });

  if (caseData.verdict?.verdictDate) {
    const ts = parseChronoTimestamp(caseData.verdict.verdictDate, fallbackYear);
    nodes.push({
      id: `chrono-verdict`,
      sortTimestamp: ts,
      displayDate: caseData.verdict.verdictDate,
      yearLabel: String(new Date(ts).getUTCFullYear()),
      kind: 'verdict',
      phaseLabel: 'FINAL DISPOSITION',
      title: caseData.verdict.pleaOrVerdict,
      surfaceSummary: `Formal disposition entered: ${caseData.verdict.verdictDate}. Declassify for appellate & unresolved questions.`,
      classification: 'Judicial Order',
      custodian: caseData.courtroom?.court || caseData.overview.jurisdiction,
      hiddenDetails: {
        forensicSignificance: `Sentencing / Outcome: ${caseData.verdict.sentencing}`,
        linkedSubjects: (caseData.personsOfInterest || []).slice(0, 2).map((p) => ({
          name: p.name,
          status: p.status,
          finding: p.outcome,
        })),
        legalAndProceduralNote: caseData.verdict.appealsAndRulings,
        anomalyOrBreakthrough:
          caseData.verdict.unresolvedLegalQuestions ||
          (caseData.aftermath?.legalReforms?.[0]
            ? `Institutional Reform: ${caseData.aftermath.legalReforms[0]}`
            : caseData.aftermath?.currentStatus),
      },
    });
  }

  // Deterministic sort: chronological timestamp, with evidence nodes prioritized first when dates tie
  const kindOrder: Record<ScrubberChronoNode['kind'], number> = {
    evidence: 0,
    reanalysis: 1,
    uploaded: 2,
    incident: 3,
    investigation: 4,
    breakthrough: 5,
    courtroom: 6,
    verdict: 7,
  };

  nodes.sort((a, b) => {
    if (a.sortTimestamp !== b.sortTimestamp) {
      return a.sortTimestamp - b.sortTimestamp;
    }
    return kindOrder[a.kind] - kindOrder[b.kind];
  });

  return nodes;
}
