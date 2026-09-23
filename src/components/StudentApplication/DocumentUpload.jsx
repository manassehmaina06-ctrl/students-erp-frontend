import React, { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const DocumentUpload = ({ data, setData, next, prev }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState(data || []);
  const { token } = useAuth();

  const uploadFile = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    setUploading(true);
    try {
  const res = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setDocs([...docs, res.data]);
      setFile(null);
      // Reset file input
      document.getElementById('fileInput').value = '';
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    }
    setUploading(false);
  };

  const removeDocument = (docId) => {
    setDocs(docs.filter(d => d._id !== docId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (docs.length === 0) {
      alert('Please upload at least one document');
      return;
    }
    setData(docs);
    next();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">📎</span>
        <h3 className="text-xl font-semibold text-gray-700">Document Upload</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 4 of 6</span>
      </div>

      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-400 transition">
        <input
          id="fileInput"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
        />
        <label htmlFor="fileInput" className="cursor-pointer">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600">Click to select a file</p>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG accepted (max 5MB)</p>
        </label>
        {file && (
          <div className="mt-3 text-sm text-gray-600">
            Selected: <span className="font-medium">{file.name}</span>
            <button
              type="button"
              onClick={uploadFile}
              disabled={uploading}
              className="ml-3 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}
      </div>

      {docs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</h4>
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d._id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-sm">{d.name}</span>
                <button
                  type="button"
                  onClick={() => removeDocument(d._id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕ Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={prev}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-lg transition"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition shadow-sm hover:shadow-md"
        >
          Next Step →
        </button>
      </div>
    </form>
  );
};

export default DocumentUpload;