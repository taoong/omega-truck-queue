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
  Truck,
  Phone,
  Package,
  ArrowDownToLine,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { adminAuthService, adminQueueService, QUEUE_STATUS, ADMIN_ROLES } from './services/adminFirebaseService.js';

// Utility function to format relative time
const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

// Sortable Queue Row Component
const SortableQueueRow = ({ ticket, stagingZones, onSummon }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const availableZones = Object.values(stagingZones).filter(zone => zone.status === 'available').length;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 transition-colors ${isDragging ? 'shadow-lg' : ''}`}
    >
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
        <div>
          <div className="font-medium">{formatRelativeTime(ticket.joinedAt)}</div>
          <div>{new Date(ticket.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="font-bold text-gray-900 text-sm">
            {ticket.poNumber}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Phone className="w-3 h-3" />
          <span>{ticket.confirmCode}</span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1">
          {ticket.type === 'pickup' ? (
            <Package className="w-3 h-3 text-blue-600" />
          ) : (
            <ArrowDownToLine className="w-3 h-3 text-green-600" />
          )}
          <span className="text-xs text-gray-600 capitalize">{ticket.type || 'pickup'}</span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {ticket.poValidated === true ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-700 font-medium">Validated</span>
            </>
          ) : ticket.poValidated === false ? (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-700 font-medium">Invalid</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-700 font-medium">Pending</span>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <button
          onClick={() => onSummon(ticket)}
          disabled={availableZones === 0}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            availableZones === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={availableZones === 0 ? 'Both staging zones are occupied' : 'Summon driver'}
        >
          {availableZones === 0 ? 'Zones Full' : 'Summon →'}
        </button>
      </td>
    </tr>
  );
};

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// PO Validation Modal Component
const POValidationModal = ({ selectedTicket, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  
  // Check current validation status
  const isCurrentlyValid = selectedTicket?.poValidated === true;
  const isCurrentlyInvalid = selectedTicket?.poValidated === false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-800">PO Validation</h3>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-3">
            Update validation for PO <strong>{selectedTicket?.poNumber}</strong>
          </p>
          
          {/* Show current status */}
          {isCurrentlyValid && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">Currently: ✓ Valid</p>
            </div>
          )}
          {isCurrentlyInvalid && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">Currently: ✗ Invalid</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter validation notes..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedTicket.id, false, reason)}
            disabled={isCurrentlyInvalid}
            className={`flex-1 font-medium py-3 rounded-lg transition-colors ${
              isCurrentlyInvalid 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Invalidate
          </button>
          <button
            onClick={() => onConfirm(selectedTicket.id, true, reason)}
            disabled={isCurrentlyValid}
            className={`flex-1 font-medium py-3 rounded-lg transition-colors ${
              isCurrentlyValid 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
};

// Manual Ticket Creation Modal
const ManualTicketModal = ({ onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    poNumber: '',
    phoneNumber: '',
    type: 'pickup'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.poNumber || !formData.phoneNumber) {
      return;
    }

    // Validate PO number (must be exactly 7 digits)
    if (!/^\d{7}$/.test(formData.poNumber)) {
      alert('PO number must be exactly 7 digits');
      return;
    }

    // Validate US phone number (10 digits)
    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      alert('Please enter a valid US phone number (10 digits)');
      return;
    }

    setLoading(true);
    try {
      // Map phoneNumber to confirmCode to match the expected field name
      const ticketData = {
        ...formData,
        confirmCode: formData.phoneNumber
      };
      delete ticketData.phoneNumber;
      
      await onConfirm(ticketData);
      onClose();
    } catch (error) {
      console.error('Error creating manual ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-800">Create Manual Ticket</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PO Number
            </label>
            <input
              type="text"
              value={formData.poNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                setFormData(prev => ({ ...prev, poNumber: value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234567"
              maxLength="7"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                let formatted = value;
                if (value.length >= 6) {
                  formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                } else if (value.length >= 3) {
                  formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                }
                setFormData(prev => ({ ...prev, phoneNumber: formatted }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(555) 123-4567"
              maxLength="14"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// State Transition Modal Component
const StateTransitionModal = ({ selectedTicket, newStatus, stagingZones, onClose, onConfirm, loading }) => {
  // Check if summoning and if staging zones are available
  const isSummoning = newStatus === QUEUE_STATUS.SUMMONED;
  const availableZones = Object.entries(stagingZones || {}).filter(([_, zone]) => zone.status === 'available');
  const canSummon = !isSummoning || availableZones.length > 0;

  const getTitle = () => {
    if (isSummoning) return 'Summon Driver?';
    if (newStatus === QUEUE_STATUS.COMPLETED) return 'Mark as Resolved?';
    if (newStatus === QUEUE_STATUS.QUEUED) return 'Move Back to Queue?';
    return 'Update Status?';
  };

  const getMessage = () => {
    if (isSummoning) {
      return `Summon PO ${selectedTicket?.poNumber}? They will be assigned to an available staging zone.`;
    }
    if (newStatus === QUEUE_STATUS.COMPLETED) {
      return `Mark PO ${selectedTicket?.poNumber} as resolved? They have completed loading.`;
    }
    if (newStatus === QUEUE_STATUS.QUEUED) {
      return `Move PO ${selectedTicket?.poNumber} back to the queue?`;
    }
    return `Update status for PO ${selectedTicket?.poNumber}?`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-800">
            {getTitle()}
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">
            {getMessage()}
          </p>
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
            disabled={loading || !canSummon}
            className={`flex-1 font-medium py-3 rounded-lg transition-colors ${
              !canSummon 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isSummoning
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : newStatus === QUEUE_STATUS.COMPLETED
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                Updating...
              </>
            ) : (
              'Confirm'
            )}
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

  const useShippingAdminDemo = () => {
    setFormData({ email: 'shipping@omega.com', password: 'shipping123' });
  };

  const useOrderDeskAdminDemo = () => {
    setFormData({ email: 'orders@omega.com', password: 'orders123' });
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

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={useShippingAdminDemo}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 rounded-lg transition-colors text-sm"
            >
              Shipping Admin Demo
            </button>
            <button
              type="button"
              onClick={useOrderDeskAdminDemo}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-3 rounded-lg transition-colors text-sm"
            >
              Order Desk Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Dashboard Component
const AdminDashboard = ({ userRole }) => {
  const [view, setView] = useState('dashboard');
  const [queue, setQueue] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateTransitionModal, setStateTransitionModal] = useState({ show: false, ticket: null, newStatus: null, loading: false });
  const [poValidationModal, setPOValidationModal] = useState({ show: false, ticket: null });
  const [manualTicketModal, setManualTicketModal] = useState({ show: false });
  
  // Staging zones state (2 zones as per spec)
  const [stagingZones, setStagingZones] = useState({
    zone1: { ticket: null, status: 'available' }, // available, pending, occupied
    zone2: { ticket: null, status: 'available' }
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
          
          // Update staging zones based on summoned tickets
          const summonedTickets = queueData.filter(ticket => ticket.status === QUEUE_STATUS.SUMMONED);
          setStagingZones(prev => {
            const newZones = { ...prev };
            
            // Clear zones that no longer have summoned tickets
            Object.keys(newZones).forEach(zoneKey => {
              const zone = newZones[zoneKey];
              if (zone.ticket) {
                const stillSummoned = summonedTickets.find(t => t.id === zone.ticket.id);
                if (!stillSummoned) {
                  newZones[zoneKey] = { ticket: null, status: 'available' };
                }
              }
            });
            
            // Assign new summoned tickets to available zones
            summonedTickets.forEach(ticket => {
              const alreadyAssigned = Object.values(newZones).some(zone => 
                zone.ticket && zone.ticket.id === ticket.id
              );
              
              if (!alreadyAssigned) {
                const availableZone = Object.keys(newZones).find(zoneKey => 
                  newZones[zoneKey].status === 'available'
                );
                
                if (availableZone) {
                  newZones[availableZone] = {
                    ticket: ticket,
                    status: 'pending'
                  };
                }
              }
            });
            
            return newZones;
          });
          
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
      setStateTransitionModal(prev => ({ ...prev, loading: true }));
      await adminQueueService.updateQueueStatus(ticketId, newStatus);
      setStateTransitionModal({ show: false, ticket: null, newStatus: null, loading: false });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
      setStateTransitionModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openStateTransitionModal = (ticket, newStatus) => {
    setStateTransitionModal({ show: true, ticket, newStatus });
  };

  const closeStateTransitionModal = () => {
    setStateTransitionModal({ show: false, ticket: null, newStatus: null, loading: false });
  };

  const handlePOValidation = async (queueId, isValid, reason) => {
    try {
      await adminQueueService.validatePO(queueId, isValid, reason);
      setPOValidationModal({ show: false, ticket: null });
    } catch (error) {
      console.error('Error validating PO:', error);
      alert('Failed to validate PO');
    }
  };

  const handleCreateManualTicket = async (ticketData) => {
    try {
      await adminQueueService.createManualTicket(ticketData);
      setManualTicketModal({ show: false });
    } catch (error) {
      console.error('Error creating manual ticket:', error);
      alert('Failed to create manual ticket');
    }
  };

  const handleQueueReorder = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const queuedTickets = queue.filter(q => q.status === QUEUE_STATUS.QUEUED).sort((a, b) => a.position - b.position);
      const oldIndex = queuedTickets.findIndex(ticket => ticket.id === active.id);
      const newIndex = queuedTickets.findIndex(ticket => ticket.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(queuedTickets, oldIndex, newIndex);
        
        // Update positions locally for immediate feedback
        const updatedQueue = queue.map(ticket => {
          if (ticket.status === QUEUE_STATUS.QUEUED) {
            const newPosition = newOrder.findIndex(t => t.id === ticket.id) + 1;
            return { ...ticket, position: newPosition };
          }
          return ticket;
        });
        setQueue(updatedQueue);

        // Update positions in Firebase
        try {
          await Promise.all(
            newOrder.map((ticket, index) =>
              adminQueueService.updateQueuePosition(ticket.id, index + 1)
            )
          );
        } catch (error) {
          console.error('Error updating queue order:', error);
          // Revert local changes on error
          const revertedQueue = queue.map(ticket => {
            const originalTicket = queuedTickets.find(t => t.id === ticket.id);
            return originalTicket ? { ...ticket, position: originalTicket.position } : ticket;
          });
          setQueue(revertedQueue);
          alert('Failed to update queue order');
        }
      }
    }
  };

  const handleDriverArrival = (zoneId) => {
    setStagingZones(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        status: 'occupied'
      }
    }));
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

      {poValidationModal.show && (
        <POValidationModal
          selectedTicket={poValidationModal.ticket}
          onClose={() => setPOValidationModal({ show: false, ticket: null })}
          onConfirm={handlePOValidation}
        />
      )}

      {manualTicketModal.show && (
        <ManualTicketModal
          onClose={() => setManualTicketModal({ show: false })}
          onConfirm={handleCreateManualTicket}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {userRole === ADMIN_ROLES.SHIPPING_ADMIN ? 'Shipping Admin Portal' : 'Order Desk Admin Portal'}
              </h1>
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
                  {userRole === ADMIN_ROLES.SHIPPING_ADMIN ? 'Queue Management' : 'PO Management'}
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
              
              {userRole === ADMIN_ROLES.ORDER_DESK_ADMIN && (
                <button
                  onClick={() => setManualTicketModal({ show: true })}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  Create Ticket
                </button>
              )}
              
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
        {view === 'dashboard' && userRole === ADMIN_ROLES.SHIPPING_ADMIN && (
          <div className="space-y-6">
            {/* Staging Zones - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Staging Zone 1 */}
              <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                stagingZones.zone1.status === 'occupied' 
                  ? 'border-l-4 border-red-500'
                  : stagingZones.zone1.status === 'pending'
                  ? 'border-l-4 border-yellow-500'
                  : 'border-l-4 border-green-500'
              }`}>
                <div className={`px-4 py-3 ${
                  stagingZones.zone1.status === 'occupied' 
                    ? 'bg-red-50'
                    : stagingZones.zone1.status === 'pending'
                    ? 'bg-yellow-50'
                    : 'bg-green-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        stagingZones.zone1.status === 'occupied' 
                          ? 'bg-red-500'
                          : stagingZones.zone1.status === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}></div>
                      <h3 className="font-bold text-gray-800">Staging Zone 1</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      stagingZones.zone1.status === 'occupied' 
                        ? 'bg-red-200 text-red-800'
                        : stagingZones.zone1.status === 'pending'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {stagingZones.zone1.status === 'occupied' 
                        ? 'Occupied'
                        : stagingZones.zone1.status === 'pending'
                        ? 'Pending'
                        : 'Available'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 min-h-[120px]">
                  {stagingZones.zone1.ticket ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {stagingZones.zone1.ticket.poNumber}
                          </span>
                          <div className="flex items-center gap-1">
                            {stagingZones.zone1.ticket.poValidated === true ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-600 font-medium">Valid</span>
                              </>
                            ) : stagingZones.zone1.ticket.poValidated === false ? (
                              <>
                                <XCircle className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-red-600 font-medium">Invalid</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-yellow-600 font-medium">Pending Validation</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatRelativeTime(stagingZones.zone1.ticket.joinedAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{stagingZones.zone1.ticket.confirmCode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {stagingZones.zone1.ticket.type === 'pickup' ? (
                              <Package className="w-3 h-3 text-blue-600" />
                            ) : (
                              <ArrowDownToLine className="w-3 h-3 text-green-600" />
                            )}
                            <span className="text-xs text-gray-600 capitalize">{stagingZones.zone1.ticket.type || 'pickup'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {stagingZones.zone1.status === 'pending' ? (
                          <button
                            onClick={() => handleDriverArrival('zone1')}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 rounded-md transition-colors"
                          >
                            ✓ Mark Occupied
                          </button>
                        ) : stagingZones.zone1.status === 'occupied' ? (
                          <button
                            onClick={() => openStateTransitionModal(stagingZones.zone1.ticket, QUEUE_STATUS.COMPLETED)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2 rounded-md transition-colors"
                          >
                            Complete →
                          </button>
                        ) : null}
                        <button
                          onClick={() => openStateTransitionModal(stagingZones.zone1.ticket, QUEUE_STATUS.QUEUED)}
                          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white text-xs font-medium py-2 rounded-md transition-colors"
                        >
                          ← Move Back to Queue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="bg-green-100 rounded-full p-3 mb-3">
                        <Truck className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Zone Available</h4>
                      <p className="text-xs text-gray-500">Ready for next driver</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Staging Zone 2 */}
              <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                stagingZones.zone2.status === 'occupied' 
                  ? 'border-l-4 border-red-500'
                  : stagingZones.zone2.status === 'pending'
                  ? 'border-l-4 border-yellow-500'
                  : 'border-l-4 border-green-500'
              }`}>
                <div className={`px-4 py-3 ${
                  stagingZones.zone2.status === 'occupied' 
                    ? 'bg-red-50'
                    : stagingZones.zone2.status === 'pending'
                    ? 'bg-yellow-50'
                    : 'bg-green-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        stagingZones.zone2.status === 'occupied' 
                          ? 'bg-red-500'
                          : stagingZones.zone2.status === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}></div>
                      <h3 className="font-bold text-gray-800">Staging Zone 2</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      stagingZones.zone2.status === 'occupied' 
                        ? 'bg-red-200 text-red-800'
                        : stagingZones.zone2.status === 'pending'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {stagingZones.zone2.status === 'occupied' 
                        ? 'Occupied'
                        : stagingZones.zone2.status === 'pending'
                        ? 'Pending'
                        : 'Available'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 min-h-[120px]">
                  {stagingZones.zone2.ticket ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {stagingZones.zone2.ticket.poNumber}
                          </span>
                          <div className="flex items-center gap-1">
                            {stagingZones.zone2.ticket.poValidated === true ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-600 font-medium">Valid</span>
                              </>
                            ) : stagingZones.zone2.ticket.poValidated === false ? (
                              <>
                                <XCircle className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-red-600 font-medium">Invalid</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-yellow-600 font-medium">Pending Validation</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatRelativeTime(stagingZones.zone2.ticket.joinedAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{stagingZones.zone2.ticket.confirmCode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {stagingZones.zone2.ticket.type === 'pickup' ? (
                              <Package className="w-3 h-3 text-blue-600" />
                            ) : (
                              <ArrowDownToLine className="w-3 h-3 text-green-600" />
                            )}
                            <span className="text-xs text-gray-600 capitalize">{stagingZones.zone2.ticket.type || 'pickup'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {stagingZones.zone2.status === 'pending' ? (
                          <button
                            onClick={() => handleDriverArrival('zone2')}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 rounded-md transition-colors"
                          >
                            ✓ Mark Occupied
                          </button>
                        ) : stagingZones.zone2.status === 'occupied' ? (
                          <button
                            onClick={() => openStateTransitionModal(stagingZones.zone2.ticket, QUEUE_STATUS.COMPLETED)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2 rounded-md transition-colors"
                          >
                            Complete →
                          </button>
                        ) : null}
                        <button
                          onClick={() => openStateTransitionModal(stagingZones.zone2.ticket, QUEUE_STATUS.QUEUED)}
                          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white text-xs font-medium py-2 rounded-md transition-colors"
                        >
                          ← Move Back to Queue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="bg-green-100 rounded-full p-3 mb-3">
                        <Truck className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Zone Available</h4>
                      <p className="text-xs text-gray-500">Ready for next driver</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Queue Section - Full Width Drag & Drop Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Queue ({queue.filter(q => q.status === QUEUE_STATUS.QUEUED).length})
                  </h3>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {queue.filter(q => q.status === QUEUE_STATUS.QUEUED).length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No drivers in queue</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleQueueReorder}
                    >
                      <table className="min-w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PO Number
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Validation Status
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <SortableContext
                            items={queue.filter(q => q.status === QUEUE_STATUS.QUEUED).sort((a, b) => a.position - b.position).map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {queue
                              .filter(q => q.status === QUEUE_STATUS.QUEUED)
                              .sort((a, b) => a.position - b.position)
                              .map((ticket) => (
                                <SortableQueueRow
                                  key={ticket.id}
                                  ticket={ticket}
                                  stagingZones={stagingZones}
                                  onSummon={(ticket) => openStateTransitionModal(ticket, QUEUE_STATUS.SUMMONED)}
                                />
                              ))}
                          </SortableContext>
                        </tbody>
                      </table>
                    </DndContext>
                  )}
                </div>
              </div>

          </div>
        )}

        {view === 'dashboard' && userRole === ADMIN_ROLES.ORDER_DESK_ADMIN && (
          <div className="space-y-6">
            {/* Today's Tickets */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Today's Tickets</h2>
              </div>
              
              <div className="overflow-hidden">
                {queue.filter(ticket => 
                  new Date(ticket.joinedAt).toDateString() === new Date().toDateString()
                ).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tickets today</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PO Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PO Validation
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {queue
                          .filter(ticket => 
                            new Date(ticket.joinedAt).toDateString() === new Date().toDateString()
                          )
                          .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
                          .map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{formatRelativeTime(ticket.joinedAt)}</div>
                                <div className="text-xs text-gray-500">{new Date(ticket.joinedAt).toLocaleTimeString()}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{ticket.poNumber}</span>
                                {ticket.createdByAdmin && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    Manual
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ticket.phoneNumber || ticket.confirmCode}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {(() => {
                                  // Get the type value from any available field
                                  const typeValue = ticket.type || ticket.orderType || ticket.deliveryType || '';
                                  const normalizedType = typeValue.toLowerCase().trim();
                                  
                                  if (normalizedType === 'pickup' || normalizedType.includes('pickup')) {
                                    return (
                                      <>
                                        <Package className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-gray-900 capitalize">Pickup</span>
                                      </>
                                    );
                                  } else if (normalizedType === 'delivery' || normalizedType.includes('delivery')) {
                                    return (
                                      <>
                                        <ArrowDownToLine className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-900 capitalize">Delivery</span>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <span className="text-sm text-gray-400">
                                        {typeValue || 'Not specified'}
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {ticket.poValidated !== undefined ? (
                                <div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    ticket.poValidated 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {ticket.poValidated ? '✓ Valid' : '✗ Invalid'}
                                  </span>
                                  {ticket.poValidationReason && (
                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={ticket.poValidationReason}>
                                      {ticket.poValidationReason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Not validated</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {ticket.poValidated === undefined && (
                                <button
                                  onClick={() => setPOValidationModal({ show: true, ticket })}
                                  className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors"
                                >
                                  Validate
                                </button>
                              )}
                              {ticket.poValidated === false && (
                                <button
                                  onClick={() => setPOValidationModal({ show: true, ticket })}
                                  className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors"
                                >
                                  Update
                                </button>
                              )}
                              {ticket.poValidated === true && (
                                <button
                                  onClick={() => setPOValidationModal({ show: true, ticket })}
                                  className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors"
                                >
                                  Update
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Days' Tickets */}
            {queue.filter(ticket => 
              new Date(ticket.joinedAt).toDateString() !== new Date().toDateString()
            ).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Previous Days' Tickets</h2>
                  <p className="text-gray-100 text-sm">Historical tickets from previous days</p>
                </div>
                
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PO Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PO Validation
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {queue
                          .filter(ticket => 
                            new Date(ticket.joinedAt).toDateString() !== new Date().toDateString()
                          )
                          .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
                          .map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{formatRelativeTime(ticket.joinedAt)}</div>
                                <div className="text-xs text-gray-500">{new Date(ticket.joinedAt).toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{ticket.poNumber}</span>
                                {ticket.createdByAdmin && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    Manual
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ticket.phoneNumber || ticket.confirmCode}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {(() => {
                                  // Get the type value from any available field
                                  const typeValue = ticket.type || ticket.orderType || ticket.deliveryType || '';
                                  const normalizedType = typeValue.toLowerCase().trim();
                                  
                                  if (normalizedType === 'pickup' || normalizedType.includes('pickup')) {
                                    return (
                                      <>
                                        <Package className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-gray-900 capitalize">Pickup</span>
                                      </>
                                    );
                                  } else if (normalizedType === 'delivery' || normalizedType.includes('delivery')) {
                                    return (
                                      <>
                                        <ArrowDownToLine className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-900 capitalize">Delivery</span>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <span className="text-sm text-gray-400">
                                        {typeValue || 'Not specified'}
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {ticket.poValidated !== undefined ? (
                                <div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    ticket.poValidated 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {ticket.poValidated ? '✓ Valid' : '✗ Invalid'}
                                  </span>
                                  {ticket.poValidationReason && (
                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={ticket.poValidationReason}>
                                      {ticket.poValidationReason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Not validated</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {ticket.poValidated === undefined && (
                                <button
                                  onClick={() => setPOValidationModal({ show: true, ticket })}
                                  className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors"
                                >
                                  Validate
                                </button>
                              )}
                              {ticket.poValidated === false && (
                                <button
                                  onClick={() => setPOValidationModal({ show: true, ticket })}
                                  className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors"
                                >
                                  Update
                                </button>
                              )}
                              {ticket.poValidated === true && (
                                <button
                                  onClick={() => setPOValidationModal({ show: true, ticket })}
                                  className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors"
                                >
                                  Update
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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

        {/* Modals */}
        {stateTransitionModal.show && (
          <StateTransitionModal
            selectedTicket={stateTransitionModal.ticket}
            newStatus={stateTransitionModal.newStatus}
            stagingZones={stagingZones}
            onClose={closeStateTransitionModal}
            onConfirm={handleStatusUpdate}
            loading={stateTransitionModal.loading}
          />
        )}

        {poValidationModal.show && (
          <POValidationModal
            selectedTicket={poValidationModal.ticket}
            onClose={() => setPOValidationModal({ show: false, ticket: null })}
            onConfirm={handlePOValidation}
          />
        )}

        {manualTicketModal.show && (
          <ManualTicketModal
            onClose={() => setManualTicketModal({ show: false })}
            onConfirm={handleCreateManualTicket}
          />
        )}
      </div>
    </div>
  );
};


// Main Admin App Component
const AdminApp = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth state listener
  useEffect(() => {
    const unsubscribe = adminAuthService.onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user ? user.email : 'signed out');
      
      if (user) {
        try {
          const profile = await adminAuthService.getUserProfile(user.uid);
          console.log('User profile:', profile);
          
          if (profile && Object.values(ADMIN_ROLES).includes(profile.role)) {
            setUser(user);
            setUserProfile(profile);
            setError('');
          } else {
            console.log('User is not an admin or profile not found');
            setError('Access denied. Admin account required.');
            setLoginLoading(false); // Reset login loading on access denied
            await adminAuthService.signOut();
          }
        } catch (error) {
          console.error('Error getting user profile:', error);
          setError('Failed to verify admin access. Please try again.');
          setLoginLoading(false); // Reset login loading on auth error
          await adminAuthService.signOut();
        }
      } else {
        setUser(null);
        setUserProfile(null);
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

  return <AdminDashboard userRole={userProfile?.role} />;
};




export default AdminApp;