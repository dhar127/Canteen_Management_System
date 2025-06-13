import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Reusing styles

const RejectedCanteens = () => {
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRejectedCanteens();
  }, []);

  const fetchRejectedCanteens = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/requests');
      const rejectedOnly = res.data.filter(r => r.status === 'rejected');
      setRejectedRequests(rejectedOnly);
    } catch (err) {
      console.error('Failed to fetch rejected canteens:', err);
    }
  };

  const goToDetails = (id) => {
    navigate(`/admin/request/${id}`);
  };

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-title red">❌ Rejected Canteens</h2>

      {rejectedRequests.length === 0 ? (
        <p className="no-requests">No rejected canteens found.</p>
      ) : (
        <ul className="request-list">
          {rejectedRequests.map(req => (
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

export default RejectedCanteens;