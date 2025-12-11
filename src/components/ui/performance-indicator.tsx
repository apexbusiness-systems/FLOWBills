import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { healthChecker, HealthCheckResult } from '@/lib/health-check';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

export const PerformanceIndicator: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleHealthCheck = (event: CustomEvent) => {
      setHealthStatus(event.detail as HealthCheckResult);
    };

    // Listen for health check events
    window.addEventListener('health-check', handleHealthCheck as EventListener);

    // Initial health check
    healthChecker.performHealthCheck().then(setHealthStatus);

    // Show indicator after a delay to avoid flash
    const timer = setTimeout(() => setIsVisible(true), 1000);

    return () => {
      window.removeEventListener('health-check', handleHealthCheck as EventListener);
      clearTimeout(timer);
    };
  }, []);

  if (!healthStatus || !isVisible) {
    return null;
  }

  const getStatusIcon = () => {
    switch (healthStatus.status) {
      case 'healthy':
        return <CheckCircle className="h-3 w-3" />;
      case 'degraded':
        return <AlertTriangle className="h-3 w-3" />;
      case 'unhealthy':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (healthStatus.status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTooltipContent = () => {
    const { checks, responseTime, timestamp } = healthStatus;
    const checkEntries = Object.entries(checks);
    const passedChecks = checkEntries.filter(([_, passed]) => passed).length;
    
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium">System Health</div>
        <div className="text-xs">
          {passedChecks}/{checkEntries.length} services operational
        </div>
        <div className="text-xs">Response: {responseTime}ms</div>
        <div className="space-y-1">
          {checkEntries.map(([service, isHealthy]) => (
            <div key={service} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="capitalize">{service}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Last check: {timestamp.toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={getStatusVariant()}
          className="gap-1 text-xs cursor-help animate-fade-in"
        >
          {getStatusIcon()}
          {healthStatus.status}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-48">
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
};