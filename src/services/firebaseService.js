import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '../config/firebase.js';

// Collections
const COLLECTIONS = {
  QUEUE: 'queue',
  PENDING_REQUESTS: 'pendingRequests',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activityLogs',
  USERS: 'users',
  SETTINGS: 'settings'
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

// User roles
export const USER_ROLES = {
  DRIVER: 'driver',
  ADMIN: 'admin'
};

// Authentication Services
export const authService = {
  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }
  },

  // Create new user account
  async signUp(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await addDoc(collection(db, COLLECTIONS.USERS), {
        uid: user.uid,
        email: user.email,
        role: userData.role || USER_ROLES.DRIVER,
        driverName: userData.driverName || '',
        createdAt: serverTimestamp(),
        isActive: true
      });
      
      return user;
    } catch (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }
  },

  // Sign out user
  async signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};

// Queue Management Services
export const queueService = {
  // Submit join queue request
  async submitJoinRequest(requestData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.PENDING_REQUESTS), {
        ...requestData,
        status: QUEUE_STATUS.PENDING,
        requestedAt: serverTimestamp(),
        userId: auth.currentUser?.uid || null
      });
      
      // Log the activity
      await this.logActivity('request_submitted', `Driver ${requestData.driverName} submitted join request`, requestData.poNumber);
      
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to submit request: ${error.message}`);
    }
  },

  // Approve join request
  async approveRequest(requestId) {
    try {
      const requestDoc = await getDoc(doc(db, COLLECTIONS.PENDING_REQUESTS, requestId));
      if (!requestDoc.exists()) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      
      // Get current queue length to determine position
      const queueSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.QUEUE), where('status', '==', QUEUE_STATUS.QUEUED))
      );
      const position = queueSnapshot.size + 1;

      // Add to queue
      const queueDocRef = await addDoc(collection(db, COLLECTIONS.QUEUE), {
        ...requestData,
        status: QUEUE_STATUS.QUEUED,
        position: position,
        joinedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid
      });

      // Remove from pending requests
      await deleteDoc(doc(db, COLLECTIONS.PENDING_REQUESTS, requestId));

      // Send notification
      await this.sendNotification(
        requestData.userId,
        'success',
        `Request approved - joined queue at position ${position}`,
        requestData.poNumber
      );

      // Log activity
      await this.logActivity('request_approved', `Request approved for ${requestData.driverName}`, requestData.poNumber);

      return queueDocRef.id;
    } catch (error) {
      throw new Error(`Failed to approve request: ${error.message}`);
    }
  },

  // Reject join request
  async rejectRequest(requestId, reason) {
    try {
      const requestDoc = await getDoc(doc(db, COLLECTIONS.PENDING_REQUESTS, requestId));
      if (!requestDoc.exists()) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();

      // Remove from pending requests
      await deleteDoc(doc(db, COLLECTIONS.PENDING_REQUESTS, requestId));

      // Send notification
      await this.sendNotification(
        requestData.userId,
        'error',
        `Request rejected: ${reason}`,
        requestData.poNumber
      );

      // Log activity
      await this.logActivity('request_rejected', `Request rejected for ${requestData.driverName}: ${reason}`, requestData.poNumber);
    } catch (error) {
      throw new Error(`Failed to reject request: ${error.message}`);
    }
  },

  // Update queue positions after reordering
  async updateQueuePositions(queueItems) {
    try {
      const batch = [];
      
      for (let i = 0; i < queueItems.length; i++) {
        const item = queueItems[i];
        batch.push(
          updateDoc(doc(db, COLLECTIONS.QUEUE, item.id), {
            position: i + 1,
            updatedAt: serverTimestamp()
          })
        );
      }

      await Promise.all(batch);
      
      // Log activity
      await this.logActivity('queue_reordered', 'Queue positions updated by admin');
    } catch (error) {
      throw new Error(`Failed to update queue positions: ${error.message}`);
    }
  },

  // Remove from queue
  async removeFromQueue(queueId, reason = 'Removed by admin') {
    try {
      const queueDoc = await getDoc(doc(db, COLLECTIONS.QUEUE, queueId));
      if (!queueDoc.exists()) {
        throw new Error('Queue item not found');
      }

      const queueData = queueDoc.data();

      // Remove from queue
      await deleteDoc(doc(db, COLLECTIONS.QUEUE, queueId));

      // Update positions of remaining items
      const remainingQueue = await getDocs(
        query(
          collection(db, COLLECTIONS.QUEUE), 
          where('position', '>', queueData.position),
          orderBy('position')
        )
      );

      const updatePromises = [];
      remainingQueue.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            position: increment(-1),
            updatedAt: serverTimestamp()
          })
        );
      });

      await Promise.all(updatePromises);

      // Send notification
      await this.sendNotification(
        queueData.userId,
        'admin_action',
        `Removed from queue: ${reason}`,
        queueData.poNumber
      );

      // Log activity
      await this.logActivity('removed_from_queue', `${queueData.driverName} removed from queue: ${reason}`, queueData.poNumber);
    } catch (error) {
      throw new Error(`Failed to remove from queue: ${error.message}`);
    }
  },

  // Update queue item status
  async updateQueueStatus(queueId, newStatus) {
    try {
      await updateDoc(doc(db, COLLECTIONS.QUEUE, queueId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      const queueDoc = await getDoc(doc(db, COLLECTIONS.QUEUE, queueId));
      const queueData = queueDoc.data();

      // Send appropriate notification based on status
      let message = '';
      switch (newStatus) {
        case QUEUE_STATUS.SUMMONED:
          message = 'You are summoned! Please proceed to the staging area.';
          break;
        case QUEUE_STATUS.STAGING:
          message = 'You are now in the staging area.';
          break;
        case QUEUE_STATUS.LOADING:
          message = 'You are now in the loading bay.';
          break;
        case QUEUE_STATUS.COMPLETED:
          message = 'Loading completed. Thank you!';
          break;
        default:
          message = `Status updated to ${newStatus}`;
      }

      await this.sendNotification(queueData.userId, 'status_update', message, queueData.poNumber);
      await this.logActivity('status_updated', `${queueData.driverName} status updated to ${newStatus}`, queueData.poNumber);
    } catch (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }
  },

  // Send notification
  async sendNotification(userId, type, message, poNumber = null) {
    try {
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        userId,
        type,
        message,
        poNumber,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  },

  // Log activity
  async logActivity(type, message, poNumber = null) {
    try {
      await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
        type,
        message,
        poNumber,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || null,
        userEmail: auth.currentUser?.email || null
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  // Real-time listeners
  onPendingRequestsChange(callback) {
    const q = query(
      collection(db, COLLECTIONS.PENDING_REQUESTS),
      orderBy('requestedAt', 'desc')
    );
    return onSnapshot(q, callback);
  },

  onQueueChange(callback) {
    const q = query(
      collection(db, COLLECTIONS.QUEUE),
      where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED, QUEUE_STATUS.STAGING, QUEUE_STATUS.LOADING]),
      orderBy('position')
    );
    return onSnapshot(q, callback);
  },

  onNotificationsChange(userId, callback) {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, callback);
  },

  onActivityLogsChange(callback) {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITY_LOGS),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, callback);
  },

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const userQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('uid', '==', userId)
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        return { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }
};

export default queueService;
