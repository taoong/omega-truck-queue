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
  // Join queue directly (anonymous)
  async joinQueue(requestData) {
    try {
      // Get current queue to determine next position
      const queueSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.QUEUE),
          where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED])
        )
      );
      
      // Calculate next position using consecutive numbering
      // Sort existing queue by position and assign the next consecutive number
      const sortedQueue = queueSnapshot.docs
        .map(doc => doc.data())
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Find the next available consecutive position
      let nextPosition = 1;
      for (const item of sortedQueue) {
        if (item.position === nextPosition) {
          nextPosition++;
        } else {
          break;
        }
      }
      
      // Add directly to queue
      const docRef = await addDoc(collection(db, COLLECTIONS.QUEUE), {
        ...requestData,
        status: QUEUE_STATUS.QUEUED,
        position: nextPosition,
        joinedAt: serverTimestamp(),
        requestedAt: serverTimestamp(),
        userId: 'anonymous', // No user authentication required
        sessionId: this.generateSessionId() // Generate session ID for tracking
      });
      
      // Log the activity
      await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
        type: 'queue_joined',
        action: 'joined',
        message: `Truck with PO ${requestData.poNumber} joined the queue`,
        poNumber: requestData.poNumber,
        queueId: docRef.id,
        position: nextPosition,
        timestamp: serverTimestamp()
      });
      
      return { id: docRef.id, position: nextPosition };
    } catch (error) {
      throw new Error(`Failed to join queue: ${error.message}`);
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
          where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED])
          // Removed orderBy to avoid composite index requirement
        )
      );
      
      const queueData = queueSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by position in JavaScript to avoid composite index requirement
      return queueData.sort((a, b) => (a.position || 0) - (b.position || 0));
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
      // First, get the ticket with this PO number
      const ticketSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.QUEUE),
          where('poNumber', '==', poNumber),
          where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED])
        )
      );
      
      if (ticketSnapshot.empty) {
        return null;
      }
      
      const ticketDoc = ticketSnapshot.docs[0];
      const ticketData = ticketDoc.data();
      
      // Get all tickets in queue to calculate actual position
      const queueSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.QUEUE),
          where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED])
        )
      );
      
      // Sort all tickets by position
      const allTickets = queueSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Find the index of this ticket in the sorted queue
      const ticketIndex = allTickets.findIndex(t => t.id === ticketDoc.id);
      
      // Calculate actual position (1-based)
      const actualPosition = ticketIndex >= 0 ? ticketIndex + 1 : ticketData.position || 1;
      
      return {
        id: ticketDoc.id,
        ...ticketData,
        position: actualPosition, // Use calculated position instead of stored position
        joinedAt: ticketData.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
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
      where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED])
      // Removed orderBy to avoid composite index requirement
    );
    
    return onSnapshot(q, (snapshot) => {
      const queueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by position in JavaScript
      const sortedQueueData = queueData.sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Create a new snapshot-like object with sorted docs
      const sortedSnapshot = {
        ...snapshot,
        docs: sortedQueueData.map((data, index) => ({
          id: data.id,
          data: () => data
        }))
      };
      
      callback(sortedSnapshot);
    });
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
