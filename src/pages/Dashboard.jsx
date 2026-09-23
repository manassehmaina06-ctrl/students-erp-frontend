import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === 'admissions') {
          const res = await axios.get('/api/admissions/stats');
          setStats(res.data);
        } else if (user?.role === 'student') {
          const res = await axios.get('/api/applications/my');
          const apps = res.data;
          setStats({
            total: apps.length,
            pending: apps.filter(a => a.status === 'pending').length,
            accepted: apps.filter(a => a.status === 'accepted').length,
            rejected: apps.filter(a => a.status === 'rejected').length,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStats();
  }, [user, token]);

  const getRoleColor = () => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      admissions: 'bg-purple-100 text-purple-800',
      academic: 'bg-green-100 text-green-800',
      finance: 'bg-yellow-100 text-yellow-800',
    };
    return colors[user?.role] || 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 hover-lift">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Welcome, {user.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Here's an overview of your {user.role} dashboard
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${getRoleColor()}`}>
            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover-lift">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? '...' : stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover-lift">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">
            {loading ? '...' : stats.pending}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover-lift">
          <p className="text-sm text-gray-500">Accepted</p>
          <p className="text-3xl font-bold text-green-600">
            {loading ? '...' : stats.accepted}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover-lift">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-3xl font-bold text-red-600">
            {loading ? '...' : stats.rejected}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 hover-lift">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {user.role === 'student' && (
            <>
              <Link to="/apply" className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-xl text-center transition hover:shadow">
                📝 Apply Now
              </Link>
              <Link to="/tracking" className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-xl text-center transition hover:shadow">
                📊 Track Application
              </Link>
            </>
          )}
          {user.role === 'admissions' && (
            <Link to="/admissions" className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-xl text-center transition hover:shadow">
              📋 Review Applications
            </Link>
          )}
          {user.role === 'academic' && (
            <Link to="/academic" className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-xl text-center transition hover:shadow">
              📚 Manage Students
            </Link>
          )}
          {user.role === 'finance' && (
            <Link to="/finance" className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 p-4 rounded-xl text-center transition hover:shadow">
              💰 View Payments
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;