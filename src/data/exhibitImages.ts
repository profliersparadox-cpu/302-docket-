import ransomDocumentImg from '../assets/images/exhibit_ransom_document_1795523471669.jpg';
import dnaAutoradiographImg from '../assets/images/exhibit_dna_autoradiograph_1795523471979.jpg';
import physicalTraceImg from '../assets/images/exhibit_physical_trace_1795523471779.jpg';
import surveillanceFrameImg from '../assets/images/exhibit_surveillance_frame_1795523472416.jpg';
import courtDossierImg from '../assets/images/exhibit_court_dossier_1795523473109.jpg';
import { EvidenceBoardItem, EvidenceItem } from '../types.ts';

export interface PresetExhibitPlate {
  id: string;
  label: string;
  caption: string;
  url: string;
}

export const PRESET_EXHIBIT_PLATES: PresetExhibitPlate[] = [
  {
    id: 'plate-document',
    label: 'Handwritten Legal Pad & Millimeter Scale',
    caption: 'Forensic questioned-document examination plate',
    url: ransomDocumentImg,
  },
  {
    id: 'plate-dna',
    label: 'DNA STR Electrophoresis Lightbox',
    caption: 'Forensic biological profile & sterile sample vials',
    url: dnaAutoradiographImg,
  },
  {
    id: 'plate-trace',
    label: 'Physical Trace Bags & Knotted Cord',
    caption: 'Chain-of-custody physical trace exhibit plate',
    url: physicalTraceImg,
  },
  {
    id: 'plate-surveillance',
    label: 'CRT Dashcam / Surveillance Still',
    caption: 'Recovered patrol / tourist video frame capture',
    url: surveillanceFrameImg,
  },
  {
    id: 'plate-dossier',
    label: 'Judicial Ledger & Flight Manifest Folder',
    caption: 'Federal grand jury documentary filing record',
    url: courtDossierImg,
  },
];

export function getEvidenceImage(ev: Partial<EvidenceItem> & { itemType?: string; tags?: string[] }): {
  url: string;
  caption: string;
} {
  if (ev.imageUrl && ev.imageUrl.trim()) {
    return {
      url: ev.imageUrl,
      caption: ev.title ? `Exhibit Attachment — ${ev.title}` : 'Uploaded Case Exhibit Photograph',
    };
  }

  const haystack = `${ev.id || ''} ${ev.exhibitNumber || ''} ${ev.title || ''} ${ev.type || ev.itemType || ''} ${(ev.tags || []).join(' ')}`.toLowerCase();

  if (
    haystack.includes('dna') ||
    haystack.includes('codis') ||
    haystack.includes('specimen') ||
    haystack.includes('saliva') ||
    haystack.includes('forensic') ||
    haystack.includes('genealog')
  ) {
    return {
      url: dnaAutoradiographImg,
      caption: 'Forensic Crime Lab DNA Profile & Biological Specimen Plate',
    };
  }

  if (
    haystack.includes('ransom') ||
    haystack.includes('handwritten') ||
    haystack.includes('notebook') ||
    haystack.includes('journal') ||
    haystack.includes('note') ||
    haystack.includes('letter')
  ) {
    return {
      url: ransomDocumentImg,
      caption: 'Questioned Document Macro Photograph with Forensic Scale',
    };
  }

  if (
    haystack.includes('bodycam') ||
    haystack.includes('dashcam') ||
    haystack.includes('video') ||
    haystack.includes('digital') ||
    haystack.includes('storage') ||
    haystack.includes('drive') ||
    haystack.includes('audio') ||
    haystack.includes('wiretap') ||
    haystack.includes('statement')
  ) {
    return {
      url: surveillanceFrameImg,
      caption: 'Archival Digital / Video Capture Monitor Frame',
    };
  }

  if (
    haystack.includes('ligature') ||
    haystack.includes('cord') ||
    haystack.includes('knot') ||
    haystack.includes('ladder') ||
    haystack.includes('window') ||
    haystack.includes('footprint') ||
    haystack.includes('gold') ||
    haystack.includes('physical') ||
    haystack.includes('suitcase')
  ) {
    return {
      url: physicalTraceImg,
      caption: 'Physical Trace Evidence Locker & Marker Plate',
    };
  }

  if (haystack.includes('suspect') || haystack.includes('poi')) {
    return {
      url: courtDossierImg,
      caption: 'Judicial Dossier & Subject Investigative Record',
    };
  }

  return {
    url: courtDossierImg,
    caption: 'Authenticated Court Docket & Documentary Archive Plate',
  };
}

export function hydrateBoardItemImage(item: EvidenceBoardItem): EvidenceBoardItem {
  if (item.imageUrl && item.imageUrl.trim()) {
    return item;
  }
  const resolved = getEvidenceImage({
    id: item.id,
    title: item.title,
    itemType: item.itemType,
    tags: item.tags,
  });
  return {
    ...item,
    imageUrl: resolved.url,
    imageCaption: item.imageCaption || resolved.caption,
  };
}
