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

// Admin role constants
export const ADMIN_ROLES = {
  SHIPPING_ADMIN: 'shipping_admin',
  ORDER_DESK_ADMIN: 'order_desk_admin'
};

// Authentication Services (Admin only)
export const adminAuthService = {
  // Sign in admin user
  async signIn(email, password) {
    try {
      let userCredential;
      let user;
      
      try {
        // Try to sign in first
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authError) {
        // If sign in fails and this is a known admin email, try to create the account
        if (authError.code === 'auth/invalid-credential' && this.isKnownAdminEmail(email)) {
          console.log('Creating new admin account...');
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
        } else {
          throw authError;
        }
      }
      
      // Try to get user profile, create if doesn't exist
      let userProfile = await this.getUserProfile(user.uid);
      
      // If no profile exists and this is a known admin email, create the profile
      if (!userProfile && this.isKnownAdminEmail(email)) {
        console.log('Creating admin profile...');
        userProfile = await this.createAdminProfile(user);
      }
      
      if (!userProfile || !Object.values(ADMIN_ROLES).includes(userProfile.role)) {
        await firebaseSignOut(auth);
        throw new Error('Access denied. Admin account required.');
      }
      
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(`Sign in failed: ${error.message}`);
    }
  },

  // Check if email is a known admin email and return role
  getAdminRole(email) {
    const adminConfig = {
      'admin@omega.com': ADMIN_ROLES.SHIPPING_ADMIN,
      'shipping@omega.com': ADMIN_ROLES.SHIPPING_ADMIN,
      'shipping@omegaproducts.com': ADMIN_ROLES.SHIPPING_ADMIN,
      'orders@omega.com': ADMIN_ROLES.ORDER_DESK_ADMIN,
      'orders@omegaproducts.com': ADMIN_ROLES.ORDER_DESK_ADMIN,
      'orderdesk@omega.com': ADMIN_ROLES.ORDER_DESK_ADMIN
    };
    return adminConfig[email.toLowerCase()] || null;
  },

  // Check if email is a known admin email
  isKnownAdminEmail(email) {
    return this.getAdminRole(email) !== null;
  },

  // Create admin profile
  async createAdminProfile(user) {
    try {
      const role = this.getAdminRole(user.email);
      if (!role) {
        throw new Error('Unknown admin email');
      }

      const adminProfile = {
        uid: user.uid,
        email: user.email,
        role: role,
        driverName: '',
        createdAt: serverTimestamp(),
        isActive: true
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), adminProfile);
      return { id: docRef.id, ...adminProfile };
    } catch (error) {
      console.error('Failed to create admin profile:', error);
      throw new Error('Failed to create admin profile');
    }
  },

  // Sign out admin user
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
      // If permission denied, return null instead of throwing
      if (error.code === 'permission-denied') {
        console.warn('Permission denied accessing user profile, user may not exist yet');
        return null;
      }
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }
};

// Admin Queue Management Services
export const adminQueueService = {
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
        requestData.userId || 'anonymous',
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
        requestData.userId || 'anonymous',
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
          where('position', '>', queueData.position)
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
        queueData.userId || 'anonymous',
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

      await this.sendNotification(queueData.userId || 'anonymous', 'status_update', message, queueData.poNumber);
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
  onPendingRequestsChange(callback, errorCallback) {
    const q = query(
      collection(db, COLLECTIONS.PENDING_REQUESTS),
      orderBy('requestedAt', 'desc')
    );
    return onSnapshot(q, callback, errorCallback || ((error) => {
      console.error('Pending requests subscription error:', error);
    }));
  },

  onQueueChange(callback, errorCallback) {
    const q = query(
      collection(db, COLLECTIONS.QUEUE),
      where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED, QUEUE_STATUS.STAGING, QUEUE_STATUS.LOADING])
    );
    return onSnapshot(q, (snapshot) => {
      // Sort by position in JavaScript to avoid composite index requirement
      const sortedSnapshot = {
        ...snapshot,
        docs: [...snapshot.docs].sort((a, b) => {
          const aPos = a.data().position || 0;
          const bPos = b.data().position || 0;
          return aPos - bPos; // Ascending order
        })
      };
      callback(sortedSnapshot);
    }, errorCallback || ((error) => {
      console.error('Queue subscription error:', error);
    }));
  },

  onActivityLogsChange(callback, errorCallback) {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITY_LOGS),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, callback, errorCallback || ((error) => {
      console.error('Activity logs subscription error:', error);
    }));
  },

  // PO Validation Functions (Order Desk Admin only)
  async validatePO(queueId, isValid, reason = '') {
    try {
      const queueRef = doc(db, COLLECTIONS.QUEUE, queueId);
      await updateDoc(queueRef, {
        poValidated: isValid,
        poValidationReason: reason,
        poValidatedAt: serverTimestamp()
      });

      // Log the activity
      await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
        type: 'admin_action',
        action: isValid ? 'po_validated' : 'po_invalidated',
        message: `PO ${isValid ? 'validated' : 'invalidated'} by order desk admin${reason ? ': ' + reason : ''}`,
        queueId: queueId,
        timestamp: serverTimestamp()
      });

      // TODO: Send notification to driver
      
    } catch (error) {
      throw new Error(`Failed to ${isValid ? 'validate' : 'invalidate'} PO: ${error.message}`);
    }
  },

  // Create manual ticket (Order Desk Admin only)
  async createManualTicket(ticketData) {
    try {
      // Get current queue to determine next position
      const queueSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.QUEUE),
          where('status', 'in', [QUEUE_STATUS.QUEUED, QUEUE_STATUS.SUMMONED])
        )
      );
      
      // Calculate next position
      const currentPositions = queueSnapshot.docs.map(doc => doc.data().position || 0);
      const nextPosition = currentPositions.length > 0 ? Math.max(...currentPositions) + 1 : 1;
      
      // Add to queue
      const docRef = await addDoc(collection(db, COLLECTIONS.QUEUE), {
        ...ticketData,
        status: QUEUE_STATUS.QUEUED,
        position: nextPosition,
        joinedAt: serverTimestamp(),
        requestedAt: serverTimestamp(),
        userId: 'manual_admin_entry',
        sessionId: 'admin_' + Date.now(),
        poValidated: true, // Manually created tickets are pre-validated
        createdByAdmin: true
      });
      
      // Log the activity
      await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
        type: 'admin_action',
        action: 'manual_ticket_created',
        message: `Manual ticket created by order desk admin for PO ${ticketData.poNumber}`,
        poNumber: ticketData.poNumber,
        queueId: docRef.id,
        position: nextPosition,
        timestamp: serverTimestamp()
      });
      
      return { id: docRef.id, position: nextPosition };
    } catch (error) {
      throw new Error(`Failed to create manual ticket: ${error.message}`);
    }
  }
};

export default adminQueueService;