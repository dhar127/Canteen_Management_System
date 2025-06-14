import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  // CRITICAL: Always initialize as empty array
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/admin/requests');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Debug: Check what we're getting from the API
        console.log('Raw API Response:', data);
        console.log('Type of data:', typeof data);
        console.log('Is array:', Array.isArray(data));
        
        // Handle different response structures
        let requestsArray = [];
        if (Array.isArray(data)) {
          requestsArray = data;
        } else if (data && Array.isArray(data.requests)) {
          requestsArray = data.requests;
        } else if (data && Array.isArray(data.data)) {
          requestsArray = data.data;
        } else {
          console.error('API response is not in expected format:', data);
          requestsArray = [];
        }
        
        console.log('Setting requests to:', requestsArray);
        setRequests(requestsArray);
        
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError(error.message);
        setErrorBanner('Unable to load requests. Please try again.');
        setRequests([]); // Ensure it's always an array
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleRefresh = () => {
    setRequests([]);
    setError(null);
    setErrorBanner(null);
    setLoading(true);
    
    // Trigger refresh by calling fetchRequests again
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/admin/requests');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        let requestsArray = [];
        if (Array.isArray(data)) {
          requestsArray = data;
        } else if (data && Array.isArray(data.requests)) {
          requestsArray = data.requests;
        } else if (data && Array.isArray(data.data)) {
          requestsArray = data.data;
        } else {
          requestsArray = [];
        }
        
        setRequests(requestsArray);
      } catch (error) {
        setError(error.message);
        setErrorBanner('Unable to load requests. Please try again.');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  };

  const handleRetry = () => {
    setError(null);
    setErrorBanner(null);
    handleRefresh();
  };

  // Updated to navigate to RequestDetails page
  const handleViewRequest = (requestId) => {
    navigate(`/admin/request/${requestId}`);
  };

  // Navigate to RequestDetails for approve/reject actions
  const handleQuickAction = (requestId, action) => {
    // You can pass the intended action as state to the RequestDetails page
    navigate(`/admin/request/${requestId}`, { 
      state: { quickAction: action } 
    });
  };

  const handleShowAll = () => {
    setFilter('all');
  };

  // Helper function to safely filter requests
  const safeFilter = (filterFn) => {
    if (!Array.isArray(requests)) {
      console.warn('requests is not an array:', requests);
      return [];
    }
    return requests.filter(filterFn);
  };

  // Safe filtering for main display
  const filteredRequests = safeFilter(request => {
    if (filter === 'all') return true;
    return request && request.status === filter;
  });

  // Safe filtering for counts (fix all instances)
  const pendingCount = safeFilter(r => r && r.status === 'pending').length;
  const approvedCount = safeFilter(r => r && r.status === 'approved').length;
  const rejectedCount = safeFilter(r => r && r.status === 'rejected').length;
  const totalCount = Array.isArray(requests) ? requests.length : 0;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-badge status-pending';
      case 'approved': return 'status-badge status-approved';
      case 'rejected': return 'status-badge status-rejected';
      default: return 'status-badge status-unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Debug render to see current state
  console.log('Current render state:', {
    requests,
    requestsType: typeof requests,
    isArray: Array.isArray(requests),
    length: Array.isArray(requests) ? requests.length : 'N/A',
    loading,
    error
  });

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <h2>Loading Dashboard...</h2>
          <p>Please wait while we fetch your requests</p>
        </div>
      </div>
    );
  }

  if (error && !errorBanner) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={handleRetry}>
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {errorBanner && (
        <div className="error-banner">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)}>×</button>
        </div>
      )}

      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-controls">
          <div className="filter-controls">
            <label htmlFor="status-filter">Filter:</label>
            <select 
              id="status-filter"
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="requests-summary">
        <div className="summary-card total">
          <div className="card-icon">📄</div>
          <div className="card-content">
            <h3>Total Requests</h3>
            <div className="count">{totalCount}</div>
          </div>
        </div>

        <div className="summary-card pending">
          <div className="card-icon">⏰</div>
          <div className="card-content">
            <h3>Pending</h3>
            <div className="count">{pendingCount}</div>
          </div>
        </div>

        <div className="summary-card approved">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Approved</h3>
            <div className="count">{approvedCount}</div>
          </div>
        </div>

        <div className="summary-card rejected">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <h3>Rejected</h3>
            <div className="count">{rejectedCount}</div>
          </div>
        </div>
      </div>

      <div className="requests-table-container">
        <div className="table-header">
          <h2>Service Requests</h2>
        </div>

        {!Array.isArray(requests) ? (
          <div className="error-container">
            <h2>Error: Invalid data format</h2>
            <p>Invalid data format received from server</p>
            <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
              {JSON.stringify(requests, null, 2)}
            </pre>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="no-requests">
            <div className="no-requests-icon">📭</div>
            <h3>No requests found</h3>
            <p>
              {filter === 'all' 
                ? "There are no service requests to display at the moment."
                : `No ${filter} requests found. Try adjusting your filter.`
              }
            </p>
            {filter !== 'all' && (
              <button className="show-all-btn" onClick={handleShowAll}>
                Show All Requests
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Client Info</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Message</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  if (!request) return null;
                  
                  return (
                    <tr key={request._id || request.id || Math.random()}>
                      <td>
                        <span className="request-id">
                          {request._id || request.id || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="contact-info">
                          <div className="name" style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {request.name || request.owner || 'Unnamed Request'}
                          </div>
                          <div className="email">{request.contactEmail || request.email || 'N/A'}</div>
                          <div className="phone">{request.contactPhone || request.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td>{request.service || request.type || 'N/A'}</td>
                      <td>
                        <span className={getStatusBadgeClass(request.status)}>
                          {request.status || 'unknown'}
                        </span>
                      </td>
                      <td>{formatDate(request.date || request.createdAt)}</td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {request.message || request.description || 'No message'}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => handleViewRequest(request._id || request.id)}
                        >
                          👁️ View
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button 
                              className="view-btn"
                              style={{ marginLeft: '5px', background: '#28a745' }}
                              onClick={() => handleQuickAction(request._id || request.id, 'approve')}
                            >
                              ✅ Approve
                            </button>
                            <button 
                              className="view-btn"
                              style={{ marginLeft: '5px', background: '#dc3545' }}
                              onClick={() => handleQuickAction(request._id || request.id, 'reject')}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;