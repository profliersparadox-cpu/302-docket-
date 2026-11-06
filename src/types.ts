export type CrimeCategory =
  | 'Special Victims / Sexual Offences'
  | 'Crimes Against Children'
  | 'Homicide'
  | 'Missing Persons'
  | 'Kidnapping'
  | 'Organised Crime'
  | 'Other Investigations';

export type CaseStatus =
  | 'Convicted'
  | 'Solved'
  | 'Cold Case / Unresolved'
  | 'Trial / Pending Appeal'
  | 'Active Investigation';

export interface TimelineEvent {
  id?: string;
  date: string;
  title: string;
  description: string;
  source?: string;
  tag?: string;
}

export interface EvidenceItem {
  id: string;
  exhibitNumber: string;
  title: string;
  type: 'document' | 'forensic' | 'audio' | 'physical' | 'testimony' | 'digital';
  description: string;
  significance: string;
  recoveredAt?: string;
  recoveredBy?: string;
  classification: 'Declassified' | 'Confidential' | 'Grand Jury Exhibit' | 'Public Record' | 'FD-302 Record';
  imageUrl?: string;
  redactedSnippet?: string;
}

export interface PersonOfInterest {
  id: string;
  name: string;
  alias?: string;
  role: string;
  status:
    | 'Convicted'
    | 'Allegations / Charged'
    | 'Indicted'
    | 'Material Witness'
    | 'Exonerated'
    | 'Deceased'
    | 'Uncharged Suspect';
  background: string;
  verifiedFindings: string;
  allegations: string;
  outcome: string;
  imageUrl?: string;
}

export interface KeyTestimony {
  witness: string;
  role: string;
  keyPoints: string;
}

export interface CourtroomData {
  court: string;
  presidingJudge: string;
  charges: string[];
  prosecutionArgument: string;
  defenseArgument: string;
  keyTestimonies: KeyTestimony[];
  trialTimeline: TimelineEvent[];
}

export interface VerdictData {
  verdictDate: string;
  pleaOrVerdict: string;
  sentencing: string;
  appealsAndRulings: string;
  unresolvedLegalQuestions?: string;
}

export interface AftermathData {
  legalReforms: string[];
  institutionalImpact: string;
  victimAdvocacy: string;
  currentStatus: string;
}

export interface ReflectionPrompt {
  question: string;
  context: string;
  legalOrEthicalIssue: string;
}

export interface Citation {
  title: string;
  source: string;
  url?: string;
  date?: string;
}

export interface CaseFile {
  id: string;
  slug: string;
  caseNumber: string; // e.g. "FD-302-MI-84920"
  title: string;
  subtitle: string;
  category: CrimeCategory;
  location: string;
  year: number;
  status: CaseStatus;
  isPublished: boolean;
  isFeatured: boolean;
  contentWarnings: string[];
  summary: string;
  bannerImageUrl?: string;

  // Chapter 1: Case Overview
  overview: {
    background: string;
    victimInfo: string;
    jurisdiction: string;
    initialAlertDate: string;
  };

  // Chapter 2: The Incident
  incident: {
    narrative: string;
    timeline: TimelineEvent[];
  };

  // Chapter 3: The Investigation
  investigation: {
    narrative: string;
    procedureNotes: string;
    interviewRecordsSummary: string;
    timeline: TimelineEvent[];
  };

  // Chapter 4: Evidence Archive
  evidence: EvidenceItem[];

  // Chapter 5: Persons of Interest
  personsOfInterest: PersonOfInterest[];

  // Chapter 6: The Breakthrough
  breakthrough: {
    narrative: string;
    turningPoints: { date: string; title: string; detail: string; description?: string }[];
  };

  // Chapter 7: The Courtroom
  courtroom: CourtroomData;

  // Chapter 8: The Verdict
  verdict: VerdictData;

  // Chapter 9: Aftermath
  aftermath: AftermathData;

  // Interactivity & Immersive Experiences
  reflectionPrompts: ReflectionPrompt[];
  citations: Citation[];
  relatedCaseIds?: string[];
  interviews?: InterviewRecord[];
  documents?: ArchiveDocument[];
  exercises?: InvestigativeExercise[];
  evidenceConnections?: EvidenceConnection[];
  geoPoints?: GeoLocationPoint[];
  mediaItems?: CaseMediaItem[];

  createdAt: string;
  updatedAt: string;
}

export interface ArchiveStats {
  totalCases: number;
  activeDossiers: number;
  exhibitsLogged: number;
  decadesCovered: number;
  jurisdictionsCount: number;
  categoriesBreakdown: Record<string, number>;
}

export interface ArchiveSettings {
  archiveTitle: string;
  tagline: string;
  disclaimer: string;
  introHeading: string;
  introBody: string;
  featuredNotice?: string;
  statsOverride?: Partial<ArchiveStats>;
}

export interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface CaseMediaItem {
  id: string;
  title: string;
  mediaType: 'audio' | 'recording' | 'image' | 'video' | 'wiretap';
  url: string;
  description: string;
  source: string;
  recoveredAt?: string;
  duration?: string;
  classification?: string;
}

export interface TranscriptLine {
  timestamp: string;
  speaker: string;
  speakerRole: string;
  text: string;
  isDirectQuote: boolean;
  editorialNote?: string;
}

export interface InterviewRecord {
  id: string;
  caseSlug: string;
  caseNumber: string;
  title: string;
  interviewee: string;
  interviewer: string;
  date: string;
  location: string;
  recordingMedium: 'Magnetic Reel Audio' | 'Standard Cassette Tape' | 'Stenographic Deposition' | 'Police Bodycam Audio/Video' | 'Stenographic Grand Jury';
  classification: 'Declassified FD-302' | 'Public Inquest' | 'Judicial Deposition' | 'Official Police Statement';
  summary: string;
  transcripts: TranscriptLine[];
  sourceCitation: string;
}

export interface ArchiveDocument {
  id: string;
  caseSlug: string;
  caseNumber: string;
  title: string;
  category: 'Court Records' | 'FD-302 Reports' | 'Coroner Autopsies' | 'Forensic Reports' | 'Federal Indictments';
  date: string;
  classification: 'Official Court Record' | 'Grand Jury True Bill' | 'Coroner Autopsy Report' | 'DOJ Investigative Summary';
  authorOrAgency: string;
  pageCount: number;
  summary: string;
  documentBody: string;
  redactions: {
    id: string;
    label: string;
    redactedText: string;
    reason: string;
  }[];
  officialCitation: string;
  downloadUrl?: string;
}

export interface GeoLocationPoint {
  id: string;
  caseSlug: string;
  caseNumber: string;
  title: string;
  locationName: string;
  region: string;
  coordinates: {
    x: number; // percentage on retro map (0-100)
    y: number; // percentage on retro map (0-100)
  };
  dateRelevance: string;
  pointType: 'Incident Location' | 'Discovery Site' | 'Law Enforcement Command' | 'Suspect Base' | 'Judicial Venue';
  summary: string;
  verifiedSource: string;
  timelineOrder: number;
}

export interface InvestigativeExerciseOption {
  id: string;
  label: string;
  actionText: string;
  reasoning: string;
  isRecommended: boolean;
  investigativePrinciple: string;
}

export interface InvestigativeExercise {
  id: string;
  code: string;
  title: string;
  difficulty: 'Entry Analyst' | 'Senior Special Agent' | 'Forensic Specialist';
  briefing: string;
  scenarioDescription: string;
  availableEvidence: string[];
  questionPrompt: string;
  options: InvestigativeExerciseOption[];
  debriefingAnalysis: string;
  ethicalGuidance: string;
}

export interface ArchiveStamp {
  id: string;
  code: string;
  title: string;
  category: 'Investigation' | 'Forensics' | 'Terminal Mastery' | 'Secret Dossier';
  rarity: 'Standard' | 'Classified' | 'Top Secret';
  description: string;
  howToUnlock: string;
  unlockedAt?: string;
  iconName: string;
}

export interface EvidenceBoardItem {
  id: string;
  title: string;
  itemType: 'document' | 'forensic' | 'suspect' | 'statement' | 'physical';
  status: 'Established Fact' | 'Documented Allegation' | 'Forensic Theory';
  x: number;
  y: number;
  snippet: string;
  source: string;
  date?: string;
  caseSlug: string;
  caseNumber: string;
  tags: string[];
}

export interface EvidenceConnection {
  fromId: string;
  toId: string;
  label: string;
  type: 'forensic_link' | 'timeline_sequence' | 'jurisdiction_link' | 'contradiction';
}
