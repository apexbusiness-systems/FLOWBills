import { AFEManager } from '@/components/afe/AFEManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const AFEManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <AFEManager />
      </main>
    </div>
  );
};

export default AFEManagement;
