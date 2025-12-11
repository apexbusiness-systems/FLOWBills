/**
 * Comprehensive Data Persistence Layer
 * Handles localStorage, sessionStorage, IndexedDB, and cache management
 */

import { queryOptimizer } from './query-optimizer';

// ============= Form Draft Persistence =============

export interface FormDraft<T = any> {
  formId: string;
  data: T;
  timestamp: number;
  userId?: string;
}

export const FormPersistence = {
  saveDraft<T>(formId: string, data: T, userId?: string): void {
    const draft: FormDraft<T> = {
      formId,
      data,
      timestamp: Date.now(),
      userId,
    };
    
    try {
      localStorage.setItem(`form_draft_${formId}`, JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save form draft:', error);
    }
  },

  loadDraft<T>(formId: string, userId?: string): T | null {
    try {
      const stored = localStorage.getItem(`form_draft_${formId}`);
      if (!stored) return null;

      const draft: FormDraft<T> = JSON.parse(stored);
      
      // Verify userId matches if provided
      if (userId && draft.userId && draft.userId !== userId) {
        this.clearDraft(formId);
        return null;
      }

      // Auto-expire drafts older than 7 days
      const age = Date.now() - draft.timestamp;
      if (age > 7 * 24 * 60 * 60 * 1000) {
        this.clearDraft(formId);
        return null;
      }

      return draft.data;
    } catch (error) {
      console.warn('Failed to load form draft:', error);
      return null;
    }
  },

  clearDraft(formId: string): void {
    try {
      localStorage.removeItem(`form_draft_${formId}`);
    } catch (error) {
      console.warn('Failed to clear form draft:', error);
    }
  },

  getAllDrafts(): FormDraft[] {
    const drafts: FormDraft[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('form_draft_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            drafts.push(JSON.parse(stored));
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get all drafts:', error);
    }

    return drafts;
  },

  clearExpiredDrafts(): number {
    let cleared = 0;
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000;

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('form_draft_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draft: FormDraft = JSON.parse(stored);
            if (now - draft.timestamp > maxAge) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear expired drafts:', error);
    }

    return cleared;
  },
};

// ============= Session Recovery =============

export interface SessionState {
  route?: string;
  scrollPosition?: number;
  activeTab?: string;
  filters?: Record<string, any>;
  timestamp: number;
}

export const SessionRecovery = {
  saveState(state: Omit<SessionState, 'timestamp'>): void {
    try {
      const fullState: SessionState = {
        ...state,
        timestamp: Date.now(),
      };
      sessionStorage.setItem('app_session_state', JSON.stringify(fullState));
    } catch (error) {
      console.warn('Failed to save session state:', error);
    }
  },

  loadState(): SessionState | null {
    try {
      const stored = sessionStorage.getItem('app_session_state');
      if (!stored) return null;

      const state: SessionState = JSON.parse(stored);
      
      // Auto-expire after 1 hour
      if (Date.now() - state.timestamp > 60 * 60 * 1000) {
        this.clearState();
        return null;
      }

      return state;
    } catch (error) {
      console.warn('Failed to load session state:', error);
      return null;
    }
  },

  clearState(): void {
    try {
      sessionStorage.removeItem('app_session_state');
    } catch (error) {
      console.warn('Failed to clear session state:', error);
    }
  },
};

// ============= Offline Queue =============

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export const OfflineQueue = {
  enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): string {
    const op: QueuedOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
      maxRetries: operation.maxRetries || 3,
    };

    try {
      const queue = this.getQueue();
      queue.push(op);
      localStorage.setItem('offline_queue', JSON.stringify(queue));
      return op.id;
    } catch (error) {
      console.error('Failed to enqueue operation:', error);
      throw error;
    }
  },

  getQueue(): QueuedOperation[] {
    try {
      const stored = localStorage.getItem('offline_queue');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to get offline queue:', error);
      return [];
    }
  },

  dequeue(id: string): void {
    try {
      const queue = this.getQueue().filter(op => op.id !== id);
      localStorage.setItem('offline_queue', JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to dequeue operation:', error);
    }
  },

  incrementRetry(id: string): void {
    try {
      const queue = this.getQueue();
      const op = queue.find(o => o.id === id);
      if (op) {
        op.retries++;
        localStorage.setItem('offline_queue', JSON.stringify(queue));
      }
    } catch (error) {
      console.warn('Failed to increment retry:', error);
    }
  },

  clearQueue(): void {
    try {
      localStorage.removeItem('offline_queue');
    } catch (error) {
      console.warn('Failed to clear queue:', error);
    }
  },

  size(): number {
    return this.getQueue().length;
  },
};

// ============= Cache Management =============

export const CacheManager = {
  async clearAllCaches(): Promise<void> {
    // Clear query cache
    queryOptimizer.clearCache();
    
    // Clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  },

  async getCacheSize(): Promise<number> {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.warn('Failed to estimate cache size:', error);
      return 0;
    }
  },

  getLocalStorageSize(): number {
    let size = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          size += key.length + (value?.length || 0);
        }
      }
    } catch (error) {
      console.warn('Failed to get localStorage size:', error);
    }
    return size;
  },
};

// ============= Periodic Cleanup =============

export function startPersistenceCleanup(): void {
  // Clean expired drafts on startup
  FormPersistence.clearExpiredDrafts();

  // Schedule periodic cleanup (every 6 hours)
  setInterval(() => {
    const cleared = FormPersistence.clearExpiredDrafts();
    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired form drafts`);
    }
  }, 6 * 60 * 60 * 1000);
}

// ============= Export All =============

export const persistence = {
  form: FormPersistence,
  session: SessionRecovery,
  offline: OfflineQueue,
  cache: CacheManager,
  startCleanup: startPersistenceCleanup,
};
