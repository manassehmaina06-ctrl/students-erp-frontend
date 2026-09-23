import React, { useState } from 'react';

const DEFAULT_ROWS = [
  { label: 'Tuition',       amount: '', paid: '' },
  { label: 'Registration',  amount: '', paid: '' },
];

const BillingModal = ({ studentName, mode = 'enroll', onCancel, onSubmit, saving }) => {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [semester, setSemester] = useState('2026-S2');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [localError, setLocalError] = useState('');

  const update = (i, key, value) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const addRow = () => setRows((prev) => [...prev, { label: '', amount: '', paid: '' }]);
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const paid  = rows.reduce((s, r) => s + (Number(r.paid) || 0), 0);
  const balance = total - paid;

  const submit = () => {
    setLocalError('');
    const cleaned = rows
      .filter((r) => r.label.trim() && Number(r.amount) > 0)
      .map((r) => ({
        label:  r.label.trim(),
        amount: Number(r.amount),
        paid:   Number(r.paid) || 0,
      }));
    if (cleaned.length === 0) {
      setLocalError('Add at least one fee line with a label and amount.');
      return;
    }
    if (mode === 'addSemester') {
      if (!semester.trim() || !academicYear.trim()) {
        setLocalError('Semester and academic year are required.');
        return;
      }
      onSubmit({ semester: semester.trim(), academicYear: academicYear.trim(), billings: cleaned });
    } else {
      onSubmit(cleaned);
    }
  };

  const isSemesterMode = mode === 'addSemester';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {isSemesterMode ? '📚 Add Semester Billings' : '🧾 Create Student Account & Bill'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{studentName}</p>
        </div>

        {isSemesterMode && (
          <div className="px-6 pt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-600">Semester</span>
              <input
                type="text" value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="2026-S2"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600">Academic Year</span>
              <input
                type="text" value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026/2027"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        <div className="p-6 space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text" value={r.label}
                onChange={(e) => update(i, 'label', e.target.value)}
                placeholder="Label"
                className="col-span-4 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number" value={r.amount}
                onChange={(e) => update(i, 'amount', e.target.value)}
                placeholder="Amount"
                className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              {!isSemesterMode && (
                <input
                  type="number" value={r.paid}
                  onChange={(e) => update(i, 'paid', e.target.value)}
                  placeholder="Paid"
                  className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              )}
              <button
                onClick={() => removeRow(i)}
                className={`${isSemesterMode ? 'col-span-8 justify-self-start' : 'col-span-2'} text-xs text-red-600 hover:text-red-800`}
              >Remove</button>
            </div>
          ))}
          <button onClick={addRow} className="text-sm text-blue-600 hover:text-blue-800">+ Add line</button>
        </div>

        <div className="px-6 pb-4 text-sm text-gray-700 space-y-1">
          <div>Total: <span className="font-semibold">KES {total.toLocaleString()}</span></div>
          {!isSemesterMode && <div>Paid: <span className="font-semibold">KES {paid.toLocaleString()}</span></div>}
          {!isSemesterMode && <div>Balance: <span className="font-semibold text-red-600">KES {balance.toLocaleString()}</span></div>}
        </div>

        {localError && (
          <div className="px-6 pb-3">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 text-xs">
              {localError}
            </div>
          </div>
        )}

        <div className="p-6 border-t flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm disabled:opacity-50"
          >Cancel</button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : (isSemesterMode ? 'Bill semester' : 'Create & Bill')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingModal;