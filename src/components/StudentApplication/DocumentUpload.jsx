import React, { useState } from 'react';
import api from '../../api/axios';

// Required document types
const REQUIRED_DOCS = [
  { key: 'nationalId',  label: 'National ID / Birth Certificate', icon: '🆔', required: true,
    accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'kcse',        label: 'KCSE Certificate / Result Slip',  icon: '📜', required: true,
    accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'transcripts', label: 'Transcripts (if any)',            icon: '📁', required: false,
    accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'photo',       label: 'Passport Photo',                  icon: '📷', required: true,
    accept: '.jpg,.jpeg,.png' },
];

const DocumentUpload = ({ data, setData, next, prev }) => {
  // docs: { [key]: { _id, name, url, key } }
  const [docs, setDocs] = useState(() => {
    // Hydrate from data if present
    const initial = {};
    if (Array.isArray(data)) {
      data.forEach((d) => { if (d.key) initial[d.key] = d; });
    }
    return initial;
  });

  const [uploading, setUploading] = useState({});
  const [error, setError] = useState('');

  const uploadFile = async (docKey, file) => {
    if (!file) return;

    setError('');
    setUploading((u) => ({ ...u, [docKey]: true }));

    const formData = new FormData();
    formData.append('document', file);
    formData.append('docKey', docKey);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Remove old version of same docType if any
      setDocs((prev) => ({
        ...prev,
        [docKey]: { ...res.data, key: docKey },
      }));
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading((u) => ({ ...u, [docKey]: false }));
    }
  };

  const removeDocument = (docKey) => {
    setDocs((prev) => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Check required docs
    const missing = REQUIRED_DOCS.filter((d) => d.required && !docs[d.key]);
    if (missing.length > 0) {
      setError('Please upload: ' + missing.map((m) => m.label).join(', '));
      return;
    }

    setData(Object.values(docs));
    next();
  };

  const uploadedCount = Object.keys(docs).length;
  const totalRequired = REQUIRED_DOCS.filter((d) => d.required).length;
  const uploadedRequired = REQUIRED_DOCS.filter((d) => d.required && docs[d.key]).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <span className="text-2xl">📎</span>
        <h3 className="font-display text-xl font-semibold text-slate-800 dark:text-slate-100">Document Upload</h3>
        <span className="text-xs text-slate-400 ml-auto">Step 4 of 9</span>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
        ℹ️ Upload the following documents. Max 5 MB each. PDF, JPG, or PNG.
        <div className="mt-2 text-xs font-medium">
          Required: {uploadedRequired} / {totalRequired} · Uploaded: {uploadedCount}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {REQUIRED_DOCS.map((def) => {
          const doc = docs[def.key];
          const isUploading = uploading[def.key];
          const inputId = 'file_' + def.key;

          return (
            <div
              key={def.key}
              className={
                'border-2 rounded-xl p-4 transition ' +
                (doc
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-400')
              }
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl shrink-0">{def.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
                      {def.label}
                    </p>
                    {def.required && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold uppercase">
                        Required
                      </span>
                    )}
                    {doc && !isUploading && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                        ✓ Uploaded
                      </span>
                    )}
                    {isUploading && (
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                        Uploading…
                      </span>
                    )}
                  </div>

                  {!doc && !isUploading && (
                    <>
                      <input
                        id={inputId}
                        type="file"
                        accept={def.accept}
                        className="hidden"
                        onChange={(e) => uploadFile(def.key, e.target.files[0])}
                      />
                      <label
                        htmlFor={inputId}
                        className="inline-block mt-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 cursor-pointer"
                      >
                        + Choose file
                      </label>
                    </>
                  )}

                  {doc && !isUploading && (
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[12rem]">
                        📄 {doc.name}
                      </span>
                      <a
                        href={doc.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDocument(def.key)}
                        className="text-xs text-rose-600 hover:text-rose-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={prev}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium px-8 py-2.5 rounded-lg transition"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-2.5 rounded-lg transition shadow-sm hover:shadow-md"
        >
          Next Step →
        </button>
      </div>
    </form>
  );
};

export default DocumentUpload;
