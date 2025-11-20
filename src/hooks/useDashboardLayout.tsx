import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface WidgetConfig {
  id: string;
  type: 'stats' | 'chart' | 'activity' | 'quickActions' | 'upload';
  title: string;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
  order: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stats-1', type: 'stats', title: 'Monthly Volume', visible: true, size: 'small', order: 0 },
  { id: 'stats-2', type: 'stats', title: 'Active Invoices', visible: true, size: 'small', order: 1 },
  { id: 'stats-3', type: 'stats', title: 'Processing Rate', visible: true, size: 'small', order: 2 },
  { id: 'stats-4', type: 'stats', title: 'Exception Queue', visible: true, size: 'small', order: 3 },
  { id: 'activity-1', type: 'activity', title: 'Recent Activity', visible: true, size: 'large', order: 4 },
  { id: 'upload-1', type: 'upload', title: 'Quick Upload', visible: true, size: 'medium', order: 5 },
];

const STORAGE_KEY = 'flowbills_dashboard_layout';

export const useDashboardLayout = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });

  const [isConfigMode, setIsConfigMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    toast.success('Widget updated');
  };

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const reorderWidgets = (newOrder: WidgetConfig[]) => {
    setWidgets(newOrder.map((w, idx) => ({ ...w, order: idx })));
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    toast.success('Layout reset to default');
  };

  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  return {
    widgets,
    visibleWidgets,
    isConfigMode,
    setIsConfigMode,
    updateWidget,
    toggleWidget,
    reorderWidgets,
    resetLayout,
  };
};
