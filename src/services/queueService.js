import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot,
    query,
    orderBy,
    where,
    serverTimestamp,
    getDocs
  } from 'firebase/firestore';
  import { db } from '../config/firebase';
  
  // Collections
  const QUEUE_COLLECTION = 'queue';
  const REQUESTS_COLLECTION = 'pendingRequests';
  const LOGS_COLLECTION = 'activityLogs';
  
  // Subscribe to queue changes (real-time)
  export function subscribeToQueue(callback) {
    const q = query(
      collection(db, QUEUE_COLLECTION),
      where('status', '==', 'approved'),
      orderBy('position', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const queue = [];
      snapshot.forEach((doc) => {
        queue.push({ id: doc.id, ...doc.data() });
      });
      callback(queue);
    });
  }
  
  // Subscribe to pending requests (admin only)
  export function subscribeToPendingRequests(callback) {
    const q = query(
      collection(db, REQUESTS_COLLECTION),
      orderBy('requestedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const requests = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      callback(requests);
    });
  }
  
  // Submit join request (driver)
  export async function submitJoinRequest(driverName, poNumber, confirmCode, location) {
    try {
      const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), {
        driverName,
        poNumber,
        confirmCode,
        location,
        requestedAt: serverTimestamp(),
        status: 'pending'
      });
      
      await addLog('request_submitted', `${driverName} submitted request`, poNumber);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error submitting request:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Approve request (admin)
  export async function approveRequest(requestId) {
    try {
      // Get the request
      const requestDoc = doc(db, REQUESTS_COLLECTION, requestId);
      const requestSnap = await getDocs(query(collection(db, REQUESTS_COLLECTION), where('__name__', '==', requestId)));
      
      if (requestSnap.empty) {
        throw new Error('Request not found');
      }
      
      const requestData = requestSnap.docs[0].data();
      
      // Get current queue length to determine position
      const queueSnap = await getDocs(collection(db, QUEUE_COLLECTION));
      const newPosition = queueSnap.size + 1;
      
      // Add to queue
      await addDoc(collection(db, QUEUE_COLLECTION), {
        ...requestData,
        status: 'approved',
        position: newPosition,
        joinedAt: serverTimestamp()
      });
      
      // Delete request
      await deleteDoc(requestDoc);
      
      await addLog('request_approved', `${requestData.driverName} approved - position ${newPosition}`, requestData.poNumber);
      
      // TODO: Send push notification to driver
      
      return { success: true, position: newPosition };
    } catch (error) {
      console.error('Error approving request:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Reject request (admin)
  export async function rejectRequest(requestId, reason) {
    try {
      const requestDoc = doc(db, REQUESTS_COLLECTION, requestId);
      const requestSnap = await getDocs(query(collection(db, REQUESTS_COLLECTION), where('__name__', '==', requestId)));
      
      if (requestSnap.empty) {
        throw new Error('Request not found');
      }
      
      const requestData = requestSnap.docs[0].data();
      
      await deleteDoc(requestDoc);
      await addLog('request_rejected', `${requestData.driverName} rejected: ${reason}`, requestData.poNumber);
      
      // TODO: Send push notification to driver
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting request:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Update queue positions (admin - after drag and drop)
  export async function updateQueuePositions(queueArray) {
    try {
      const batch = [];
      
      for (let i = 0; i < queueArray.length; i++) {
        const item = queueArray[i];
        const docRef = doc(db, QUEUE_COLLECTION, item.id);
        batch.push(updateDoc(docRef, { position: i + 1 }));
      }
      
      await Promise.all(batch);
      await addLog('queue_reordered', 'Admin reordered queue', null);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating positions:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Remove from queue (admin)
  export async function removeFromQueue(ticketId, reason = 'Removed by admin') {
    try {
      const ticketDoc = doc(db, QUEUE_COLLECTION, ticketId);
      const ticketSnap = await getDocs(query(collection(db, QUEUE_COLLECTION), where('__name__', '==', ticketId)));
      
      if (ticketSnap.empty) {
        throw new Error('Ticket not found');
      }
      
      const ticketData = ticketSnap.docs[0].data();
      
      await deleteDoc(ticketDoc);
      
      // Reorder remaining tickets
      const remainingSnap = await getDocs(
        query(collection(db, QUEUE_COLLECTION), orderBy('position', 'asc'))
      );
      
      const batch = [];
      remainingSnap.forEach((doc, index) => {
        batch.push(updateDoc(doc.ref, { position: index + 1 }));
      });
      
      await Promise.all(batch);
      await addLog('removed_from_queue', `${ticketData.driverName} removed: ${reason}`, ticketData.poNumber);
      
      // TODO: Send push notification to driver
      
      return { success: true };
    } catch (error) {
      console.error('Error removing from queue:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Add activity log
  async function addLog(type, message, poNumber) {
    try {
      await addDoc(collection(db, LOGS_COLLECTION), {
        type,
        message,
        poNumber,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }
  
  // Subscribe to activity logs
  export function subscribeToLogs(callback, limit = 50) {
    const q = query(
      collection(db, LOGS_COLLECTION),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      callback(logs.slice(0, limit));
    });
  }