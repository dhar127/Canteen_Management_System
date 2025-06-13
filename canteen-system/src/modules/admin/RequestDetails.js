import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RequestDetails.css';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestDetails();
  }, []);

  const fetchRequestDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/request/${id}`);
      setRequest(res.data);
    } catch (err) {
      console.error('Error fetching request details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/approve/${id}`);
      alert('Canteen Approved!');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/reject/${id}`);
      alert('Canteen Rejected!');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  if (loading) return <div className="details-loading">Loading...</div>;
  if (!request) return <div className="details-error">Request not found.</div>;

  return (
    <div className="request-details-container">
      <div className="request-card">
        <h2 className="request-title">Canteen Request Details</h2>

        <div className="request-section">
          <h3>User Login Details</h3>
          <p><strong>Username:</strong> {request.user?.username}</p>
          <p><strong>Email:</strong> {request.user?.email}</p>
        </div>

<div className="request-section">
  <h3>Canteen Details</h3>
  <p><strong>Name:</strong> {request.name}</p>
  <p><strong>Owner:</strong> {request.owner}</p>
  <p><strong>License Number:</strong> {request.licenseNumber}</p>
  <p><strong>Location:</strong> {request.location}</p>
  <p><strong>Contact Email:</strong> {request.contactEmail}</p>
  <p><strong>Contact Phone:</strong> {request.contactPhone}</p>
  <p><strong>Food Type:</strong> {request.foodType}</p>
  <p><strong>Opening Hours:</strong> {request.openingHours}</p>
  <p><strong>Description:</strong> {request.description}</p>
  <p><strong>Status:</strong> {request.status}</p>
</div>


        <div className="request-actions">
          <button className="approve-btn" onClick={handleApprove}>✅ Approve</button>
          <button className="reject-btn" onClick={handleReject}>❌ Reject</button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;