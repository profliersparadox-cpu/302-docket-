import { Router, Request, Response } from 'express';
import { dbService } from '../db.ts';
import { requireAdminAuth, optionalAdminAuth } from '../authMiddleware.ts';
import { CaseFile } from '../../src/types.ts';

const router = Router();

// GET /api/cases - List cases with filtering and search
router.get('/cases', optionalAdminAuth, (req: Request, res: Response) => {
  const isAdmin = !!req.admin;
  const includeUnpublished = req.query.admin === 'true' && isAdmin;

  let cases = dbService.getAllCases(includeUnpublished);

  // Filter: Category
  const category = req.query.category as string;
  if (category && category !== 'All') {
    cases = cases.filter((c) => c.category === category);
  }

  // Filter: Status
  const status = req.query.status as string;
  if (status && status !== 'All') {
    cases = cases.filter((c) => c.status === status);
  }

  // Filter: Year range
  const yearFrom = req.query.yearFrom ? parseInt(req.query.yearFrom as string, 10) : null;
  const yearTo = req.query.yearTo ? parseInt(req.query.yearTo as string, 10) : null;
  if (yearFrom) {
    cases = cases.filter((c) => c.year >= yearFrom);
  }
  if (yearTo) {
    cases = cases.filter((c) => c.year <= yearTo);
  }

  // Filter: Location
  const location = req.query.location as string;
  if (location) {
    const locLower = location.toLowerCase();
    cases = cases.filter((c) => c.location.toLowerCase().includes(locLower));
  }

  // Search query (across title, subtitle, caseNumber, summary, persons of interest, evidence)
  const q = (req.query.q as string)?.toLowerCase().trim();
  if (q) {
    cases = cases.filter((c) => {
      const titleMatch = c.title.toLowerCase().includes(q);
      const subtitleMatch = c.subtitle?.toLowerCase().includes(q);
      const caseNumMatch = c.caseNumber.toLowerCase().includes(q);
      const summaryMatch = c.summary?.toLowerCase().includes(q);
      const locationMatch = c.location.toLowerCase().includes(q);
      const poiMatch = c.personsOfInterest?.some((p) => p.name.toLowerCase().includes(q) || p.alias?.toLowerCase().includes(q));
      const evMatch = c.evidence?.some((e) => e.title.toLowerCase().includes(q) || e.exhibitNumber.toLowerCase().includes(q));
      return titleMatch || subtitleMatch || caseNumMatch || summaryMatch || locationMatch || poiMatch || evMatch;
    });
  }

  return res.json({
    cases,
    total: cases.length,
  });
});

// GET /api/cases/:slug - Single case file with full dossier
router.get('/cases/:slug', optionalAdminAuth, (req: Request, res: Response) => {
  const isAdmin = !!req.admin;
  const c = dbService.getCaseBySlug(req.params.slug, isAdmin);

  if (!c) {
    return res.status(404).json({ error: 'Case file not found in active repository.' });
  }

  return res.json(c);
});

// GET /api/stats - Dynamic archive statistics
router.get('/stats', (_req: Request, res: Response) => {
  const stats = dbService.getArchiveStats();
  return res.json(stats);
});

// Admin: POST /api/admin/cases - Create new case dossier
router.post('/admin/cases', requireAdminAuth, (req: Request, res: Response) => {
  const body = req.body as Partial<CaseFile>;

  if (!body.title || !body.caseNumber || !body.category) {
    return res.status(400).json({ error: 'Title, case number, and crime category are required.' });
  }

  // Auto slug if not provided
  const slug =
    body.slug?.trim() ||
    body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 6);

  const newCase: CaseFile = {
    id: body.id || 'case-' + Date.now(),
    slug,
    caseNumber: body.caseNumber.trim(),
    title: body.title.trim(),
    subtitle: body.subtitle?.trim() || '',
    category: body.category,
    location: body.location?.trim() || 'Jurisdiction Pending',
    year: body.year || new Date().getFullYear(),
    status: body.status || 'Active Investigation',
    isPublished: body.isPublished ?? true,
    isFeatured: body.isFeatured ?? false,
    contentWarnings: body.contentWarnings || [],
    summary: body.summary?.trim() || '',
    bannerImageUrl: body.bannerImageUrl,
    overview: body.overview || {
      background: '',
      victimInfo: '',
      jurisdiction: '',
      initialAlertDate: '',
    },
    incident: body.incident || { narrative: '', timeline: [] },
    investigation: body.investigation || { narrative: '', procedureNotes: '', interviewRecordsSummary: '', timeline: [] },
    evidence: body.evidence || [],
    personsOfInterest: body.personsOfInterest || [],
    breakthrough: body.breakthrough || { narrative: '', turningPoints: [] },
    courtroom: body.courtroom || {
      court: '',
      presidingJudge: '',
      charges: [],
      prosecutionArgument: '',
      defenseArgument: '',
      keyTestimonies: [],
      trialTimeline: [],
    },
    verdict: body.verdict || {
      verdictDate: '',
      pleaOrVerdict: '',
      sentencing: '',
      appealsAndRulings: '',
    },
    aftermath: body.aftermath || {
      legalReforms: [],
      institutionalImpact: '',
      victimAdvocacy: '',
      currentStatus: '',
    },
    reflectionPrompts: body.reflectionPrompts || [],
    citations: body.citations || [],
    relatedCaseIds: body.relatedCaseIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = dbService.saveCase(newCase);
  return res.status(201).json(saved);
});

// Admin: PUT /api/admin/cases/:id - Update existing case
router.put('/admin/cases/:id', requireAdminAuth, (req: Request, res: Response) => {
  const existing = dbService.getCaseById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Case file not found.' });
  }

  const updatedCase: CaseFile = {
    ...existing,
    ...req.body,
    id: existing.id, // prevent id mutation
    updatedAt: new Date().toISOString(),
  };

  const saved = dbService.saveCase(updatedCase);
  return res.json(saved);
});

// Admin: DELETE /api/admin/cases/:id - Delete case
router.delete('/admin/cases/:id', requireAdminAuth, (req: Request, res: Response) => {
  const success = dbService.deleteCase(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Case not found or could not be expunged.' });
  }
  return res.json({ message: 'Case file permanently removed from repository.' });
});

export default router;
