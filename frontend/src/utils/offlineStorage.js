import Dexie from 'dexie';

// Initialize IndexedDB for offline storage
const db = new Dexie('RuralTelemedicineDB');

db.version(1).stores({
  healthRecords: '++id, patientId, doctorId, symptoms, diagnosis, prescriptions, createdAt, synced',
  medicines: '++id, name, category, stockQuantity, price, lastUpdated',
  consultations: '++id, patientId, doctorId, status, symptoms, createdAt, synced',
  userProfile: '++id, userId, data, lastUpdated',
  syncQueue: '++id, type, data, timestamp, retryCount'
});

// Initialize offline storage
export const initOfflineStorage = async () => {
  try {
    await db.open();
    console.log('Offline storage initialized');
  } catch (error) {
    console.error('Failed to initialize offline storage:', error);
  }
};

// Health Records offline functions
export const saveHealthRecordOffline = async (record) => {
  try {
    const recordWithSync = {
      ...record,
      synced: false,
      createdAt: new Date()
    };
    await db.healthRecords.add(recordWithSync);
    
    // Add to sync queue
    await addToSyncQueue('healthRecord', recordWithSync);
    
    return recordWithSync;
  } catch (error) {
    console.error('Failed to save health record offline:', error);
    throw error;
  }
};

export const getHealthRecordsOffline = async (patientId) => {
  try {
    const records = await db.healthRecords
      .where('patientId')
      .equals(patientId)
      .reverse()
      .sortBy('createdAt');
    return records;
  } catch (error) {
    console.error('Failed to get health records offline:', error);
    return [];
  }
};

// Medicine inventory offline functions
export const saveMedicinesOffline = async (medicines) => {
  try {
    const medicinesWithTimestamp = medicines.map(med => ({
      ...med,
      lastUpdated: new Date()
    }));
    
    await db.medicines.clear();
    await db.medicines.bulkAdd(medicinesWithTimestamp);
    
    return medicinesWithTimestamp;
  } catch (error) {
    console.error('Failed to save medicines offline:', error);
    throw error;
  }
};

export const getMedicinesOffline = async () => {
  try {
    const medicines = await db.medicines.toArray();
    return medicines;
  } catch (error) {
    console.error('Failed to get medicines offline:', error);
    return [];
  }
};

// Consultation offline functions
export const saveConsultationOffline = async (consultation) => {
  try {
    const consultationWithSync = {
      ...consultation,
      synced: false,
      createdAt: new Date()
    };
    await db.consultations.add(consultationWithSync);
    
    // Add to sync queue
    await addToSyncQueue('consultation', consultationWithSync);
    
    return consultationWithSync;
  } catch (error) {
    console.error('Failed to save consultation offline:', error);
    throw error;
  }
};

export const getConsultationsOffline = async (patientId) => {
  try {
    const consultations = await db.consultations
      .where('patientId')
      .equals(patientId)
      .reverse()
      .sortBy('createdAt');
    return consultations;
  } catch (error) {
    console.error('Failed to get consultations offline:', error);
    return [];
  }
};

// User profile offline functions
export const saveUserProfileOffline = async (userId, profileData) => {
  try {
    const profile = {
      userId,
      data: profileData,
      lastUpdated: new Date()
    };
    
    await db.userProfile.put(profile);
    return profile;
  } catch (error) {
    console.error('Failed to save user profile offline:', error);
    throw error;
  }
};

export const getUserProfileOffline = async (userId) => {
  try {
    const profile = await db.userProfile.where('userId').equals(userId).first();
    return profile ? profile.data : null;
  } catch (error) {
    console.error('Failed to get user profile offline:', error);
    return null;
  }
};

// Sync queue functions
export const addToSyncQueue = async (type, data) => {
  try {
    const queueItem = {
      type,
      data,
      timestamp: new Date(),
      retryCount: 0
    };
    await db.syncQueue.add(queueItem);
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
  }
};

export const getSyncQueue = async () => {
  try {
    const queue = await db.syncQueue.orderBy('timestamp').toArray();
    return queue;
  } catch (error) {
    console.error('Failed to get sync queue:', error);
    return [];
  }
};

export const removeSyncQueueItem = async (id) => {
  try {
    await db.syncQueue.delete(id);
  } catch (error) {
    console.error('Failed to remove sync queue item:', error);
  }
};

export const updateSyncQueueRetry = async (id, retryCount) => {
  try {
    await db.syncQueue.update(id, { retryCount });
  } catch (error) {
    console.error('Failed to update sync queue retry count:', error);
  }
};

// Sync functions
export const syncOfflineData = async () => {
  if (!navigator.onLine) {
    console.log('Cannot sync - offline');
    return;
  }

  try {
    const queue = await getSyncQueue();
    
    for (const item of queue) {
      try {
        await syncItem(item);
        await removeSyncQueueItem(item.id);
      } catch (error) {
        console.error('Failed to sync item:', error);
        await updateSyncQueueRetry(item.id, item.retryCount + 1);
        
        // Remove items that have failed too many times
        if (item.retryCount >= 3) {
          await removeSyncQueueItem(item.id);
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync offline data:', error);
  }
};

const syncItem = async (item) => {
  const { type, data } = item;
  
  switch (type) {
    case 'healthRecord':
      // Sync health record to server
      const response = await fetch('/records/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync health record');
      }
      
      // Mark as synced in local storage
      await db.healthRecords.update(data.id, { synced: true });
      break;
      
    case 'consultation':
      // Sync consultation to server
      const consultResponse = await fetch('/queues/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!consultResponse.ok) {
        throw new Error('Failed to sync consultation');
      }
      
      // Mark as synced in local storage
      await db.consultations.update(data.id, { synced: true });
      break;
      
    default:
      console.warn('Unknown sync type:', type);
  }
};

// Clear offline data
export const clearOfflineData = async () => {
  try {
    await db.healthRecords.clear();
    await db.medicines.clear();
    await db.consultations.clear();
    await db.userProfile.clear();
    await db.syncQueue.clear();
    console.log('Offline data cleared');
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
};

// Check if data is stale
export const isDataStale = (lastUpdated, maxAgeMinutes = 60) => {
  if (!lastUpdated) return true;
  
  const now = new Date();
  const dataAge = (now - new Date(lastUpdated)) / (1000 * 60); // in minutes
  
  return dataAge > maxAgeMinutes;
};

// Auto-sync when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online - syncing data');
    syncOfflineData();
  });
}
