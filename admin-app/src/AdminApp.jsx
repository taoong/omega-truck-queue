import React, { useState, useEffect } from 'react';
import { 
  Users, 
  History, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  LogOut,
  Shield,
  Eye,
  EyeOff,
  Truck
} from 'lucide-react';
import { adminAuthService, adminQueueService, QUEUE_STATUS, ADMIN_ROLES } from './services/adminFirebaseService.js';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// PO Validation Modal Component
const POValidationModal = ({ selectedTicket, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-800">PO Validation</h3>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-3">
            Validate PO <strong>{selectedTicket?.poNumber}</strong>?
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter validation notes..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedTicket.id, false, reason)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Invalidate
          </button>
          <button
            onClick={() => onConfirm(selectedTicket.id, true, reason)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
};

// Manual Ticket Creation Modal
const ManualTicketModal = ({ onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    poNumber: '',
    phoneNumber: '',
    orderType: 'pickup'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.poNumber || !formData.phoneNumber) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(formData);
      onClose();
    } catch (error) {
      console.error('Error creating manual ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-800">Create Manual Ticket</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PO Number
            </label>
            <input
              type="text"
              value={formData.poNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PO123456"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <select
              value={formData.orderType}
              onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// State Transition Modal Component
const StateTransitionModal = ({ selectedTicket, newStatus, onClose, onConfirm }) => {
  const statusLabels = {
    [QUEUE_STATUS.QUEUED]: 'In Queue',
    [QUEUE_STATUS.SUMMONED]: 'Active (Summoned)',
    [QUEUE_STATUS.COMPLETED]: 'Resolved'
  };

  const statusDescriptions = {
    [QUEUE_STATUS.QUEUED]: 'Move back to waiting in queue',
    [QUEUE_STATUS.SUMMONED]: 'Summon driver - they will be notified to come to the facility',
    [QUEUE_STATUS.COMPLETED]: 'Mark as resolved - driver has completed loading and left'
  };

  const currentStatus = selectedTicket?.status;
  const isMovingBackward = newStatus === QUEUE_STATUS.QUEUED && currentStatus !== QUEUE_STATUS.QUEUED;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className={`w-6 h-6 ${isMovingBackward ? 'text-orange-500' : 'text-blue-500'}`} />
          <h3 className="text-xl font-bold text-gray-800">
            {isMovingBackward ? 'Move Back to Queue?' : 'Update Status?'}
          </h3>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-3">
            Change status for PO <strong>{selectedTicket?.poNumber}</strong>?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-medium">{statusLabels[currentStatus]}</span>
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
              <span className={`font-medium ${isMovingBackward ? 'text-orange-600' : 'text-blue-600'}`}>
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
                <strong>Note:</strong> Driver will be notified of the status change.
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
            {isMovingBackward ? 'Move Back' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};


// Login Form Component
const AdminLoginForm = ({ onLogin, loading, error }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData.email, formData.password);
  };

  const useShippingAdminDemo = () => {
    setFormData({ email: 'shipping@omega.com', password: 'shipping123' });
  };

  const useOrderDeskAdminDemo = () => {
    setFormData({ email: 'orders@omega.com', password: 'orders123' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          <p className="text-gray-600">Omega Products Truck Queue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter password"
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={useShippingAdminDemo}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 rounded-lg transition-colors text-sm"
            >
              Shipping Admin Demo
            </button>
            <button
              type="button"
              onClick={useOrderDeskAdminDemo}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-3 rounded-lg transition-colors text-sm"
            >
              Order Desk Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Dashboard Component
const AdminDashboard = ({ userRole }) => {
  const [view, setView] = useState('dashboard');
  const [queue, setQueue] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateTransitionModal, setStateTransitionModal] = useState({ show: false, ticket: null, newStatus: null });
  const [poValidationModal, setPOValidationModal] = useState({ show: false, ticket: null });
  const [manualTicketModal, setManualTicketModal] = useState({ show: false });

  useEffect(() => {
    let unsubscribes = [];
    let loadingTimeout;

    // Set loading timeout
    loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 5000);

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


      // Subscribe to activity logs
      const activityUnsub = adminQueueService.onActivityLogsChange((snapshot) => {
        try {
          console.log('Activity logs data received:', snapshot.size, 'documents');
          const activityData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
          }));
          setActivityLogs(activityData);
        } catch (error) {
          console.error('Error processing activity logs:', error);
        }
      }, (error) => {
        console.error('Activity logs subscription error:', error);
      });
      unsubscribes.push(activityUnsub);

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


  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await adminQueueService.updateQueueStatus(ticketId, newStatus);
      setStateTransitionModal({ show: false, ticket: null, newStatus: null });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const openStateTransitionModal = (ticket, newStatus) => {
    setStateTransitionModal({ show: true, ticket, newStatus });
  };

  const closeStateTransitionModal = () => {
    setStateTransitionModal({ show: false, ticket: null, newStatus: null });
  };

  const handlePOValidation = async (queueId, isValid, reason) => {
    try {
      await adminQueueService.validatePO(queueId, isValid, reason);
      setPOValidationModal({ show: false, ticket: null });
    } catch (error) {
      console.error('Error validating PO:', error);
      alert('Failed to validate PO');
    }
  };

  const handleCreateManualTicket = async (ticketData) => {
    try {
      await adminQueueService.createManualTicket(ticketData);
      setManualTicketModal({ show: false });
    } catch (error) {
      console.error('Error creating manual ticket:', error);
      alert('Failed to create manual ticket');
    }
  };

  const handleSignOut = async () => {
    try {
      await adminAuthService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modals */}
      {stateTransitionModal.show && (
        <StateTransitionModal
          selectedTicket={stateTransitionModal.ticket}
          newStatus={stateTransitionModal.newStatus}
          onClose={closeStateTransitionModal}
          onConfirm={handleStatusUpdate}
        />
      )}

      {poValidationModal.show && (
        <POValidationModal
          selectedTicket={poValidationModal.ticket}
          onClose={() => setPOValidationModal({ show: false, ticket: null })}
          onConfirm={handlePOValidation}
        />
      )}

      {manualTicketModal.show && (
        <ManualTicketModal
          onClose={() => setManualTicketModal({ show: false })}
          onConfirm={handleCreateManualTicket}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {userRole === ADMIN_ROLES.SHIPPING_ADMIN ? 'Shipping Admin Portal' : 'Order Desk Admin Portal'}
              </h1>
              <p className="text-sm text-gray-600">Omega Products Truck Queue Management</p>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="flex gap-2">
                <button
                  onClick={() => setView('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    view === 'dashboard' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {userRole === ADMIN_ROLES.SHIPPING_ADMIN ? 'Queue Management' : 'PO Management'}
                </button>
                <button
                  onClick={() => setView('history')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    view === 'history' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  History
                </button>
              </nav>
              
              {userRole === ADMIN_ROLES.ORDER_DESK_ADMIN && (
                <button
                  onClick={() => setManualTicketModal({ show: true })}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  Create Ticket
                </button>
              )}
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {view === 'dashboard' && userRole === ADMIN_ROLES.SHIPPING_ADMIN && (
          <div className="space-y-6">
            {/* Three Stage Layout for Shipping Admin */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Queue Section */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Queue ({queue.filter(q => q.status === QUEUE_STATUS.QUEUED).length})
                  </h3>
                  <p className="text-blue-100 text-sm">Waiting drivers</p>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {queue.filter(q => q.status === QUEUE_STATUS.QUEUED).length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No drivers in queue</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {queue
                        .filter(q => q.status === QUEUE_STATUS.QUEUED)
                        .sort((a, b) => a.position - b.position)
                        .map((ticket) => (
                        <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                #{ticket.position}
                              </span>
                              <span className="font-semibold text-gray-800 text-sm">PO: {ticket.poNumber}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-3">
                            <p>PO: {ticket.poNumber}</p>
                            <p>Joined: {new Date(ticket.joinedAt).toLocaleTimeString()}</p>
                          </div>
                          
                          <button
                            onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.SUMMONED)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                          >
                            Summon →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Active/Summoned Section */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Active ({queue.filter(q => q.status === QUEUE_STATUS.SUMMONED).length})
                  </h3>
                  <p className="text-yellow-100 text-sm">Currently being processed</p>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {queue.filter(q => q.status === QUEUE_STATUS.SUMMONED).length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No active drivers</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {queue
                        .filter(q => q.status === QUEUE_STATUS.SUMMONED)
                        .map((ticket) => (
                        <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-gray-600" />
                              <span className="font-semibold text-gray-800 text-sm">PO: {ticket.poNumber}</span>
                            </div>
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                              Summoned
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-3">
                            <p>PO: {ticket.poNumber}</p>
                            <p>Summoned: {new Date(ticket.joinedAt).toLocaleTimeString()}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.COMPLETED)}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                            >
                              Mark Resolved →
                            </button>
                            <button
                              onClick={() => openStateTransitionModal(ticket, QUEUE_STATUS.QUEUED)}
                              className="px-3 bg-gray-400 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                              title="Move back to queue"
                            >
                              ← Queue
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Resolved Section */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Resolved Today ({activityLogs.filter(log => 
                      log.action === 'completed' && 
                      new Date(log.timestamp).toDateString() === new Date().toDateString()
                    ).length})
                  </h3>
                  <p className="text-green-100 text-sm">Completed loading</p>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {activityLogs.filter(log => 
                    log.action === 'completed' && 
                    new Date(log.timestamp).toDateString() === new Date().toDateString()
                  ).length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No completed drivers today</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {activityLogs
                        .filter(log => 
                          log.action === 'completed' && 
                          new Date(log.timestamp).toDateString() === new Date().toDateString()
                        )
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map((log) => (
                        <div key={log.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-gray-800 text-sm">PO: {log.poNumber}</span>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              Resolved
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-600">
                            <p>PO: {log.poNumber}</p>
                            <p>Completed: {new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' && userRole === ADMIN_ROLES.ORDER_DESK_ADMIN && (
          <div className="space-y-6">
            {/* PO Management Dashboard for Order Desk Admin */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">PO Management & Queue Overview</h2>
                <p className="text-purple-100 text-sm">Validate PO numbers and manage queue tickets</p>
              </div>
              
              <div className="p-6">
                <div className="grid gap-4">
                  {queue.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No trucks in queue</p>
                    </div>
                  ) : (
                    queue.map((ticket) => (
                      <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                ticket.status === QUEUE_STATUS.QUEUED ? 'bg-blue-100 text-blue-800' :
                                ticket.status === QUEUE_STATUS.SUMMONED ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {ticket.status === QUEUE_STATUS.QUEUED ? `#${ticket.position} in Queue` :
                                 ticket.status === QUEUE_STATUS.SUMMONED ? 'Active' : 'Resolved'}
                              </span>
                              <Truck className="w-4 h-4 text-gray-600" />
                              <span className="font-semibold text-gray-800">PO: {ticket.poNumber}</span>
                              {ticket.createdByAdmin && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  Manual Entry
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Phone:</span> {ticket.phoneNumber}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {ticket.orderType}
                              </div>
                              <div>
                                <span className="font-medium">Joined:</span> {new Date(ticket.joinedAt).toLocaleTimeString()}
                              </div>
                            </div>

                            {ticket.poValidated !== undefined && (
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  ticket.poValidated 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {ticket.poValidated ? '✓ PO Validated' : '✗ PO Invalid'}
                                </span>
                                {ticket.poValidationReason && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    {ticket.poValidationReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {ticket.poValidated === undefined && (
                              <button
                                onClick={() => setPOValidationModal({ show: true, ticket })}
                                className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
                              >
                                Validate PO
                              </button>
                            )}
                            {ticket.poValidated === false && (
                              <button
                                onClick={() => setPOValidationModal({ show: true, ticket })}
                                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                              >
                                Re-validate
                              </button>
                            )}
                            {ticket.poValidated === true && (
                              <button
                                onClick={() => setPOValidationModal({ show: true, ticket })}
                                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
                              >
                                Invalidate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth state listener
  useEffect(() => {
    const unsubscribe = adminAuthService.onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user ? user.email : 'signed out');
      
      if (user) {
        try {
          const profile = await adminAuthService.getUserProfile(user.uid);
          console.log('User profile:', profile);
          
          if (profile && Object.values(ADMIN_ROLES).includes(profile.role)) {
            setUser(user);
            setUserProfile(profile);
            setError('');
          } else {
            console.log('User is not an admin or profile not found');
            setError('Access denied. Admin account required.');
            setLoginLoading(false); // Reset login loading on access denied
            await adminAuthService.signOut();
          }
        } catch (error) {
          console.error('Error getting user profile:', error);
          setError('Failed to verify admin access. Please try again.');
          setLoginLoading(false); // Reset login loading on auth error
          await adminAuthService.signOut();
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    setLoginLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', email);
      await adminAuthService.signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
      setError(`Sign in failed: ${error.message}`);
    } finally {
      setLoginLoading(false);
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

  return <AdminDashboard userRole={userProfile?.role} />;
};

export default AdminApp;