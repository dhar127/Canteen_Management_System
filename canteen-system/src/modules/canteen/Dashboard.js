import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const CanteenDashboard = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  
  const [requestStatus, setRequestStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasRequest, setHasRequest] = useState(false);

  useEffect(() => {
    fetchCanteenRequestStatus();
  }, [userId]);

  const fetchCanteenRequestStatus = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/canteen/request-by-user/${userId}`);
      setRequestStatus(response.data.status);
      setRequestId(response.data._id);
      setHasRequest(true);
    } catch (error) {
      // No request found
      setHasRequest(false);
      setRequestStatus(null);
      setRequestId(null);
    }
    setLoading(false);
  };

  const handleGiveRequest = () => {
    navigate("/canteen/request-form");
  };

  const handleManageMenu = () => {
    if (requestStatus === 'approved') {
      navigate("/canteen/manage-menu");
    }
  };

  const handleViewOrders = () => {
    if (requestStatus === 'approved') {
      navigate("/canteen/view-orders");
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    await fetchCanteenRequestStatus();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusMessage = () => {
    if (!hasRequest) {
      return "You haven't submitted a canteen registration request yet.";
    }
    
    switch (requestStatus) {
      case 'approved':
        return "🎉 Congratulations! Your canteen has been approved. You can now manage your menu and view orders.";
      case 'rejected':
        return "❌ Your canteen request has been rejected. You can submit a new request with updated information.";
      case 'pending':
        return "⏳ Your canteen request is under review. Please wait for admin approval.";
      default:
        return "Status unknown. Please refresh to check your request status.";
    }
  };

  const getButtonText = () => {
    if (!hasRequest) {
      return 'Submit Request';
    }
    
    switch (requestStatus) {
      case 'rejected':
        return 'Submit New Request';
      case 'pending':
        return 'View Request Status';
      case 'approved':
        return 'View Request';
      default:
        return 'View Request';
    }
  };

  if (loading) {
    return (
      <div className="canteen-dashboard-container">
        <div className="canteen-dashboard-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="canteen-dashboard-container">
      <div className="canteen-dashboard-card">
        <h2 className="canteen-dashboard-title">Welcome, Canteen Owner</h2>
        
        {/* Request Status Section */}
        <div className="status-section" style={{ marginBottom: '20px' }}>
          {hasRequest && (
            <div className="request-status-card">
              <h3>Request Status</h3>
              <p><strong>Request ID:</strong> {requestId}</p>
              <p>
                <strong>Status: </strong>
                <span 
                  style={{ 
                    color: getStatusColor(requestStatus), 
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {requestStatus}
                </span>
              </p>
              <p className="status-message">{getStatusMessage()}</p>
              <button 
                onClick={refreshStatus} 
                className="refresh-button"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Status"}
              </button>
            </div>
          )}
          
          {!hasRequest && (
            <div className="no-request-card">
              <p>{getStatusMessage()}</p>
            </div>
          )}
        </div>

        {/* Dashboard Actions */}
        <div className="dashboard-actions">
          <p className="canteen-dashboard-subtext">
            Manage menu, view orders, and process deliveries.
          </p>
          
          <button 
            className={`canteen-dashboard-button ${requestStatus !== 'approved' ? 'disabled' : ''}`}
            onClick={handleManageMenu}
            disabled={requestStatus !== 'approved'}
            title={requestStatus !== 'approved' ? 'Request must be approved first' : ''}
          >
            Manage Menu
            {requestStatus !== 'approved' && <span className="lock-icon"> 🔒</span>}
          </button>
          
          <button 
            className={`canteen-dashboard-button ${requestStatus !== 'approved' ? 'disabled' : ''}`}
            onClick={handleViewOrders}
            disabled={requestStatus !== 'approved'}
            title={requestStatus !== 'approved' ? 'Request must be approved first' : ''}
          >
            View Orders
            {requestStatus !== 'approved' && <span className="lock-icon"> 🔒</span>}
          </button>
          
          <button 
            className="canteen-dashboard-button secondary"
            onClick={handleGiveRequest}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanteenDashboard;