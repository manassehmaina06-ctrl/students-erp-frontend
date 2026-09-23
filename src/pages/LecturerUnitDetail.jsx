import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';

const TYPE_LABEL = {
  assignment: 'Assignment',
  cat:        'CAT',
  exam:       'Exam',
  project:    'Project',
  practical:  'Practical',
};

const emptyAssess = { name: '', type: 'assignment', number: 1, weight: 10, maxScore: 100 };

export default function LecturerUnitDetail() {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState('assessments'); // 'assessments' | 'marks'

  // Assessments
  const [assessments, setAssessments] = useState([]);
  const [weightTotal, setWeightTotal] = useState(0);
  const [weightsValid, setWeightsValid] = useState(false);
  const [semester, setSemester] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAssess);

  // Marks grid
  const [grid, setGrid] = useState(null);
  const [scores, setScores] = useState({}); // { `${studentId}:${assessmentId}`: value }
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Assignments
  const [assignments, setAssignments]               = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [showAssignModal, setShowAssignModal]       = useState(false);
  const [assignForm, setAssignForm]                 = useState({
    title: '', description: '', dueDate: '', maxScore: 100,
    linkToAssessment: false, weight: 10, file: null,
  });
  const [savingAssign, setSavingAssign] = useState(false);
  const assignFileRef = useRef(null);


  // Resources state
  const [resources, setResources]         = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm]   = useState({ title: '', description: '', category: 'lecture_notes', file: null });
  const [uploading, setUploading]         = useState(false);
    // Attendance state
  const [sessions, setSessions]         = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm]   = useState({ date: '', topic: '', note: '' });
  const [openSession, setOpenSession]   = useState(null);   // { session, students }
  const [savingAttendance, setSavingAttendance] = useState(false);
  const loadAssessments = () => {
    return api.get(`/lecturer/units/${unitId}/assessments`)
      .then((r) => {
        setAssessments(r.data.assessments || []);
        setWeightTotal(r.data.weightTotal || 0);
        setWeightsValid(!!r.data.weightsValid);
        setSemester(r.data.semester || '');
      });
  };

  const loadGrid = () => {
    return api.get(`/lecturer/units/${unitId}/marks`)
      .then((r) => {
        setGrid(r.data);
        const next = {};
        for (const s of (r.data.students || [])) {
          for (const [aId, score] of Object.entries(s.marks || {})) {
            next[`${s._id}:${aId}`] = score === null || score === undefined ? '' : score;
          }
        }
        setScores(next);
      });
  };

  const loadSessions = () => {
    setSessionsLoading(true);
    return api.get(`/lecturer/units/${unitId}/sessions`)
      .then((r) => setSessions(r.data.sessions || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setSessionsLoading(false));
  };
    const loadResources = () => {
    setResourcesLoading(true);
    return api.get(`/lecturer/units/${unitId}/resources`)
      .then((r) => setResources(r.data.resources || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setResourcesLoading(false));
  };

    const loadAssignments = () => {
    setAssignmentsLoading(true);
    return api.get(`/lecturer/units/${unitId}/assignments`)
      .then((r) => setAssignments(r.data.assignments || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setAssignmentsLoading(false));
  };

  useEffect(() => {
    setLoading(true);
       Promise.all([loadAssessments(), loadGrid(), loadSessions(), loadResources(), loadAssignments()])
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [unitId]);;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAssess);
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditing(a._id);
    setForm({
      name: a.name, type: a.type,
      number: a.number || 1,
      weight: a.weight,
      maxScore: a.maxScore,
    });
    setShowModal(true);
  };

  const saveAssessment = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        number: Number(form.number),
        weight: Number(form.weight),
        maxScore: Number(form.maxScore),
      };
      if (editing) {
        await api.put(`/lecturer/assessments/${editing}`, payload);
      } else {
        await api.post(`/lecturer/units/${unitId}/assessments`, payload);
      }
      setShowModal(false);
      await loadAssessments();
      await loadGrid();
      setToast(editing ? 'Assessment updated' : 'Assessment created');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAssessment = async (id) => {
    if (!window.confirm('Delete this assessment and all its marks?')) return;
    try {
      await api.delete(`/lecturer/assessments/${id}`);
      await loadAssessments();
      await loadGrid();
      setToast('Assessment deleted');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const setScore = (studentId, assessmentId, value) => {
    setScores((prev) => ({ ...prev, [`${studentId}:${assessmentId}`]: value }));
  };

  const saveMarks = async () => {
    setSaving(true); setError('');
    try {
      const rows = [];
      for (const [key, value] of Object.entries(scores)) {
        const [studentId, assessmentId] = key.split(':');
        rows.push({
          studentId,
          assessmentId,
          score: value === '' ? null : Number(value),
        });
      }
      const res = await api.post(`/lecturer/units/${unitId}/marks`, { marks: rows });
      setToast(`Saved ${res.data.saved} marks${res.data.errors?.length ? ` (${res.data.errors.length} errors)` : ''}`);
      await loadGrid();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };
    const openCreateSession = () => {
    setSessionForm({ date: new Date().toISOString().slice(0, 10), topic: '', note: '' });
    setShowSessionModal(true);
  };

  const createSession = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post(`/lecturer/units/${unitId}/sessions`, sessionForm);
      setShowSessionModal(false);
      await loadSessions();
      setToast('Session created');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Delete this session and all its attendance records?')) return;
    try {
      await api.delete(`/lecturer/units/${unitId}/sessions/${sessionId}`);
      await loadSessions();
      setToast('Session deleted');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const openSessionForEditing = async (sessionId) => {
    try {
      const r = await api.get(`/lecturer/units/${unitId}/sessions/${sessionId}`);
      setOpenSession(r.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const setStudentStatus = (studentId, status) => {
    setOpenSession((prev) => ({
      ...prev,
      students: prev.students.map((s) => s._id === studentId ? { ...s, status } : s),
    }));
  };

  const saveAttendance = async () => {
    if (!openSession) return;
    setSavingAttendance(true); setError('');
    try {
      await api.put(
        `/lecturer/units/${unitId}/sessions/${openSession.session._id}`,
        { records: openSession.students.map((s) => ({ studentId: s._id, status: s.status })) }
      );
      setToast('Attendance saved');
      setOpenSession(null);
      await loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSavingAttendance(false);
    }
  };
    const openResourceModal = () => {
    setResourceForm({ title: '', description: '', category: 'lecture_notes', file: null });
    setShowResourceModal(true);
  };

  const uploadResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.file) return setError('Please choose a file');
    if (!resourceForm.title.trim()) return setError('Title is required');

    const fd = new FormData();
    fd.append('file', resourceForm.file);
    fd.append('title', resourceForm.title);
    fd.append('description', resourceForm.description);
    fd.append('category', resourceForm.category);

    setUploading(true); setError('');
    try {
      await api.post(`/lecturer/units/${unitId}/resources`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowResourceModal(false);
      await loadResources();
      setToast('Resource uploaded');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteResource = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/lecturer/resources/${resourceId}`);
      await loadResources();
      setToast('Resource deleted');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

    const openAssignModal = () => {
    setAssignForm({
      title: '', description: '', dueDate: '', maxScore: 100,
      linkToAssessment: false, weight: 10, file: null,
    });
    if (assignFileRef.current) assignFileRef.current.value = '';
    setShowAssignModal(true);
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.title.trim()) return setError('Title required');
    if (!assignForm.dueDate) return setError('Due date required');
    if (assignForm.linkToAssessment && (!assignForm.weight || Number(assignForm.weight) <= 0)) {
      return setError('Weight must be > 0 when linking to grade');
    }

    const fd = new FormData();
    fd.append('title', assignForm.title);
    fd.append('description', assignForm.description);
    fd.append('dueDate', assignForm.dueDate);
    fd.append('maxScore', assignForm.maxScore);
    fd.append('linkToAssessment', assignForm.linkToAssessment ? 'true' : 'false');
    if (assignForm.linkToAssessment) fd.append('weight', assignForm.weight);
    if (assignForm.file) fd.append('file', assignForm.file);

    setSavingAssign(true); setError('');
    try {
      await api.post(`/lecturer/units/${unitId}/assignments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowAssignModal(false);
      await Promise.all([loadAssignments(), loadAssessments()]);   // reload assessments too (weight total may change)
      setToast('Assignment created (draft)');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSavingAssign(false);
    }
  };

  const setAssignmentStatus = async (assignmentId, action) => {
    try {
      await api.post(`/lecturer/assignments/${assignmentId}/${action}`);
      await loadAssignments();
      setToast(`Assignment ${action === 'publish' ? 'published' : action === 'hide' ? 'moved to draft' : 'closed'}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const deleteAssignment = async (assignmentId, title) => {
    if (!window.confirm(`Delete "${title}"? All submissions will also be deleted.`)) return;
    try {
      await api.delete(`/lecturer/assignments/${assignmentId}`);
      await Promise.all([loadAssignments(), loadAssessments()]);
      setToast('Assignment deleted');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const ASSIGN_PILL = {
    draft:     'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-800',
    closed:    'bg-blue-100 text-blue-800',
  };

  const fmtBytes = (n) => {
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const CATEGORY_LABEL = {
    lecture_notes: 'Lecture Notes',
    past_papers:   'Past Papers',
    slides:        'Slides',
    reading_list:  'Reading List',
    other:         'Other',
  };

  const computeRow = (studentId) => {
    if (!grid) return null;
    let coursework = 0, exam = 0, allGraded = true;
    for (const a of grid.assessments) {
      const v = scores[`${studentId}:${a._id}`];
      if (v === '' || v === undefined || v === null) { allGraded = false; continue; }
      const pct = (Number(v) / a.maxScore) * 100;
      const w = (pct * a.weight) / 100;
      if (a.type === 'exam') exam += w; else coursework += w;
    }
    const final = coursework + exam;
    const grade = final >= 70 ? 'A' : final >= 60 ? 'B' : final >= 50 ? 'C' : final >= 40 ? 'D' : 'E';
    return {
      coursework: Math.round(coursework * 100) / 100,
      exam:       Math.round(exam * 100) / 100,
      final:      Math.round(final * 100) / 100,
      grade:      allGraded ? grade : null,
    };
  };

  if (loading) return <StaffLayout><div className="p-8 text-gray-500">Loading…</div></StaffLayout>;

   return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/erp/lecturer')} className="text-gray-500 hover:text-gray-800 text-sm mb-4">
          ← Back to My Units
        </button>

        {toast && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-4">{toast}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {grid?.unit && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{grid.unit.code} — {grid.unit.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Semester {semester} · {grid.students.length} student{grid.students.length === 1 ? '' : 's'} enrolled
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Weight total</p>
                <p className={`text-lg font-bold ${weightsValid ? 'text-green-700' : 'text-red-600'}`}>
                  {weightTotal}%
                </p>
                <p className="text-xs text-gray-400">
                  {weightsValid ? '✓ valid (sums to 100)' : 'needs 100%'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs jameni  */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab('assessments')}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'assessments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >Assessments</button>
          <button
            onClick={() => setTab('marks')}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'marks' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >Marks Entry</button>
          <button
            onClick={() => setTab('attendance')}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'attendance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >Attendance</button>
          <button
            onClick={() => setTab('resources')}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'resources' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >Resources</button>
                    <button
            onClick={() => setTab('assignments')}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'assignments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >Assignments</button>
        </div>

        {/* ===== ASSESSMENTS TAB ===== */}
        {tab === 'assessments' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                + New Assessment
              </button>
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {assessments.length === 0 ? (
                <p className="p-6 text-center text-gray-400">
                  No assessments yet. Define them (e.g. Assignment 1 – 10%, CAT 1 – 20%, Final Exam – 70%).
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Max Score</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a) => (
                      <tr key={a._id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{a.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{TYPE_LABEL[a.type] || a.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{a.number}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{a.weight}%</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{a.maxScore}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit(a)} className="text-xs text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                          <button onClick={() => deleteAssessment(a._id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ===== MARKS TAB ===== */}
        {tab === 'marks' && (
          <>
            {grid?.students?.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
                No students are enrolled in this unit yet.
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10">Student</th>
                        {grid?.assessments?.map((a) => (
                          <th key={a._id} className="px-2 py-3 text-center min-w-[100px]">
                            <div className="font-medium text-gray-700">{a.name}</div>
                            <div className="text-[10px] text-gray-400">/{a.maxScore} · {a.weight}%</div>
                          </th>
                        ))}
                        <th className="px-3 py-3 text-right">Course</th>
                        <th className="px-3 py-3 text-right">Exam</th>
                        <th className="px-3 py-3 text-right">Final</th>
                        <th className="px-3 py-3 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grid?.students?.map((s) => {
                        const row = computeRow(s._id);
                        return (
                          <tr key={s._id} className="border-t border-gray-100">
                            <td className="px-4 py-2 sticky left-0 bg-white z-10">
                              <div className="text-sm font-medium text-gray-800">{s.name}</div>
                              <div className="text-xs text-purple-700 font-mono">{s.studentNumber}</div>
                            </td>
                            {grid.assessments.map((a) => (
                              <td key={a._id} className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={a.maxScore}
                                  value={scores[`${s._id}:${a._id}`] ?? ''}
                                  onChange={(e) => setScore(s._id, a._id, e.target.value)}
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                                />
                              </td>
                            ))}
                            <td className="px-3 py-2 text-right text-sm text-gray-700">{row?.coursework ?? '—'}</td>
                            <td className="px-3 py-2 text-right text-sm text-gray-700">{row?.exam ?? '—'}</td>
                            <td className="px-3 py-2 text-right text-sm font-medium text-gray-800">{row?.final ?? '—'}</td>
                            <td className="px-3 py-2 text-right">
                              {row?.grade && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  row.grade === 'A' ? 'bg-green-100 text-green-800'
                                  : row.grade === 'B' ? 'bg-blue-100 text-blue-800'
                                  : row.grade === 'C' ? 'bg-yellow-100 text-yellow-800'
                                  : row.grade === 'D' ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                                }`}>{row.grade}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={saveMarks}
                    disabled={saving || !weightsValid}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg"
                  >
                    {saving ? 'Saving…' : 'Save Marks'}
                  </button>
                </div>
                {!weightsValid && (
                  <p className="text-xs text-red-600 mt-2 text-right">
                    Fix the assessment weights first (must total 100%).
                  </p>
                )}
              </>
            )}
          </>
        )}

        {/* ===== ATTENDANCE TAB ===== */}
        {tab === 'attendance' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={openCreateSession}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                + New Session
              </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              {sessionsLoading ? (
                <p className="p-6 text-center text-gray-400">Loading…</p>
              ) : sessions.length === 0 ? (
                <p className="p-6 text-center text-gray-400">
                  No sessions yet. Create one to start marking attendance.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Topic</th>
                      <th className="px-4 py-3">Present</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s._id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {new Date(s.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.topic || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {s.presentCount} / {grid?.students?.length || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openSessionForEditing(s._id)}
                            className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                          >Mark</button>
                          <button
                            onClick={() => deleteSession(s._id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ===== RESOURCES TAB ===== */}
        {tab === 'resources' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={openResourceModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                + Upload Resource
              </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              {resourcesLoading ? (
                <p className="p-6 text-center text-gray-400">Loading…</p>
              ) : resources.length === 0 ? (
                <p className="p-6 text-center text-gray-400">No resources uploaded yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">File</th>
                      <th className="px-4 py-3">Uploaded</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((r) => (
                      <tr key={r._id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{r.title}</div>
                          {r.description && <div className="text-xs text-gray-500">{r.description}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {CATEGORY_LABEL[r.category] || r.category}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {r.fileName}
                          <div className="text-[10px] text-gray-400">{fmtBytes(r.fileSize)}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(r.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`http://localhost:5000${r.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                          >Download</a>
                          <button
                            onClick={() => deleteResource(r._id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>



        {tab === 'assignments' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={openAssignModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                + New Assignment
              </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              {assignmentsLoading ? (
                <p className="p-6 text-center text-gray-400">Loading…</p>
              ) : assignments.length === 0 ? (
                <p className="p-6 text-center text-gray-400">No assignments yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Due</th>
                      <th className="px-4 py-3">Max</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Subs</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a._id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{a.title}</div>
                          {a.attachmentName && (
                            <a href={`http://localhost:5000${a.attachmentUrl}`}
                               target="_blank" rel="noopener noreferrer"
                               className="text-xs text-blue-600 hover:text-blue-800">
                              📎 {a.attachmentName}
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {new Date(a.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.maxScore}</td>
                        <td className="px-4 py-3 text-sm">
                          {a.linkToAssessment && a.weight > 0
                            ? <span className="text-purple-700 font-medium">{a.weight}%</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {a.gradedCount}/{a.totalSubmissions}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ASSIGN_PILL[a.status]}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {a.status === 'draft' && (
                            <button onClick={() => setAssignmentStatus(a._id, 'publish')}
                              className="text-xs text-green-600 hover:text-green-800 mr-3 font-medium">
                              Publish
                            </button>
                          )}
                          {a.status === 'published' && (
                            <>
                              <button onClick={() => navigate(`/erp/lecturer/units/${unitId}/assignments/${a._id}`)}
                                className="text-xs text-blue-600 hover:text-blue-800 mr-3 font-medium">
                                Grade
                              </button>
                              <button onClick={() => setAssignmentStatus(a._id, 'close')}
                                className="text-xs text-gray-500 hover:text-gray-700 mr-3">
                                Close
                              </button>
                            </>
                          )}
                          {a.status === 'closed' && (
                            <>
                              <button onClick={() => navigate(`/erp/lecturer/units/${unitId}/assignments/${a._id}`)}
                                className="text-xs text-blue-600 hover:text-blue-800 mr-3 font-medium">
                                Grade
                              </button>
                              <button onClick={() => setAssignmentStatus(a._id, 'publish')}
                                className="text-xs text-green-600 hover:text-green-800 mr-3">
                                Reopen
                              </button>
                            </>
                          )}
                          <button onClick={() => deleteAssignment(a._id, a.title)}
                            className="text-xs text-red-600 hover:text-red-800">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      {/* Assessment modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={saveAssessment} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editing ? 'Edit Assessment' : 'New Assessment'}
            </h2>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Name</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Assignment 1" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="block">
                <span className="text-sm text-gray-600">Type</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2">
                  {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Number</span>
                <input type="number" min="1" value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Weight (%)</span>
                <input type="number" min="0" max="100" value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Max Score</span>
                <input type="number" min="1" value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
                {saving ? 'Saving…' : (editing ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New session modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={createSession} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">New Session</h2>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Date</span>
              <input type="date" required value={sessionForm.date}
                onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Topic (optional)</span>
              <input type="text" value={sessionForm.topic}
                onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                placeholder="e.g. Introduction to loops"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <label className="block mb-5">
              <span className="text-sm text-gray-600">Note (optional)</span>
              <input type="text" value={sessionForm.note}
                onChange={(e) => setSessionForm({ ...sessionForm, note: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowSessionModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attendance marking modal */}
      {openSession && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Mark Attendance</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(openSession.session.date).toLocaleDateString()}
                  {openSession.session.topic && ` · ${openSession.session.topic}`}
                </p>
              </div>
              <button onClick={() => setOpenSession(null)}
                className="text-gray-400 hover:text-gray-800 text-2xl leading-none">×</button>
            </div>

            {openSession.students.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No students enrolled in this unit.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {openSession.students.map((s) => (
                    <tr key={s._id} className="border-t border-gray-100">
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800">{s.name}</div>
                        <div className="text-xs text-purple-700 font-mono">{s.studentNumber}</div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={s.status}
                          onChange={(e) => setStudentStatus(s._id, e.target.value)}
                          className={`border rounded-lg px-2 py-1 text-sm ${
                            s.status === 'present' ? 'bg-green-50 border-green-300 text-green-800'
                            : s.status === 'absent' ? 'bg-red-50 border-red-300 text-red-800'
                            : s.status === 'late' ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                            : 'bg-gray-50 border-gray-300 text-gray-700'
                          }`}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setOpenSession(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Cancel</button>
              <button onClick={saveAttendance} disabled={savingAttendance}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
                {savingAttendance ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload resource modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={uploadResource} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Resource</h2>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Title</span>
              <input type="text" required value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                placeholder="e.g. Week 1 — Introduction"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Description (optional)</span>
              <textarea value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                rows="2"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Category</span>
              <select value={resourceForm.category}
                onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="lecture_notes">Lecture Notes</option>
                <option value="past_papers">Past Papers</option>
                <option value="slides">Slides</option>
                <option value="reading_list">Reading List</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block mb-5">
              <span className="text-sm text-gray-600">File (max 25 MB)</span>
              <input type="file" required
                onChange={(e) => setResourceForm({ ...resourceForm, file: e.target.files[0] })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              <span className="text-xs text-gray-400">
                PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, TXT, images
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowResourceModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Cancel</button>
              <button type="submit" disabled={uploading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}
            {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={createAssignment} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">New Assignment</h2>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Title</span>
              <input type="text" required value={assignForm.title}
                onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                placeholder="e.g. Assignment 4: Loops"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Description</span>
              <textarea value={assignForm.description}
                onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                rows="3"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="block">
                <span className="text-sm text-gray-600">Due Date</span>
                <input type="date" required value={assignForm.dueDate}
                  onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Max Score</span>
                <input type="number" min="1" value={assignForm.maxScore}
                  onChange={(e) => setAssignForm({ ...assignForm, maxScore: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox"
                  checked={assignForm.linkToAssessment}
                  onChange={(e) => setAssignForm({ ...assignForm, linkToAssessment: e.target.checked })} />
                <span className="font-medium text-purple-900">Count toward final grade</span>
              </label>
              {assignForm.linkToAssessment && (
                <>
                  <label className="block mt-3">
                    <span className="text-xs text-purple-700">Weight (% of coursework)</span>
                    <input type="number" min="1" max="100" value={assignForm.weight}
                      onChange={(e) => setAssignForm({ ...assignForm, weight: e.target.value })}
                      className="mt-1 w-full border border-purple-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <p className="text-xs text-purple-700 mt-2">
                    Current total: <strong>{weightTotal}%</strong>.
                    Adding {assignForm.weight}% would make it <strong>{weightTotal + Number(assignForm.weight || 0)}%</strong>.
                  </p>
                </>
              )}
            </div>

            <label className="block mb-5">
              <span className="text-sm text-gray-600">Attachment (optional)</span>
              <input ref={assignFileRef} type="file"
                onChange={(e) => setAssignForm({ ...assignForm, file: e.target.files[0] })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              <span className="text-xs text-gray-400">Max 25 MB</span>
            </label>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Cancel</button>
              <button type="submit" disabled={savingAssign}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
                {savingAssign ? 'Creating…' : 'Create (draft)'}
              </button>
            </div>
          </form>
        </div>
      )}
      </StaffLayout>
    );
}





