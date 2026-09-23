import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Tracking = () => {
  const [apps, setApps] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await axios.get('/api/applications/my');
        setApps(res.data);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      }
    };
    fetchApps();
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold">Application Status</h2>
      {apps.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        apps.map((app) => (
          <div key={app._id} className="border p-4 my-2 rounded shadow">
            <p><span className="font-semibold">Status:</span> {app.status}</p>
            <p><span className="font-semibold">Submitted:</span> {new Date(app.submittedAt).toLocaleDateString()}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default Tracking;