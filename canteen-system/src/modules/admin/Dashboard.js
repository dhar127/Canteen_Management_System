import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Make sure to create this CSS file

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/requests');
      const pendingOnly = res.data.filter(r => r.status === 'pending');
      setRequests(pendingOnly);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const goToRequestDetails = (id) => {
    navigate(`/admin/request/${id}`);
  };

  const handleNavigation = (type) => {
    if (type === 'accepted') navigate('/admin/accepted');
    else if (type === 'rejected') navigate('/admin/rejected');
    else if (type === 'revenue') navigate('/admin/revenue');
  };

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-title">Admin Dashboard</h2>

      <div className="dashboard-buttons">
        <button className="dashboard-button green" onClick={() => handleNavigation('accepted')}>
          ✅ Accepted Canteens
        </button>
        <button className="dashboard-button red" onClick={() => handleNavigation('rejected')}>
          ❌ Rejected Canteens
        </button>
        <button className="dashboard-button orange" onClick={() => handleNavigation('revenue')}>
          💰 Total Revenue
        </button>
      </div>

      <h3 className="dashboard-subtext">Pending Canteen Requests</h3>

      {requests.length === 0 ? (
        <p className="no-requests">No pending requests.</p>
      ) : (
        <ul className="request-list">
          {requests.map(req => (
            <li key={req._id} className="request-card" onClick={() => goToRequestDetails(req._id)}>
              <p><strong>Canteen:</strong> {req.name}</p>
              <p><strong>Owner:</strong> {req.owner}</p>
              <p><strong>Location:</strong> {req.location}</p>
              <p><strong>Status:</strong> {req.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminDashboard;
