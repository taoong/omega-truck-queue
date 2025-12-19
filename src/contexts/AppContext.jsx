import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, queueService, USER_ROLES } from '../services/firebaseService.js';

// Initial state
const initialState = {
  // Auth state
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: true,
  
  // App state
  userType: USER_ROLES.DRIVER,
  currentView: 'home',
  
  // Data state
  queue: [],
  pendingRequests: [],
  notifications: [],
  activityLogs: [],
  
  // UI state
  showRemoveModal: false,
  showRejectModal: false,
  selectedTicket: null,
  rejectReason: '',
  
  // Form state
  formData: {
    poNumber: '',
    confirmCode: '',
    driverName: ''
  }
};

// Action types
const ActionTypes = {
  // Auth actions
  SET_USER: 'SET_USER',
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  SET_LOADING: 'SET_LOADING',
  SIGN_OUT: 'SIGN_OUT',
  
  // App actions
  SET_USER_TYPE: 'SET_USER_TYPE',
  SET_VIEW: 'SET_VIEW',
  
  // Data actions
  SET_QUEUE: 'SET_QUEUE',
  SET_PENDING_REQUESTS: 'SET_PENDING_REQUESTS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_ACTIVITY_LOGS: 'SET_ACTIVITY_LOGS',
  
  // UI actions
  SET_SHOW_REMOVE_MODAL: 'SET_SHOW_REMOVE_MODAL',
  SET_SHOW_REJECT_MODAL: 'SET_SHOW_REJECT_MODAL',
  SET_SELECTED_TICKET: 'SET_SELECTED_TICKET',
  SET_REJECT_REASON: 'SET_REJECT_REASON',
  
  // Form actions
  SET_FORM_DATA: 'SET_FORM_DATA',
  RESET_FORM: 'RESET_FORM'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
      
    case ActionTypes.SET_USER_PROFILE:
      return {
        ...state,
        userProfile: action.payload,
        userType: action.payload?.role || USER_ROLES.DRIVER
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
      
    case ActionTypes.SET_USER_TYPE:
      return {
        ...state,
        userType: action.payload
      };
      
    case ActionTypes.SET_VIEW:
      return {
        ...state,
        currentView: action.payload
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
      
    case ActionTypes.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload
      };
      
    case ActionTypes.SET_ACTIVITY_LOGS:
      return {
        ...state,
        activityLogs: action.payload
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
      
    case ActionTypes.SET_FORM_DATA:
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      };
      
    case ActionTypes.RESET_FORM:
      return {
        ...state,
        formData: initialState.formData
      };
      
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Auth effect
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      dispatch({ type: ActionTypes.SET_USER, payload: user });
      
      if (user) {
        try {
          const userProfile = await queueService.getUserProfile(user.uid);
          dispatch({ type: ActionTypes.SET_USER_PROFILE, payload: userProfile });
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      } else {
        dispatch({ type: ActionTypes.SET_USER_PROFILE, payload: null });
      }
    });

    return unsubscribe;
  }, []);

  // Real-time data subscriptions
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const unsubscribes = [];

    // Subscribe to queue changes
    const queueUnsub = queueService.onQueueChange((snapshot) => {
      const queueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        requestedAt: doc.data().requestedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      dispatch({ type: ActionTypes.SET_QUEUE, payload: queueData });
    });
    unsubscribes.push(queueUnsub);

    // Subscribe to pending requests (admin only)
    if (state.userProfile?.role === USER_ROLES.ADMIN) {
      const pendingUnsub = queueService.onPendingRequestsChange((snapshot) => {
        const pendingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        dispatch({ type: ActionTypes.SET_PENDING_REQUESTS, payload: pendingData });
      });
      unsubscribes.push(pendingUnsub);

      // Subscribe to activity logs
      const logsUnsub = queueService.onActivityLogsChange((snapshot) => {
        const logsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        dispatch({ type: ActionTypes.SET_ACTIVITY_LOGS, payload: logsData });
      });
      unsubscribes.push(logsUnsub);
    }

    // Subscribe to user notifications
    if (state.user?.uid) {
      const notificationsUnsub = queueService.onNotificationsChange(state.user.uid, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: notificationsData });
      });
      unsubscribes.push(notificationsUnsub);
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [state.isAuthenticated, state.userProfile?.role, state.user?.uid]);

  // Actions
  const actions = {
    // Auth actions
    async signIn(email, password) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        await authService.signIn(email, password);
      } catch (error) {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        throw error;
      }
    },

    async signUp(email, password, userData) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        await authService.signUp(email, password, userData);
      } catch (error) {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        throw error;
      }
    },

    async signOut() {
      try {
        await authService.signOut();
        dispatch({ type: ActionTypes.SIGN_OUT });
      } catch (error) {
        throw error;
      }
    },

    // Queue actions
    async submitJoinRequest() {
      try {
        if (!state.formData.driverName || !state.formData.poNumber || !state.formData.confirmCode) {
          throw new Error('Please fill in all fields');
        }

        await queueService.submitJoinRequest({
          driverName: state.formData.driverName,
          poNumber: state.formData.poNumber,
          confirmCode: state.formData.confirmCode
        });

        dispatch({ type: ActionTypes.RESET_FORM });
        dispatch({ type: ActionTypes.SET_VIEW, payload: 'status' });
      } catch (error) {
        throw error;
      }
    },

    async approveRequest(requestId) {
      try {
        await queueService.approveRequest(requestId);
      } catch (error) {
        throw error;
      }
    },

    async rejectRequest(requestId, reason) {
      try {
        await queueService.rejectRequest(requestId, reason);
        dispatch({ type: ActionTypes.SET_SHOW_REJECT_MODAL, payload: false });
        dispatch({ type: ActionTypes.SET_SELECTED_TICKET, payload: null });
        dispatch({ type: ActionTypes.SET_REJECT_REASON, payload: '' });
      } catch (error) {
        throw error;
      }
    },

    async removeFromQueue(queueId) {
      try {
        await queueService.removeFromQueue(queueId);
        dispatch({ type: ActionTypes.SET_SHOW_REMOVE_MODAL, payload: false });
        dispatch({ type: ActionTypes.SET_SELECTED_TICKET, payload: null });
      } catch (error) {
        throw error;
      }
    },

    async updateQueuePositions(queueItems) {
      try {
        await queueService.updateQueuePositions(queueItems);
      } catch (error) {
        throw error;
      }
    },

    async markNotificationRead(notificationId) {
      try {
        await queueService.markNotificationRead(notificationId);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },

    // UI actions
    setView: (view) => dispatch({ type: ActionTypes.SET_VIEW, payload: view }),
    setUserType: (userType) => dispatch({ type: ActionTypes.SET_USER_TYPE, payload: userType }),
    setFormData: (data) => dispatch({ type: ActionTypes.SET_FORM_DATA, payload: data }),
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

    getCurrentUserTicket: () => {
      return state.queue.find(ticket => ticket.userId === state.user?.uid);
    },

    getCurrentUserPendingRequest: () => {
      return state.pendingRequests.find(request => request.userId === state.user?.uid);
    },

    getUnreadNotificationsCount: () => {
      return state.notifications.filter(notification => !notification.read).length;
    }
  };

  const value = {
    state,
    actions,
    helpers
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
