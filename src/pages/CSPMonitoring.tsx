import { CSPDashboard } from '@/components/security/CSPDashboard';

const CSPMonitoring = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Content Security Policy Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Real-time CSP violation reports and analytics
        </p>
      </div>
      <CSPDashboard />
    </div>
  );
};

export default CSPMonitoring;
