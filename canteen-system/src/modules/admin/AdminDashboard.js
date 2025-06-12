import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/requests');
      // Only show pending ones
      const pendingOnly = res.data.filter(r => r.status === 'pending');
      setRequests(pendingOnly);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const approveRequest = async (id) => {
    await axios.put(`http://localhost:5000/api/admin/approve/${id}`);
    fetchRequests();
    alert('Canteen approved!');
  };

  const rejectRequest = async (id) => {
    await axios.put(`http://localhost:5000/api/admin/reject/${id}`);
    fetchRequests();
    alert('Canteen rejected!');
  };

  return (
    <div className="admin-dashboard" style={{ padding: '20px' }}>
      <h2>Pending Canteen Approvals</h2>
      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {requests.map(req => (
            <li key={req._id} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
              <strong>Canteen:</strong> {req.name}<br />
              <strong>Owner:</strong> {req.owner}<br />
              <strong>Location:</strong> {req.location}<br />
              <strong>Status:</strong> {req.status}<br />
              <button onClick={() => approveRequest(req._id)} style={{ marginRight: '10px', background: 'green', color: 'white' }}>
                Approve
              </button>
              <button onClick={() => rejectRequest(req._id)} style={{ background: 'red', color: 'white' }}>
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminDashboard;
