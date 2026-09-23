import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ProgrammeSelection = ({ data, setData, next, prev }) => {
  const [programmes, setProgrammes] = useState([]);
  const [selected, setSelected] = useState(data || '');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
      const res = await api.get('/programmes');
        setProgrammes(res.data);
      } catch (err) {
        console.error('Failed to fetch programmes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgrammes();
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected) {
      alert('Please select a programme');
      return;
    }
    setData(selected);
    next();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">🎯</span>
        <h3 className="text-xl font-semibold text-gray-700">Programme Selection</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 3 of 6</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Select Programme <span className="text-red-500">*</span>
        </label>
        {loading ? (
          <div className="text-gray-400 py-4">Loading programmes...</div>
        ) : (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 hover:bg-white"
            required
          >
            <option value="">Choose a programme...</option>
            {programmes.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.code}) – {p.duration} semesters
              </option>
            ))}
          </select>
        )}
        {!loading && programmes.length === 0 && (
          <p className="text-sm text-yellow-600 mt-1">No programmes available. Please contact admin.</p>
        )}
      </div>

      {selected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Selected:</span>{' '}
            {programmes.find(p => p._id === selected)?.name}
          </p>
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

export default ProgrammeSelection;