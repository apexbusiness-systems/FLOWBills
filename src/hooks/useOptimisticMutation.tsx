import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { OfflineQueue } from "@/lib/persistence";

interface OptimisticMutationOptions<TData, TVariables> {
  queryKey: any[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  optimisticUpdater?: (oldData: any, variables: TVariables) => any;
  offlineSupport?: boolean;
  offlineTable?: string;
  offlineType?: "create" | "update" | "delete";
  successMessage?: string;
  errorMessage?: string;
  onError?: (error: Error, variables: TVariables, context: any) => void;
  onSuccess?: (data: TData, variables: TVariables, context: any) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: any
  ) => void;
}

export function useOptimisticMutation<TData = unknown, TVariables = unknown>(
  options: OptimisticMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<TData, Error, TVariables>({
    mutationFn: options.mutationFn,

    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(options.queryKey);

      // Optimistically update cache if updater provided
      if (options.optimisticUpdater) {
        queryClient.setQueryData(options.queryKey, (old: any) =>
          options.optimisticUpdater!(old, variables)
        );
      }

      // Queue for offline if needed
      if (options.offlineSupport && options.offlineTable && options.offlineType) {
        try {
          OfflineQueue.enqueue({
            type: options.offlineType,
            table: options.offlineTable,
            data: variables,
            maxRetries: 3,
          });
        } catch (error) {
          console.warn("Failed to queue offline operation:", error);
        }
      }

      return { previousData };
    },

    onError: (error, variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }

      toast({
        title: "Error",
        description: options.errorMessage || error.message || "Operation failed",
        variant: "destructive",
      });

      // Call original onError if provided
      options.onError?.(error, variables, context);
    },

    onSuccess: (data, variables, context: any) => {
      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        });
      }

      // Call original onSuccess if provided
      options.onSuccess?.(data, variables, context);
    },

    onSettled: (data, error, variables, context: any) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: options.queryKey });

      // Call original onSettled if provided
      options.onSettled?.(data, error, variables, context);
    },
  });
}
