import React, { useState } from 'react';
import { Clock, Truck, MapPin, Bell, Users, History, Settings, CheckCircle, XCircle, AlertCircle, GripVertical, X, LogOut } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext.jsx';
import AuthForm from './components/AuthForm.jsx';
import { USER_ROLES } from './services/firebaseService.js';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Component declarations outside of main component
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

const DriverHome = () => {
  const { state, actions, helpers } = useApp();
  const { queue } = state;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Queue Status</h2>
        <p className="text-blue-100 mb-4">Corona, California</p>
        
        <div className="bg-white/20 backdrop-blur rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Trucks in Queue</span>
          </div>
          <div className="text-3xl font-bold mb-1">{queue.length}</div>
          <div className="text-sm text-blue-100">
            Est. wait: ~{helpers.calculateWaitTime(queue.length)} minutes
          </div>
        </div>
      </div>

      <button
        onClick={() => actions.setView('join')}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors"
      >
        Join Queue
      </button>

      {(helpers.getCurrentUserTicket() || helpers.getCurrentUserPendingRequest()) && (
        <button
          onClick={() => actions.setView('status')}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors"
        >
          View My Status
        </button>
      )}

      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Nearby Parking Areas
        </h3>
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-sm">Main Street Lot</p>
            <p className="text-xs text-gray-600">0.5 miles away • 8 min drive</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-sm">Industrial Park B</p>
            <p className="text-xs text-gray-600">0.8 miles away • 9 min drive</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => actions.setView('history')}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <History className="w-5 h-5" />
        View Notification History
      </button>
    </div>
  );
};

const JoinQueue = () => {
  const { state, actions } = useApp();
  const { formData } = state;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      await actions.submitJoinRequest();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => actions.setView('home')}
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back
      </button>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Join Queue</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver Name
            </label>
            <input
              type="text"
              value={formData.driverName}
              onChange={(e) => actions.setFormData({ driverName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PO Number
            </label>
            <input
              type="text"
              value={formData.poNumber}
              onChange={(e) => actions.setFormData({ poNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PO-12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmation Code
            </label>
            <input
              type="text"
              value={formData.confirmCode}
              onChange={(e) => actions.setFormData({ confirmCode: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> An admin will verify your information and location before approving your request to join the queue.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DriverStatus = () => {
  const { state, actions, helpers } = useApp();
  const { notifications } = state;
  
  const userTicket = helpers.getCurrentUserTicket();
  const isPending = helpers.getCurrentUserPendingRequest();
  
  if (isPending) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => actions.setView('home')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back
        </button>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-6 h-6" />
            <h2 className="text-xl font-bold">Request Pending</h2>
          </div>
          
          <p className="text-yellow-100 mb-4">
            Your request to join the queue is awaiting admin approval. You will be notified once your request has been reviewed.
          </p>

          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <p className="text-sm text-yellow-100 mb-1">PO Number</p>
            <p className="text-lg font-bold">{isPending.poNumber}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!userTicket) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => actions.setView('home')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back
        </button>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You are not currently in the queue</p>
        </div>
      </div>
    );
  }

  const waitTime = helpers.calculateWaitTime(userTicket.position);

  return (
    <div className="space-y-6">
      <button
        onClick={() => actions.setView('home')}
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back
      </button>

      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-6 h-6" />
          <h2 className="text-xl font-bold">In Queue</h2>
        </div>
        
        <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4">
          <p className="text-sm text-green-100 mb-1">Your Position</p>
          <p className="text-5xl font-bold">#{userTicket.position}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-green-100 mb-1">Est. Wait Time</p>
            <p className="text-2xl font-bold">{waitTime} min</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-green-100 mb-1">PO Number</p>
            <p className="text-lg font-bold">{userTicket.poNumber}</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Stay within 10 minutes of the facility</p>
            <p>If you leave the area for too long, you may be removed from the queue.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Notifications</h3>
        <div className="space-y-2">
          {notifications.filter(n => n.poNumber === userTicket.poNumber).slice(0, 3).map(notif => (
            <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {notif.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
              {notif.type === 'error' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              {notif.type === 'pending' && <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminView = () => {
  const { state, actions, helpers } = useApp();
  const { pendingRequests, queue } = state;
  const [draggedItem, setDraggedItem] = useState(null);

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
      actions.updateQueuePositions(reordered);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-600" />
            Pending Requests ({pendingRequests.length})
          </h2>
          
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-white border border-yellow-200 rounded-lg p-4">
                <div className="mb-3">
                  <div className="font-semibold text-gray-800">{request.driverName}</div>
                  <p className="text-sm text-gray-600">{request.poNumber}</p>
                  <p className="text-xs text-gray-500">
                    Code: {request.confirmCode} • Requested: {new Date(request.requestedAt).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => actions.approveRequest(request.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      actions.setSelectedTicket(request);
                      actions.setShowRejectModal(true);
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

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Queue Management</h2>
        
        <div className="mb-6 text-center bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Trucks in Queue</p>
          <p className="text-3xl font-bold text-blue-600">{queue.length}</p>
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm flex-shrink-0">
                      {ticket.position}
                    </span>
                    <span className="font-semibold text-gray-800">{ticket.driverName}</span>
                  </div>
                  <p className="text-sm text-gray-600">{ticket.poNumber}</p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(ticket.joinedAt).toLocaleTimeString()} • Wait: ~{helpers.calculateWaitTime(ticket.position)} min
                  </p>
                </div>

                <button
                  onClick={() => {
                    actions.setSelectedTicket(ticket);
                    actions.setShowRemoveModal(true);
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          
          {queue.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No trucks in queue
            </div>
          )}
        </div>

        {queue.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Drag and drop to reorder the queue
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => actions.setView('history')}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <History className="w-5 h-5" />
        View All Activity Logs
      </button>
    </div>
  );
};

const HistoryView = () => {
  const { state, actions } = useApp();
  const { activityLogs, userProfile } = state;

  return (
    <div className="space-y-6">
      <button
        onClick={() => actions.setView(userProfile?.role === USER_ROLES.ADMIN ? 'admin' : 'home')}
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back
      </button>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Activity History</h2>
        
        <div className="space-y-3">
          {activityLogs.map((log) => (
            <div key={log.id} className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {(log.type === 'success' || log.type === 'queue_joined') && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {log.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                  {log.type === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                  {log.type === 'admin_action' && <Settings className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{log.message}</p>
                  {log.poNumber && (
                    <p className="text-xs text-gray-600 mt-1">{log.poNumber}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const TruckQueueAppContent = () => {
  const { state, actions } = useApp();
  const { 
    isAuthenticated, 
    isLoading, 
    userProfile, 
    currentView, 
    showRemoveModal, 
    showRejectModal, 
    selectedTicket, 
    rejectReason,
    pendingRequests 
  } = state;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;
  const currentUserType = isAdmin ? USER_ROLES.ADMIN : USER_ROLES.DRIVER;

  return (
    <div className="min-h-screen bg-gray-100">
      {showRemoveModal && (
        <RemoveModal 
          selectedTicket={selectedTicket}
          onClose={() => {
            actions.setShowRemoveModal(false);
            actions.setSelectedTicket(null);
          }}
          onConfirm={actions.removeFromQueue}
        />
      )}
      {showRejectModal && (
        <RejectModal 
          selectedTicket={selectedTicket}
          rejectReason={rejectReason}
          setRejectReason={actions.setRejectReason}
          onClose={() => {
            actions.setShowRejectModal(false);
            actions.setSelectedTicket(null);
            actions.setRejectReason('');
          }}
          onConfirm={actions.rejectRequest}
        />
      )}

      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Omega Products</h1>
              <p className="text-sm text-gray-600">Truck Queue System</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-gray-800">{userProfile?.driverName || userProfile?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{userProfile?.role}</p>
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => {
                    const newView = currentView === 'admin' ? 'home' : 'admin';
                    actions.setView(newView);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  {currentView === 'admin' ? 'Driver View' : 'Admin View'}
                </button>
              )}
              
              {isAdmin && pendingRequests.length > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingRequests.length}
                  </span>
                </div>
              )}
              
              <button
                onClick={actions.signOut}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {currentUserType === USER_ROLES.DRIVER && currentView === 'home' && <DriverHome />}
        {currentUserType === USER_ROLES.DRIVER && currentView === 'join' && <JoinQueue />}
        {currentUserType === USER_ROLES.DRIVER && currentView === 'status' && <DriverStatus />}
        {isAdmin && (currentView === 'admin' || currentView === 'home') && <AdminView />}
        {currentView === 'history' && <HistoryView />}
      </div>
    </div>
  );
};

// Root App Component with Provider
const TruckQueueApp = () => {
  return (
    <AppProvider>
      <TruckQueueAppContent />
    </AppProvider>
  );
};

export default TruckQueueApp;