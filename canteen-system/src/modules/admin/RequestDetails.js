import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './RequestDetails.css';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Check if there's a quick action to perform
  const quickAction = location.state?.quickAction;

  useEffect(() => {
    fetchRequestDetails();
  }, []);

  useEffect(() => {
    // If there's a quick action and request is loaded, perform it
    if (quickAction && request && !processing) {
      if (quickAction === 'approve') {
        handleApprove(true); // true indicates it's a quick action
      } else if (quickAction === 'reject') {
        handleReject(true); // true indicates it's a quick action
      }
      // Clear the quick action from state to prevent re-execution
      window.history.replaceState({}, document.title);
    }
  }, [quickAction, request, processing]);

  const fetchRequestDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/request/${id}`);
      setRequest(res.data);
    } catch (err) {
      console.error('Error fetching request details:', err);
      alert('Error loading request details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (isQuickAction = false) => {
    if (processing) return; // Prevent double-clicks
    
    setProcessing(true);
    try {
      await axios.put(`http://localhost:5000/api/admin/approve/${id}`);
      
      if (isQuickAction) {
        alert('Canteen Approved successfully!');
        navigate('/admin/dashboard');
      } else {
        alert('Canteen Approved!');
        // Update local state to reflect the change
        setRequest(prev => ({ ...prev, status: 'approved' }));
      }
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Failed to approve canteen. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (isQuickAction = false) => {
    if (processing) return; // Prevent double-clicks
    
    setProcessing(true);
    try {
      await axios.put(`http://localhost:5000/api/admin/reject/${id}`);
      
      if (isQuickAction) {
        alert('Canteen Rejected successfully!');
        navigate('/admin/dashboard');
      } else {
        alert('Canteen Rejected!');
        // Update local state to reflect the change
        setRequest(prev => ({ ...prev, status: 'rejected' }));
      }
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Failed to reject canteen. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoBack = () => {
    navigate('/admin/dashboard');
  };

  if (loading) return <div className="details-loading">Loading request details...</div>;
  if (!request) return (
    <div className="details-error">
      <h2>Request not found</h2>
      <p>The requested canteen details could not be found.</p>
      <button onClick={handleGoBack} className="back-btn">
        ← Back to Dashboard
      </button>
    </div>
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-unknown';
    }
  };

  return (
    <div className="request-details-container">
      <div className="request-card">
        <div className="card-header">
          <button onClick={handleGoBack} className="back-btn">
            ← Back to Dashboard
          </button>
          <h2 className="request-title">Canteen Request Details</h2>
          <div className={`status-indicator ${getStatusClass(request.status)}`}>
            {request.status.toUpperCase()}
          </div>
        </div>

        {request.user && (
          <div className="request-section">
            <h3>User Login Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Username:</label>
                <span>{request.user.username}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{request.user.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="request-section">
          <h3>Canteen Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{request.name}</span>
            </div>
            <div className="info-item">
              <label>Owner:</label>
              <span>{request.owner}</span>
            </div>
            <div className="info-item">
              <label>License Number:</label>
              <span>{request.licenseNumber}</span>
            </div>
            <div className="info-item">
              <label>Location:</label>
              <span>{request.location}</span>
            </div>
            <div className="info-item">
              <label>Contact Email:</label>
              <span>{request.contactEmail}</span>
            </div>
            <div className="info-item">
              <label>Contact Phone:</label>
              <span>{request.contactPhone}</span>
            </div>
            <div className="info-item">
              <label>Food Type:</label>
              <span>{request.foodType}</span>
            </div>
            <div className="info-item">
              <label>Opening Hours:</label>
              <span>{request.openingHours}</span>
            </div>
            <div className="info-item full-width">
              <label>Description:</label>
              <span>{request.description}</span>
            </div>
          </div>
        </div>

        {request.status === 'pending' && (
          <div className="request-actions">
            <button 
              className="approve-btn" 
              onClick={() => handleApprove(false)}
              disabled={processing}
            >
              {processing ? '⏳ Processing...' : '✅ Approve'}
            </button>
            <button 
              className="reject-btn" 
              onClick={() => handleReject(false)}
              disabled={processing}
            >
              {processing ? '⏳ Processing...' : '❌ Reject'}
            </button>
          </div>
        )}

        {request.status !== 'pending' && (
          <div className="request-status-message">
            <p>
              This request has already been <strong>{request.status}</strong>.
              {request.status === 'approved' && ' The canteen owner has been notified.'}
              {request.status === 'rejected' && ' The canteen owner has been notified of the rejection.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetails;