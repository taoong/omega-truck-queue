import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { adminAuthService, adminQueueService } from '../services/adminFirebaseService.js';

// Initial state
const initialState = {
  // Auth state
  admin: null,
  adminProfile: null,
  isAuthenticated: false,
  isLoading: true,
  
  // Data state
  queue: [],
  pendingRequests: [],
  activityLogs: [],
  queueStats: {
    totalInQueue: 0,
    pendingRequests: 0,
    statusBreakdown: {},
    stagingCount: 0,
    loadingCount: 0
  },
  
  // UI state
  showRemoveModal: false,
  showRejectModal: false,
  selectedTicket: null,
  rejectReason: '',
  currentView: 'dashboard'
};

// Action types
const ActionTypes = {
  // Auth actions
  SET_ADMIN: 'SET_ADMIN',
  SET_ADMIN_PROFILE: 'SET_ADMIN_PROFILE',
  SET_LOADING: 'SET_LOADING',
  SIGN_OUT: 'SIGN_OUT',
  
  // Data actions
  SET_QUEUE: 'SET_QUEUE',
  SET_PENDING_REQUESTS: 'SET_PENDING_REQUESTS',
  SET_ACTIVITY_LOGS: 'SET_ACTIVITY_LOGS',
  SET_QUEUE_STATS: 'SET_QUEUE_STATS',
  
  // UI actions
  SET_SHOW_REMOVE_MODAL: 'SET_SHOW_REMOVE_MODAL',
  SET_SHOW_REJECT_MODAL: 'SET_SHOW_REJECT_MODAL',
  SET_SELECTED_TICKET: 'SET_SELECTED_TICKET',
  SET_REJECT_REASON: 'SET_REJECT_REASON',
  SET_VIEW: 'SET_VIEW'
};

// Reducer
function adminReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_ADMIN:
      return {
        ...state,
        admin: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
      
    case ActionTypes.SET_ADMIN_PROFILE:
      return {
        ...state,
        adminProfile: action.payload
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ActionTypes.SIGN_OUT:
      return {
        ...initialState,
        isLoading: false
      };
      
    case ActionTypes.SET_QUEUE:
      return {
        ...state,
        queue: action.payload
      };
      
    case ActionTypes.SET_PENDING_REQUESTS:
      return {
        ...state,
        pendingRequests: action.payload
      };
      
    case ActionTypes.SET_ACTIVITY_LOGS:
      return {
        ...state,
        activityLogs: action.payload
      };
      
    case ActionTypes.SET_QUEUE_STATS:
      return {
        ...state,
        queueStats: action.payload
      };
      
    case ActionTypes.SET_SHOW_REMOVE_MODAL:
      return {
        ...state,
        showRemoveModal: action.payload
      };
      
    case ActionTypes.SET_SHOW_REJECT_MODAL:
      return {
        ...state,
        showRejectModal: action.payload
      };
      
    case ActionTypes.SET_SELECTED_TICKET:
      return {
        ...state,
        selectedTicket: action.payload
      };
      
    case ActionTypes.SET_REJECT_REASON:
      return {
        ...state,
        rejectReason: action.payload
      };
      
    case ActionTypes.SET_VIEW:
      return {
        ...state,
        currentView: action.payload
      };
      
    default:
      return state;
  }
}

// Create context
const AdminContext = createContext();

// Provider component
export function AdminProvider({ children }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Auth effect
  useEffect(() => {
    const unsubscribe = adminAuthService.onAuthStateChange(async (admin) => {
      dispatch({ type: ActionTypes.SET_ADMIN, payload: admin });
      
      if (admin) {
        try {
          const adminProfile = await adminAuthService.getUserProfile(admin.uid);
          dispatch({ type: ActionTypes.SET_ADMIN_PROFILE, payload: adminProfile });
        } catch (error) {
          console.error('Failed to load admin profile:', error);
          // If not admin, sign out
          await adminAuthService.signOut();
        }
      } else {
        dispatch({ type: ActionTypes.SET_ADMIN_PROFILE, payload: null });
      }
    });

    return unsubscribe;
  }, []);

  // Real-time data subscriptions
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const unsubscribes = [];

    // Subscribe to queue changes
    const queueUnsub = adminQueueService.onQueueChange((snapshot) => {
      const queueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        requestedAt: doc.data().requestedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      dispatch({ type: ActionTypes.SET_QUEUE, payload: queueData });
    });
    unsubscribes.push(queueUnsub);

    // Subscribe to pending requests
    const pendingUnsub = adminQueueService.onPendingRequestsChange((snapshot) => {
      const pendingData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      dispatch({ type: ActionTypes.SET_PENDING_REQUESTS, payload: pendingData });
    });
    unsubscribes.push(pendingUnsub);

    // Subscribe to activity logs
    const logsUnsub = adminQueueService.onActivityLogsChange((snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      dispatch({ type: ActionTypes.SET_ACTIVITY_LOGS, payload: logsData });
    });
    unsubscribes.push(logsUnsub);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [state.isAuthenticated]);

  // Update queue stats when queue changes
  useEffect(() => {
    if (state.queue.length > 0 || state.pendingRequests.length > 0) {
      adminQueueService.getQueueStats().then(stats => {
        dispatch({ type: ActionTypes.SET_QUEUE_STATS, payload: stats });
      }).catch(console.error);
    }
  }, [state.queue, state.pendingRequests]);

  // Actions
  const actions = {
    // Auth actions
    async signIn(email, password) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        await adminAuthService.signIn(email, password);
      } catch (error) {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        throw error;
      }
    },

    async signOut() {
      try {
        await adminAuthService.signOut();
        dispatch({ type: ActionTypes.SIGN_OUT });
      } catch (error) {
        throw error;
      }
    },

    // Queue actions
    async approveRequest(requestId) {
      try {
        await adminQueueService.approveRequest(requestId);
      } catch (error) {
        throw error;
      }
    },

    async rejectRequest(requestId, reason) {
      try {
        await adminQueueService.rejectRequest(requestId, reason);
        dispatch({ type: ActionTypes.SET_SHOW_REJECT_MODAL, payload: false });
        dispatch({ type: ActionTypes.SET_SELECTED_TICKET, payload: null });
        dispatch({ type: ActionTypes.SET_REJECT_REASON, payload: '' });
      } catch (error) {
        throw error;
      }
    },

    async removeFromQueue(queueId) {
      try {
        await adminQueueService.removeFromQueue(queueId);
        dispatch({ type: ActionTypes.SET_SHOW_REMOVE_MODAL, payload: false });
        dispatch({ type: ActionTypes.SET_SELECTED_TICKET, payload: null });
      } catch (error) {
        throw error;
      }
    },

    async updateQueuePositions(queueItems) {
      try {
        await adminQueueService.updateQueuePositions(queueItems);
      } catch (error) {
        throw error;
      }
    },

    async updateQueueStatus(queueId, newStatus) {
      try {
        await adminQueueService.updateQueueStatus(queueId, newStatus);
      } catch (error) {
        throw error;
      }
    },

    // UI actions
    setView: (view) => dispatch({ type: ActionTypes.SET_VIEW, payload: view }),
    setShowRemoveModal: (show) => dispatch({ type: ActionTypes.SET_SHOW_REMOVE_MODAL, payload: show }),
    setShowRejectModal: (show) => dispatch({ type: ActionTypes.SET_SHOW_REJECT_MODAL, payload: show }),
    setSelectedTicket: (ticket) => dispatch({ type: ActionTypes.SET_SELECTED_TICKET, payload: ticket }),
    setRejectReason: (reason) => dispatch({ type: ActionTypes.SET_REJECT_REASON, payload: reason })
  };

  // Helper functions
  const helpers = {
    calculateWaitTime: (position) => {
      const baseTime = 15;
      return position * baseTime;
    },

    getStatusColor: (status) => {
      switch (status) {
        case 'queued': return 'bg-blue-100 text-blue-800';
        case 'summoned': return 'bg-yellow-100 text-yellow-800';
        case 'staging': return 'bg-orange-100 text-orange-800';
        case 'loading': return 'bg-green-100 text-green-800';
        case 'completed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const value = {
    state,
    actions,
    helpers
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

// Hook to use the context
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

export default AdminContext;
