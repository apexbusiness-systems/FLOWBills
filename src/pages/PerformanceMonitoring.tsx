import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const PerformanceMonitoring = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <PerformanceDashboard />
    </div>
  );
};

export default PerformanceMonitoring;
