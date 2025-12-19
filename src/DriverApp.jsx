import React, { useState, useEffect } from 'react';
import { Clock, Truck, MapPin, Bell, Users, History, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { driverQueueService, QUEUE_STATUS } from './services/driverFirebaseService.js';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Home Screen Component
const HomeScreen = ({ onNavigate, queueLength, calculateWaitTime }) => (
  <div className="space-y-6">
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
      <h2 className="text-2xl font-bold mb-2">Queue Status</h2>
      <p className="text-blue-100 mb-4">Corona, California</p>
      
      <div className="bg-white/20 backdrop-blur rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">Trucks in Queue</span>
        </div>
        <div className="text-3xl font-bold mb-1">{queueLength}</div>
        <div className="text-sm text-blue-100">
          Est. wait: ~{calculateWaitTime(queueLength)} minutes
        </div>
      </div>
    </div>

    <button
      onClick={() => onNavigate('join')}
      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors"
    >
      Join Queue
    </button>

    <button
      onClick={() => onNavigate('check-status')}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors"
    >
      Check My Status
    </button>

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
  </div>
);

// Join Queue Screen
const JoinQueueScreen = ({ onNavigate, onSubmitRequest }) => {
  const [formData, setFormData] = useState({
    driverName: '',
    poNumber: '',
    confirmCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.driverName || !formData.poNumber || !formData.confirmCode) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmitRequest(formData);
      // Navigate to status check with the PO number
      onNavigate('status', formData.poNumber);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
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
              onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, confirmCode: e.target.value }))}
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

// Check Status Screen
const CheckStatusScreen = ({ onNavigate, currentPO, setCurrentPO }) => {
  const [poNumber, setPONumber] = useState(currentPO || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckStatus = () => {
    if (!poNumber.trim()) {
      setError('Please enter a PO number');
      return;
    }
    
    setError('');
    setCurrentPO(poNumber.trim());
    onNavigate('status', poNumber.trim());
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Check Status</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PO Number
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPONumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your PO number (e.g., PO-12345)"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Enter the same PO number you used when joining the queue to check your current status.
            </p>
          </div>

          <button
            onClick={handleCheckStatus}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors"
          >
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
};

// Status Display Screen
const StatusScreen = ({ onNavigate, poNumber, calculateWaitTime }) => {
  const [queueTicket, setQueueTicket] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!poNumber) return;

    const loadStatus = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Check if in queue
        const ticket = await driverQueueService.findPositionByPO(poNumber);
        setQueueTicket(ticket);
        
        // Check if pending
        if (!ticket) {
          const pending = await driverQueueService.findPendingRequestByPO(poNumber);
          setPendingRequest(pending);
        }
        
        // Load notifications
        const notifs = await driverQueueService.getNotificationsByPO(poNumber);
        setNotifications(notifs);
        
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();

    // Set up real-time listener for notifications
    const unsubscribe = driverQueueService.onNotificationsChangeByPO(poNumber, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      setNotifications(notificationsData);
    });

    return unsubscribe;
  }, [poNumber]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate('check-status')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (pendingRequest) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate('check-status')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
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
            <p className="text-lg font-bold">{pendingRequest.poNumber}</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-semibold text-gray-800 mb-3">Recent Notifications</h3>
            <div className="space-y-2">
              {notifications.slice(0, 3).map(notif => (
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
        )}
      </div>
    );
  }

  if (!queueTicket) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate('check-status')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <div className="text-center py-12">
          <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">No active queue entry found for PO: {poNumber}</p>
          <button
            onClick={() => onNavigate('join')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Join Queue
          </button>
        </div>
      </div>
    );
  }

  const waitTime = calculateWaitTime(queueTicket.position);
  const statusColor = {
    [QUEUE_STATUS.QUEUED]: 'from-blue-500 to-blue-600',
    [QUEUE_STATUS.SUMMONED]: 'from-orange-500 to-orange-600',
    [QUEUE_STATUS.STAGING]: 'from-yellow-500 to-yellow-600',
    [QUEUE_STATUS.LOADING]: 'from-purple-500 to-purple-600',
    [QUEUE_STATUS.COMPLETED]: 'from-green-500 to-green-600'
  };

  const statusText = {
    [QUEUE_STATUS.QUEUED]: 'In Queue',
    [QUEUE_STATUS.SUMMONED]: 'Summoned',
    [QUEUE_STATUS.STAGING]: 'In Staging',
    [QUEUE_STATUS.LOADING]: 'Loading',
    [QUEUE_STATUS.COMPLETED]: 'Completed'
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate('check-status')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className={`bg-gradient-to-br ${statusColor[queueTicket.status]} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-6 h-6" />
          <h2 className="text-xl font-bold">{statusText[queueTicket.status]}</h2>
        </div>
        
        <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4">
          <p className="text-sm text-white/80 mb-1">Your Position</p>
          <p className="text-5xl font-bold">#{queueTicket.position}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-white/80 mb-1">Est. Wait Time</p>
            <p className="text-2xl font-bold">{waitTime} min</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-white/80 mb-1">PO Number</p>
            <p className="text-lg font-bold">{queueTicket.poNumber}</p>
          </div>
        </div>
      </div>

      {queueTicket.status === QUEUE_STATUS.QUEUED && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Stay within 10 minutes of the facility</p>
              <p>If you leave the area for too long, you may be removed from the queue.</p>
            </div>
          </div>
        </div>
      )}

      {queueTicket.status === QUEUE_STATUS.SUMMONED && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">You have been summoned!</p>
              <p>Please proceed to the staging area at the facility now.</p>
            </div>
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold text-gray-800 mb-3">Recent Notifications</h3>
          <div className="space-y-2">
            {notifications.slice(0, 5).map(notif => (
              <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {notif.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                {notif.type === 'error' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                {notif.type === 'status_update' && <Bell className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                {notif.type === 'admin_action' && <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />}
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
      )}
    </div>
  );
};

// Main Driver App Component
const DriverApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentPO, setCurrentPO] = useState('');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial queue data
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const queueData = await driverQueueService.getQueueStatus();
        setQueue(queueData);
      } catch (error) {
        console.error('Failed to load queue:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQueue();

    // Set up real-time listener for queue changes
    const unsubscribe = driverQueueService.onQueueChange((snapshot) => {
      const queueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQueue(queueData);
    });

    return unsubscribe;
  }, []);

  const calculateWaitTime = (position) => {
    return driverQueueService.calculateWaitTime(position);
  };

  const handleNavigate = (screen, poNumber = '') => {
    setCurrentScreen(screen);
    if (poNumber) {
      setCurrentPO(poNumber);
    }
  };

  const handleSubmitRequest = async (formData) => {
    await driverQueueService.submitJoinRequest(formData);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Omega Products</h1>
            <p className="text-sm text-gray-600">Truck Queue System</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {currentScreen === 'home' && (
          <HomeScreen 
            onNavigate={handleNavigate}
            queueLength={queue.length}
            calculateWaitTime={calculateWaitTime}
          />
        )}
        
        {currentScreen === 'join' && (
          <JoinQueueScreen 
            onNavigate={handleNavigate}
            onSubmitRequest={handleSubmitRequest}
          />
        )}
        
        {currentScreen === 'check-status' && (
          <CheckStatusScreen 
            onNavigate={handleNavigate}
            currentPO={currentPO}
            setCurrentPO={setCurrentPO}
          />
        )}
        
        {currentScreen === 'status' && (
          <StatusScreen 
            onNavigate={handleNavigate}
            poNumber={currentPO}
            calculateWaitTime={calculateWaitTime}
          />
        )}
      </div>
    </div>
  );
};

export default DriverApp;
