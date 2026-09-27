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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in font-sans text-xs">
      <div className="w-full max-w-lg rounded-3xl card-3d shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative bg-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/80 shadow-xs">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">
                Upload Workblock Footage
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Offline optical frame sampling & ISO posture rule engine
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File input / dropzone */}
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-rose-400 bg-slate-50/70 hover:bg-rose-50/20 text-center transition-all cursor-pointer relative card-3d-inset">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/avi"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-9 h-9 text-rose-500 mx-auto mb-2" />
            {file ? (
              <div>
                <span className="text-slate-900 font-bold block text-sm">{file.name}</span>
                <span className="text-slate-500 text-xs block mt-1">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB • Click to change file
                </span>
              </div>
            ) : (
              <div>
                <span className="text-slate-800 block font-bold text-sm">Select or drag & drop posture video</span>
                <span className="text-slate-500 text-xs block mt-1">Supports MP4, WebM, MOV, AVI</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-slate-600 block mb-1.5 text-xs font-semibold">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Afternoon Coding Sprint"
              className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 card-3d-inset font-sans text-xs"
            />
          </div>

          <div>
            <label className="text-slate-600 block mb-1.5 text-xs font-semibold">Workstation Setup</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 card-3d-inset font-sans text-xs"
            >
              <option value="Office Desk">Office Standard Desk</option>
              <option value="Standing Desk">Standing Desk</option>
              <option value="Gaming Setup">Gaming Cockpit</option>
              <option value="Study Table">Study Table</option>
            </select>
          </div>

          {uploading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  Sampling frames & evaluating posture rules...
                </span>
                <span className="text-rose-600 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 transition-all duration-300"
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
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-40 text-white font-sans font-semibold transition-all shadow-md shadow-rose-500/25 flex items-center gap-2 text-xs"
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
