import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CanteenRequestForm.css';

const CanteenRequestForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    licenseNumber: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    foodType: '',
    openingHours: '',
    description: '',
  });

  const [requestId, setRequestId] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/canteen/request', formData);
      alert('Request submitted successfully!');
      setRequestId(response.data.requestId);
      setRequestStatus(response.data.status);

      setFormData({
        name: '',
        owner: '',
        licenseNumber: '',
        location: '',
        contactEmail: '',
        contactPhone: '',
        foodType: '',
        openingHours: '',
        description: '',
      });
    } catch (error) {
      alert('Submission failed!');
    }
  };

  const checkStatus = async () => {
    if (!requestId) return;
    setLoadingStatus(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/canteen/status/${requestId}`);
      setRequestStatus(res.data.status);
    } catch (err) {
      console.error(err);
    }
    setLoadingStatus(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="canteen-form">
        <h2>Register Your Canteen</h2>

        <input name="name" value={formData.name} placeholder="Canteen Name" onChange={handleChange} required />
        <input name="owner" value={formData.owner} placeholder="Owner Name" onChange={handleChange} required />
        <input name="licenseNumber" value={formData.licenseNumber} placeholder="License Number" onChange={handleChange} required />
        <input name="location" value={formData.location} placeholder="Location" onChange={handleChange} required />
        <input name="contactEmail" type="email" value={formData.contactEmail} placeholder="Contact Email" onChange={handleChange} required />
        <input name="contactPhone" value={formData.contactPhone} placeholder="Contact Phone" onChange={handleChange} required />

        <select name="foodType" value={formData.foodType} onChange={handleChange} required>
          <option value="">Select Food Type</option>
          <option value="Veg">Veg</option>
          <option value="Non-Veg">Non-Veg</option>
          <option value="Mixed">Mixed</option>
        </select>

        <input name="openingHours" value={formData.openingHours} placeholder="Opening Hours (e.g. 8AM - 8PM)" onChange={handleChange} required />
        <textarea name="description" value={formData.description} placeholder="Brief Description" onChange={handleChange} required />

        <button type="submit">Submit Request</button>
      </form>

      {/* Show status and request ID after submission */}
      {requestId && (
        <div className="status-box">
          <h3>Request Submitted</h3>
          <p><strong>ID:</strong> {requestId}</p>
          <p><strong>Status:</strong> {requestStatus || 'Checking...'}</p>
          <button onClick={checkStatus}>
            {loadingStatus ? 'Refreshing...' : 'Refresh Status'}
          </button>
          <br /><br />
          <button disabled={requestStatus !== 'approved'}>
            Proceed
          </button>
        </div>
      )}
    </div>
  );
};

export default CanteenRequestForm;
