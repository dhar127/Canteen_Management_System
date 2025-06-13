import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CanteenRequestForm.css";

const CanteenRequestForm = () => {
  const userId = localStorage.getItem("userId");

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

  useEffect(() => {
    const fetchRequest = async () => {
      if (!userId) return;
      
      try {
        const res = await axios.get(`http://localhost:5000/api/canteen/request-by-user/${userId}`);
        setRequestId(res.data._id);
        setRequestStatus(res.data.status);
        setAlreadySubmitted(true);
        
        // If status is rejected, allow user to see the form option
        if (res.data.status === 'rejected') {
          setShowForm(false); // Start with status view, but allow form access
        }
      } catch (err) {
        // No request yet
        setAlreadySubmitted(false);
        setShowForm(true); // Show form for new users
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
    setIsSubmitting(true);
    
    try {
      const reqBody = { ...formData, userId };
      const res = await axios.post("http://localhost:5000/api/canteen/request", reqBody);
      
      setRequestId(res.data.requestId);
      setRequestStatus(res.data.status);
      setAlreadySubmitted(true);
      setShowForm(false);
      
      // Show success message briefly
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = 'Request submitted successfully!';
      document.querySelector('.canteen-form-container').prepend(successDiv);
      
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.parentNode.removeChild(successDiv);
        }
      }, 3000);
      
    } catch (err) {
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = err.response?.data?.message || "Submission failed!";
      document.querySelector('.canteen-form-container').prepend(errorDiv);
      
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkStatus = async () => {
    if (!requestId) return;
    setLoadingStatus(true);
    
    try {
      const res = await axios.get(`http://localhost:5000/api/canteen/status/${requestId}`);
      setRequestStatus(res.data.status);
    } catch (err) {
      console.error('Error fetching status:', err);
    }
    setLoadingStatus(false);
  };

  const getStatusIndicator = (status) => {
    const statusClass = `status-indicator ${status}`;
    const statusIcon = {
      pending: '⏳',
      approved: '✅',
      rejected: '❌'
    };
    
    return (
      <div className={statusClass}>
        <span>{statusIcon[status] || '❓'}</span>
        <span>{status ? status.toUpperCase() : 'UNKNOWN'}</span>
      </div>
    );
  };

  const handleProceed = () => {
    if (requestStatus === 'approved') {
      // Navigate to canteen dashboard or management page
      window.location.href = '/canteen/dashboard';
    }
  };

  const handleNewRequest = () => {
    // Reset form data for new request
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
    setShowForm(true);
  };

  const handleBackToStatus = () => {
    setShowForm(false);
  };

  // Show form for new users or when user chooses to submit new request after rejection
  if (!alreadySubmitted || showForm) {
    return (
      <div className="canteen-form-container">
        <form onSubmit={handleSubmit} className={`canteen-form ${isSubmitting ? 'loading' : ''}`}>
          <h2>{alreadySubmitted ? 'Submit New Canteen Request' : 'Register Your Canteen'}</h2>

          {alreadySubmitted && requestStatus === 'rejected' && (
            <div className="info-message" style={{ 
              backgroundColor: '#fef3c7', 
              color: '#92400e', 
              padding: '10px', 
              borderRadius: '5px', 
              marginBottom: '15px',
              border: '1px solid #fbbf24'
            }}>
              Your previous request was rejected. You can submit a new request with updated information.
            </div>
          )}

          <input 
            name="name" 
            value={formData.name} 
            placeholder="Canteen Name" 
            onChange={handleChange} 
            required 
            disabled={isSubmitting}
          />
          
          <input 
            name="owner" 
            value={formData.owner} 
            placeholder="Owner Name" 
            onChange={handleChange} 
            required 
            disabled={isSubmitting}
          />
          
          <input 
            name="licenseNumber" 
            value={formData.licenseNumber} 
            placeholder="License Number" 
            onChange={handleChange} 
            required 
            disabled={isSubmitting}
          />
          
          <input 
            name="location" 
            value={formData.location} 
            placeholder="Location" 
            onChange={handleChange} 
            required 
            disabled={isSubmitting}
          />
          
          <input 
            name="contactEmail" 
            type="email" 
            value={formData.contactEmail} 
            placeholder="Contact Email" 
            onChange={handleChange} 
            required 
            disabled={isSubmitting}
          />
          
          <input 
            name="contactPhone" 
            value={formData.contactPhone} 
            placeholder="Contact Phone" 
            onChange={handleChange} 
            required 
            disabled={isSubmitting}
          />

          <select 
            name="foodType" 
            value={formData.foodType} 
            onChange={handleChange} 
            required
            disabled={isSubmitting}
          >
            <option value="">Select Food Type</option>
            <option value="Veg">Vegetarian</option>
            <option value="Non-Veg">Non-Vegetarian</option>
            <option value="Mixed">Mixed (Veg & Non-Veg)</option>
          </select>

          <input 
            name="openingHours" 
            value={formData.openingHours} 
            placeholder="Opening Hours (e.g. 8:00 AM - 8:00 PM)" 
            onChange={handleChange} 
            required 
            disabled={isSubmitting}
          />
          
          <textarea 
            name="description" 
            value={formData.description} 
            placeholder="Brief description about your canteen, specialties, etc." 
            onChange={handleChange} 
            required 
            disabled={isSubmitting}
          />

          <div className="form-buttons">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
            </button>
            
            {alreadySubmitted && (
              <button 
                type="button" 
                onClick={handleBackToStatus}
                disabled={isSubmitting}
                style={{ 
                  marginLeft: '10px', 
                  backgroundColor: '#6b7280',
                  color: 'white' 
                }}
              >
                Back to Status
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // Show status view for existing requests
  return (
    <div className="canteen-form-container">
      <div className="status-box">
        <h3>Request Status</h3>
        
        <p><strong>Request ID:</strong></p>
        <div className="request-id">{requestId}</div>
        
        <p><strong>Current Status:</strong></p>
        {getStatusIndicator(requestStatus)}
        
        <div style={{ margin: '20px 0' }}>
          {requestStatus === 'pending' && (
            <p style={{ color: '#d97706', fontStyle: 'italic' }}>
              Your request is under review. Please wait for admin approval.
            </p>
          )}
          {requestStatus === 'approved' && (
            <p style={{ color: '#065f46', fontStyle: 'italic' }}>
              🎉 Congratulations! Your canteen has been approved. You can now proceed to manage your canteen.
            </p>
          )}
          {requestStatus === 'rejected' && (
            <div>
              <p style={{ color: '#991b1b', fontStyle: 'italic' }}>
                Your request has been rejected. Please contact the administrator for more details.
              </p>
              <p style={{ color: '#374151', marginTop: '10px' }}>
                You can submit a new request with updated information.
              </p>
            </div>
          )}
        </div>
        
        <div className="status-buttons">
          <button onClick={checkStatus} disabled={loadingStatus}>
            {loadingStatus ? "Refreshing..." : "🔄 Refresh Status"}
          </button>
          
          <button 
            onClick={handleProceed}
            disabled={requestStatus !== "approved"}
            style={{ 
              marginLeft: '10px',
              backgroundColor: requestStatus === 'approved' ? '#10b981' : '#d1d5db'
            }}
          >
            {requestStatus === 'approved' ? '🚀 Proceed to Dashboard' : '🔒 Proceed (Approval Required)'}
          </button>
          
          {requestStatus === 'rejected' && (
            <button 
              onClick={handleNewRequest}
              style={{ 
                marginLeft: '10px',
                backgroundColor: '#2563eb',
                color: 'white'
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