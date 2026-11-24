import { MediaItem, CaseMediaItem, EvidenceItem, ArchiveDocument } from '../types.ts';

export const MEDIA_UPDATED_EVENT = 'docket_media_updated';

// Format detection functions
export const isAudioMedia = (item: {
  mimeType?: string;
  url?: string;
  filename?: string;
  originalName?: string;
  mediaType?: string;
}): boolean => {
  if (item.mediaType === 'audio' || item.mediaType === 'recording' || item.mediaType === 'wiretap') {
    return true;
  }
  if (item.mimeType && item.mimeType.toLowerCase().startsWith('audio/')) {
    return true;
  }
  const name = (item.originalName || item.filename || item.url || '').toLowerCase();
  const ext = name.split('?')[0].split('.').pop() || '';
  return ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac', 'wma'].includes(ext);
};

export const isPdfMedia = (item: {
  mimeType?: string;
  url?: string;
  filename?: string;
  originalName?: string;
  mediaType?: string;
}): boolean => {
  if (item.mimeType && item.mimeType.toLowerCase() === 'application/pdf') {
    return true;
  }
  const name = (item.originalName || item.filename || item.url || '').toLowerCase();
  const ext = name.split('?')[0].split('.').pop() || '';
  return ext === 'pdf';
};

export const isVideoMedia = (item: {
  mimeType?: string;
  url?: string;
  filename?: string;
  originalName?: string;
  mediaType?: string;
}): boolean => {
  if (item.mediaType === 'video') {
    return true;
  }
  if (item.mimeType && item.mimeType.toLowerCase().startsWith('video/')) {
    return true;
  }
  const name = (item.originalName || item.filename || item.url || '').toLowerCase();
  const ext = name.split('?')[0].split('.').pop() || '';
  return ['mp4', 'm4v', 'mpeg', 'mpg', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
};

export const isImageMedia = (item: {
  mimeType?: string;
  url?: string;
  filename?: string;
  originalName?: string;
  mediaType?: string;
}): boolean => {
  if (item.mediaType === 'image') {
    return true;
  }
  if (item.mimeType && item.mimeType.toLowerCase().startsWith('image/')) {
    return true;
  }
  const name = (item.originalName || item.filename || item.url || '').toLowerCase();
  const ext = name.split('?')[0].split('.').pop() || '';
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
};

// Fetch media from server API + local fallback
export const fetchAllMedia = async (caseSlug?: string): Promise<MediaItem[]> => {
  const list: MediaItem[] = [];
  const seenIds = new Set<string>();

  try {
    const url = caseSlug ? `/api/media?caseSlug=${encodeURIComponent(caseSlug)}` : '/api/media';
    const res = await fetch(url);
    if (res.ok) {
      const serverMedia: MediaItem[] = await res.json();
      serverMedia.forEach((m) => {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          list.push(m);
        }
      });
    }
  } catch (err) {
    console.warn('Failed to fetch media from /api/media:', err);
  }

  // Also merge any offline/local uploaded items from localStorage
  try {
    const localRaw = localStorage.getItem('docket_custom_media');
    if (localRaw) {
      const localMedia: MediaItem[] = JSON.parse(localRaw);
      localMedia.forEach((m) => {
        if (!seenIds.has(m.id)) {
          if (!caseSlug || m.caseSlug === caseSlug) {
            seenIds.add(m.id);
            list.push(m);
          }
        }
      });
    }
  } catch (err) {
    console.warn('Failed to parse local media:', err);
  }

  return list;
};

// Upload media helper that hits /api/media/upload and syncs locally
export const uploadMediaFile = async (
  file: File,
  metadata: {
    caseSlug: string;
    caseNumber?: string;
    title?: string;
    description?: string;
    transcript?: string;
  }
): Promise<MediaItem> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('caseSlug', metadata.caseSlug);
  if (metadata.caseNumber) formData.append('caseNumber', metadata.caseNumber);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.transcript) formData.append('transcript', metadata.transcript);

  let mediaItem: MediaItem;

  try {
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      // Fallback try admin endpoint
      const adminRes = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!adminRes.ok) {
        throw new Error(`Upload error: ${res.statusText}`);
      }
      mediaItem = await adminRes.json();
    } else {
      mediaItem = await res.json();
    }
  } catch (err) {
    // Local data URL fallback if offline
    console.warn('Server upload failed, storing locally:', err);
    const blobUrl = URL.createObjectURL(file);
    mediaItem = {
      id: 'media-local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      filename: file.name,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      url: blobUrl,
      uploadedAt: new Date().toISOString(),
      caseSlug: metadata.caseSlug,
      caseNumber: metadata.caseNumber,
      title: metadata.title || file.name,
      description: metadata.description,
      transcript: metadata.transcript,
    };
  }

  // Save to local cache
  try {
    const localRaw = localStorage.getItem('docket_custom_media');
    const existing: MediaItem[] = localRaw ? JSON.parse(localRaw) : [];
    existing.unshift(mediaItem);
    localStorage.setItem('docket_custom_media', JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to cache media in localStorage:', err);
  }

  // Broadcast update event so all components react immediately
  window.dispatchEvent(new CustomEvent(MEDIA_UPDATED_EVENT, { detail: mediaItem }));

  return mediaItem;
};

// Convert a MediaItem into an EvidenceItem for the Case Evidence Room
export const convertMediaToEvidence = (media: MediaItem, index: number): EvidenceItem => {
  const isAudio = isAudioMedia(media);
  const isPdf = isPdfMedia(media);
  const isVideo = isVideoMedia(media);

  let type: 'document' | 'forensic' | 'audio' | 'physical' | 'testimony' | 'digital' = 'physical';
  if (isAudio) type = 'audio';
  else if (isPdf) type = 'document';
  else if (isVideo) type = 'digital';

  const classification = isAudio
    ? 'Grand Jury Exhibit'
    : isPdf
    ? 'Official Court Record'
    : 'Grand Jury Exhibit';

  return {
    id: media.id,
    exhibitNumber: `EX-UPL-${(index + 1).toString().padStart(2, '0')}`,
    title: media.title || media.originalName,
    type,
    description:
      media.description ||
      (isAudio
        ? `Contemporaneous audio recording exhibit (${media.originalName}). Admitted into case file.`
        : isPdf
        ? `Official PDF document filing (${media.originalName}). Authenticated court docket.`
        : `Physical forensic media exhibit (${media.originalName}).`),
    significance: media.transcript
      ? `VERIFIED TRANSCRIPTION ATTACHED: "${media.transcript.slice(0, 140)}..."`
      : isAudio
      ? 'Admitted audio evidence; verified audio reel.'
      : isPdf
      ? 'Authenticated documentary PDF record filed under federal rules of evidence.'
      : 'Primary digital forensic exhibit logged by investigator.',
    recoveredAt: media.uploadedAt.split('T')[0],
    recoveredBy: 'Investigative Docket Unit / Uploaded Asset',
    classification: classification as any,
    imageUrl: media.url,
  };
};

// Convert a MediaItem into an ArchiveDocument for the Document Room
export const convertMediaToDocument = (media: MediaItem): ArchiveDocument => {
  const isPdf = isPdfMedia(media);
  return {
    id: `doc-${media.id}`,
    caseSlug: media.caseSlug || 'general-archive',
    caseNumber: media.caseNumber || 'CASE-DOC',
    title: media.title || media.originalName,
    category: isPdf ? 'Court Records' : 'FD-302 Reports',
    date: media.uploadedAt.split('T')[0],
    classification: isPdf ? 'Official Court Record' : 'DOJ Investigative Summary',
    authorOrAgency: 'Authenticated Judicial Docket / Federal Case Files',
    pageCount: isPdf ? Math.max(1, Math.ceil(media.size / 80000)) : 1,
    summary:
      media.description ||
      `Official documentary filing and exhibit: ${media.originalName} (${Math.round(media.size / 1024)} KB).`,
    documentBody:
      media.transcript ||
      media.description ||
      `AUTHENTICATED RECORD: ${media.title || media.originalName}\nFILE: ${media.filename}\nORIGIN: ${media.originalName}\nSIZE: ${Math.round(media.size / 1024)} KB\nDATE: ${media.uploadedAt}\n\nDocumentary evidence record logged in system docket. Full digital contents available in attached PDF viewer.`,
    redactions: [],
    officialCitation: `${media.title || media.originalName} (DOJ Judicial Docket Record)`,
    downloadUrl: media.url,
  };
};

// Convert a MediaItem into a CaseMediaItem for the Case Media Vault
export const convertMediaToCaseMedia = (media: MediaItem): CaseMediaItem => {
  const isAudio = isAudioMedia(media);
  const isVideo = isVideoMedia(media);
  const isPdf = isPdfMedia(media);

  let mediaType: 'audio' | 'recording' | 'image' | 'video' | 'wiretap' = 'image';
  if (isAudio) mediaType = 'audio';
  else if (isVideo) mediaType = 'video';
  else if (isPdf) mediaType = 'recording';

  return {
    id: media.id,
    title: media.title || media.originalName,
    mediaType,
    url: media.url,
    description: media.description || `${media.originalName} (${Math.round(media.size / 1024)} KB)`,
    source: `Uploaded Archive File • ${media.originalName}`,
    recoveredAt: media.uploadedAt.split('T')[0],
    duration: isAudio ? '03:45' : isVideo ? '04:12' : undefined,
    classification: isPdf ? 'OFFICIAL PDF DOCUMENT' : isAudio ? 'MP3 AUDIO REEL' : 'ADMITTED EXHIBIT',
    caseSlug: media.caseSlug,
    caseNumber: media.caseNumber,
    transcript: media.transcript,
  };
};
