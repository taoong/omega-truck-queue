import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// Collections
const COLLECTIONS = {
  QUEUE: 'queue',
  PENDING_REQUESTS: 'pendingRequests',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activityLogs'
};

// Queue status constants
export const QUEUE_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SUMMONED: 'summoned',
  STAGING: 'staging',
  LOADING: 'loading',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
};

// Driver Queue Services (No Authentication Required)
export const driverQueueService = {
  // Submit join queue request (anonymous)
  async submitJoinRequest(requestData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.PENDING_REQUESTS), {
        ...requestData,
        status: QUEUE_STATUS.PENDING,
        requestedAt: serverTimestamp(),
        userId: 'anonymous', // No user authentication required
        sessionId: this.generateSessionId() // Generate session ID for tracking
      });
      
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to submit request: ${error.message}`);
    }
  },

  // Generate session ID for anonymous users
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  },

  // Get current queue status
  async getQueueStatus() {
    try {
      const queueSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.QUEUE), 
          where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED, QUEUE_STATUS.STAGING, QUEUE_STATUS.LOADING]),
          orderBy('position')
        )
      );
      
      return queueSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Failed to get queue status: ${error.message}`);
    }
  },

  // Get notifications for a specific PO number (since no user auth)
  async getNotificationsByPO(poNumber) {
    try {
      const notificationsSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('poNumber', '==', poNumber)
        )
      );
      
      const notifications = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      
      // Sort by timestamp in JavaScript to avoid composite index requirement
      return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  },

  // Find user's current position by PO number
  async findPositionByPO(poNumber) {
    try {
      const queueSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.QUEUE),
          where('poNumber', '==', poNumber),
          where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED, QUEUE_STATUS.STAGING, QUEUE_STATUS.LOADING])
        )
      );
      
      if (!queueSnapshot.empty) {
        const doc = queueSnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to find position: ${error.message}`);
    }
  },

  // Check if request is pending by PO number
  async findPendingRequestByPO(poNumber) {
    try {
      const pendingSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.PENDING_REQUESTS),
          where('poNumber', '==', poNumber)
        )
      );
      
      if (!pendingSnapshot.empty) {
        const doc = pendingSnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to find pending request: ${error.message}`);
    }
  },

  // Real-time listeners
  onQueueChange(callback) {
    const q = query(
      collection(db, COLLECTIONS.QUEUE),
      where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED, QUEUE_STATUS.STAGING, QUEUE_STATUS.LOADING]),
      orderBy('position')
    );
    return onSnapshot(q, callback);
  },

  onNotificationsChangeByPO(poNumber, callback) {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('poNumber', '==', poNumber)
    );
    return onSnapshot(q, (snapshot) => {
      // Sort the results in JavaScript to avoid composite index requirement
      const sortedSnapshot = {
        ...snapshot,
        docs: [...snapshot.docs].sort((a, b) => {
          const aTime = a.data().timestamp?.toDate?.() || new Date(0);
          const bTime = b.data().timestamp?.toDate?.() || new Date(0);
          return bTime - aTime; // Descending order (newest first)
        })
      };
      callback(sortedSnapshot);
    });
  },

  // Helper to calculate wait time
  calculateWaitTime(position) {
    const baseTime = 15; // 15 minutes per truck
    return position * baseTime;
  }
};

export default driverQueueService;
