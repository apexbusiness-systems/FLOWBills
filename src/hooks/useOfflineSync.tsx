import { useEffect, useState, useCallback } from 'react';
import { OfflineQueue, QueuedOperation } from '@/lib/persistence';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Changes will be synced when connection is restored.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Process queue when online
  const processQueue = useCallback(async () => {
    if (!isOnline || syncing) return;

    const queue = OfflineQueue.getQueue();
    if (queue.length === 0) {
      setQueueSize(0);
      return;
    }

    setSyncing(true);
    let processed = 0;
    let failed = 0;

    for (const operation of queue) {
      try {
        await processOperation(operation);
        OfflineQueue.dequeue(operation.id);
        processed++;
      } catch (error) {
        console.error('Failed to process operation:', error);
        
        if (operation.retries >= operation.maxRetries) {
          // Max retries reached, remove from queue
          OfflineQueue.dequeue(operation.id);
          failed++;
        } else {
          // Increment retry counter
          OfflineQueue.incrementRetry(operation.id);
        }
      }
    }

    setSyncing(false);
    setQueueSize(OfflineQueue.size());

    if (processed > 0) {
      toast({
        title: 'Sync Complete',
        description: `${processed} operation${processed > 1 ? 's' : ''} synced successfully.`,
      });
    }

    if (failed > 0) {
      toast({
        title: 'Sync Failed',
        description: `${failed} operation${failed > 1 ? 's' : ''} could not be synced after maximum retries.`,
        variant: 'destructive',
      });
    }
  }, [isOnline, syncing, toast]);

  // Process a single operation
  async function processOperation(op: QueuedOperation): Promise<void> {
    const { type, table, data } = op;

    switch (type) {
      case 'create':
        const { error: createError } = await supabase
          .from(table as any)
          .insert(data);
        if (createError) throw createError;
        break;

      case 'update':
        const { id, ...updateData } = data;
        const { error: updateError } = await supabase
          .from(table as any)
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(table as any)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  // Auto-sync when online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  // Update queue size periodically
  useEffect(() => {
    const updateSize = () => setQueueSize(OfflineQueue.size());
    updateSize();
    
    const interval = setInterval(updateSize, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    queueSize,
    syncing,
    processQueue,
  };
}
