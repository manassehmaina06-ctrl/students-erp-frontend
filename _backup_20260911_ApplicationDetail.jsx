import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const ApplicationDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState('');

  // Editable fields state
  const [editData, setEditData] = useState({
    personalInfo: {},
    academicInfo: {},
  });

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await axios.get(`/api/admissions/applications/${id}`);
        setApplication(res.data);
        setComments(res.data.comments || '');
        
        const student = res.data.studentId || {};
        setEditData({
          personalInfo: student.personalInfo || {},
          academicInfo: student.academicInfo || {},
        });
      } catch (err) {
        console.error('Error fetching application:', err);
        alert('Failed to load application');
        navigate('/admissions');
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id, token]);

  const handlePersonalChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const handleAcademicChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      academicInfo: { ...prev.academicInfo, [field]: value }
    }));
  };

  const handleSubjectsChange = (e) => {
    const subjects = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setEditData(prev => ({
      ...prev,
      academicInfo: { ...prev.academicInfo, subjects }
    }));
  };

  const saveEdits = async () => {
    setSaving(true);
    try {
      const studentId = application.studentId._id;
      await axios.put(`/api/admissions/student/${studentId}`, {
        personalInfo: editData.personalInfo,
        academicInfo: editData.academicInfo,
      });
      
      // Also save comments
      await axios.put(`/api/admissions/applications/${id}`, {
        status: application.status,
        comments
      });
      
      alert('✅ Changes saved successfully!');
      setIsEditing(false);
      
      // Refresh
      const res = await axios.get(`/api/admissions/applications/${id}`);
      setApplication(res.data);
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    setSaving(false);
  };

  const handleStatusUpdate = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} this application?`)) return;
    setSaving(true);
    try {
      await axios.put(`/api/admissions/applications/${id}`, { status, comments });
      alert(`✅ Application ${status}!`);
      const res = await axios.get(`/api/admissions/applications/${id}`);
      setApplication(res.data);
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
    setSaving(false);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    setSaving(true);
    try {
      await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Document uploaded successfully!');
      const res = await axios.get(`/api/admissions/applications/${id}`);
      setApplication(res.data);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading application...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Application not found</p>
      </div>
    );
  }

  const student = application.studentId || {};
  const personal = student.personalInfo || {};
  const academic = student.academicInfo || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📄</span>
          <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {application.status}
          </span>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            >
              ✏️ Edit
            </button>
          ) : (
            <>
              <button
                onClick={saveEdits}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/admissions')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 hover-lift">
        {/* Personal Information */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">👤 Personal Information</h3>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                <input
                  type="text"
                  value={editData.personalInfo.firstName || ''}
                  onChange={(e) => handlePersonalChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editData.personalInfo.lastName || ''}
                  onChange={(e) => handlePersonalChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={editData.personalInfo.phone || ''}
                  onChange={(e) => handlePersonalChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nationality</label>
                <input
                  type="text"
                  value={editData.personalInfo.nationality || ''}
                  onChange={(e) => handlePersonalChange('nationality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  value={editData.personalInfo.address || ''}
                  onChange={(e) => handlePersonalChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{personal.firstName} {personal.lastName}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{student.userId?.email || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{personal.phone || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Nationality</p><p className="font-medium">{personal.nationality || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-sm text-gray-500">Address</p><p className="font-medium">{personal.address || 'N/A'}</p></div>
            </div>
          )}
        </div>

        {/* Academic Information */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 Academic Information</h3>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">High School</label>
                <input
                  type="text"
                  value={editData.academicInfo.highSchool || ''}
                  onChange={(e) => handleAcademicChange('highSchool', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Graduation Year</label>
                <input
                  type="number"
                  value={editData.academicInfo.graduationYear || ''}
                  onChange={(e) => handleAcademicChange('graduationYear', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">GPA</label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.academicInfo.gpa || ''}
                  onChange={(e) => handleAcademicChange('gpa', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Subjects (comma separated)</label>
                <input
                  type="text"
                  value={editData.academicInfo.subjects?.join(', ') || ''}
                  onChange={handleSubjectsChange}
                  placeholder="e.g. Mathematics, English, Physics"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">High School</p><p className="font-medium">{academic.highSchool || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Graduation Year</p><p className="font-medium">{academic.graduationYear || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">GPA</p><p className="font-medium">{academic.gpa || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-sm text-gray-500">Subjects</p><p className="font-medium">{academic.subjects?.join(', ') || 'N/A'}</p></div>
            </div>
          )}
        </div>

        {/* Programme */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🎯 Programme</h3>
          <p className="font-medium">{application.programmeId?.name || 'N/A'}</p>
          <p className="text-sm text-gray-500">{application.programmeId?.code} · {application.programmeId?.department}</p>
        </div>

        {/* Documents */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📎 Documents ({student.documents?.length || 0})</h3>
          {student.documents?.map((doc) => (
            <div key={doc._id} className="flex items-center justify-between bg-gray-50 p-2 rounded mb-1">
              <span className="text-sm">{doc.name}</span>
              <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">View</a>
            </div>
          ))}
          <div className="mt-3">
            <input
              type="file"
              onChange={(e) => handleUpload(e.target.files[0])}
              className="text-sm"
            />
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 Comments & Notes</h3>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows="3"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Add comments about this application..."
          />
          {!isEditing && comments && (
            <p className="text-xs text-gray-400 mt-1">✏️ Click Edit to save comments</p>
          )}
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {application.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg transition shadow-sm hover:shadow-md disabled:opacity-50"
              >
                ✅ Accept Application
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={saving}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg transition shadow-sm hover:shadow-md disabled:opacity-50"
              >
                ❌ Reject Application
              </button>
            </>
          )}
          {application.status !== 'pending' && (
            <div className="text-gray-500 text-sm py-2">
              This application has been {application.status}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
