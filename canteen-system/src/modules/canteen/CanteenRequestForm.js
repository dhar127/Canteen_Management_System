import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CanteenRequestForm.css";

const CanteenRequestForm = () => {
  // Get userId from localStorage - should be set during login
  const userId = localStorage.getItem("userId");
  
  // Debug: Log all localStorage items
  console.log("🔍 ALL localStorage items:");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}: ${value}`);
  }
  
  console.log("🔍 Retrieved userId from localStorage:", userId);
  console.log("🔍 userId type:", typeof userId);

  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    licenseNumber: "",
    location: "",
    contactEmail: "",
    contactPhone: "",
    foodType: "",
    openingHours: "",
    description: "",
  });

  const [requestId, setRequestId] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);

  // Enhanced userId validation function
  const isValidUserId = (id) => {
    if (!id || id === 'null' || id === 'undefined' || id.trim() === '') {
      return false;
    }
    // MongoDB ObjectId validation (24 hex characters)
    return /^[0-9a-fA-F]{24}$/.test(id.trim());
  };

  // Check authentication and fetch existing request
  useEffect(() => {
    console.log("🔍 useEffect - userId check:", userId);
    
    if (!isValidUserId(userId)) {
      console.log("❌ UserId validation failed - userId:", userId);
      setAuthError(true);
      setError("Please log in to submit a canteen request.");
      return;
    }
    
    console.log("✅ UserId validation passed, fetching request...");
    setAuthError(false);
    
    const fetchRequest = async () => {
      try {
        const cleanUserId = userId.trim();
        const res = await axios.get(`http://localhost:5000/api/canteen/request-by-user/${cleanUserId}`);
        
        if (res.data) {
          setRequestId(res.data._id);
          setRequestStatus(res.data.status);
          setAlreadySubmitted(true);
          
          // If status is rejected, start with status view but allow form access
          setShowForm(res.data.status === 'rejected' ? false : false);
        }
      } catch (err) {
        console.log("ℹ️ No existing request found or error:", err.response?.status);
        
        if (err.response?.status === 401) {
          setAuthError(true);
          setError("Session expired. Please log in again.");
        } else {
          // No request found - show form for new users
          setAlreadySubmitted(false);
          setShowForm(true);
        }
      }
    };

    fetchRequest();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate userId before submitting
    if (!isValidUserId(userId)) {
      setError("Invalid user session. Please log in again.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const cleanUserId = userId.trim();
      const reqBody = { ...formData, userId: cleanUserId };
      console.log("📤 Submitting with userId:", cleanUserId);
      console.log("📤 Full request body:", reqBody);
      
      const res = await axios.post("http://localhost:5000/api/canteen/request", reqBody);
      
      if (res.data) {
        setRequestId(res.data.requestId || res.data._id);
        setRequestStatus(res.data.status || 'pending');
        setAlreadySubmitted(true);
        setShowForm(false);
        
        // Show success message
        setError(null);
        const successMessage = "Request submitted successfully!";
        
        // Create temporary success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = successMessage;
        successDiv.style.cssText = `
          background-color: #d1fae5;
          color: #065f46;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 15px;
          border: 1px solid #10b981;
          text-align: center;
        `;
        
        const container = document.querySelector('.canteen-form-container');
        if (container) {
          container.insertBefore(successDiv, container.firstChild);
          setTimeout(() => {
            if (successDiv.parentNode) {
              successDiv.parentNode.removeChild(successDiv);
            }
          }, 4000);
        }
      }
      
    } catch (err) {
      console.error("Submission error:", err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        setAuthError(true);
        setError("Session expired. Please log in again.");
      } else if (err.response?.status === 409) {
        setError("You already have a pending request. Please check your status.");
      } else {
        setError(err.response?.data?.message || "Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkStatus = async () => {
    if (!requestId) return;
    setLoadingStatus(true);
    setError(null);
    
    try {
      const res = await axios.get(`http://localhost:5000/api/canteen/status/${requestId}`);
      setRequestStatus(res.data.status);
    } catch (err) {
      console.error('Error fetching status:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to refresh status. Please try again.");
      }
    }
    setLoadingStatus(false);
  };

  const getStatusIndicator = (status) => {
    const statusConfig = {
      pending: { icon: '⏳', color: '#d97706', bgColor: '#fef3c7' },
      approved: { icon: '✅', color: '#065f46', bgColor: '#d1fae5' },
      rejected: { icon: '❌', color: '#991b1b', bgColor: '#fee2e2' }
    };
    
    const config = statusConfig[status] || { icon: '❓', color: '#6b7280', bgColor: '#f3f4f6' };
    
    return (
      <div 
        className="status-indicator"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 15px',
          borderRadius: '5px',
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.color}`,
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        <span style={{ fontSize: '20px' }}>{config.icon}</span>
        <span>{status ? status.toUpperCase() : 'UNKNOWN'}</span>
      </div>
    );
  };

  const handleProceed = () => {
    if (requestStatus === 'approved') {
      // Navigate to canteen dashboard
      window.location.href = '/canteen/dashboard';
    }
  };

  const handleNewRequest = () => {
    // Reset form for new request
    setFormData({
      name: "",
      owner: "",
      licenseNumber: "",
      location: "",
      contactEmail: "",
      contactPhone: "",
      foodType: "",
      openingHours: "",
      description: "",
    });
    setError(null);
    setShowForm(true);
  };

  const handleBackToStatus = () => {
    setShowForm(false);
    setError(null);
  };

  const handleLogin = () => {
    // Clear localStorage and redirect to login
    localStorage.clear();
    window.location.href = '/login/canteen';
  };

  // Show authentication error
  if (authError) {
    return (
      <div className="canteen-form-container">
        <div className="error-message" style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #fca5a5',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Authentication Required</h3>
          <p style={{ marginBottom: '15px' }}>Please log in to submit a canteen request.</p>
          
          <div style={{ 
            backgroundColor: '#fff3cd', 
            color: '#856404', 
            padding: '15px', 
            borderRadius: '5px', 
            margin: '15px 0',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            <strong>Debug Info:</strong><br/>
            Retrieved userId: {userId || 'null'}<br/>
            Type: {typeof userId}<br/>
            Is valid ObjectId: {userId ? /^[0-9a-fA-F]{24}$/.test(userId.toString().trim()) : 'false'}<br/>
            All localStorage keys: {Object.keys(localStorage).join(', ') || 'none'}<br/>
            Expected format: 24-character hex string (e.g., "684c5be2cc701c96971f36f7")
          </div>
          
          <button 
            onClick={handleLogin}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show form for new users or when user chooses to submit new request
  if (!alreadySubmitted || showForm) {
    return (
      <div className="canteen-form-container">
        {error && (
          <div className="error-message" style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        <div className="canteen-form" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
            {alreadySubmitted ? 'Submit New Canteen Request' : 'Register Your Canteen'}
          </h2>

          {alreadySubmitted && requestStatus === 'rejected' && (
            <div className="info-message" style={{ 
              backgroundColor: '#fef3c7', 
              color: '#92400e', 
              padding: '15px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              border: '1px solid #fbbf24'
            }}>
              <strong>Previous Request Rejected:</strong> You can submit a new request with updated information.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              name="name" 
              value={formData.name} 
              placeholder="Canteen Name *" 
              onChange={handleChange} 
              required 
              disabled={isSubmitting}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db' }}
            />
            
            <input 
              name="owner" 
              value={formData.owner} 
              placeholder="Owner Name *" 
              onChange={handleChange} 
              required 
              disabled={isSubmitting}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db' }}
            />
            
            <input 
              name="licenseNumber" 
              value={formData.licenseNumber} 
              placeholder="License Number *" 
              onChange={handleChange} 
              required 
              disabled={isSubmitting}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db' }}
            />
            
            <input 
              name="location" 
              value={formData.location} 
              placeholder="Location *" 
              onChange={handleChange} 
              required 
              disabled={isSubmitting}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db' }}
            />
            
            <input 
              name="contactEmail" 
              type="email" 
              value={formData.contactEmail} 
              placeholder="Contact Email *" 
              onChange={handleChange} 
              required 
              disabled={isSubmitting}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db' }}
            />
            
            <input 
              name="contactPhone" 
              value={formData.contactPhone} 
              placeholder="Contact Phone *" 
              onChange={handleChange} 
              required 
              disabled={isSubmitting}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db' }}
            />

            <select 
              name="foodType" 
              value={formData.foodType} 
              onChange={handleChange} 
              required
              disabled={isSubmitting}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db' }}
            >
              <option value="">Select Food Type *</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Mixed">Mixed (Veg & Non-Veg)</option>
              <option value="Vegan">Vegan</option>
              <option value="Speciality">Speciality</option>
            </select>

            <input 
              name="openingHours" 
              value={formData.openingHours} 
              placeholder="Opening Hours (e.g., 8:00 AM - 8:00 PM) *" 
              onChange={handleChange} 
              required 
              disabled={isSubmitting}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db' }}
            />
            
            <textarea 
              name="description" 
              value={formData.description} 
              placeholder="Brief description about your canteen, specialties, etc. *" 
              onChange={handleChange} 
              required 
              disabled={isSubmitting}
              rows="4"
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d5db', resize: 'vertical' }}
            />

            <div className="form-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
              </button>
              
              {alreadySubmitted && (
                <button 
                  type="button" 
                  onClick={handleBackToStatus}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Back to Status
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show status view for existing requests
  return (
    <div className="canteen-form-container">
      <div className="status-box" style={{ 
        maxWidth: '500px', 
        margin: '0 auto', 
        padding: '30px', 
        border: '1px solid #d1d5db', 
        borderRadius: '8px',
        backgroundColor: '#ffffff'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: '25px', fontSize: '24px' }}>
          Request Status
        </h3>
        
        {error && (
          <div className="error-message" style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Request ID:</strong></p>
          <div style={{ 
            backgroundColor: '#f3f4f6',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all',
            marginTop: '5px'
          }}>
            {requestId}
          </div>
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <p style={{ marginBottom: '10px' }}><strong>Current Status:</strong></p>
          {getStatusIndicator(requestStatus)}
        </div>
        
        <div style={{ margin: '25px 0', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
          {requestStatus === 'pending' && (
            <p style={{ color: '#d97706', fontStyle: 'italic', margin: 0 }}>
              ⏳ Your request is under review. Please wait for admin approval.
            </p>
          )}
          {requestStatus === 'approved' && (
            <p style={{ color: '#065f46', fontStyle: 'italic', margin: 0 }}>
              🎉 Congratulations! Your canteen has been approved. You can now proceed to manage your canteen.
            </p>
          )}
          {requestStatus === 'rejected' && (
            <div>
              <p style={{ color: '#991b1b', fontStyle: 'italic', marginBottom: '10px' }}>
                ❌ Your request has been rejected. Please contact the administrator for more details.
              </p>
              <p style={{ color: '#374151', margin: 0 }}>
                You can submit a new request with updated information below.
              </p>
            </div>
          )}
        </div>
        
        <div className="status-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={checkStatus} 
            disabled={loadingStatus}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: loadingStatus ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loadingStatus ? "Refreshing..." : "🔄 Refresh Status"}
          </button>
          
          <button 
            onClick={handleProceed}
            disabled={requestStatus !== "approved"}
            style={{ 
              backgroundColor: requestStatus === 'approved' ? '#10b981' : '#d1d5db',
              color: requestStatus === 'approved' ? 'white' : '#6b7280',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: requestStatus === 'approved' ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {requestStatus === 'approved' ? '🚀 Proceed to Dashboard' : '🔒 Proceed (Approval Required)'}
          </button>
          
          {requestStatus === 'rejected' && (
            <button 
              onClick={handleNewRequest}
              style={{ 
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              📝 Submit New Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanteenRequestForm;