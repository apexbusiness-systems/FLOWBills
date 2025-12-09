import { useState } from "react";
import { useIntegrations, Integration } from "@/hooks/useIntegrations";
import IntegrationList from "./IntegrationList";
import CreateIntegrationDialog from "./CreateIntegrationDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const IntegrationManager = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    integrations,
    loading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    syncIntegration,
  } = useIntegrations();

  const handleCreate = async (integrationData: {
    integration_name: string;
    integration_type: string;
    config: Record<string, any>;
  }) => {
    const success = await createIntegration(integrationData);
    if (success) {
      setCreateDialogOpen(false);
    }
  };

  const handleTest = async (integrationId: string) => {
    await testConnection(integrationId);
  };

  const handleSync = async (integrationId: string) => {
    await syncIntegration(integrationId);
  };

  const handleToggleStatus = async (integration: Integration) => {
    const newStatus = integration.status === "connected" ? "disconnected" : "connected";
    await updateIntegration(integration.id, { status: newStatus });
  };

  const handleDelete = async (integrationId: string) => {
    await deleteIntegration(integrationId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integration Management</h2>
          <p className="text-muted-foreground">Manage NOV and third-party system integrations</p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Integration
        </Button>
      </div>

      <IntegrationList
        integrations={integrations}
        loading={loading}
        onTest={handleTest}
        onSync={handleSync}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      <CreateIntegrationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default IntegrationManager;
