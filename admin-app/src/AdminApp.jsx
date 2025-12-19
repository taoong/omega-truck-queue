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
            Change status for <strong>{selectedTicket?.driverName}</strong> ({selectedTicket?.poNumber})?
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

  const useDemoCredentials = () => {
    setFormData({ email: 'admin@omega.com', password: 'admin123' });
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

          <button
            type="button"
            onClick={useDemoCredentials}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
          >
            Use Demo Credentials
          </button>
        </form>
      </div>
    </div>
  );
};

// Main Dashboard Component
const AdminDashboard = () => {
  const [view, setView] = useState('dashboard');
  const [queue, setQueue] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateTransitionModal, setStateTransitionModal] = useState({ show: false, ticket: null, newStatus: null });

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

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
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
                  Dashboard
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
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Queue</p>
                    <p className="text-2xl font-bold text-gray-900">{queue.filter(q => q.status === QUEUE_STATUS.QUEUED).length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active (Summoned)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {queue.filter(q => q.status === QUEUE_STATUS.SUMMONED).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                    <p className="text-2xl font-bold text-gray-900">{activityLogs.filter(log => 
                      log.action === 'completed' && 
                      new Date(log.timestamp).toDateString() === new Date().toDateString()
                    ).length}</p>
                  </div>
                </div>
              </div>
            </div>


            {/* Three Stage Layout */}
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
                              <span className="font-semibold text-gray-800 text-sm">{ticket.driverName}</span>
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
                              <span className="font-semibold text-gray-800 text-sm">{ticket.driverName}</span>
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
                              <span className="font-semibold text-gray-800 text-sm">{log.driverName}</span>
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
            setError('');
          } else {
            console.log('User is not an admin or profile not found');
            setError('Access denied. Admin account required.');
            await adminAuthService.signOut();
          }
        } catch (error) {
          console.error('Error getting user profile:', error);
          setError('Failed to verify admin access. Please try again.');
          await adminAuthService.signOut();
        }
      } else {
        setUser(null);
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

  return <AdminDashboard />;
};

export default AdminApp;