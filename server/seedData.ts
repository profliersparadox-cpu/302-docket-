import { CaseFile } from '../src/types.ts';

export const initialCases: CaseFile[] = [
  // ==========================================
  // CASE 001 — JONBENÉT RAMSEY (Boulder, CO, 1996)
  // ==========================================
  {
    id: 'case-001-ramsey',
    slug: 'jonbenet-ramsey-boulder',
    caseNumber: 'DOCKET-001-CO-1996',
    title: 'CASE 001 — JONBENÉT RAMSEY',
    subtitle: 'Boulder Police Department Casework #96-15795: Unsolved Child Homicide & Ransom Note Analysis',
    category: 'Crimes Against Children',
    location: 'Boulder, Colorado',
    year: 1996,
    status: 'Cold Case / Unresolved',
    isPublished: true,
    isFeatured: true,
    contentWarnings: [
      'Documented child homicide investigation',
      'Unresolved cold case evidence',
      'Non-graphic factual procedural reporting',
    ],
    summary:
      'On December 26, 1996, six-year-old JonBenét Ramsey was reported kidnapped after her mother discovered a 2.5-page handwritten ransom note on a back staircase demanding $118,000. Seven hours later, her body was discovered in the basement wine cellar of the family home. The investigation was marred by early crime scene contamination, conflicting investigative theories (intruder vs. household members), a 1999 grand jury indictment that the district attorney declined to prosecute, and foreign male DNA profiles in CODIS that remain unidentified.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    overview: {
      background:
        'JonBenét Patricia Ramsey (born August 6, 1990) was a six-year-old beauty pageant titleholder living with her parents, John and Patsy Ramsey, and nine-year-old brother Burke in a 7,000-square-foot Tudor-style residence at 755 15th Street in Boulder, Colorado. John Ramsey was the chief executive of Access Graphics, a computer systems subsidiary of Lockheed Martin.',
      victimInfo:
        'JonBenét Ramsey, aged 6. Autopsy conducted by Boulder County Coroner Dr. John Meyer determined cause of death was asphyxia by strangulation associated with craniocerebral trauma.',
      jurisdiction:
        'Boulder Police Department, Boulder County District Attorney’s Office, Colorado Bureau of Investigation (CBI), and FBI Behavioral Analysis Unit (consultative capacity).',
      initialAlertDate: 'December 26, 1996 at 05:52 AM (911 emergency call placed by Patsy Ramsey)',
    },
    incident: {
      narrative:
        'The Ramsey family returned home from a Christmas dinner at friends’ house around 10:00 PM on December 25, 1996. At approximately 5:30 AM on December 26, Patsy Ramsey awakened and discovered three handwritten pages on the back spiral staircase. The note claimed JonBenét had been taken by a "small foreign faction" demanding an exact sum of $118,000. At 5:52 AM, Patsy dialed 911. Friends and victim advocates were summoned to the residence, inadvertently contaminating potential forensic evidence prior to a comprehensive forensic lockdown.',
      timeline: [
        {
          date: 'December 25, 1996 ~10:00 PM',
          title: 'Ramsey Family Returns Home',
          description: 'Family returns from Christmas party; JonBenét is carried upstairs to bed asleep.',
          source: 'Boulder Police Interview Records',
        },
        {
          date: 'December 26, 1996 05:52 AM',
          title: '911 Kidnapping Call',
          description: 'Patsy Ramsey reports finding 2.5-page ransom note demanding $118,000; officer arrives at 5:59 AM.',
          source: 'Boulder Emergency Communications Dispatch Audio Log',
        },
        {
          date: 'December 26, 1996 ~01:05 PM',
          title: 'Discovery of Victim in Basement',
          description: 'Detective Linda Arndt instructs John Ramsey and friend Fleet White to search the house for anything unusual; John discovers JonBenét’s body in the windowless basement wine cellar.',
          source: 'Detective Linda Arndt Sworn Deposition (1998)',
        },
      ],
    },
    investigation: {
      narrative:
        'The investigation immediately divided into two competing schools of thought: the "Umbrella of Suspicion" directed at the parents by Boulder Police Department detectives, versus the "Intruder Theory" championed by legendary Colorado Springs homicide detective Lou Smit. In 1997, Smit identified an unlatched basement window with a broken pane, suitcase positioned beneath it, and scuff marks indicating external entry. Modern genetic testing re-examined the garrote cord, paintbrush handle sourced from Patsy’s art kit, and unidentified male DNA in the waistband and panties.',
      procedureNotes:
        'Crime scene was not cordoned off as a homicide scene until after the body was discovered at 1:05 PM, allowing numerous visitors to traverse floors. Handwriting exemplars collected from John and Patsy Ramsey; John was eliminated as author, while Patsy was classified as "could not be excluded."',
      interviewRecordsSummary:
        'Over 140 formal interviews conducted. FBI profiler John Douglas conducted behavioral analysis concluding the crime was inconsistent with familial homicide pattern.',
      timeline: [
        {
          date: 'January 1997',
          title: 'Detective Lou Smit Recruited',
          description: 'Boulder DA Alex Hunter hires veteran investigator Lou Smit to examine evidence independently.',
          source: 'Boulder County DA Memorandum',
        },
        {
          date: 'September 1998',
          title: 'Grand Jury Convened',
          description: 'Boulder County Grand Jury impaneled to hear testimony from forensic scientists, family members, and investigators.',
          source: 'State Judicial Records',
        },
        {
          date: 'July 2008',
          title: 'Touch-DNA Exoneration Letter',
          description: 'DA Mary Lacy issues formal letter exonerating Ramsey family members based on touch-DNA finding of an unknown male profile.',
          source: 'Boulder County DA Official Correspondence',
        },
      ],
    },
    evidence: [
      {
        id: 'ev-ramsey-01',
        exhibitNumber: 'CBI-EXHIBIT-01',
        title: 'The 2.5-Page Handwritten Ransom Note',
        type: 'document',
        description:
          'Three sheets of lined legal paper torn from Patsy Ramsey’s personal notepad using a Sharpie pen from the home. Demanded $118,000—identical to John Ramsey’s 1996 corporate bonus.',
        significance:
          'Longest ransom note in FBI annals (375 words). Contains quotes and linguistic parallels to Hollywood films including Speed, Ransom, and Dirty Harry.',
        recoveredAt: 'December 26, 1996 06:00 AM',
        recoveredBy: 'Officer Rick French, Boulder PD',
        classification: 'Public Record',
      },
      {
        id: 'ev-ramsey-02',
        exhibitNumber: 'CBI-DNA-002',
        title: 'Unidentified Male Biological Profile (CODIS Case Record)',
        type: 'forensic',
        description:
          'STR nuclear DNA profile recovered from blood spots on JonBenét’s underwear and matched to touch-DNA on the waistband of her long johns in 2008. Entered into CODIS under unidentified male profile.',
        significance:
          'Points to an unknown male contributor not matching any Ramsey family member, law enforcement officer, or coroner staff.',
        recoveredAt: '1997 & 2008',
        recoveredBy: 'Colorado Bureau of Investigation / Bode Technology',
        classification: 'Confidential',
      },
      {
        id: 'ev-ramsey-03',
        exhibitNumber: 'CBI-PHOTO-BASEMENT',
        title: 'Basement Window Grating & Footprint Impressions',
        type: 'physical',
        description:
          'Unlatched ground-level basement window with broken pane and foliage disturbance, beneath which a Samsonite suitcase was positioned.',
        significance:
          'Core physical basis for the intruder theory presented by Lou Smit, contesting the claim that the house was sealed.',
        recoveredAt: 'December 1996 / March 1997',
        recoveredBy: 'Detective Lou Smit',
        classification: 'FD-302 Record',
      },
    ],
    personsOfInterest: [
      {
        id: 'poi-john-ramsey',
        name: 'John Bennett Ramsey',
        role: 'Father of Victim',
        status: 'Exonerated',
        background: 'CEO of Access Graphics; corporate executive and pilot.',
        verifiedFindings:
          'Eliminated as source of handwriting by Secret Service and CBI analysts; DNA does not match the foreign profile in CODIS. Exonerated by DA Mary Lacy in 2008.',
        allegations:
          'Early focus of Boulder PD leaks suggesting familial staging; indicted by 1999 Grand Jury on child abuse neglect charges that the DA refused to sign.',
        outcome: 'No criminal charges filed; continues to advocate for advanced forensic genealogy testing.',
      },
      {
        id: 'poi-patsy-ramsey',
        name: 'Patricia Ann Ramsey',
        alias: 'Patsy Ramsey',
        role: 'Mother of Victim',
        status: 'Deceased',
        background: 'Former Miss West Virginia (1977); mother of JonBenét and Burke.',
        verifiedFindings:
          'Handwriting analysis was inconclusive ("could not be eliminated"); DNA does not match foreign profile. Passed away from ovarian cancer in 2006.',
        allegations:
          'Accused by select investigators of writing the note in panic to stage an accidental trauma incident.',
        outcome: 'Exonerated post-mortem by DA Mary Lacy in 2008.',
      },
      {
        id: 'poi-unknown-intruder',
        name: 'Unknown Male Contributor ("Subject CODIS-CO-1996")',
        role: 'Unidentified Suspect',
        status: 'Uncharged Suspect',
        background: 'Male profile matching touch-DNA and epithelial cell samples recovered from victim garments.',
        verifiedFindings:
          'Profile registered in the FBI Combined DNA Index System (CODIS); no match found across millions of offender profiles to date.',
        allegations:
          'Hypothesized by Lou Smit and independent cold case investigators as an intruder with local familiarity or pageant stalking fixation.',
        outcome: 'Subject remains unidentified; case remains an open, active cold case homicide investigation.',
      },
    ],
    breakthrough: {
      narrative:
        'The primary modern investigative breakthrough occurred in 2008 when Bode Technology utilized newly developed touch-DNA analysis on the waistband of JonBenét’s clothing, confirming the presence of genetic material matching the foreign male profile previously isolated from her underwear.',
      turningPoints: [
        {
          date: 'October 1999',
          title: 'Grand Jury Indictment True Bills',
          detail:
            'Grand jury votes to indict John and Patsy Ramsey for permitting child abuse; DA Alex Hunter refuses to sign, determining evidence insufficient to prove beyond reasonable doubt at trial.',
        },
        {
          date: 'July 2008',
          title: 'Touch-DNA Matches Foreign Profile',
          detail:
            'Testing of newly swabbed areas on the waistband reveals matching unknown male alleles, leading District Attorney Mary Lacy to issue an official apology and exoneration letter.',
        },
        {
          date: 'December 2022',
          title: 'Boulder Police Cold Case DNA Audit',
          detail:
            'Boulder PD announces partnership with the Colorado Cold Case Review Team to apply modern forensic genetic genealogy to surviving biological evidence.',
        },
      ],
    },
    courtroom: {
      court: 'Boulder County District Court (20th Judicial District of Colorado)',
      presidingJudge: 'Chief Judge Roxanne Bailin (Supervising 1999 Grand Jury)',
      charges: [
        'No formal criminal trial ever held.',
        'Grand Jury True Bill (1999, unsealed 2013): CRS 18-6-401 Child Abuse Resulting in Death (Never signed or prosecuted by DA).',
      ],
      prosecutionArgument:
        'District Attorney Alex Hunter concluded on October 13, 1999 that there was insufficient admissible evidence to warrant a public prosecution or secure a unanimous conviction before a trial jury.',
      defenseArgument:
        'Ramsey defense counsel (Hal Haddon and Lin Wood) maintained innocence, pointing to DNA exclusion, forensic evidence of external entry, and catastrophic leaks from police leadership.',
      keyTestimonies: [
        {
          witness: 'Lou Smit',
          role: 'DA Senior Investigator',
          keyPoints:
            'Testified before the grand jury demonstrating photographic evidence of basement window access, stun gun mark measurements, and foreign shoe print impressions.',
        },
        {
          witness: 'Dr. Henry Lee',
          role: 'Renowned Forensic Scientist',
          keyPoints:
            'Analyzed crime scene preservation failures and verified foreign DNA mixtures on victim clothing.',
        },
      ],
      trialTimeline: [
        {
          date: 'September 15, 1998',
          title: 'Grand Jury Impaneled',
          description: 'Hears testimony from dozens of witnesses over 13 months.',
        },
        {
          date: 'October 13, 1999',
          title: 'DA Hunter Declines Prosecution',
          description: 'Announces grand jury dismissed without public indictments.',
        },
        {
          date: 'October 25, 2013',
          title: 'Court Orders Unsealing of 1999 True Bills',
          description: 'Judge Bailin orders release of four indictment pages revealing grand jury vote.',
        },
      ],
    },
    verdict: {
      verdictDate: 'October 13, 1999 (Grand Jury Dismissal) / Unsolved',
      pleaOrVerdict: 'No Verdict / No Trial Conducted / Case Remains Open',
      sentencing: 'None. No individuals ever convicted in court.',
      appealsAndRulings:
        'Civil defamation settlements achieved against multiple media outlets regarding false accusations.',
      unresolvedLegalQuestions:
        'Whether modern next-generation SNP sequencing and forensic genetic genealogy can resolve the unidentified male CODIS profile.',
    },
    aftermath: {
      legalReforms: [
        'Revisions to Colorado municipal crime scene containment and multi-agency homicide protocols',
        'Colorado Cold Case Database Task Force establishment',
        'Heightened judicial standards regarding grand jury secrecy and unsealing of true bills',
      ],
      institutionalImpact:
        'Resignation of Boulder Police Chief Tom Koby and District Attorney Alex Hunter; widespread overhaul of child homicide investigative training nationwide.',
      victimAdvocacy:
        'Creation of the JonBenét Ramsey Children’s Foundation and ongoing legal campaigns for independent federal review.',
      currentStatus: 'Unsolved cold case. Active investigation maintained by the Boulder Police Department.',
    },
    reflectionPrompts: [
      {
        question: 'How did immediate crime scene contamination permanently compromise physical evidence?',
        context: 'Dozens of family friends and non-forensic personnel were permitted into the home before a forensic sweep.',
        legalOrEthicalIssue: 'The balance between victim compassion and rigid crime scene containment protocols.',
      },
      {
        question: 'What ethical dilemmas arise when a Grand Jury votes to indict but the prosecutor refuses to sign?',
        context: 'DA Alex Hunter believed the state could not meet the constitutional standard of proof beyond a reasonable doubt.',
        legalOrEthicalIssue: 'The division of power between citizen grand juries and executive prosecutorial discretion.',
      },
    ],
    citations: [
      {
        title: 'Boulder County Grand Jury True Bill (CRS 18-6-401)',
        source: 'Boulder County District Court Records (Unsealed October 2013)',
        date: 'October 1999',
      },
      {
        title: 'Boulder County Coroner Autopsy Report #96A-155 (Dr. John Meyer)',
        source: 'Boulder County Coroner Office Public Record',
        date: 'December 27, 1996',
      },
      {
        title: 'Official Exoneration Correspondence of District Attorney Mary T. Lacy',
        source: 'Boulder County District Attorney’s Office',
        date: 'July 9, 2008',
      },
    ],
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // ==========================================
  // CASE 002 — THE GOLDEN STATE KILLER (CA, 1970s–1980s)
  // ==========================================
  {
    id: 'case-002-gsk',
    slug: 'golden-state-killer-deangelo',
    caseNumber: 'DOCKET-002-CA-1974',
    title: 'CASE 002 — THE GOLDEN STATE KILLER',
    subtitle: 'Joint Multi-Jurisdiction Casework: The 44-Year Manhunt for the East Area Rapist & Forensic Genealogy Breakthrough',
    category: 'Homicide',
    location: 'Sacramento, Contra Costa & Orange Counties, California',
    year: 1974,
    status: 'Convicted',
    isPublished: true,
    isFeatured: true,
    contentWarnings: [
      'Serial homicide and home invasion assaults',
      'Complex multi-jurisdictional cold case',
      'Pioneering forensic genetic genealogy',
    ],
    summary:
      'Between 1974 and 1986, an unidentified perpetrator committed at least 13 murders, over 50 rapes, and 120 burglaries across ten California counties. Operating under monikers including the Visalia Ransacker, the East Area Rapist, and the Original Night Stalker, the offender evaded detection for over four decades. In 2018, cold case investigators utilized investigative genetic genealogy (IGG) to compare crime scene DNA against open consumer genealogical databases, leading to former police officer Joseph James DeAngelo.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    overview: {
      background:
        'Operating predominantly in residential suburban subdivisions, the perpetrator demonstrated sophisticated knowledge of law enforcement shift patterns, tactical weapons handling, and counter-surveillance. For over twenty years, state investigators believed the Northern California rapist and Southern California serial killer were distinct criminals until DNA profiling linked the cases in 2001.',
      victimInfo:
        'Thirteen confirmed murder victims and over fifty documented survivors across Sacramento, Contra Costa, San Joaquin, Stanislaus, Santa Clara, Alameda, Santa Barbara, and Orange counties.',
      jurisdiction:
        'California Department of Justice, Sacramento County Sheriff, Orange County DA, Contra Costa Sheriff, and FBI Sacramento Field Office.',
      initialAlertDate: 'June 18, 1976 (First confirmed East Area Rapist assault in Rancho Cordova, CA)',
    },
    incident: {
      narrative:
        'The attacker methodically cased targeted homes days in advance, entering to unbolt windows, remove bullets from household handguns, and pre-position ligature cords under sofa cushions. During nighttime attacks, he awakened occupants with blinding flashlights, forced victims onto their stomachs, and balanced ceramic dishes on the male partner’s back with warnings of immediate execution if sounds were heard.',
      timeline: [
        {
          date: 'September 11, 1975',
          title: 'Murder of Professor Claude Snelling',
          description: 'Visalia Ransacker shoots Claude Snelling while preventing the abduction of Snelling’s teenage daughter.',
          source: 'Visalia Police Case Record #75-1044',
        },
        {
          date: 'February 2, 1978',
          title: 'Murders of Brian and Katie Maggiore',
          description: 'Air Force sergeant and his wife executed in Rancho Cordova while walking their dog.',
          source: 'Sacramento County Sheriff Incident Log',
        },
        {
          date: 'May 4, 1986',
          title: 'Murder of Janelle Cruz',
          description: 'Final known crime committed in Irvine, California; biological specimen preserved at minus-20 degrees.',
          source: 'Orange County Sheriff Crime Lab Report',
        },
      ],
    },
    investigation: {
      narrative:
        'In 2001, Orange County crime lab director Paul Holes utilized emerging STR typing to prove the East Area Rapist and Original Night Stalker were the same genetic individual. With the CODIS database producing no offender matches over 17 years, Holes collaborated with genealogist Dr. Barbara Rae-Venter in 2017 to convert biological DNA into 600,000 single nucleotide polymorphisms (SNPs) and search public genealogy databases, constructing extensive family trees spanning back to the 1800s.',
      procedureNotes:
        'Public database GEDmatch and FamilyTreeDNA records utilized under fourth amendment third-party doctrine. Abandoned DNA collected from DeAngelo’s vehicle door handle outside a Hobby Lobby and a discarded tissue.',
      interviewRecordsSummary:
        'Thousands of archival interview transcripts reviewed. Consistent witness recollections noted athletic agility, specialized maritime diamond knots, and tactical terminology.',
      timeline: [
        {
          date: 'Spring 2001',
          title: 'DNA Links North & South California Cases',
          description: 'Forensic scientist Paul Holes links EAR rape kits with ONS murder evidence via STR profiles.',
          source: 'California Department of Justice Crime Lab Bulletin',
        },
        {
          date: 'March 2018',
          title: 'Genealogical Tree Identifies DeAngelo',
          description: 'Investigative team narrows tree of thousands of descendants to Joseph James DeAngelo based on age and geographic proximity.',
          source: 'Sacramento DA Investigative Summary',
        },
        {
          date: 'April 24, 2018',
          title: '100% Forensic DNA Match & Arrest',
          description: 'Confirmatory DNA analysis matches DeAngelo at 1-in-several-sextillion probability; arrest executed in Citrus Heights.',
          source: 'Joint Federal and State Press Briefing',
        },
      ],
    },
    evidence: [
      {
        id: 'ev-gsk-01',
        exhibitNumber: 'VENTURA-EXHIBIT-DNA',
        title: 'Lyman & Charlene Smith Crime Scene Specimen (Ventura, 1980)',
        type: 'forensic',
        description:
          'Frozen biological evidence preserved for 38 years. Provided high-integrity nuclear DNA enabling dense SNP microarray genotyping.',
        significance:
          'The definitive scientific benchmark that broke the 44-year cold case and conclusively matched DeAngelo.',
        recoveredAt: 'March 1980 / Re-analyzed 2018',
        recoveredBy: 'Ventura County Coroner Lab',
        classification: 'Public Record',
      },
      {
        id: 'ev-gsk-02',
        exhibitNumber: 'EXHIBIT-LIGATURE-04',
        title: 'Braided Ligature Cords & Diamond Knot Ties',
        type: 'physical',
        description:
          'Braided nylon cords recovered across multiple crime scenes tied in distinctive diamond knots characteristic of naval rigging.',
        significance:
          'Corroborated DeAngelo’s naval background aboard the USS Piedmont during the Vietnam War.',
        recoveredAt: '1976-1981',
        recoveredBy: 'Contra Costa County Sheriff Evidence Vault',
        classification: 'Confidential',
      },
    ],
    personsOfInterest: [
      {
        id: 'poi-deangelo',
        name: 'Joseph James DeAngelo Jr.',
        alias: 'The Golden State Killer / East Area Rapist / Visalia Ransacker',
        role: 'Defendant / Former Police Officer',
        status: 'Convicted',
        background:
          'Former Exeter and Auburn police officer; Navy veteran; worked 27 years as a distribution mechanic until retirement.',
        verifiedFindings:
          'Pleaded guilty in open court to 13 counts of first-degree murder with special circumstances and admitted to 62 uncharged offenses.',
        allegations:
          'Leveraged active law enforcement training, radio scanners, and night-vision techniques to commit crimes without apprehension.',
        outcome:
          'Sentenced to consecutive life sentences without the possibility of parole. Currently incarcerated at California State Prison, Corcoran.',
      },
    ],
    breakthrough: {
      narrative:
        'The historic deployment of Investigative Genetic Genealogy (IGG) bridged forensic science and civilian consumer genealogy, proving that biological cold cases can be resolved even when the perpetrator has no prior felony record in CODIS.',
      turningPoints: [
        {
          date: 'April 2018',
          title: '3rd-Cousin Match on GEDmatch',
          detail: 'Genealogists discovered matches sharing ~2-3% DNA, establishing ancestral great-great-great grandparents.',
        },
        {
          date: 'April 23, 2018',
          title: 'Surreptitious DNA Capture',
          detail: 'Undercover detectives swabbed car handle and discarded paper towel, confirming exact forensic match.',
        },
      ],
    },
    courtroom: {
      court: 'Sacramento County Superior Court (Convened at Sacramento State University Ballroom)',
      presidingJudge: 'Judge Michael Bowman',
      charges: [
        '13 counts of First-Degree Murder with Special Circumstances (Lying in wait, rape, and burglary)',
        '13 counts of Kidnapping to Commit Robbery',
      ],
      prosecutionArgument:
        'A historic multi-county coalition of prosecutors presented overwhelming forensic certainty, documenting four decades of calculated terror across California communities.',
      defenseArgument:
        'Public defenders negotiated a comprehensive plea agreement avoiding the death penalty in exchange for admitting guilt to all charged and uncharged offenses.',
      keyTestimonies: [
        {
          witness: 'Surviving Victims & Family Members (Over 40 Witnesses)',
          role: 'Victim Impact Panels',
          keyPoints:
            'Delivered three consecutive days of public testimony, breaking decades of silence and confronting DeAngelo directly.',
        },
      ],
      trialTimeline: [
        {
          date: 'June 29, 2020',
          title: 'Guilty Plea Hearing',
          description: 'DeAngelo speaks word "Guilty" 26 consecutive times in open court.',
        },
        {
          date: 'August 21, 2020',
          title: 'Formal Sentencing',
          description: 'Sentenced to life imprisonment without possibility of parole.',
        },
      ],
    },
    verdict: {
      verdictDate: 'August 21, 2020',
      pleaOrVerdict: 'Guilty Plea to 13 counts of First-Degree Murder and 13 counts of Kidnapping',
      sentencing: 'Multiple consecutive life terms without parole, plus eight years.',
      appealsAndRulings: 'Waived all appellate rights pursuant to the binding plea agreement.',
      unresolvedLegalQuestions:
        'Catalyzed nationwide state and federal regulations governing privacy thresholds for consumer DNA databases.',
    },
    aftermath: {
      legalReforms: [
        'United States Department of Justice Interim Policy on Forensic Genetic Genealogical DNA Analysis (November 2019)',
        'California Department of Justice IGG Oversight Standards',
        'Informed consent regulations for commercial consumer genetic registries (FTC enforcement)',
      ],
      institutionalImpact:
        'Established forensic genetic genealogy as a recognized law enforcement discipline, solving hundreds of subsequent cold cases.',
      victimAdvocacy:
        'Memorialized by late investigative author Michelle McNamara ("I’ll Be Gone in the Dark").',
      currentStatus: 'DeAngelo is serving his life sentence at California State Prison, Corcoran.',
    },
    reflectionPrompts: [
      {
        question: 'How do privacy rights in commercial genetic databases balance against solving violent cold crimes?',
        context: 'DeAngelo was caught through distant relatives who had voluntarily uploaded DNA to ancestry tracing services.',
        legalOrEthicalIssue: 'Fourth Amendment expectations of privacy in third-party genetic databases.',
      },
    ],
    citations: [
      {
        title: 'People of the State of California v. Joseph James DeAngelo, Case #18FE008012',
        source: 'Sacramento County Superior Court Record Transcript',
        date: '2020',
      },
      {
        title: 'DOJ Interim Policy: Forensic Genetic Genealogical DNA Analysis and Searching',
        source: 'United States Department of Justice',
        date: 'November 2019',
      },
    ],
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // ==========================================
  // CASE 003 — GABBY PETITO (United States, 2021)
  // ==========================================
  {
    id: 'case-003-petito',
    slug: 'gabby-petito-brian-laundrie',
    caseNumber: 'DOCKET-003-WY-2021',
    title: 'CASE 003 — GABBY PETITO',
    subtitle: 'FBI Denver Case #WY-21-09: Missing Person Investigation, Digital Crowdsourcing & Domestic Violence Casework',
    category: 'Missing Persons',
    location: 'Moab, UT, Grand Teton, WY & North Port, FL',
    year: 2021,
    status: 'Solved',
    isPublished: true,
    isFeatured: true,
    contentWarnings: [
      'Documented domestic violence and homicide',
      'Digital forensics and location data tracking',
      'Sensitive treatment of survivor legacy',
    ],
    summary:
      'In July 2021, 22-year-old travel vlogger Gabrielle "Gabby" Petito departed on a cross-country van trip with fiancé Brian Laundrie. On September 1, Laundrie returned alone to his family home in North Port, Florida with Petito’s van and invoked his Fifth Amendment right to silence. Following an unprecedented digital manhunt driven by bodycam footage, social media travel logs, and tourist dashcam sightings, Petito’s remains were recovered in Bridger-Teton National Forest on September 19, 2021. Laundrie subsequently died by suicide in a Florida nature reserve, leaving behind written confession notes claiming responsibility.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    overview: {
      background:
        'Gabby Petito and Brian Laundrie were childhood acquaintances from Blue Point, New York who began dating in 2019 and moved to Florida. In summer 2021, they embarked on a planned four-month road trip visiting western national parks in Petito’s converted 2012 Ford Transit Connect van, documenting their travels on YouTube and Instagram.',
      victimInfo:
        'Gabrielle Venora Petito, aged 22. Autopsy by Teton County Coroner Dr. Brent Blue determined manner of death was homicide caused by manual strangulation/throttling, estimated to have occurred 3–4 weeks prior to body recovery.',
      jurisdiction:
        'Federal Bureau of Investigation (Denver and Tampa Field Offices), National Park Service, Teton County Sheriff, Moab City Police Department, and North Port Police Department.',
      initialAlertDate: 'September 11, 2021 (Missing person report filed with Suffolk County Police, NY by Nichole Schmidt)',
    },
    incident: {
      narrative:
        'On August 12, 2021, Moab City Police responded to a 911 call reporting a domestic altercation between Petito and Laundrie outside the Moonflower Community Cooperative. Bodycam footage showed Petito distressed and crying; officers classified the dispute as a mental health crisis rather than a domestic assault, separating the couple for the night. The final verbal telephone contact between Petito and her mother occurred on August 25. An unusual text message was sent from Petito’s phone on August 27 referencing "Stan" (her grandfather), which family members recognized as uncharacteristic. On September 1, Laundrie drove Petito’s van back to Florida alone.',
      timeline: [
        {
          date: 'August 12, 2021',
          title: 'Moab Police Domestic Dispute Traffic Stop',
          description: 'Officers pull over Ford Transit after 911 caller witnesses physical altercation; officers separate couple for one night.',
          source: 'Moab Police Department Bodycam Video Record',
        },
        {
          date: 'August 27, 2021',
          title: 'Last Confirmed Sightings in Jackson, WY',
          description: 'Couple seen in Merry Piglets restaurant in Jackson; tourist dashcam spots van near Spread Creek Dispersed Camping Area.',
          source: 'FBI Witness Interview Transcripts',
        },
        {
          date: 'September 1, 2021',
          title: 'Laundrie Returns to Florida Alone',
          description: 'Laundrie arrives at parents’ home in North Port, FL driving Petito’s van; parents decline to speak with Petito family.',
          source: 'North Port Police Automated License Plate Reader Records',
        },
        {
          date: 'September 11, 2021',
          title: 'Official Missing Person Report Filed',
          description: 'Petito’s mother files formal missing person report after ten days of silence.',
          source: 'Suffolk County Police Department Incident Report',
        },
      ],
    },
    investigation: {
      narrative:
        'The FBI launched a massive search across Grand Teton National Park while North Port Police placed Laundrie under surveillance. On September 13, Laundrie left his residence and disappeared into the 25,000-acre Carlton Reserve. On September 19, search teams located Petito’s remains in an undeveloped campsite near Spread Creek. On October 20, investigators searching receding floodwaters in Myakkahatchee Creek Environmental Park recovered Laundrie’s skeletal remains, a revolver, and a waterproof notebook containing his handwritten confession.',
      procedureNotes:
        'Cellular tower triangulation, Apple iCloud geolocational metadata extraction, and social media digital forensics led directly to the campsite search area.',
      interviewRecordsSummary:
        'Dozens of cross-country tourist interviews conducted by FBI Special Agents, including eyewitnesses who gave Laundrie rides while hitchhiking in Colter Bay on August 29.',
      timeline: [
        {
          date: 'September 19, 2021',
          title: 'Discovery of Petito’s Remains',
          description: 'Search teams locate human remains matching Petito in Bridger-Teton National Forest.',
          source: 'FBI Denver Press Briefing',
        },
        {
          date: 'September 22, 2021',
          title: 'Federal Arrest Warrant Issued for Laundrie',
          description: 'U.S. District Court for District of Wyoming issues arrest warrant for unauthorized debit card use.',
          source: 'U.S. District Court Indictment #21-CR-117-SWS',
        },
        {
          date: 'October 20, 2021',
          title: 'Laundrie’s Remains & Notebook Recovered',
          description: 'Remains identified via dental records; water-damaged notebook contains confession admitting responsibility for Petito’s death.',
          source: 'FBI Denver Final Investigative Summary (Jan 2022)',
        },
      ],
    },
    evidence: [
      {
        id: 'ev-petito-01',
        exhibitNumber: 'FBI-EXHIBIT-NOTEBOOK',
        title: 'Brian Laundrie’s Waterproof Journal & Handwritten Confession',
        type: 'document',
        description:
          'Spiral-bound waterproof notebook recovered from Carlton Reserve. Laundrie wrote: "I ended her life. I thought it was merciful, that it is what she wanted, but I see now all the mistakes I made."',
        significance:
          'Conclusive direct admission of homicide, providing formal investigative closure in the absence of a criminal trial.',
        recoveredAt: 'October 20, 2021',
        recoveredBy: 'FBI Tampa Evidence Response Team',
        classification: 'Public Record',
      },
      {
        id: 'ev-petito-02',
        exhibitNumber: 'MOAB-VIDEO-BODYCAM',
        title: 'Moab Police Body-Worn Camera Recordings (August 12, 2021)',
        type: 'digital',
        description:
          '77 minutes of high-definition bodycam footage documenting physical marks on Petito’s face and arm, and conflicting officer assessments.',
        significance:
          'Catalyzed national legislative reviews regarding officer lethality assessments and domestic violence screening protocols.',
        recoveredAt: 'August 12, 2021 / Released September 2021',
        recoveredBy: 'Moab City Police Department',
        classification: 'Public Record',
      },
    ],
    personsOfInterest: [
      {
        id: 'poi-laundrie',
        name: 'Brian Christopher Laundrie',
        alias: 'Brian Laundrie',
        role: 'Sole Person of Interest / Perpetrator',
        status: 'Deceased',
        background: 'Fiancé of victim; 23 years old; companion on cross-country road trip.',
        verifiedFindings:
          'FBI Denver concluded Laundrie was solely responsible for Petito’s death based on physical evidence, cell records, and his written notebook confession.',
        allegations:
          'Fled to Florida, refused communication with law enforcement, and committed unauthorized ATM withdrawals totaling over $1,000 using Petito’s debit card.',
        outcome:
          'Died of a self-inflicted gunshot wound in Myakkahatchee Creek Environmental Park; case officially closed by the FBI in January 2022.',
      },
    ],
    breakthrough: {
      narrative:
        'The primary breakthrough emerged from civilian digital crowdsourcing: travel vloggers Tim and Jenn Bethune reviewed their GoPro dashboard footage from August 27 and spotted Petito’s white Ford Transit van parked with Florida plates at Spread Creek, providing the exact coordinates where search teams discovered her remains.',
      turningPoints: [
        {
          date: 'September 18, 2021',
          title: 'Dashcam Video Spottings Verified by FBI',
          detail: 'Vloggers contact FBI after recognizing the van from news reports, narrowing a multi-million-acre wilderness to a specific drainage area.',
        },
        {
          date: 'January 21, 2022',
          title: 'FBI Releases Final Investigative Report',
          detail: 'FBI Denver announces comprehensive conclusion of inquiry with confirmation of notebook admission and debit card transactions.',
        },
      ],
    },
    courtroom: {
      court: 'U.S. District Court for the District of Wyoming (Federal Criminal Jurisdiction) & Sarasota County Circuit Court (Civil)',
      presidingJudge: 'U.S. Magistrate Judge Scott W. Skavdahl (Federal) / Judge Hunter W. Carroll (Civil)',
      charges: [
        '18 U.S.C. § 1029(a)(2) - Fraudulent Use of an Access Device (Federal Indictment returned against Laundrie prior to death).',
        'No homicide trial held due to perpetrator suicide.',
      ],
      prosecutionArgument:
        'Federal prosecutors established probable cause for unauthorized interstate debit card usage while preparing felony murder charges prior to the recovery of Laundrie’s remains.',
      defenseArgument:
        'Laundrie’s family retained attorney Steven Bertolino, who advised the family to invoke their Fifth Amendment rights and decline voluntary statements.',
      keyTestimonies: [
        {
          witness: 'Dr. Brent Blue',
          role: 'Teton County Coroner',
          keyPoints:
            'Conducted forensic pathology autopsy, verifying victim died of manual strangulation and blunt-force facial trauma.',
        },
      ],
      trialTimeline: [
        {
          date: 'September 22, 2021',
          title: 'Federal Grand Jury Indictment',
          description: 'Federal warrant issued for Brian Laundrie.',
        },
        {
          date: 'November 2022',
          title: 'Civil Wrongful Death Settlement',
          description: 'Petito family awarded $3 million civil settlement against Laundrie estate.',
        },
      ],
    },
    verdict: {
      verdictDate: 'January 21, 2022 (FBI Case Closure) / No Criminal Verdict',
      pleaOrVerdict: 'Perpetrator Deceased / Investigation Closed with Sole Perpetrator Identification',
      sentencing: 'None (Perpetrator deceased). Civil damages judgment awarded against estate.',
      appealsAndRulings: 'No criminal appeals applicable.',
      unresolvedLegalQuestions:
        'Civil lawsuits filed against the Moab Police Department alleging improper domestic violence lethality assessment and failure to protect.',
    },
    aftermath: {
      legalReforms: [
        'The Federal Gabby Petito Act (introduced to mandate standardized domestic violence lethality assessments across law enforcement agencies)',
        'Comprehensive overhaul of Moab Police Department domestic violence protocols and mandatory bodycam audit policies',
        'Increased awareness regarding the "Missing White Woman Syndrome" and disparate media attention for missing indigenous women in Wyoming',
      ],
      institutionalImpact:
        'Establishment of the Gabby Petito Foundation supporting domestic violence prevention and missing person search efforts.',
      victimAdvocacy:
        'Widespread adoption of the "Lethality Assessment Program" (LAP) by municipal police departments across the US.',
      currentStatus: 'Criminal case officially closed by the FBI. Ongoing civil litigation and foundation advocacy.',
    },
    reflectionPrompts: [
      {
        question: 'How did law enforcement’s assessment of the August 12 domestic dispute highlight systemic training gaps?',
        context: 'Officers treated the incident as a mental health crisis and separated the couple without filing misdemeanor charges.',
        legalOrEthicalIssue: 'The efficacy of lethality assessment screening tools in identifying imminent domestic homicide risk.',
      },
      {
        question: 'What role did public crowdsourced video play in narrowing an otherwise vast wilderness search?',
        context: 'A tourist couple reviewing vacation GoPro footage provided the exact coordinates that located the victim.',
        legalOrEthicalIssue: 'The coordination of civilian digital intelligence with federal investigative protocols.',
      },
    ],
    citations: [
      {
        title: 'FBI Denver Final Investigative Update on Gabrielle Petito Investigation',
        source: 'Federal Bureau of Investigation Public Release',
        date: 'January 21, 2022',
      },
      {
        title: 'United States of America v. Brian Christopher Laundrie, Indictment 21-CR-117-SWS',
        source: 'U.S. District Court for the District of Wyoming',
        date: 'September 2021',
      },
      {
        title: 'Independent Investigative Report on the Moab Police Department (City of Moab)',
        source: 'Price City Police Department Internal Review',
        date: 'January 2022',
      },
    ],
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
];
