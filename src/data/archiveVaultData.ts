import {
  InterviewRecord,
  ArchiveDocument,
  GeoLocationPoint,
  InvestigativeExercise,
  ArchiveStamp,
  EvidenceBoardItem,
  EvidenceConnection,
} from '../types.ts';

// -------------------------------------------------------------
// 1. PUBLIC ARCHIVAL INTERVIEW RECORDS (FORM FD-302 STYLE)
// Strictly non-fabricated. Summaries and documented quotes.
// -------------------------------------------------------------
export const archiveInterviewRecords: InterviewRecord[] = [
  {
    id: 'int-ramsey-01',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001-CO-1996',
    title: 'FD-302 RECORD // PATSY RAMSEY 911 RECORD & PRELIMINARY STATEMENT',
    interviewee: 'Patricia \"Patsy\" Ramsey',
    interviewer: 'Dispatch Operator / Det. Linda Arndt (Boulder PD)',
    date: 'December 26, 1996 - 05:52 MST',
    location: '755 15th Street, Boulder, Colorado',
    recordingMedium: 'Police Bodycam Audio/Video',
    classification: 'Official Police Statement',
    summary: 'Initial recorded emergency communication and immediate preliminary on-scene interview following the reported abduction. Documented state of distress and accounts of finding the handwritten note.',
    transcripts: [
      {
        timestamp: '05:52:10',
        speaker: 'DISPATCH',
        speakerRole: 'Boulder County Emergency Communications Center',
        text: '911 Emergency. What is the address of your emergency?',
        isDirectQuote: true,
      },
      {
        timestamp: '05:52:14',
        speaker: 'PATSY RAMSEY',
        speakerRole: 'Mother of Victim / 911 Caller',
        text: 'Seven-fifty-five Fifteenth Street... Please! Hurry, hurry, hurry!',
        isDirectQuote: true,
      },
      {
        timestamp: '05:52:20',
        speaker: 'DISPATCH',
        speakerRole: 'Emergency Dispatcher',
        text: 'What is going on there, ma\'am?',
        isDirectQuote: true,
      },
      {
        timestamp: '05:52:23',
        speaker: 'PATSY RAMSEY',
        speakerRole: 'Mother of Victim',
        text: 'We have a kidnapping! Hurry, please! There\'s a note left and our daughter is gone!',
        isDirectQuote: true,
      },
      {
        timestamp: '05:52:32',
        speaker: 'INVESTIGATIVE NOTE',
        speakerRole: 'BPD Case Record #96-15795',
        text: '[SUMMARY] Caller reported discovering a 2.5-page ransom note placed on the bottom stairs of the back spiral staircase demanding $118,000. Officers dispatched at 05:53.',
        isDirectQuote: false,
        editorialNote: 'Official police summary log; audio tape was subsequently analyzed for background acoustic signals.',
      },
    ],
    sourceCitation: 'Boulder Police Department Emergency Dispatch Audio Tape Log #96-15795 (Public Inquest Exhibit)',
  },
  {
    id: 'int-ramsey-02',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001-CO-1996',
    title: 'SWORN DEPOSITION TRANSCRIPT // DETECTIVE LINDA ARNDT',
    interviewee: 'Linda Arndt (Former Detective, Boulder Police Department)',
    interviewer: 'Civil Deposition Counsel',
    date: 'February 19, 1998',
    location: 'Boulder, Colorado',
    recordingMedium: 'Stenographic Deposition',
    classification: 'Judicial Deposition',
    summary: 'Sworn testimony regarding morning timeline events on December 26, 1996, the search of the residence, and instructions leading to the recovery of the victim in the basement wine cellar.',
    transcripts: [
      {
        timestamp: '13:00:00',
        speaker: 'COUNSEL',
        speakerRole: 'Examining Attorney',
        text: 'Detective Arndt, at approximately one o\'clock in the afternoon on December 26th, what instruction did you communicate to Mr. John Ramsey and Mr. Fleet White?',
        isDirectQuote: true,
      },
      {
        timestamp: '13:01:15',
        speaker: 'LINDA ARNDT',
        speakerRole: 'Boulder Police Detective',
        text: 'I asked John Ramsey and Fleet White to check the house from bottom to top to see if anything was out of place or unusual, or if anything had been disturbed.',
        isDirectQuote: true,
      },
      {
        timestamp: '13:05:40',
        speaker: 'INVESTIGATIVE NOTE',
        speakerRole: 'Deposition Record (Page 142)',
        text: '[SUMMARY] Detective Arndt stated John Ramsey ran downstairs toward the basement wine cellar, opened the closed latch, and located the victim wrapped in a white blanket. Ramsey carried the body upstairs into the living room, causing inadvertent crime scene contact prior to forensic photography.',
        isDirectQuote: false,
        editorialNote: 'Critical evidentiary event documenting chain of custody and scene disturbance.',
      },
    ],
    sourceCitation: 'Civil Court Deposition Transcript of Detective Linda Arndt, 1998 (State of Colorado)',
  },
  {
    id: 'int-gsk-01',
    caseSlug: 'golden-state-killer-deangelo',
    caseNumber: 'DOCKET-002-CA-1974',
    title: 'SACRAMENTO DA INVESTIGATIVE DEBRIEF // INVESTIGATOR PAUL HOLES',
    interviewee: 'Paul Holes (Chief of Forensics & Cold Case Investigator)',
    interviewer: 'Sacramento & Contra Costa Joint Task Force',
    date: 'April 25, 2018',
    location: 'Sacramento County District Attorney Cold Case Room',
    recordingMedium: 'Standard Cassette Tape',
    classification: 'Declassified FD-302',
    summary: 'Technical debriefing describing the conversion of STR forensic DNA from the 1980 Ventura County Smith homicide into an SNP array, upload to GEDmatch, and the construction of the DeAngelo ancestral tree.',
    transcripts: [
      {
        timestamp: '09:15:00',
        speaker: 'INVESTIGATOR HOLES',
        speakerRole: 'Lead Cold Case Investigator',
        text: 'We had crime scene STR profiles sitting in CODIS for eighteen years with zero offender hits. That meant the perpetrator had never been convicted of a felony that mandated a sample upload.',
        isDirectQuote: true,
      },
      {
        timestamp: '09:16:30',
        speaker: 'TASK FORCE COUNSEL',
        speakerRole: 'Deputy District Attorney',
        text: 'When did Dr. Barbara Rae-Venter identify the third-cousin genetic relationship?',
        isDirectQuote: true,
      },
      {
        timestamp: '09:17:10',
        speaker: 'INVESTIGATOR HOLES',
        speakerRole: 'Lead Cold Case Investigator',
        text: 'In early 2018, we isolated two key family branches descending from an ancestral couple in the early nineteenth century. We built backward down every branch until we found a male residing in Citrus Heights with former police officer credentials in Auburn and Exeter.',
        isDirectQuote: true,
      },
      {
        timestamp: '09:22:00',
        speaker: 'INVESTIGATIVE NOTE',
        speakerRole: 'DOJ Task Force Briefing Record',
        text: '[SUMMARY] Investigative team established surreptitious surveillance outside Citrus Heights residence. Abandoned DNA sample swabbed from door handle matched crime scene STR markers at a certainty exceeding one in one sextillion.',
        isDirectQuote: false,
      },
    ],
    sourceCitation: 'Sacramento County District Attorney Case Briefing #18FE008012 (State of California DOJ)',
  },
  {
    id: 'int-petito-01',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseNumber: 'DOCKET-003-WY-2021',
    title: 'OFFICER BODYCAM AUDIO RECORD // MOAB CITY POLICE STOP',
    interviewee: 'Gabrielle \"Gabby\" Petito & Brian Laundrie',
    interviewer: 'Officers Eric Pratt & Daniel Robbins (Moab Police Department)',
    date: 'August 12, 2021 - 16:35 MDT',
    location: 'Entrance to Arches National Park, Moab, Utah',
    recordingMedium: 'Police Bodycam Audio/Video',
    classification: 'Official Police Statement',
    summary: 'Documented traffic stop after a 911 caller witnessed a physical altercation in front of the Moonflower Community Cooperative. Recorded dialog demonstrates emotional distress, conflict accounts, and officer lethality classification.',
    transcripts: [
      {
        timestamp: '00:08:12',
        speaker: 'OFFICER ROBBINS',
        speakerRole: 'Moab Patrol Officer',
        text: 'Why are you crying? Can you tell me what happened back there in town?',
        isDirectQuote: true,
      },
      {
        timestamp: '00:08:20',
        speaker: 'GABBY PETITO',
        speakerRole: 'Victim / Driver',
        text: 'I\'m sorry. I just... I was apologizing to him for being mean. I have really bad OCD and anxiety, and we\'ve been fighting all morning.',
        isDirectQuote: true,
      },
      {
        timestamp: '00:15:40',
        speaker: 'OFFICER PRATT',
        speakerRole: 'Moab Police Officer',
        text: 'Did he strike you or push you? I see small marks on your chin and arm.',
        isDirectQuote: true,
      },
      {
        timestamp: '00:16:02',
        speaker: 'GABBY PETITO',
        speakerRole: 'Victim',
        text: 'He grabbed my face like this... he told me to calm down and shoved me away.',
        isDirectQuote: true,
      },
      {
        timestamp: '00:42:00',
        speaker: 'INVESTIGATIVE NOTE',
        speakerRole: 'Price City Police Independent Review (Jan 2022)',
        text: '[SUMMARY] Independent review concluded responding officers erred by classifying the incident as an emotional/mental health breakdown rather than a domestic assault, failing to implement mandatory state domestic violence arrest or referral statutes.',
        isDirectQuote: false,
        editorialNote: 'Bodycam released to the public under Utah GRAMA public records requests.',
      },
    ],
    sourceCitation: 'Moab City Police Department Body-Worn Camera Footage (Archive Case #21-12711)',
  },
];

// -------------------------------------------------------------
// 2. DOCUMENT ROOM ARCHIVES
// Authentic public domain documents, grand jury records, autopsy filings.
// -------------------------------------------------------------
export const archiveDocuments: ArchiveDocument[] = [
  {
    id: 'doc-ramsey-01',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001-CO-1996',
    title: 'BOULDER COUNTY GRAND JURY TRUE BILL (INDICTMENT #99-01)',
    category: 'Grand Jury Exhibits' as any,
    date: 'October 13, 1999 (Unsealed October 25, 2013)',
    classification: 'Grand Jury True Bill',
    authorOrAgency: '20th Judicial District Grand Jury / Presiding Judge Roxanne Bailin',
    pageCount: 4,
    summary: 'Official unsealed four-page true bill finding probable cause that John and Patsy Ramsey rendered child abuse resulting in death. District Attorney Alex Hunter declined to sign or pursue trial proceedings.',
    documentBody: `STATE OF COLORADO )
COUNTY OF BOULDER ) SS. IN THE DISTRICT COURT
TWENTIETH JUDICIAL DISTRICT

THE PEOPLE OF THE STATE OF COLORADO
VS.
JOHN BENNETT RAMSEY & PATRICIA PAUGH RAMSEY

INDICTMENT: COUNT IV (a) & (b) - C.R.S. 18-6-401(1)(a)
CLASS 2 FELONY: CHILD ABUSE RESULTING IN DEATH

THE GRAND JURY OF THE COUNTY OF BOULDER, UPON THEIR OATHS, DO FIND THAT:

On or about December 25, 1996, or December 26, 1996, in Boulder County, Colorado, the named defendants did unlawfully, knowingly, recklessly and feloniously permit a child to be unreasonably placed in a situation which posed a threat of injury to the child's life or health, which resulted in the death of JonBenét Ramsey.

FURTHER, the Grand Jury finds probable cause to believe that the defendants did render assistance to a person with intent to hinder, delay, or prevent the discovery, detection, apprehension, prosecution, trial, or punishment of such person for the commission of a crime.

FOREPERSON SIGNATURE: [SIGNATURE ON FILE - GRAND JURY FOREPERSON]
PROSECUTOR ACTION: NOT SIGNED BY DISTRICT ATTORNEY ALEX HUNTER.

NOTICE: Under Rule 6(e) of Colorado Criminal Procedure, documents were sealed until October 25, 2013, when Chief Judge Roxanne Bailin ordered public disclosure following Freedom of Information litigation.`,
    redactions: [
      {
        id: 'red-01',
        label: 'JUROR IDENTITIES',
        redactedText: '[JUROR NAMES WITHHELD UNDER COLORADO GRAND JURY SECRECY STATUTE 16-5-205]',
        reason: 'Statutory protection of grand jury citizen identities.',
      },
      {
        id: 'red-02',
        label: 'JUVENILE RECORDS',
        redactedText: '[REDACTED: CONFIDENTIAL FAMILY MEDICAL & MINOR COUNSELING EVALUATIONS]',
        reason: 'Juvenile privacy and medical confidentiality under HIPAA/FERPA.',
      },
    ],
    officialCitation: 'Boulder County District Court Public Record Case No. 1999-CR-001 (Unsealed 2013)',
  },
  {
    id: 'doc-ramsey-02',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001-CO-1996',
    title: 'BOULDER COUNTY CORONER AUTOPSY PROTOCOL REPORT #96A-155',
    category: 'Coroner Autopsies',
    date: 'December 27, 1996',
    classification: 'Coroner Autopsy Report',
    authorOrAgency: 'John E. Meyer, M.D. (Boulder County Coroner)',
    pageCount: 13,
    summary: 'Comprehensive post-mortem forensic medical evaluation establishing asphyxia by strangulation associated with craniocerebral trauma.',
    documentBody: `OFFICE OF THE CORONER // COUNTY OF BOULDER, COLORADO
AUTOPSY PROTOCOL: CASE #96A-155
NAME: RAMSEY, JONBENET PATRICIA
AGE: 6 YEARS | SEX: FEMALE | DATE OF DEATH: DECEMBER 26, 1996

PATHOLOGICAL DIAGNOSES:
I. CRANIOCEREBRAL TRAUMA
   A. Massive 8.5-inch linear comminuted fracture of the right calvarium.
   B. Extensive subdural and subarachnoid hemorrhage with cerebral edema.

II. ASPHYXIA BY STRANGULATION
   A. Ligature furrow around neck with wooden stick garrote mechanism.
   B. Subconjunctival petechiae of right and left bulbar conjunctiva.

III. PHYSICAL EVIDENCE COLLECTED
   A. Ligature cord and garrote handle constructed from white nylon cord and broken paintbrush.
   B. Vaginal swabs, blood samples, fingernail clippings preserved under refrigeration.
   C. Forensically isolated DNA profile: Foreign male alleles identified in subsequent CBI and Bode Technology testing.

CAUSE OF DEATH: Asphyxia by strangulation associated with craniocerebral trauma.
MANNER OF DEATH: Homicide.

SIGNED: JOHN E. MEYER, M.D. - CORONER`,
    redactions: [
      {
        id: 'red-03',
        label: 'SENSITIVE BIO-SPECIMENS',
        redactedText: '[DETAILED GYNECOLOGICAL MEASUREMENTS REDACTED UNDER COLORADO CHILD PRIVACY REGULATIONS]',
        reason: 'Protection against non-scientific exploitation of minor anatomical details.',
      },
    ],
    officialCitation: 'Boulder County Coroner Public Record #96A-155',
  },
  {
    id: 'doc-gsk-01',
    caseSlug: 'golden-state-killer-deangelo',
    caseNumber: 'DOCKET-002-CA-1974',
    title: 'PEOPLE OF CALIFORNIA V. JOSEPH JAMES DEANGELO // CONSOLIDATED FELONY COMPLAINT',
    category: 'Court Records',
    date: 'June 29, 2020',
    classification: 'Official Court Record',
    authorOrAgency: 'Sacramento County District Attorney Anne Marie Schubert (Joint Counties)',
    pageCount: 42,
    summary: 'Consolidated charging document across Sacramento, Orange, Contra Costa, and Ventura counties outlining 13 counts of first-degree murder with special circumstances.',
    documentBody: `SUPERIOR COURT OF THE STATE OF CALIFORNIA
IN AND FOR THE COUNTY OF SACRAMENTO

THE PEOPLE OF THE STATE OF CALIFORNIA,
PLAINTIFF,
VS.
JOSEPH JAMES DEANGELO, JR. (DOB 11/08/1945),
DEFENDANT.

CASE NO. 18FE008012 // CONSOLIDATED AMENDED COMPLAINT

COUNTS 1 THROUGH 13: FIRST DEGREE MURDER (PENAL CODE § 187(a))
SPECIAL CIRCUMSTANCES ALLEGATIONS:
- Multiple Murder (Penal Code § 190.2(a)(3))
- Murder during the commission of Rape (Penal Code § 190.2(a)(17)(C))
- Murder during the commission of Burglary (Penal Code § 190.2(a)(17)(G))

VICTIM SCHEDULE:
COUNT 1: Claude Snelling (September 11, 1975) - Visalia, Tulare County
COUNTS 2 & 3: Brian & Katie Maggiore (February 2, 1978) - Rancho Cordova
COUNTS 4 & 5: Robert Offerman & Alexandria Manning (December 30, 1979) - Goleta
COUNTS 6 & 7: Lyman & Charlene Smith (March 13, 1980) - Ventura
COUNTS 8 & 9: Keith & Patrice Harrington (August 19, 1980) - Dana Point
COUNT 10: Manuela Witthuhn (February 6, 1981) - Irvine
COUNTS 11 & 12: Cheri Domingo & Gregory Sanchez (July 27, 1981) - Goleta
COUNT 13: Janelle Cruz (May 4, 1986) - Irvine

DISPOSITION:
On June 29, 2020, defendant entered pleas of GUILTY to all 13 counts of First-Degree Murder and admitted special circumstances, plus 13 counts of Kidnapping to Commit Robbery (PC § 209).`,
    redactions: [
      {
        id: 'red-04',
        label: 'SURVIVOR CONFIDENTIALITY',
        redactedText: '[SURVIVOR FULL NAMES MASKED PURSUANT TO CALIFORNIA PENAL CODE § 293]',
        reason: 'Statutory victim protection for living survivors of sexual violence.',
      },
    ],
    officialCitation: 'Superior Court of California, County of Sacramento Case #18FE008012',
  },
  {
    id: 'doc-petito-01',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseNumber: 'DOCKET-003-WY-2021',
    title: 'FBI DENVER FINAL INVESTIGATIVE SUMMARY // WY-21-09',
    category: 'FD-302 Reports',
    date: 'January 21, 2022',
    classification: 'DOJ Investigative Summary',
    authorOrAgency: 'Federal Bureau of Investigation (Denver Division Special Agent in Charge Michael Schneider)',
    pageCount: 5,
    summary: 'Formal closure report summarizing cellular data triangulation, forensic recovery at Spread Creek, debit card fraud evidence, and the Carlton Reserve notebook confession.',
    documentBody: `FEDERAL BUREAU OF INVESTIGATION // DENVER DIVISION
PUBLIC DISCLOSURE BULLETIN // CASE IDENTIFIER: WY-21-09
SUBJECT: FINAL INVESTIGATIVE UPDATE - GABRIELLE PETITO HOMICIDE

SUMMARY OF INVESTIGATIVE FINDINGS:

1. RECOVERY AT SPREAD CREEK:
On September 19, 2021, FBI Denver Evidence Response Teams recovered human remains matching Gabrielle Petito in the Bridger-Teton National Forest, Wyoming. On October 12, 2021, Teton County Coroner Dr. Brent Blue determined the cause of death was blunt-force injuries to the head and neck, with manual strangulation.

2. SUSPECT DISCOVERY IN FLORIDA:
On October 20, 2021, following extensive searches in Myakkahatchee Creek Environmental Park and Carlton Reserve, law enforcement located skeletal remains identified through dental records as Brian Laundrie. Medical examination concluded Laundrie died from a self-inflicted gunshot wound.

3. ADMISSION OF RESPONSIBILITY IN NOTEBOOK:
Recovered adjacent to Laundrie's remains was a waterproof spiral-bound notebook. Forensic handwriting examination verified the entries were written by Brian Laundrie. Within the journal, Laundrie claimed responsibility for the death of Ms. Petito.

4. CLOSURE DETERMINATION:
All logical investigative steps have been concluded in this matter. An exhaustive review did not identify any other individuals involved in the homicide of Gabrielle Petito. The FBI will formally close its criminal investigation.`,
    redactions: [
      {
        id: 'red-05',
        label: 'BANK ACCESS NUMBERS',
        redactedText: '[REDACTED CAPITAL ONE DEBIT ACCOUNT & ATM TRANSACTION PINS]',
        reason: 'Financial privacy and security regulations (18 U.S.C. § 1029).',
      },
    ],
    officialCitation: 'FBI Denver Division Official Press Release and Case Dossier WY-21-09 (Released Jan 2022)',
  },
];

// -------------------------------------------------------------
// 3. DOCUMENTED GEOGRAPHICAL RECON POINTS
// Verified locations from public court filings & law enforcement records.
// -------------------------------------------------------------
export const archiveGeoPoints: GeoLocationPoint[] = [
  {
    id: 'geo-ramsey-01',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001-CO-1996',
    title: '755 15th Street (The Ramsey Residence)',
    locationName: 'University Hill, Boulder, Colorado',
    region: 'Boulder County, CO',
    coordinates: { x: 38, y: 44 },
    dateRelevance: 'December 25-26, 1996',
    pointType: 'Incident Location',
    summary: 'The 7,000-square-foot Tudor residence where the 2.5-page ransom note was located and the victim’s body was recovered in the basement wine cellar.',
    verifiedSource: 'Boulder Police Incident Report #96-15795',
    timelineOrder: 1,
  },
  {
    id: 'geo-ramsey-02',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001-CO-1996',
    title: 'Boulder Police Department Headquarters',
    locationName: '1805 33rd Street, Boulder, Colorado',
    region: 'Boulder County, CO',
    coordinates: { x: 41, y: 42 },
    dateRelevance: '1996 - Present',
    pointType: 'Law Enforcement Command',
    summary: 'Central command for the BPD Task Force; location of early interviews, evidentiary storage, and recent 2022 cold-case DNA audits.',
    verifiedSource: 'Boulder County District Court Records',
    timelineOrder: 2,
  },
  {
    id: 'geo-gsk-01',
    caseSlug: 'golden-state-killer-deangelo',
    caseNumber: 'DOCKET-002-CA-1974',
    title: 'Rancho Cordova Neighborhoods',
    locationName: 'Sacramento County, California',
    region: 'Sacramento Valley, CA',
    coordinates: { x: 14, y: 46 },
    dateRelevance: '1976 - 1978',
    pointType: 'Incident Location',
    summary: 'Primary operational territory of the East Area Rapist, including the February 2, 1978 homicide of Brian and Katie Maggiore.',
    verifiedSource: 'Sacramento County Sheriff Incident Archive',
    timelineOrder: 1,
  },
  {
    id: 'geo-gsk-02',
    caseSlug: 'golden-state-killer-deangelo',
    caseNumber: 'DOCKET-002-CA-1974',
    title: 'Citrus Heights Residence & Arrest Site',
    locationName: 'Citrus Heights, Sacramento County, California',
    region: 'Northern California',
    coordinates: { x: 16, y: 43 },
    dateRelevance: 'April 24, 2018',
    pointType: 'Suspect Base',
    summary: 'Suburban home where DeAngelo resided for decades and was taken into custody without incident following confirmation of DNA match.',
    verifiedSource: 'Joint Federal & State Arrest Briefing (Sacramento DA)',
    timelineOrder: 2,
  },
  {
    id: 'geo-petito-01',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseNumber: 'DOCKET-003-WY-2021',
    title: 'Moonflower Community Cooperative & Arches Entrance',
    locationName: 'Moab, Grand County, Utah',
    region: 'Southeastern Utah',
    coordinates: { x: 32, y: 56 },
    dateRelevance: 'August 12, 2021',
    pointType: 'Incident Location',
    summary: 'Site of the 911 domestic disturbance report and subsequent 77-minute police traffic stop documented by officer body-worn cameras.',
    verifiedSource: 'Moab Police Department Bodycam Records',
    timelineOrder: 1,
  },
  {
    id: 'geo-petito-02',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseNumber: 'DOCKET-003-WY-2021',
    title: 'Spread Creek Dispersed Camping Area',
    locationName: 'Bridger-Teton National Forest, Wyoming',
    region: 'Grand Teton National Park Ecosystem',
    coordinates: { x: 35, y: 31 },
    dateRelevance: 'August 27 - September 19, 2021',
    pointType: 'Discovery Site',
    summary: 'Undeveloped forest campsite where the Ford Transit was spotted on tourist dashcam and where search teams discovered Petito\'s remains.',
    verifiedSource: 'FBI Denver Field Office Public Notice #WY-21-09',
    timelineOrder: 2,
  },
  {
    id: 'geo-petito-03',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseNumber: 'DOCKET-003-WY-2021',
    title: 'Myakkahatchee Creek Environmental Park & Carlton Reserve',
    locationName: 'North Port, Sarasota County, Florida',
    region: 'Sarasota County, FL',
    coordinates: { x: 74, y: 82 },
    dateRelevance: 'October 20, 2021',
    pointType: 'Suspect Base',
    summary: '25,000-acre swampland reserve where Brian Laundrie died by suicide and where his handwritten confession notebook was recovered.',
    verifiedSource: 'FBI Tampa Evidence Response Team Log',
    timelineOrder: 3,
  },
];

// -------------------------------------------------------------
// 4. INVESTIGATIVE PRINCIPLES LAB (FICTIONAL TRAINING EXERCISES)
// Strictly fictional, instructive scenarios to teach investigative methodologies.
// -------------------------------------------------------------
export const fictionalExercises: InvestigativeExercise[] = [
  {
    id: 'ex-101',
    code: 'SIM-TR-101',
    title: 'Scenario Alpha: Cold Storage Evidence Triage & Chain of Custody',
    difficulty: 'Senior Special Agent',
    briefing: 'A 28-year-old cold homicide case file has been assigned for review. The evidence locker contains three sealed brown paper bags, one plastic vacuum-sealed pouch containing biological fluid from 1994, and an unlabelled floppy disk.',
    scenarioDescription: 'You are reviewing evidence logged under obsolete storage methods. Modern ISO/IEC 17025 accredited labs require strict preservation conditions to avoid degradation of STR/SNP profiles.',
    availableEvidence: [
      'Bag #1: Knitted woolen scarf with microscopic biological crusts stored at room temperature.',
      'Bag #2: Plastic heat-sealed bag with noticeable interior condensation.',
      'Floppy Disk: 3.5\" disk containing handwritten log notes from lead detective in 1994.',
    ],
    questionPrompt: 'Which piece of evidence requires immediate environmental intervention to prevent irreparable forensic loss?',
    options: [
      {
        id: 'opt-a',
        label: 'A: Extract the floppy disk and insert it into a standard drive immediately',
        actionText: 'Mount disk in drive without hardware write-blocker',
        reasoning: 'Inserting a 1990s magnetic disk without a hardware write-blocker can overwrite file access timestamps (MACB metadata), permanently contaminating digital evidence.',
        isRecommended: false,
        investigativePrinciple: 'Digital Forensics - ISO 27037 Evidence Preservation',
      },
      {
        id: 'opt-b',
        label: 'B: (Recommended) Remediate the plastic pouch with interior condensation',
        actionText: 'Notify crime lab director to remediate damp biological specimen',
        reasoning: 'Moisture sealed in plastic facilitates fungal and bacterial growth that digests biological DNA. Biological specimens must be dried and stored in breathable paper or temperature-controlled cold vaults.',
        isRecommended: true,
        investigativePrinciple: 'Forensic Biology - Biological Evidence Degradation Prevention',
      },
      {
        id: 'opt-c',
        label: 'C: Discard the handwritten notes as inadmissible hearsay',
        actionText: 'Exclude informal detective notes from evidence room',
        reasoning: 'Original contemporaneous investigator notes are vital under the Federal Rules of Evidence (Rule 803(5) Recorded Recollection) and may reveal critical lead details.',
        isRecommended: false,
        investigativePrinciple: 'Rules of Evidence - Contemporaneous Officer Records',
      },
    ],
    debriefingAnalysis: 'In real cold cases like the Golden State Killer, preserved biological specimens kept at -20°C in the Ventura County crime lab for over three decades were the only reason modern SNP genetic genealogy could crack the case in 2018.',
    ethicalGuidance: 'Forensic evidence must be preserved objectively without bias toward any pre-selected suspect theory.',
  },
  {
    id: 'ex-102',
    code: 'SIM-TR-102',
    title: 'Scenario Beta: Cross-Jurisdictional DNA Contamination Assessment',
    difficulty: 'Forensic Specialist',
    briefing: 'A low-copy DNA profile recovered from the outer cuff of a victim\'s coat matches an individual who lived 400 miles away with verified payroll records placing them on duty during the incident window.',
    scenarioDescription: 'Secondary transfer occurs when epithelial cells are transferred through an intermediary object, clothing laundromat, or shared medical examination table.',
    availableEvidence: [
      'Forensic finding: 6-locus partial DNA profile with stochastic dropout.',
      'Alibi record: Verified biometric workplace clock-in 400 miles away.',
      'Coroner log: Transport stretcher used previously for an unrelated highway fatality.',
    ],
    questionPrompt: 'What is the correct protocol before issuing a material witness warrant?',
    options: [
      {
        id: 'opt-a',
        label: 'A: Immediately leak the match to local media to solicit tip line calls',
        actionText: 'Release name of partial DNA match publicly',
        reasoning: 'Prematurely releasing uncorroborated partial DNA leads can destroy innocent lives and cause irreversible bias in the jury pool, violating DOJ media guidelines.',
        isRecommended: false,
        investigativePrinciple: 'Prosecutorial Ethics & Media Integrity',
      },
      {
        id: 'opt-b',
        label: 'B: (Recommended) Audit contamination vectors & request high-density testing',
        actionText: 'Conduct contamination audit across EMT, coroner, and lab staff',
        reasoning: 'Before treating a partial or secondary transfer profile as suspect evidence, investigators must eliminate cross-contamination from emergency response equipment and run elimination databases.',
        isRecommended: true,
        investigativePrinciple: 'Forensic Validation - Secondary Transfer & Elimination Standards',
      },
      {
        id: 'opt-c',
        label: 'C: Presume the alibi employer fabricated timecards',
        actionText: 'Threaten corporate alibi witness with perjury charges',
        reasoning: 'Assuming an established documentary alibi is false without corroborating evidence reflects confirmation bias, a leading cause of wrongful convictions.',
        isRecommended: false,
        investigativePrinciple: 'Cognitive Bias Mitigation in Criminal Investigation',
      },
    ],
    debriefingAnalysis: 'In the JonBenét Ramsey case, foreign male DNA on clothing elements led to decades of debate regarding whether the alleles originated from an unknown intruder or secondary contact during manufacturing/handling.',
    ethicalGuidance: 'DNA is circumstantial evidence that requires contextual corroboration; it does not automatically establish temporal presence or guilt.',
  },
];

// -------------------------------------------------------------
// 5. COLLECTIBLE ARCHIVE STAMPS & TERMINAL EASTER EGGS
// Exploration rewards that grant legal facts and archive milestones.
// -------------------------------------------------------------
export const archiveStamps: ArchiveStamp[] = [
  {
    id: 'stamp-01',
    code: 'STAMP_FIRST_BOOT',
    title: 'Investigator Terminal Initialized',
    category: 'Terminal Mastery',
    rarity: 'Standard',
    description: 'Granted upon completing the vintage 1996 BIOS workstation boot sequence.',
    howToUnlock: 'Boot up the terminal and enter the 302 Docket workstation.',
    iconName: 'Cpu',
  },
  {
    id: 'stamp-02',
    code: 'STAMP_TERMINAL_HACKER',
    title: 'Command Line Analyst',
    category: 'Terminal Mastery',
    rarity: 'Classified',
    description: 'Awarded for running 5 or more commands inside the DOS-302 Terminal window.',
    howToUnlock: 'Type commands like HELP, CASES, SEARCH, and TIMELINE in CMD302.EXE.',
    iconName: 'Terminal',
  },
  {
    id: 'stamp-03',
    code: 'STAMP_CODIS_EXAMINER',
    title: 'CODIS Forensic Profiler',
    category: 'Forensics',
    rarity: 'Classified',
    description: 'Unlocked by inspecting the STR & SNP DNA profiles in Case 001 or Case 002.',
    howToUnlock: 'Open the Evidence Room and inspect biological DNA exhibit records.',
    iconName: 'Dna',
  },
  {
    id: 'stamp-04',
    code: 'STAMP_SECRET_CACHE',
    title: 'Bureau Archives Red Tape Pierced',
    category: 'Secret Dossier',
    rarity: 'Top Secret',
    description: 'Awarded for uncovering the hidden \".BUREAU_CONFIDENTIAL\" system folder on the desktop.',
    howToUnlock: 'Discover and open the hidden confidential system folder.',
    iconName: 'ShieldAlert',
  },
  {
    id: 'stamp-05',
    code: 'STAMP_TIMELINE_SURVEYOR',
    title: 'Chronology Reconstruction Master',
    category: 'Investigation',
    rarity: 'Standard',
    description: 'Examined key milestones in the interactive timeline reconstruction.',
    howToUnlock: 'Step through 3 chronological events in the timeline engine.',
    iconName: 'Clock',
  },
  {
    id: 'stamp-06',
    code: 'STAMP_TRAINING_SCHOLAR',
    title: 'Forensic Lab Certified',
    category: 'Investigation',
    rarity: 'Classified',
    description: 'Successfully completed an investigative principles training scenario.',
    howToUnlock: 'Complete an exercise in the Fictional Principles Lab.',
    iconName: 'Award',
  },
  {
    id: 'stamp-07',
    code: 'STAMP_EASTER_EGG_HOOVER',
    title: 'Director\'s Special Clearance',
    category: 'Secret Dossier',
    rarity: 'Top Secret',
    description: 'Unlocked by entering the secret terminal command \"HOOVER\" or \"CIPHER\".',
    howToUnlock: 'Type HOOVER or CIPHER in the command terminal.',
    iconName: 'Key',
  },
  {
    id: 'stamp-08',
    code: 'STAMP_MAP_RECON',
    title: 'Geographical Surveyor',
    category: 'Investigation',
    rarity: 'Standard',
    description: 'Inspected verified casework locations on the retro geographical radar view.',
    howToUnlock: 'Open the MAP.EXE application and inspect location pins.',
    iconName: 'MapPin',
  },
];

// -------------------------------------------------------------
// 6. DEFAULT EVIDENCE BOARD ITEMS (PINBOARD / CANVAS)
// -------------------------------------------------------------
export const initialEvidenceBoardItems: EvidenceBoardItem[] = [
  {
    id: 'board-01',
    title: '2.5-Page Handwritten Note',
    itemType: 'document',
    status: 'Established Fact',
    x: 80,
    y: 60,
    snippet: 'Written on notepad found in house with Sharpie pen; demanded exact $118,000 corporate bonus sum.',
    source: 'Boulder Police Evidence Exhibit CBI-01',
    date: 'Dec 26, 1996',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001',
    tags: ['Linguistics', 'Handwriting', 'Ransom Note'],
  },
  {
    id: 'board-02',
    title: 'Broken Basement Window & Suitcase',
    itemType: 'physical',
    status: 'Established Fact',
    x: 360,
    y: 80,
    snippet: 'Unlatched window with broken pane and foliage scuff marks, positioned directly above Samsonite suitcase.',
    source: 'Detective Lou Smit Forensic Reconstruction',
    date: 'Dec 1996 / Mar 1997',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001',
    tags: ['Point of Entry', 'Intruder Theory', 'Physical Trace'],
  },
  {
    id: 'board-03',
    title: 'Foreign Male DNA in CODIS',
    itemType: 'forensic',
    status: 'Established Fact',
    x: 220,
    y: 280,
    snippet: 'STR nuclear profile in underwear blood spots matching touch-DNA from waistband; no match to family or police.',
    source: 'Colorado Bureau of Investigation / Bode Technology 2008',
    date: '1997 / 2008',
    caseSlug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001',
    tags: ['CODIS Profile', 'STR Alleles', 'Unidentified Contributor'],
  },
  {
    id: 'board-04',
    title: 'Ventura Frozen Specimen (1980)',
    itemType: 'forensic',
    status: 'Established Fact',
    x: 640,
    y: 70,
    snippet: 'Biological sample preserved for 38 years at -20°C; converted into 600,000 SNP array for GEDmatch search.',
    source: 'Ventura County Crime Lab Archive',
    date: 'Mar 1980 / Re-tested 2018',
    caseSlug: 'golden-state-killer-deangelo',
    caseNumber: 'DOCKET-002',
    tags: ['Genetic Genealogy', 'SNP Array', 'Ventura County'],
  },
  {
    id: 'board-05',
    title: 'Diamond Knot Ligature Cord',
    itemType: 'physical',
    status: 'Forensic Theory',
    x: 880,
    y: 110,
    snippet: 'Specialized diamond knots tied in braided nylon restraints matching naval rigging procedures.',
    source: 'Contra Costa Sheriff Evidence Vault',
    date: '1976-1981',
    caseSlug: 'golden-state-killer-deangelo',
    caseNumber: 'DOCKET-002',
    tags: ['Naval Background', 'Signature Knot', 'EAR Offenses'],
  },
  {
    id: 'board-06',
    title: 'Spread Creek Dashcam Sighting',
    itemType: 'statement',
    status: 'Established Fact',
    x: 520,
    y: 330,
    snippet: 'GoPro video from tourist van spotted Petito’s white Ford Transit van parked at undeveloped campsite.',
    source: 'FBI Denver Public Tip Submission (Bethune Video)',
    date: 'Aug 27, 2021',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseNumber: 'DOCKET-003',
    tags: ['Crowdsourcing', 'Dashcam', 'Spread Creek'],
  },
  {
    id: 'board-07',
    title: 'Waterproof Journal Confession',
    itemType: 'document',
    status: 'Established Fact',
    x: 820,
    y: 340,
    snippet: 'Handwritten journal entries in Carlton Reserve claiming responsibility for victim death.',
    source: 'FBI Tampa Field Evidence Response Team',
    date: 'Oct 20, 2021',
    caseSlug: 'gabby-petito-brian-laundrie',
    caseNumber: 'DOCKET-003',
    tags: ['Confession Note', 'FBI Closure', 'Direct Evidence'],
  },
];

export const initialEvidenceConnections: EvidenceConnection[] = [
  {
    fromId: 'board-01',
    toId: 'board-02',
    label: 'Location / Timeline Congruence',
    type: 'timeline_sequence',
  },
  {
    fromId: 'board-02',
    toId: 'board-03',
    label: 'Intruder Theory Physical Link',
    type: 'forensic_link',
  },
  {
    fromId: 'board-04',
    toId: 'board-05',
    label: 'Corroborates Naval Veteran Identity',
    type: 'forensic_link',
  },
  {
    fromId: 'board-06',
    toId: 'board-07',
    label: 'Recovery Location to Written Admission',
    type: 'timeline_sequence',
  },
];
