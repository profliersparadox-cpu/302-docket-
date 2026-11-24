import { CaseFile } from '../types.ts';

export interface PrecedentCard {
  id: string;
  citation: string;
  ruleName: string;
  holding: string;
}

export interface LegalDilemmaChoice {
  id: string;
  label: string;
  legalAction: string;
  constitutionalDelta: number; // -20 to +20
  evidentiaryDelta: number;    // -20 to +20
  appellateDelta: number;      // -20 to +20
  isOptimalStrategy: boolean;
  benchOutcome: string;
  doctrineNote: string;
}

export interface LegalDilemmaScenario {
  id: string;
  code: string;
  title: string;
  posture: string;
  dilemmaPrompt: string;
  realWorldStakes: string;
  requiredPrecedentId: string;
  preferredExhibitKeyword: string;
  precedentCards: PrecedentCard[];
  choices: LegalDilemmaChoice[];
  historicalResolution: string;
}

export interface LegalDoctrineRef {
  term: string;
  citation: string;
  summary: string;
}

// Landmark U.S. criminal law & evidentiary doctrines used for inline dossier cross-referencing
export const LEGAL_DOCTRINE_GLOSSARY: LegalDoctrineRef[] = [
  {
    term: 'Grand Jury',
    citation: 'U.S. Const. Amend. V / Colo. R. Crim. P. 6.2',
    summary:
      'A grand jury determines probable cause to indict—a significantly lower legal threshold than proof beyond a reasonable doubt required for conviction at trial.',
  },
  {
    term: 'CODIS',
    citation: 'DNA Identification Act of 1994 (34 U.S.C. § 12592)',
    summary:
      'Combined DNA Index System storing STR offender and forensic profiles. Absent a statutory felony hit, law enforcement could not link unknown perpetrator profiles without external comparison.',
  },
  {
    term: 'GEDmatch',
    citation: 'DOJ Interim Policy on Forensic Genetic Genealogical DNA (2019)',
    summary:
      'Public genetic genealogy database permitting third-party SNP kinship searches after traditional CODIS exhaustion, subject to constitutional abandoned-DNA confirmation.',
  },
  {
    term: 'Daubert',
    citation: 'Daubert v. Merrell Dow Pharmaceuticals, 509 U.S. 579 (1993)',
    summary:
      'Federal gatekeeping standard requiring scientific or forensic methodology to be testable, peer-reviewed, have known error rates, and achieve general acceptance before reaching a jury.',
  },
  {
    term: 'chain of custody',
    citation: 'Fed. R. Evid. 901(a)',
    summary:
      'Authentication requires continuous documentation accounting for seizure, custody, transfer, analysis, and storage to prevent contamination or tampering challenges.',
  },
  {
    term: 'touch DNA',
    citation: 'trace biological transfer & mixture interpretation',
    summary:
      'Microscopic epithelial DNA transfer is highly sensitive to secondary contact or scene contamination, requiring corroborating forensic context rather than standalone certainty.',
  },
  {
    term: 'bodycam',
    citation: 'Utah Code § 77-36-2.2 / Contemporaneous Official Record',
    summary:
      'Real-time officer audio-video recordings serve as primary objective evidence evaluating predominant-aggressor assessments and exceptions to hearsay.',
  },
  {
    term: 'Non-Prosecution Agreement',
    citation: 'United States v. Maxwell, No. 22-1426 (2d Cir. 2024)',
    summary:
      'Federal plea contracts bind only the prosecuting U.S. Attorney district specified unless expressly authorized by Main Justice to bind sister districts nationwide.',
  },
  {
    term: 'Crime Victims’ Rights Act',
    citation: '18 U.S.C. § 3771 (CVRA)',
    summary:
      'Grants federal crime victims the statutory right to reasonable notice, conferral with government prosecutors, and to be heard at public plea and sentencing proceedings.',
  },
  {
    term: 'Lindbergh Law',
    citation: 'Federal Kidnapping Act, 18 U.S.C. § 1201 (1932)',
    summary:
      'Enacted in response to the 1932 Lindbergh abduction, making interstate kidnapping and ransom transportation federal crimes under FBI jurisdiction.',
  },
  {
    term: 'Wetterling',
    citation: 'Jacob Wetterling Crimes Against Children Act, 42 U.S.C. § 14071 (1994)',
    summary:
      'Landmark federal statute requiring states to establish registries for offenders convicted of crimes against minors and sexually violent offenses.',
  },
];

const CASE_SPECIFIC_DILEMMAS: Record<string, LegalDilemmaScenario[]> = {
  'jonbenet-ramsey-boulder': [
    {
      id: 'ramsey-gj-unseal',
      code: 'CONST-01A',
      title: 'Grand Jury True Bills vs. Prosecutorial Declination',
      posture: 'Boulder County District Court // 1999–2013 Unsealing Dispute',
      dilemmaPrompt:
        'A Colorado grand jury votes to return True Bills on child abuse resulting in death, yet the District Attorney concludes the admissible evidence falls short of "beyond a reasonable doubt." Media petitioners move to unseal the indictment. How should the bench & prosecution proceed?',
      realWorldStakes:
        'Balancing public accountability, grand jury secrecy protecting unindicted citizens, and the constitutional duty never to pursue charges lacking trial-sufficient proof.',
      requiredPrecedentId: 'prec-ramsey-1',
      preferredExhibitKeyword: 'dna',
      precedentCards: [
        {
          id: 'prec-ramsey-1',
          citation: 'Colo. R. Crim. P. 6.2 & ABA Standard 3-4.3',
          ruleName: 'Grand Jury Secrecy vs. Trial Burden Standard',
          holding:
            'A prosecutor may decline to sign a grand jury indictment if admissible evidence cannot sustain proof beyond a reasonable doubt; unsealing requires balancing public interest against reputational harm to uncharged parties.',
        },
        {
          id: 'prec-ramsey-2',
          citation: 'Gideon v. Wainwright, 372 U.S. 335 (1963)',
          ruleName: 'Sixth Amendment Right to Appointed Counsel',
          holding: 'Guarantees indigent criminal defendants legal representation in felony trials.',
        },
        {
          id: 'prec-ramsey-3',
          citation: 'Terry v. Ohio, 392 U.S. 1 (1968)',
          ruleName: 'Stop and Frisk Reasonable Suspicion',
          holding: 'Permits brief investigatory detentions upon articulable suspicion.',
        },
      ],
      choices: [
        {
          id: 'c-ram-1a',
          label: 'Decline Prosecution Under Ethical Trial Standard & Unseal Only Final True Bill Pages',
          legalAction:
            'Refuse to prosecute absent beyond-reasonable-doubt forensic certainty while permitting narrow judicial release of the 1999 True Bill charges without underlying grand jury testimony.',
          constitutionalDelta: 15,
          evidentiaryDelta: 5,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'ETHICAL & CONSTITUTIONALLY SOUND: Preserves due process and avoids a failed double-jeopardy trial while satisfying judicial transparency orders (2013 ruling).',
          doctrineNote:
            'Jeopardy attaches once a trial jury is sworn; premature prosecution with unresolved DNA exclusions would permanently bar retrial under the Fifth Amendment.',
        },
        {
          id: 'c-ram-1b',
          label: 'Sign the Indictment Immediately Despite Unresolved DNA Exclusions',
          legalAction:
            'Proceed straight to felony jury trial relying primarily on disputed handwriting comparisons and household circumstantial inference.',
          constitutionalDelta: -15,
          evidentiaryDelta: -10,
          appellateDelta: -20,
          isOptimalStrategy: false,
          benchOutcome:
            'HIGH REVERSAL & ACQUITTAL RISK: Defense exploits unidentified male touch-DNA (UM1) and scene contamination to defeat burden of proof, triggering permanent Double Jeopardy bar.',
          doctrineNote:
            'Under Rule 29 & Jackson v. Virginia, unresolved exculpatory biological evidence prevents proving guilt beyond a reasonable doubt.',
        },
      ],
      historicalResolution:
        'In 1999, DA Alex Hunter declined to sign the True Bills citing insufficient evidence to prove guilt beyond a reasonable doubt. In 2013, Judge Robert Lowenbach ordered the 4 pages of True Bills unsealed while keeping grand jury deliberations secret.',
    },
    {
      id: 'ramsey-scene-custody',
      code: 'EVID-01B',
      title: 'Crime Scene Integrity & Trace DNA Contamination',
      posture: 'Pre-Trial Suppression Hearing // Fourth & Evidentiary Audit',
      dilemmaPrompt:
        'During the initial response, non-investigators moved through the residence and the deceased victim was carried upstairs before forensic photography. Later, minute unidentified male touch-DNA (UM1) is isolated. How must a reviewing court weigh this forensic record?',
      realWorldStakes:
        'Separating probative biological evidence from secondary contamination without fabricating investigative certainty.',
      requiredPrecedentId: 'prec-ramsey-2a',
      preferredExhibitKeyword: 'ransom',
      precedentCards: [
        {
          id: 'prec-ramsey-2a',
          citation: 'Fed. R. Evid. 901 & Daubert Trace Transfer',
          ruleName: 'Foundation & Secondary DNA Transfer Scrutiny',
          holding:
            'Admitting trace biological profiles requires laboratory validation demonstrating the profile came from the crime event rather than benign handling or scene cross-contamination.',
        },
        {
          id: 'prec-ramsey-2b',
          citation: 'Mapp v. Ohio, 367 U.S. 643 (1961)',
          ruleName: 'Fourth Amendment Exclusionary Rule',
          holding: 'Bars evidence seized via unconstitutional warrantless police searches.',
        },
      ],
      choices: [
        {
          id: 'c-ram-2a',
          label: 'Require Multi-Locus CODIS Concordance & Independent Non-DNA Corroboration',
          legalAction:
            'Treat UM1 as an unresolved investigative lead requiring advanced whole-genome / investigative genetic genealogy confirmation and physical corroboration before attributing culpability.',
          constitutionalDelta: 15,
          evidentiaryDelta: 15,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'SCIENTIFICALLY RIGOROUS: Prevents wrongful attribution based on trace ambiguity while keeping cold-case biological samples preserved for modern STR/SNP advances.',
          doctrineNote:
            'Modern Cold Case DNA protocols distinguish probative donor profiles from low-template touch mixtures before seeking arrest warrants.',
        },
        {
          id: 'c-ram-2b',
          label: 'Exclude All Basement Physical Evidence Entirely Under Spoliation',
          legalAction:
            'Bar every recovered fiber, note, and biological swab from review due to early police scene-control failures.',
          constitutionalDelta: 0,
          evidentiaryDelta: -20,
          appellateDelta: -5,
          isOptimalStrategy: false,
          benchOutcome:
            'OVERBROAD EXCLUSION: Defects in initial police scene perimeter typically go to weight for the fact-finder rather than wholesale suppression absent bad-faith destruction (Arizona v. Youngblood).',
          doctrineNote:
            'Under Arizona v. Youngblood (1988), negligent evidence handling does not violate Due Process absent bad faith.',
        },
      ],
      historicalResolution:
        'In 2008, DA Mary Lacy formally cleared the Ramsey family citing the 2008 touch-DNA match across distinct clothing items; Boulder Police later emphasized ongoing cold-case re-testing and modern DNA review panels.',
    },
  ],

  'golden-state-killer-deangelo': [
    {
      id: 'gsk-igg-fourth',
      code: 'CONST-02A',
      title: 'Fourth Amendment & Investigative Genetic Genealogy (IGG)',
      posture: 'Sacramento Superior Court // Suppression Motion Pre-Plea',
      dilemmaPrompt:
        'Investigators upload 1980 crime-scene DNA converted to an SNP array onto a public genealogy database (GEDmatch) without a warrant, narrow the family tree to a 72-year-old former officer, and collect his DNA off a parked car door handle and discarded tissue. Defense moves to suppress under the Fourth Amendment.',
      realWorldStakes:
        'Determining where digital genetic privacy ends and lawful abandoned-property investigative collection begins.',
      requiredPrecedentId: 'prec-gsk-1',
      preferredExhibitKeyword: 'smith',
      precedentCards: [
        {
          id: 'prec-gsk-1',
          citation: 'California v. Greenwood, 486 U.S. 35 (1988)',
          ruleName: 'Abandoned Property & Reasonable Expectation of Privacy',
          holding:
            'Individuals forfeit Fourth Amendment privacy expectations in items voluntarily discarded in public or left on exposed exterior surfaces accessible to third parties.',
        },
        {
          id: 'prec-gsk-2',
          citation: 'Carpenter v. United States, 585 U.S. 296 (2018)',
          ruleName: 'Third-Party Doctrine Limits for Cell-Site Location',
          holding:
            'Requires a warrant for comprehensive historical cell-site location records held by telecom providers.',
        },
      ],
      choices: [
        {
          id: 'c-gsk-1a',
          label: 'Sustain Surreptitious Abandoned-DNA Collection & Restrict Genealogy Data to Lead Generation Only',
          legalAction:
            'Defend the arrest warrant using direct STR confirmation from discarded trash/car-handle swabs while treating GEDmatch purely as an investigative lead excluded from courtroom proof.',
          constitutionalDelta: 15,
          evidentiaryDelta: 20,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'MOTION DENIED: Direct STR match from lawfully abandoned DNA establishes overwhelming probable cause (1 in 1 sextillion) without relying on genealogy trees at trial.',
          doctrineNote:
            'DOJ 2019 Interim Policy codifies this exact boundary: IGG is an investigative lead tool; probable cause and trial proof must rest on direct confirmatory STR testing.',
        },
        {
          id: 'c-gsk-1b',
          label: 'Subpoena All GEDmatch Relatives’ Raw Medical Genomes for Trial Presentation',
          legalAction:
            'Introduce third-party distant cousins’ private genetic profiles directly into the jury trial record without consent.',
          constitutionalDelta: -20,
          evidentiaryDelta: -5,
          appellateDelta: -20,
          isOptimalStrategy: false,
          benchOutcome:
            'SEVERE PRIVACY & REVERSAL RISK: Exposes uncharged citizens’ genetic data and invites broad Fourth Amendment overbreadth challenges.',
          doctrineNote:
            'Unnecessary intrusion into non-suspect genetic privacy violates DOJ IGG guidelines and invites suppression battles.',
        },
      ],
      historicalResolution:
        'Sacramento investigators used GEDmatch strictly as a lead-generation tool and obtained direct confirmatory STR DNA from DeAngelo’s discarded tissue and vehicle handle. DeAngelo later waived suppression challenges as part of his comprehensive guilty plea.',
    },
    {
      id: 'gsk-statute-limitations',
      code: 'STAT-02B',
      title: 'Ex Post Facto Limits vs. 1970s Rape Statutes of Limitations',
      posture: 'Multi-County Consolidation // Charging Authority',
      dilemmaPrompt:
        'Joseph DeAngelo committed ~50 sexual assaults in the 1970s whose statutes of limitations expired decades ago, plus 13 homicides that have no statute of limitations. Can prosecutors revive expired 1970s rape charges alongside the murder counts?',
      realWorldStakes:
        'Respecting the Constitution’s Ex Post Facto Clause while ensuring accountability for victims of time-barred offenses.',
      requiredPrecedentId: 'prec-gsk-2a',
      preferredExhibitKeyword: 'ligature',
      precedentCards: [
        {
          id: 'prec-gsk-2a',
          citation: 'Stogner v. California, 539 U.S. 607 (2003)',
          ruleName: 'Ex Post Facto Bar on Reviving Expired Limitations Periods',
          holding:
            'The Ex Post Facto Clause prohibits states from retroactively prosecuting crimes after the original statute of limitations has already expired.',
        },
        {
          id: 'prec-gsk-2b',
          citation: 'Fed. R. Evid. 413',
          ruleName: 'Similar Crimes in Sexual-Assault Cases',
          holding: 'Permits evidence of uncharged sexual assaults in federal sexual assault trials subject to Rule 403.',
        },
      ],
      choices: [
        {
          id: 'c-gsk-2a',
          label: 'Charge Non-Expiring Murder Counts & Kidnapping for Robbery; Incorporate Time-Barred Assaults via Plea & Evidence',
          legalAction:
            'Respect Stogner v. California by filing 13 murder counts and non-expiring kidnapping charges while admitting the 1970s modus operandi pattern (ligatures/diamond knots) under Rule 404(b) / Cal. Evid. Code § 1101(b) and formal plea admissions.',
          constitutionalDelta: 20,
          evidentiaryDelta: 15,
          appellateDelta: 20,
          isOptimalStrategy: true,
          benchOutcome:
            'CONSTITUTIONALLY INVINCIBLE: Secures 11 consecutive life sentences without parole while honoring Stogner v. California and giving victims official courtroom recognition.',
          doctrineNote:
            'In June 2020, DeAngelo pleaded guilty to 13 murders and 13 kidnapping-for-robbery counts and publicly admitted dozens of uncharged 1970s rapes.',
        },
        {
          id: 'c-gsk-2b',
          label: 'File Indictments on Expired 1976 Rape Counts Under Retroactive DNA Tolling',
          legalAction:
            'Ignore expired limitations periods and indict all 50 sexual assaults directly.',
          constitutionalDelta: -20,
          evidentiaryDelta: 0,
          appellateDelta: -25,
          isOptimalStrategy: false,
          benchOutcome:
            'DISMISSED AS UNCONSTITUTIONAL: Directly violates Stogner v. California (539 U.S. 607), forcing mandatory dismissal on appeal.',
          doctrineNote:
            'Retroactive extension of limitations only applies if the prior statute had NOT yet expired when the new law took effect.',
        },
      ],
      historicalResolution:
        'California prosecutors could not charge the time-barred 1970s rapes due to Stogner v. California, so they consolidated 6 counties to charge 13 murders and 13 kidnapping counts, requiring DeAngelo to admit the uncharged rapes on the record during his 2020 plea.',
    },
  ],

  'gabby-petito-brian-laundrie': [
    {
      id: 'petito-moab-mandatory',
      code: 'STAT-03A',
      title: 'Predominant Aggressor Statute & Bodycam Lethality Audit',
      posture: 'Administrative & Statutory Review // Utah Code § 77-36-2.2',
      dilemmaPrompt:
        'On August 12, 2021, Moab officers observe facial scratches, witness statements of a physical shove, and severe emotional distress, yet classify the domestic encounter as a "mental health crisis" and separate the couple for one night without arrest. Which legal standard governed that roadside encounter?',
      realWorldStakes:
        'Distinguishing criminal assault statutes from misapplied behavioral assumptions during high-lethality domestic interventions.',
      requiredPrecedentId: 'prec-pet-1',
      preferredExhibitKeyword: 'bodycam',
      precedentCards: [
        {
          id: 'prec-pet-1',
          citation: 'Utah Code Ann. § 77-36-2.2',
          ruleName: 'Mandatory Arrest / Predominant Aggressor Analysis',
          holding:
            'When officers have probable cause that domestic violence occurred, Utah law mandates arrest or formal citation—requiring identification of the predominant aggressor rather than misclassifying physical assault as mutual mental distress.',
        },
        {
          id: 'prec-pet-2',
          citation: 'Miranda v. Arizona, 384 U.S. 436 (1966)',
          ruleName: 'Custodial Interrogation Warnings',
          holding: 'Requires advisement of rights prior to custodial police interrogation.',
        },
      ],
      choices: [
        {
          id: 'c-pet-1a',
          label: 'Apply Predominant-Aggressor Matrix & Mandatory Lethality Referral Protocol',
          legalAction:
            'Evaluate offensive vs. defensive injuries, witness accounts from 911 callers, and coercive control indicators to enforce mandatory domestic assault statutes and victim safety planning.',
          constitutionalDelta: 15,
          evidentiaryDelta: 20,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'STATUTORILY COMPLIANT: Matches the findings of the independent Price City Police audit (Jan 2022) and sparked statewide lethality assessment reforms.',
          doctrineNote:
            'Following the audit, Utah enacted mandatory domestic violence lethality assessment protocols statewide.',
        },
        {
          id: 'c-pet-1b',
          label: 'Defer Arrest Whenever Either Party Appears Visibly Anxious During Traffic Stop',
          legalAction:
            'Treat visible crying as proof of an isolated mental health episode rather than evaluating physical assault evidence.',
          constitutionalDelta: -10,
          evidentiaryDelta: -15,
          appellateDelta: -10,
          isOptimalStrategy: false,
          benchOutcome:
            'STATUTORY FAILURE: Independent review cited this exact error ("unintentional mistakes" ignoring probable cause of assault) as a critical missed intervention.',
          doctrineNote:
            'Trauma response by a victim frequently mimics agitation and must never obscure independent witness corroboration of assault.',
        },
      ],
      historicalResolution:
        'An independent January 2022 investigation concluded Moab officers made "several unintentional mistakes" by treating the stop as a mental health crisis rather than enforcing Utah’s domestic assault statutes, prompting state-level lethality protocol legislation.',
    },
    {
      id: 'petito-federal-enclave',
      code: 'JURIS-03B',
      title: 'Federal Enclave Jurisdiction vs. Posthumous Discovery',
      posture: 'U.S. District Court (Wyoming) // 18 U.S.C. § 7 & Civil Discovery',
      dilemmaPrompt:
        'Because Gabby Petito’s remains were located inside Bridger-Teton National Forest (federal land) and Brian Laundrie later died by suicide leaving a waterproof confession notebook, how do federal criminal jurisdiction and subsequent civil wrongful-death liability operate?',
      realWorldStakes:
        'Understanding federal enclave criminal authority and how criminal abatement differs from civil estate liability.',
      requiredPrecedentId: 'prec-pet-2a',
      preferredExhibitKeyword: 'journal',
      precedentCards: [
        {
          id: 'prec-pet-2a',
          citation: '18 U.S.C. § 7(3) & § 1111 (Federal Enclave Jurisdiction)',
          ruleName: 'Special Maritime and Territorial Jurisdiction',
          holding:
            'Homicides occurring on designated federal parkland trigger exclusive or concurrent federal felony jurisdiction; suspect death abates criminal prosecution but does not bar civil wrongful death claims against an estate.',
        },
        {
          id: 'prec-pet-2b',
          citation: 'Mapp v. Ohio, 367 U.S. 643 (1961)',
          ruleName: 'Warrantless Search Exclusion',
          holding: 'Suppresses evidence obtained through unlawful police searches.',
        },
      ],
      choices: [
        {
          id: 'c-pet-2a',
          label: 'Abate Criminal Indictment Upon Verified Death While Preserving Forensic Notebook for Civil Wrongful Death Action',
          legalAction:
            'Formally close the federal criminal prosecution after dental/DNA confirmation of suspect death while transferring verified confession records to support civil estate resolution.',
          constitutionalDelta: 15,
          evidentiaryDelta: 15,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'LEGALLY ACCURATE: Preserves public forensic findings, closes the FBI criminal investigation cleanly, and enables the $3M civil wrongful death judgment.',
          doctrineNote:
            'Criminal liability ends at death (abatement), whereas civil tort claims survive against a decedent’s estate.',
        },
        {
          id: 'c-pet-2b',
          label: 'Proceed to In Absentia Federal Criminal Jury Trial Against a Deceased Defendant',
          legalAction:
            'Continue prosecuting the federal indictment posthumously to obtain a formal criminal conviction.',
          constitutionalDelta: -20,
          evidentiaryDelta: 0,
          appellateDelta: -20,
          isOptimalStrategy: false,
          benchOutcome:
            'CONSTITUTIONALLY BARRED: Sixth Amendment confrontation and competency rights prohibit criminal trials of deceased defendants.',
          doctrineNote:
            'Criminal courts lose subject-matter adjudicatory purpose over a dead defendant; only civil restitution/estate litigation proceeds.',
        },
      ],
      historicalResolution:
        'After recovering Laundrie’s remains and waterproof confession notebook in Myakkahatchee Creek, the FBI closed the criminal case in January 2022. The Petito family later secured a $3 million wrongful death settlement against the Laundrie estate.',
    },
  ],

  'the-lindbergh-kidnapping-and-federal-law': [
    {
      id: 'lind-frye-wood',
      code: 'EVID-04A',
      title: 'Novel Forensic Science & The Frye General Acceptance Standard',
      posture: 'Hunterdon County Court of Oyer & Terminer // 1935 Admissibility Battle',
      dilemmaPrompt:
        'Government expert Arthur Koehler seeks to testify that microscopic wood-grain rings and planer marks on Rail 16 of the kidnapping ladder match lumber sold to Bruno Hauptmann and floor joists inside Hauptmann’s Bronx attic. Defense objects that forensic wood-matching ("xylotomy") has never been accepted in a murder trial.',
      realWorldStakes:
        'Admitting pioneering trace-pattern forensic testimony without abandoning evidentiary reliability standards.',
      requiredPrecedentId: 'prec-lind-1',
      preferredExhibitKeyword: 'ladder',
      precedentCards: [
        {
          id: 'prec-lind-1',
          citation: 'Frye v. United States, 293 F. 1013 (D.C. Cir. 1923)',
          ruleName: 'General Acceptance of Novel Scientific Principles',
          holding:
            'Expert deduction from a scientific principle is admissible only when the underlying methodology has gained general acceptance in its particular field—requiring demonstrable physical mechanics rather than subjective speculation.',
        },
        {
          id: 'prec-lind-2',
          citation: 'Brady v. Maryland, 373 U.S. 83 (1963)',
          ruleName: 'Prosecutorial Disclosure of Exculpatory Evidence',
          holding: 'Requires prosecutors to disclose material exculpatory evidence to the defense.',
        },
      ],
      choices: [
        {
          id: 'c-lind-1a',
          label: 'Establish Foundational Mechanics Through Mill Planer Defects & Nail-Hole Alignment Demonstrations',
          legalAction:
            'Have Koehler demonstrate physically in open court how unique mill knife nicks, annual growth rings, and square nail holes match the Bronx attic floor joist to the ladder rail.',
          constitutionalDelta: 10,
          evidentiaryDelta: 20,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'ADMITTED AS FOUNDATIONAL FORENSIC COMPARISON: Persuades both trial bench and appellate review; still studied as the birth of modern pattern-matching forensics.',
          doctrineNote:
            'Transparent physical tool-mark demonstration allows jurors and appellate courts to verify observable mechanics directly.',
        },
        {
          id: 'c-lind-1b',
          label: 'Offer Expert Conclusion Alone Without Displaying the Attic Joist or Mill Tracing',
          legalAction:
            'Have the witness merely state his subjective belief that the wood matches without underlying demonstratives.',
          constitutionalDelta: -5,
          evidentiaryDelta: -20,
          appellateDelta: -15,
          isOptimalStrategy: false,
          benchOutcome:
            'VULNERABLE TO EXCLUSION: Bare expert ipse dixit lacks verifiable foundation under Frye (and modern Daubert Rule 702).',
          doctrineNote:
            'Unexplained expert conclusions violate evidentiary gatekeeping rules.',
        },
      ],
      historicalResolution:
        'Judge Thomas Trenchard admitted Arthur Koehler’s forensic wood testimony after Koehler traced the wood mill-by-mill from South Carolina to the Bronx and demonstrated matching tool marks and nail holes before the jury.',
    },
    {
      id: 'lind-media-circus',
      code: 'CONST-04B',
      title: 'Sixth Amendment Fair Trial vs. Unchecked Courtroom Publicity',
      posture: 'Post-Trial Due Process & Judicial Reform // Precursor to Sheppard v. Maxwell',
      dilemmaPrompt:
        'Over 700 reporters, flashbulbs, radio microphones, and souvenir hawkers flood Flemington, NJ during the 1935 "Trial of the Century," turning courtroom steps into a spectacle. What institutional reform must federal and state courts adopt to safeguard Sixth Amendment impartiality?',
      realWorldStakes:
        'Protecting the constitutional guarantee of an impartial jury against prejudicial media saturation.',
      requiredPrecedentId: 'prec-lind-2a',
      preferredExhibitKeyword: 'ransom',
      precedentCards: [
        {
          id: 'prec-lind-2a',
          citation: 'ABA Canon 35 (1937) / Sheppard v. Maxwell, 384 U.S. 333 (1966)',
          ruleName: 'Courtroom Decorum & Fair Trial Safeguards',
          holding:
            'Trial judges bear an affirmative constitutional duty to insulate jurors from pervasive media interference, regulating cameras, press seating, and extrajudicial statements.',
        },
        {
          id: 'prec-lind-2b',
          citation: 'Katz v. United States, 389 U.S. 347 (1967)',
          ruleName: 'Reasonable Expectation of Privacy in Communications',
          holding: 'Protects private telephone communications from warrantless electronic eavesdropping.',
        },
      ],
      choices: [
        {
          id: 'c-lind-2a',
          label: 'Enact Judicial Decorum Rules, Juror Sequestration & Broadcast Restrictions (ABA Canon 35)',
          legalAction:
            'Ban intrusive photography inside courtrooms, regulate press gallery access, and enforce strict juror sequestration standards.',
          constitutionalDelta: 20,
          evidentiaryDelta: 5,
          appellateDelta: 20,
          isOptimalStrategy: true,
          benchOutcome:
            'HISTORIC CONSTITUTIONAL REFORM: Directly led to the ABA’s 1937 Canon 35 courtroom camera ban and modern Sixth Amendment publicity doctrine.',
          doctrineNote:
            'The Lindbergh trial also catalyzed enactment of the Federal Kidnapping Act (18 U.S.C. § 1201).',
        },
        {
          id: 'c-lind-2b',
          label: 'Permit Unrestricted Live Radio Commentary Inside the Jury Box Area',
          legalAction:
            'Maximize commercial press access inside the well of the courtroom throughout deliberations.',
          constitutionalDelta: -20,
          evidentiaryDelta: -5,
          appellateDelta: -20,
          isOptimalStrategy: false,
          benchOutcome:
            'DUE PROCESS VIOLATION: Modern Supreme Court doctrine (Estes v. Texas; Sheppard) reverses convictions tainted by carnival courtroom conditions.',
          doctrineNote:
            'Press freedom under the First Amendment cannot override a defendant’s Sixth Amendment right to an unprejudiced tribunal.',
        },
      ],
      historicalResolution:
        'Following the Lindbergh trial spectacle, the American Bar Association adopted Judicial Canon 35 (1937) prohibiting courtroom photography and broadcasting, and Congress strengthened the Federal Kidnapping Act ("Lindbergh Law").',
    },
  ],

  'disappearance-of-jacob-wetterling': [
    {
      id: 'wett-plea-proffer',
      code: 'STAT-05A',
      title: 'Conditional Plea Proffer & Recovery Immunity ("No Body, No Deal")',
      posture: 'U.S. District Court (Minnesota) // 2016 Federal Child Pornography & Plea Negotiation',
      dilemmaPrompt:
        'In 2016, Danny Heinrich faces federal child-pornography charges carrying decades in prison after DNA links him to the 1989 Paynesville assault, yet Jacob Wetterling’s abduction still lacks a body or direct physical link. Should prosecutors offer a sentencing cap conditioned on Heinrich leading agents to Jacob’s remains and giving a full sworn confession?',
      realWorldStakes:
        'Weighing prosecutorial punishment ceilings against delivering long-denied truth and physical recovery to a grieving family after 27 years.',
      requiredPrecedentId: 'prec-wett-1',
      preferredExhibitKeyword: 'dna',
      precedentCards: [
        {
          id: 'prec-wett-1',
          citation: 'Fed. R. Crim. P. 11(c)(1)(C) & Kastigar Proffer Boundaries',
          ruleName: 'Binding Plea Agreement & Conditional Truth-Recovery Proffer',
          holding:
            'Prosecutors may negotiate binding Rule 11(c)(1)(C) sentencing agreements conditioned on verified physical corroboration—voiding the agreement if the defendant lies or fails to produce remains.',
        },
        {
          id: 'prec-wett-2',
          citation: 'Batson v. Kentucky, 476 U.S. 79 (1986)',
          ruleName: 'Equal Protection in Jury Selection',
          holding: 'Prohibits peremptory juror strikes based solely on race.',
        },
      ],
      choices: [
        {
          id: 'c-wett-1a',
          label: 'Execute Verified Rule 11(c)(1)(C) Agreement Requiring Physical Recovery + Full Allocution',
          legalAction:
            'Condition the 20-year federal plea cap strictly on Heinrich leading FBI/BCA teams to Jacob’s burial site, forensic confirmation of remains, and a complete sworn narrative in open court.',
          constitutionalDelta: 15,
          evidentiaryDelta: 20,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'CASE RESOLVED AFTER 27 YEARS: Jacob’s remains are recovered and confirmed via dental records; Heinrich’s full confession ends 27 years of uncertainty while federal civil commitment remains available post-sentence.',
          doctrineNote:
            'Minnesota’s Sexually Dangerous Person civil commitment statutes remain legally viable even after a fixed federal criminal term.',
        },
        {
          id: 'c-wett-1b',
          label: 'Reject Any Conditional Recovery Proffer & Try Child Pornography Counts Alone',
          legalAction:
            'Refuse plea negotiations entirely and proceed solely on unrelated 2015 possession counts.',
          constitutionalDelta: 5,
          evidentiaryDelta: -15,
          appellateDelta: 5,
          isOptimalStrategy: false,
          benchOutcome:
            'TRUTH LEFT BURIED: Without a corroborated recovery proffer, state murder charges remained barred by expired limitations or lack of corpus delicti, leaving the family without closure.',
          doctrineNote:
            'Rule 11(c)(1)(C) plea deals are a lawful tool when evidentiary staleness after 27 years blocks independent state prosecution.',
        },
      ],
      historicalResolution:
        'Federal and state prosecutors negotiated a binding plea under which Heinrich led investigators to Jacob’s buried remains in Paynesville and gave a graphic sworn confession in September 2016 in exchange for a 20-year federal prison term.',
    },
    {
      id: 'wett-registry-expost',
      code: 'CONST-05B',
      title: 'The Jacob Wetterling Act & Sex Offender Registry Constitutionality',
      posture: 'Federal Statutory Framework // 42 U.S.C. § 14071 & Smith v. Doe',
      dilemmaPrompt:
        'Following Jacob’s abduction, Congress passes the 1994 Jacob Wetterling Act mandating state offender registries. Offenders challenge retroactive registration under the Ex Post Facto Clause, arguing registries impose unconstitutional retroactive punishment.',
      realWorldStakes:
        'Understanding the Supreme Court’s civil-regulatory vs. punitive test under constitutional law.',
      requiredPrecedentId: 'prec-wett-2a',
      preferredExhibitKeyword: 'tire',
      precedentCards: [
        {
          id: 'prec-wett-2a',
          citation: 'Smith v. Doe, 538 U.S. 84 (2003)',
          ruleName: 'Civil Regulatory Scheme vs. Punitive Ex Post Facto Test',
          holding:
            'Non-punitive public safety registration systems designed to protect communities from recidivism are civil regulatory measures—not retroactive criminal punishment—and therefore survive Ex Post Facto challenge.',
        },
        {
          id: 'prec-wett-2b',
          citation: 'Gideon v. Wainwright, 372 U.S. 335 (1963)',
          ruleName: 'Right to Counsel',
          holding: 'Mandates defense counsel in felony cases.',
        },
      ],
      choices: [
        {
          id: 'c-wett-2a',
          label: 'Structure Registry as Non-Punitive Public Safety Notice Tied to Law Enforcement Verification',
          legalAction:
            'Frame statutory registration around civil public-protection objectives rather than retaliatory shame or confinement.',
          constitutionalDelta: 15,
          evidentiaryDelta: 10,
          appellateDelta: 20,
          isOptimalStrategy: true,
          benchOutcome:
            'UPHELD BY U.S. SUPREME COURT: Survives Smith v. Doe constitutional scrutiny while forming the backbone of modern missing-child and Amber Alert infrastructure.',
          doctrineNote:
            'Smith v. Doe (2003) remains the controlling federal precedent distinguishing regulatory registries from punitive sanctions.',
        },
        {
          id: 'c-wett-2b',
          label: 'Impose Automatic Indefinite Prison Confinement Without Hearing Upon Failure to Notify',
          legalAction:
            'Eliminate administrative notice/hearing protections and enact punitive retroactive imprisonment.',
          constitutionalDelta: -20,
          evidentiaryDelta: 0,
          appellateDelta: -20,
          isOptimalStrategy: false,
          benchOutcome:
            'STRUCK DOWN: Crossing from regulatory notice into punitive restraint violates the Ex Post Facto and Due Process Clauses.',
          doctrineNote:
            'Constitutional registries rely strictly on non-punitive civil regulatory classification.',
        },
      ],
      historicalResolution:
        'The 1994 Jacob Wetterling Act pioneered national offender registration; in Smith v. Doe (2003), the U.S. Supreme Court upheld civil registration statutes against Ex Post Facto challenges.',
    },
  ],

  'larry-nassar-usa-gymnastics': [
    {
      id: 'nassar-allocution-bias',
      code: 'CONST-06A',
      title: 'Victim Impact Allocution vs. Judicial Impartiality',
      posture: 'Ingham County Circuit Court // Post-Sentencing Resentencing Appeal',
      dilemmaPrompt:
        'During Nassar’s 7-day sentencing hearing, more than 150 survivors deliver impact statements. Judge Rosemarie Aquilina strongly condemns Nassar’s conduct from the bench ("I just signed your death warrant"). Defense later moves for resentencing before a new judge claiming judicial bias violated Due Process.',
      realWorldStakes:
        'Reconciling victims’ statutory rights to be heard with the constitutional appearance of an impartial sentencing tribunal.',
      requiredPrecedentId: 'prec-nas-1',
      preferredExhibitKeyword: 'victim',
      precedentCards: [
        {
          id: 'prec-nas-1',
          citation: '18 U.S.C. § 3771 (CVRA) & Michigan Sentencing Review (People v. Nassar, 2020)',
          ruleName: 'Victim Allocution Rights vs. Judicial Partiality Threshold',
          holding:
            'While judges retain wide latitude to express moral gravity at sentencing after guilt is established, intemperate bench remarks invite appellate due-process scrutiny—though appellate courts uphold sentences grounded in valid, negotiated plea terms.',
        },
        {
          id: 'prec-nas-2',
          citation: 'Katz v. United States, 389 U.S. 347 (1967)',
          ruleName: 'Wiretap Warrant Requirement',
          holding: 'Requires probable cause warrants for electronic eavesdropping.',
        },
      ],
      choices: [
        {
          id: 'c-nas-1a',
          label: 'Protect Full Survivor Allocution Under CVRA While Anchoring Sentence to Objective Statutory Guidelines',
          legalAction:
            'Permit all survivors to deliver impact statements on the record while tying sentencing discretion explicitly to the negotiated guideline range and statutory harm factors.',
          constitutionalDelta: 15,
          evidentiaryDelta: 15,
          appellateDelta: 20,
          isOptimalStrategy: true,
          benchOutcome:
            'APPEAL PROOF & VICTIM-CENTERED: Honors the Crime Victims’ Rights Act while insulating the 40–175 year sentence from Due Process recusal reversals.',
          doctrineNote:
            'The Michigan Supreme Court ultimately declined resentencing in 2022 while cautioning judges on maintaining detached courtroom demeanor.',
        },
        {
          id: 'c-nas-1b',
          label: 'Exclude Survivor Impact Statements Beyond Three Representative Witnesses to Save Time',
          legalAction:
            'Bar over 150 victims from speaking in open court before sentencing.',
          constitutionalDelta: -15,
          evidentiaryDelta: -10,
          appellateDelta: -5,
          isOptimalStrategy: false,
          benchOutcome:
            'STATUTORY VIOLATION: Undermines Michigan’s Crime Victim’s Rights Act and denies victims their statutory voice on the permanent judicial record.',
          doctrineNote:
            'Statutory victim rights entitle affected individuals to be reasonably heard at sentencing.',
        },
      ],
      historicalResolution:
        'Over 150 survivors spoke during Nassar’s 2018 Ingham County sentencing. In 2022, the Michigan Supreme Court affirmed Nassar’s sentence (40–175 years) while admonishing that judicial comments risked the appearance of bias.',
    },
    {
      id: 'nassar-mandatory-reporting',
      code: 'STAT-06B',
      title: 'Institutional Cover-Up, Title IX & Mandatory Reporting Failures',
      posture: 'Federal & Institutional Accountability // Protecting Young Athletes (2018)',
      dilemmaPrompt:
        'Complaints against Nassar were escalated internally to USA Gymnastics and Michigan State officials starting in 1997–2015, yet authorities failed to notify law enforcement promptly, enabling ongoing abuse. Which statutory mechanism closes this institutional loophole?',
      realWorldStakes:
        'Converting internal institutional discretion into enforceable federal criminal liability for delayed reporting.',
      requiredPrecedentId: 'prec-nas-2a',
      preferredExhibitKeyword: 'title',
      precedentCards: [
        {
          id: 'prec-nas-2a',
          citation: 'Protecting Young Victims from Sexual Abuse Act (36 U.S.C. § 220541)',
          ruleName: '24-Hour Mandatory Law Enforcement Reporting Mandate',
          holding:
            'Requires national governing sports bodies and adults authorized to interact with amateur minor athletes to report suspicions of child sexual abuse to law enforcement within 24 hours—removing internal vetting delays.',
        },
        {
          id: 'prec-nas-2b',
          citation: 'Brady v. Maryland, 373 U.S. 83 (1963)',
          ruleName: 'Exculpatory Evidence Disclosure',
          holding: 'Governs prosecutorial disclosure duties to criminal defendants.',
        },
      ],
      choices: [
        {
          id: 'c-nas-2a',
          label: 'Enforce 24-Hour External Reporting Duty & Strip Governing-Body Self-Policing',
          legalAction:
            'Mandate immediate reporting directly to FBI/local police within 24 hours, paired with criminal penalties for institutional concealment and independent SafeSport oversight.',
          constitutionalDelta: 15,
          evidentiaryDelta: 15,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'SYSTEMIC REFORM ENACTED: Mirrors the 2018 federal Protecting Young Victims from Sexual Abuse Act and Michigan’s statutory mandatory-reporter expansions.',
          doctrineNote:
            'External mandatory reporting prevents institutions from prioritizing brand reputation over child safety.',
        },
        {
          id: 'c-nas-2b',
          label: 'Allow Institutions 90 Days for Confidential Internal HR Investigation Before Notifying Police',
          legalAction:
            'Delegate initial credibility screening exclusively to internal federation counsel.',
          constitutionalDelta: -15,
          evidentiaryDelta: -15,
          appellateDelta: -10,
          isOptimalStrategy: false,
          benchOutcome:
            'SYSTEMIC RECURRENCE RISK: Delaying police notification allows evidence degradation and continued offender access to victims.',
          doctrineNote:
            'Internal HR units lack forensic interviewing credentials and create conflict-of-interest concealment.',
        },
      ],
      historicalResolution:
        'The Nassar case triggered the federal Protecting Young Victims from Sexual Abuse and Safe Sport Authorization Act (2018), a $500M Michigan State settlement, and a $380M USAG/USOPC survivor bankruptcy resolution.',
    },
  ],

  'jeffrey-epstein-ghislaine-maxwell-investigation': [
    {
      id: 'epstein-npa-scope',
      code: 'CONST-07A',
      title: 'Scope of the 2007 Florida Non-Prosecution Agreement (SDFL vs. SDNY)',
      posture: 'U.S. Court of Appeals for the Second Circuit // United States v. Maxwell',
      dilemmaPrompt:
        'In 2007, the U.S. Attorney for the Southern District of Florida signed a Non-Prosecution Agreement (NPA) immunizing Jeffrey Epstein and "any potential co-conspirators." In 2020, SDNY prosecutors indict Ghislaine Maxwell in New York. Maxwell moves to dismiss the indictment arguing the Florida NPA bars prosecution anywhere in the United States.',
      realWorldStakes:
        'Determining whether a single district U.S. Attorney can silently immunize co-conspirators nationwide without Main Justice authorization.',
      requiredPrecedentId: 'prec-ep-1',
      preferredExhibitKeyword: 'npa',
      precedentCards: [
        {
          id: 'prec-ep-1',
          citation: 'United States v. Annabi, 771 F.2d 670 (2d Cir. 1985) & U.S. v. Maxwell (2d Cir. 2024)',
          ruleName: 'Territorial Scope of Federal Plea / NPA Agreements',
          holding:
            'A plea or non-prosecution agreement made by one U.S. Attorney’s Office binds ONLY that specific district unless there is an affirmative showing that another district or Main Justice expressly consented to be bound.',
        },
        {
          id: 'prec-ep-2',
          citation: 'Gideon v. Wainwright, 372 U.S. 335 (1963)',
          ruleName: 'Indigent Defense Counsel',
          holding: 'Establishes felony right to appointed counsel.',
        },
      ],
      choices: [
        {
          id: 'c-ep-1a',
          label: 'Deny Motion Under Annabi: Limit SDFL NPA Exclusively to Southern District of Florida',
          legalAction:
            'Hold that because the NPA used "the United States" without affirmative commitment from SDNY or the DOJ Criminal Division, SDNY retained independent authority to indict Maxwell.',
          constitutionalDelta: 15,
          evidentiaryDelta: 15,
          appellateDelta: 20,
          isOptimalStrategy: true,
          benchOutcome:
            'AFFIRMED BY SECOND CIRCUIT (2024): Motion to dismiss denied; Maxwell’s convictions on 5 federal counts and 20-year sentence affirmed on appeal.',
          doctrineNote:
            'Under Second Circuit precedent (Annabi), ambiguity in district-level NPAs does not silently bind sister federal districts.',
        },
        {
          id: 'c-ep-1b',
          label: 'Dismiss All SDNY Counts Nationwide Under Blanket Reading of Florida NPA',
          legalAction:
            'Treat any local U.S. Attorney phrase "the United States" as permanent nationwide immunity for unnamed co-conspirators.',
          constitutionalDelta: -10,
          evidentiaryDelta: -20,
          appellateDelta: -15,
          isOptimalStrategy: false,
          benchOutcome:
            'CONTRARY TO SECOND CIRCUIT LAW: Would allow one regional office to secretly extinguish federal prosecutions across all 94 districts without DOJ approval.',
          doctrineNote:
            'Federal prosecutors in SDNY are not bound by unilateral SDFL agreements absent express multi-district authorization.',
        },
      ],
      historicalResolution:
        'Both District Judge Alison Nathan and the Second Circuit Court of Appeals (September 2024) held under United States v. Annabi that the 2007 Florida NPA bound only SDFL and did not bar SDNY’s prosecution of Ghislaine Maxwell.',
    },
    {
      id: 'epstein-cvra-secret',
      code: 'STAT-07B',
      title: 'Secret Plea Bargaining vs. The Crime Victims’ Rights Act (CVRA)',
      posture: 'U.S. District Court (SDFL) // Jane Doe 1 & 2 v. United States',
      dilemmaPrompt:
        'Federal prosecutors negotiate and finalize the 2007 Epstein NPA in secrecy, deliberately concealing the deal from identified underage victims until after it is signed in state court. Do victims hold enforceable statutory rights prior to formal federal indictment?',
      realWorldStakes:
        'Testing the limits of secret pre-charge prosecutorial agreements against statutory victims’ rights.',
      requiredPrecedentId: 'prec-ep-2a',
      preferredExhibitKeyword: 'flight',
      precedentCards: [
        {
          id: 'prec-ep-2a',
          citation: '18 U.S.C. § 3771 (CVRA) & In re Wild (11th Cir. en banc)',
          ruleName: 'Pre-Indictment Victim Conferral vs. Judicial Remedies',
          holding:
            'While courts found the government’s deliberate concealment violated the spirit of the CVRA, the 11th Circuit held en banc that 18 U.S.C. § 3771 did not create a standalone private lawsuit before formal federal charges are filed—prompting DOJ Office of Professional Responsibility sanctions and statutory reform proposals.',
        },
        {
          id: 'prec-ep-2b',
          citation: 'Crawford v. Washington, 541 U.S. 36 (2004)',
          ruleName: 'Sixth Amendment Confrontation Clause',
          holding: 'Bars testimonial hearsay absent unavailability and prior cross-examination.',
        },
      ],
      choices: [
        {
          id: 'c-ep-2a',
          label: 'Enforce Mandatory DOJ Victim Conferral Policy Prior to Any Non-Prosecution Deal & Mandate Public Accountability',
          legalAction:
            'Require written DOJ victim consultation before executing pre-indictment declinations or NPAs, closing the pre-charge secrecy loophole exposed in Jane Doe 1 & 2.',
          constitutionalDelta: 20,
          evidentiaryDelta: 10,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'REFORM MANDATE VERIFIED: Aligns with the 2020 DOJ Office of Professional Responsibility report condemning the secrecy and modern CVRA reform bills.',
          doctrineNote:
            'Even where pre-indictment suits face procedural bars (In re Wild), DOJ internal rules now mandate timely victim notification.',
        },
        {
          id: 'c-ep-2b',
          label: 'Seal Pre-Charge Immunity Agreements Permanently From Affected Victims',
          legalAction:
            'Permit prosecutors to affirmatively mislead victims that an investigation remains ongoing after secretly signing immunity deals.',
          constitutionalDelta: -20,
          evidentiaryDelta: -10,
          appellateDelta: -15,
          isOptimalStrategy: false,
          benchOutcome:
            'INSTITUTIONAL FAILURE: Found by federal judges and DOJ OPR (2020) to constitute "poor judgment" and a betrayal of victim rights.',
          doctrineNote:
            'Secret plea concealment destroys public trust in equal justice under law.',
        },
      ],
      historicalResolution:
        'Judge Kenneth Marra ruled in 2019 that prosecutors violated the CVRA by concealing the deal from victims, and the DOJ’s 2020 OPR investigation cited serious failures of judgment. Congress subsequently pursued amendments to strengthen pre-indictment CVRA enforcement.',
    },
  ],
};

export function getDilemmasForCase(caseData: CaseFile): LegalDilemmaScenario[] {
  if (CASE_SPECIFIC_DILEMMAS[caseData.slug]) {
    return CASE_SPECIFIC_DILEMMAS[caseData.slug];
  }

  // Dynamic fallback grounded in actual case metadata for any admin-created case
  const firstEx = caseData.evidence?.[0]?.title || 'Primary Forensic Exhibit';
  const courtName = caseData.courtroom?.court || 'United States District Court';

  return [
    {
      id: `${caseData.slug}-const-01`,
      code: 'CONST-GEN-01',
      title: 'Evidentiary Gatekeeping & Chain of Custody Authentication',
      posture: `${courtName} // Pre-Trial Admissibility Hearing`,
      dilemmaPrompt: `Defense moves to exclude ${firstEx}, arguing breaks in custodial logs and prejudicial inference under Rule 403. How must counsel establish lawful admissibility?`,
      realWorldStakes: 'Ensuring trial exhibits satisfy Federal Rules of Evidence without inviting appellate reversal.',
      requiredPrecedentId: 'prec-gen-1',
      preferredExhibitKeyword: caseData.evidence?.[0]?.exhibitNumber || 'EX-01',
      precedentCards: [
        {
          id: 'prec-gen-1',
          citation: 'Fed. R. Evid. 901(a) & Daubert, 509 U.S. 579 (1993)',
          ruleName: 'Authentication & Scientific Gatekeeping',
          holding:
            'Admitting physical or forensic exhibits requires witness or custodial records establishing the item is what the proponent claims via reliable methodology.',
        },
        {
          id: 'prec-gen-2',
          citation: 'Miranda v. Arizona, 384 U.S. 436 (1966)',
          ruleName: 'Custodial Warnings',
          holding: 'Governs police custodial interrogation advisements.',
        },
      ],
      choices: [
        {
          id: 'c-gen-1a',
          label: 'Proffer Sworn Custodial Receipt & Forensic Validation Foundation',
          legalAction:
            'Call the recovering agent and forensic analyst to verify unbroken vault logs and laboratory methodology prior to jury publication.',
          constitutionalDelta: 15,
          evidentiaryDelta: 20,
          appellateDelta: 15,
          isOptimalStrategy: true,
          benchOutcome:
            'EXHIBIT ADMITTED: Satisfies Rule 901 and insulates the trial record against Rule 403 suppression.',
          doctrineNote: 'Contemporaneous FD-302 recovery records anchor evidentiary reliability.',
        },
        {
          id: 'c-gen-1b',
          label: 'Publish Unauthenticated Summaries Directly in Opening Statement',
          legalAction: 'Present contested physical claims without custodial witnesses.',
          constitutionalDelta: -15,
          evidentiaryDelta: -15,
          appellateDelta: -20,
          isOptimalStrategy: false,
          benchOutcome: 'OBJECTION SUSTAINED: Risks mistrial or reversal for prosecutorial overreach.',
          doctrineNote: 'Opening arguments may not reference inadmissible exhibits.',
        },
      ],
      historicalResolution:
        caseData.verdict?.appealsAndRulings ||
        caseData.courtroom?.prosecutionArgument ||
        'Proceedings resolved under established federal and state evidentiary standards.',
    },
  ];
}
