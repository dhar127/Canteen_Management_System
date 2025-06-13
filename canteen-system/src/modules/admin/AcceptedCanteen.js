import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CanteenList.css'; // Reusing same styles as AdminDashboard

const AcceptedCanteens = () => {
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAcceptedCanteens();
  }, []);

  const fetchAcceptedCanteens = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/requests');
      const approvedOnly = res.data.filter(r => r.status === 'approved');
      setAcceptedRequests(approvedOnly);
    } catch (err) {
      console.error('Failed to fetch accepted canteens:', err);
    }
  };

  const goToDetails = (id) => {
    navigate(`/admin/request/${id}`);
  };

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-title green">✅ Accepted Canteens</h2>

      {acceptedRequests.length === 0 ? (
        <p className="no-requests">No accepted canteens found.</p>
      ) : (
        <ul className="request-list">
          {acceptedRequests.map(req => (
            <li key={req._id} className="request-card" onClick={() => goToDetails(req._id)}>
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

export default AcceptedCanteens;
