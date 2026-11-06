import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Copy, Check, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { MediaItem } from '../../types.ts';

export const MediaLibrary: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload failed');
      }

      await fetchMedia();
    } catch (err: any) {
      setError(err.message || 'Error uploading media file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this media asset?')) return;

    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err: any) {
      setError('Failed to delete media asset: ' + err.message);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-editorial text-zinc-100">
            Media & Evidence Document Storage
          </h2>
          <p className="text-xs font-mono text-zinc-400">
            Upload case photographs, scanned court exhibits, and evidence records stored persistently on the server.
          </p>
        </div>

        <div>
          <label className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-100 text-xs font-mono rounded cursor-pointer transition-colors flex items-center space-x-2">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'UPLOADING...' : 'UPLOAD NEW ASSET'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              accept="image/*,application/pdf"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-mono rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs font-mono text-zinc-500">
          RETRIEVING STORED ASSETS...
        </div>
      ) : mediaList.length === 0 ? (
        <div className="p-12 text-center bg-zinc-950 border border-zinc-800 rounded-lg">
          <ImageIcon className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs font-mono text-zinc-400">No media assets uploaded yet.</p>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Uploaded images can be referenced in case banners and evidence exhibits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map((item) => {
            const isImage = item.mimeType.startsWith('image/');
            const sizeKb = (item.size / 1024).toFixed(1);

            return (
              <div
                key={item.id}
                className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col justify-between group hover:border-zinc-700 transition-colors"
              >
                <div className="h-36 bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                  {isImage ? (
                    <img
                      src={item.url}
                      alt={item.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-zinc-600" />
                  )}
                  <span className="absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.5 bg-black/80 text-zinc-300 rounded">
                    {sizeKb} KB
                  </span>
                </div>

                <div className="p-3">
                  <div className="text-xs font-mono text-zinc-200 font-semibold truncate mb-1" title={item.originalName}>
                    {item.originalName}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mb-3 truncate">
                    {item.url}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <button
                      onClick={() => handleCopyUrl(item.url, item.id)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 rounded flex items-center space-x-1"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY LINK</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
