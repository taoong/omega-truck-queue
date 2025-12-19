import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Users, 
  History, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  GripVertical, 
  X, 
  LogOut,
  Shield,
  Eye,
  EyeOff,
  Truck
} from 'lucide-react';
import { adminAuthService, adminQueueService, QUEUE_STATUS } from './services/adminFirebaseService.js';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Login Form Component
const AdminLoginForm = ({ onLogin, loading, error }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData.email, formData.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          <p className="text-gray-600">Omega Products Truck Queue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@omega.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Demo Credentials Button */}
          <button
            type="button"
            onClick={() => {
              setFormData({ email: 'admin@omega.com', password: 'password' });
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
          >
            Use Demo Credentials
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Sign In to Admin Portal
              </>
            )}
          </button>
        </form>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Admin Account:</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Email:</strong> admin@omega.com</p>
            <p><strong>Password:</strong> password</p>
            <p className="mt-2 text-blue-600">
              <strong>Note:</strong> If this is your first time, the account will be created automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Components
const RemoveModal = ({ selectedTicket, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 max-w-md w-full">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <h3 className="text-xl font-bold text-gray-800">Remove from Queue?</h3>
      </div>
      <p className="text-gray-600 mb-6">
        Are you sure you want to remove <strong>{selectedTicket?.driverName}</strong> ({selectedTicket?.poNumber}) from the queue? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(selectedTicket.id)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
);

// State Transition Modal Component
const StateTransitionModal = ({ selectedTicket, newStatus, onClose, onConfirm }) => {
  const statusLabels = {
    [QUEUE_STATUS.QUEUED]: 'Queued',
    [QUEUE_STATUS.SUMMONED]: 'Summoned',
    [QUEUE_STATUS.STAGING]: 'In Staging',
    [QUEUE_STATUS.LOADING]: 'Loading',
    [QUEUE_STATUS.COMPLETED]: 'Completed'
  };

  const statusDescriptions = {
    [QUEUE_STATUS.QUEUED]: 'Move back to waiting in queue',
    [QUEUE_STATUS.SUMMONED]: 'Summon to proceed to facility',
    [QUEUE_STATUS.STAGING]: 'Move to staging area (2-truck capacity)',
    [QUEUE_STATUS.LOADING]: 'Move to loading bay (3-bay capacity)',
    [QUEUE_STATUS.COMPLETED]: 'Mark as completed and remove from active queue'
  };

  const currentStatus = selectedTicket?.status;
  const isMovingForward = Object.values(QUEUE_STATUS).indexOf(newStatus) > Object.values(QUEUE_STATUS).indexOf(currentStatus);
  const isMovingBackward = Object.values(QUEUE_STATUS).indexOf(newStatus) < Object.values(QUEUE_STATUS).indexOf(currentStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className={`w-6 h-6 ${isMovingBackward ? 'text-orange-500' : 'text-blue-500'}`} />
          <h3 className="text-xl font-bold text-gray-800">
            {isMovingBackward ? 'Move Back?' : 'Advance Status?'}
          </h3>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-3">
            Change status for <strong>{selectedTicket?.driverName}</strong> ({selectedTicket?.poNumber})?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-medium capitalize">{statusLabels[currentStatus]}</span>
            </div>
            <div className="flex items-center justify-center my-2">
              <div className={`w-6 h-0.5 ${isMovingBackward ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
              <span className={`mx-2 ${isMovingBackward ? 'text-orange-500' : 'text-blue-500'}`}>
                {isMovingBackward ? '←' : '→'}
              </span>
              <div className={`w-6 h-0.5 ${isMovingBackward ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">New:</span>
              <span className={`font-medium capitalize ${isMovingBackward ? 'text-orange-600' : 'text-blue-600'}`}>
                {statusLabels[newStatus]}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            {statusDescriptions[newStatus]}
          </p>
          
          {isMovingBackward && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> Moving backward will notify the driver of the status change.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedTicket.id, newStatus)}
            className={`flex-1 font-medium py-3 rounded-lg transition-colors text-white ${
              isMovingBackward 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isMovingBackward ? 'Move Back' : 'Advance'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectModal = ({ selectedTicket, rejectReason, setRejectReason, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 max-w-md w-full">
      <div className="flex items-center gap-3 mb-4">
        <XCircle className="w-6 h-6 text-red-500" />
        <h3 className="text-xl font-bold text-gray-800">Reject Request?</h3>
      </div>
      <p className="text-gray-600 mb-4">
        Reject request from <strong>{selectedTicket?.driverName}</strong> ({selectedTicket?.poNumber})?
      </p>
      
      <div className="mb-6 space-y-2">
        <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="rejectReason"
            value="Invalid PO number or confirmation code"
            checked={rejectReason === 'Invalid PO number or confirmation code'}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">Invalid PO number or confirmation code</span>
        </label>
        <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="rejectReason"
            value="Location too far from facility"
            checked={rejectReason === 'Location too far from facility'}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">Location too far from facility</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!rejectReason) {
              alert('Please select a reason');
              return;
            }
            onConfirm(selectedTicket.id, rejectReason);
          }}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  </div>
);

// Main Admin Dashboard
const AdminDashboard = ({ user, onSignOut }) => {
  const [view, setView] = useState('dashboard');
  const [queue, setQueue] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [stateTransitionModal, setStateTransitionModal] = useState({ show: false, ticket: null, newStatus: null });
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);

  // Real-time data subscriptions
  useEffect(() => {
    const unsubscribes = [];
    let loadingTimeout;

    // Set a timeout to ensure loading doesn't stay true forever
    loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    try {
      // Subscribe to queue changes
      const queueUnsub = adminQueueService.onQueueChange((snapshot) => {
        try {
          console.log('Queue data received:', snapshot.size, 'documents');
          const queueData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            requestedAt: doc.data().requestedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }));
          setQueue(queueData);
          
          // Clear timeout and set loading to false on first successful load
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
          }
          setLoading(false);
        } catch (error) {
          console.error('Error processing queue data:', error);
          setLoading(false);
        }
      }, (error) => {
        console.error('Queue subscription error:', error);
        setLoading(false);
      });
      unsubscribes.push(queueUnsub);

      // Subscribe to pending requests
      const pendingUnsub = adminQueueService.onPendingRequestsChange((snapshot) => {
        try {
          console.log('Pending requests data received:', snapshot.size, 'documents');
          const pendingData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            requestedAt: doc.data().requestedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }));
          setPendingRequests(pendingData);
        } catch (error) {
          console.error('Error processing pending requests:', error);
        }
      }, (error) => {
        console.error('Pending requests subscription error:', error);
      });
      unsubscribes.push(pendingUnsub);

      // Subscribe to activity logs
      const logsUnsub = adminQueueService.onActivityLogsChange((snapshot) => {
        try {
          console.log('Activity logs data received:', snapshot.size, 'documents');
          const logsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
          }));
          setActivityLogs(logsData);
        } catch (error) {
          console.error('Error processing activity logs:', error);
        }
      }, (error) => {
        console.error('Activity logs subscription error:', error);
      });
      unsubscribes.push(logsUnsub);

    } catch (error) {
      console.error('Error setting up subscriptions:', error);
      setLoading(false);
    }

    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      unsubscribes.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
    };
  }, []);

  // Helper functions
  const calculateWaitTime = (position) => {
    const baseTime = 15;
    return position * baseTime;
  };

  // Action handlers
  const handleApproveRequest = async (requestId) => {
    try {
      await adminQueueService.approveRequest(requestId);
    } catch (error) {
      alert(`Failed to approve request: ${error.message}`);
    }
  };

  const handleRejectRequest = async (requestId, reason) => {
    try {
      await adminQueueService.rejectRequest(requestId, reason);
      setShowRejectModal(false);
      setSelectedTicket(null);
      setRejectReason('');
    } catch (error) {
      alert(`Failed to reject request: ${error.message}`);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await adminQueueService.updateQueueStatus(ticketId, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setStateTransitionModal({ show: false, ticket: null, newStatus: null });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const openStateTransitionModal = (ticket, newStatus) => {
    setStateTransitionModal({ show: true, ticket, newStatus });
  };

  const closeStateTransitionModal = () => {
    setStateTransitionModal({ show: false, ticket: null, newStatus: null });
  };

  const handleRemoveFromQueue = async (queueId) => {
    try {
      await adminQueueService.removeFromQueue(queueId);
      setShowRemoveModal(false);
      setSelectedTicket(null);
    } catch (error) {
      alert(`Failed to remove from queue: ${error.message}`);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, ticket) => {
    setDraggedItem(ticket);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, ticket) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedItem || draggedItem.id === ticket.id) return;
    
    const items = [...queue];
    const draggedIdx = items.findIndex(i => i.id === draggedItem.id);
    const targetIdx = items.findIndex(i => i.id === ticket.id);
    
    if (draggedIdx !== -1 && targetIdx !== -1) {
      items.splice(draggedIdx, 1);
      items.splice(targetIdx, 0, draggedItem);
      
      const reordered = items.map((item, idx) => ({ ...item, position: idx + 1 }));
      adminQueueService.updateQueuePositions(reordered);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modals */}
      {showRemoveModal && (
        <RemoveModal 
          selectedTicket={selectedTicket}
          onClose={() => {
            setShowRemoveModal(false);
            setSelectedTicket(null);
          }}
          onConfirm={handleRemoveFromQueue}
        />
      )}
      {showRejectModal && (
        <RejectModal
          selectedTicket={selectedTicket}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedTicket(null);
            setRejectReason('');
          }}
          onConfirm={handleRejectRequest}
        />
      )}

      {stateTransitionModal.show && (
        <StateTransitionModal
          selectedTicket={stateTransitionModal.ticket}
          newStatus={stateTransitionModal.newStatus}
          onClose={closeStateTransitionModal}
          onConfirm={handleStatusUpdate}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
              <p className="text-sm text-gray-600">Omega Products Truck Queue Management</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Navigation */}
              <nav className="flex gap-2">
                <button
                  onClick={() => setView('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    view === 'dashboard' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setView('history')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    view === 'history' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Activity Logs
                </button>
              </nav>

              {/* Pending requests notification */}
              {pendingRequests.length > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingRequests.length}
                  </span>
                </div>
              )}

              {/* User info and sign out */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{user.email}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  Pending Requests ({pendingRequests.length})
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-white border border-yellow-200 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          {request.driverName}
                        </div>
                        <p className="text-sm text-gray-600">{request.poNumber}</p>
                        <p className="text-xs text-gray-500">
                          Code: {request.confirmCode} • {new Date(request.requestedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(request);
                            setShowRejectModal(true);
                          }}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Queue Management */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Current Queue</h2>
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Trucks in Queue</p>
                  <p className="text-3xl font-bold text-blue-600">{queue.length}</p>
                </div>
              </div>

              <div className="space-y-3">
                {queue.map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket)}
                    onDragOver={(e) => handleDragOver(e, ticket)}
                    onDragEnd={handleDragEnd}
                    className={`border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow ${
                      draggedItem?.id === ticket.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm flex-shrink-0">
                            {ticket.position}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-800">{ticket.driverName}</span>
                            <p className="text-sm text-gray-600">{ticket.poNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Joined: {new Date(ticket.joinedAt).toLocaleTimeString()}</span>
                          <span>Wait: ~{calculateWaitTime(ticket.position)} min</span>
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded">{ticket.status}</span>
                        </div>
                      </div>

                      {/* Status update buttons */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          {/* Forward navigation - primary action */}
                          <div className="flex justify-center">
                            {ticket.status === QUEUE_STATUS.QUEUED && (
                              <button
                                onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.SUMMONED)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                              >
                                Summon →
                              </button>
                            )}
                            {ticket.status === QUEUE_STATUS.SUMMONED && (
                              <button
                                onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.STAGING)}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                              >
                                To Staging →
                              </button>
                            )}
                            {ticket.status === QUEUE_STATUS.STAGING && (
                              <button
                                onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.LOADING)}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                              >
                                To Loading →
                              </button>
                            )}
                            {ticket.status === QUEUE_STATUS.LOADING && (
                              <button
                                onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.COMPLETED)}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                              >
                                Complete →
                              </button>
                            )}
                          </div>
                          
                          {/* Backward navigation - secondary actions */}
                          {(ticket.status !== QUEUE_STATUS.QUEUED) && (
                            <div className="flex flex-wrap justify-center gap-1">
                              <button
                                onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.QUEUED)}
                                className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                                title="Move back to queue"
                              >
                                ← Queue
                              </button>
                              {ticket.status !== QUEUE_STATUS.SUMMONED && (
                                <button
                                  onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.SUMMONED)}
                                  className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                                  title="Move back to summoned"
                                >
                                  ← Summoned
                                </button>
                              )}
                              {(ticket.status === QUEUE_STATUS.LOADING) && (
                                <button
                                  onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.STAGING)}
                                  className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                                  title="Move back to staging"
                                >
                                  ← Staging
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowRemoveModal(true);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {queue.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No trucks in queue</p>
                  </div>
                )}
              </div>

              {queue.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Drag and drop to reorder the queue. Use status buttons to move trucks through the process.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Activity History</h2>
            
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {(log.type === 'success' || log.type === 'queue_joined' || log.type === 'request_approved') && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {(log.type === 'error' || log.type === 'request_rejected') && <XCircle className="w-5 h-5 text-red-500" />}
                      {log.type === 'pending' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                      {(log.type === 'admin_action' || log.type === 'removed_from_queue' || log.type === 'queue_reordered' || log.type === 'status_updated') && <Settings className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{log.message}</p>
                      <div className="flex items-center gap-4 mt-1">
                        {log.poNumber && (
                          <p className="text-xs text-gray-600">{log.poNumber}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.userEmail && (
                          <p className="text-xs text-gray-500">by {log.userEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {activityLogs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activity logs yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Admin App Component
const AdminApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth state listener
  useEffect(() => {
    const unsubscribe = adminAuthService.onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user ? user.email : 'signed out');
      
      if (user) {
        try {
          const userProfile = await adminAuthService.getUserProfile(user.uid);
          console.log('User profile:', userProfile);
          
          if (userProfile && userProfile.role === 'admin') {
            setUser(user);
            setLoginLoading(false); // Reset login loading on successful auth
            setError(''); // Clear any previous errors
          } else {
            await adminAuthService.signOut();
            setError('Access denied. Admin account required.');
            setLoginLoading(false);
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          setError('Failed to verify admin access.');
          setLoginLoading(false);
        }
      } else {
        setUser(null);
        setLoginLoading(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (email, password) => {
    try {
      setLoginLoading(true);
      setError('');
      console.log('Attempting login for:', email);
      await adminAuthService.signIn(email, password);
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message);
      setLoginLoading(false); // Make sure to reset loading state on error
    }
    // Don't set loading to false here on success - let the auth state change handle it
  };

  const handleSignOut = async () => {
    try {
      await adminAuthService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <AdminLoginForm 
        onLogin={handleLogin}
        loading={loginLoading}
        error={error}
      />
    );
  }

  return <AdminDashboard user={user} onSignOut={handleSignOut} />;
};

export default AdminApp;
