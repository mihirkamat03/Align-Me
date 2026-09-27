import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadVideoSession } from '../services/api';
import { UploadCloud, X, Film, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function VideoUploadModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [environment, setEnvironment] = useState('Office Desk');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(20);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title || file.name);
    formData.append('environment', environment);

    try {
      setProgress(50);
      const res = await uploadVideoSession(formData);
      setProgress(100);
      if (res && res.session_id) {
        setTimeout(() => {
          onClose();
          navigate(`/session/${res.session_id}`);
        }, 600);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      setError(err.message || 'Failed to process video file');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono text-xs">
      <div className="w-full max-w-lg rounded-3xl bg-[#090D14] border border-white/10 cockpit-surface shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display text-white uppercase tracking-tight">
                Upload Workblock Footage
              </h2>
              <span className="text-[11px] text-zinc-400">
                Run offline frame sampling & ISO posture rule engine on video
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File input / dropzone */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-zinc-900/40 text-center transition-all cursor-pointer relative">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/avi"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            {file ? (
              <div>
                <span className="text-white font-bold block">{file.name}</span>
                <span className="text-zinc-500 text-[11px] block mt-1">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB • Click to replace
                </span>
              </div>
            ) : (
              <div>
                <span className="text-zinc-300 block font-bold">Select or drag & drop posture video</span>
                <span className="text-zinc-500 text-[11px] block mt-1">Supports MP4, WebM, MOV, AVI</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 text-[11px] uppercase">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Afternoon Coding Sprint"
              className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 text-[11px] uppercase">Workstation Setup</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Office Desk">Office Standard Desk</option>
              <option value="Standing Desk">Standing Desk</option>
              <option value="Gaming Setup">Gaming Cockpit</option>
              <option value="Study Table">Study Table</option>
            </select>
          </div>

          {uploading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Sampling frames & evaluating posture rules...
                </span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-zinc-950 font-bold uppercase transition-all shadow-md flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Analyze Video</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
