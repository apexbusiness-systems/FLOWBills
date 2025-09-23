import { useAuth } from '@/hooks/useAuth';
import InvoiceManager from '@/components/invoices/InvoiceManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const Invoices = () => {
  return (
    <ProtectedRoute requiredRole="viewer">
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        <main className="container mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Invoice Management
            </h1>
            <p className="text-muted-foreground">
              Create, manage, and track invoice records for your oil & gas operations
            </p>
          </div>
          
          <InvoiceManager />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Invoices;