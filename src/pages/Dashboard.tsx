import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Layout, FileText, DollarSign, MapPin, BarChart3 } from 'lucide-react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { DashboardConfigPanel } from '@/components/dashboard/DashboardConfigPanel';
import { StatsWidget } from '@/components/dashboard/widgets/StatsWidget';
import { ActivityWidget } from '@/components/dashboard/widgets/ActivityWidget';
import { UploadWidget } from '@/components/dashboard/widgets/UploadWidget';
import { ChartWidget } from '@/components/dashboard/widgets/ChartWidget';
import { SupportChat } from '@/components/support/SupportChat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSupportMinimized, setIsSupportMinimized] = useState(true);
  const {
    widgets,
    visibleWidgets,
    isConfigMode,
    setIsConfigMode,
    toggleWidget,
    reorderWidgets,
    resetLayout,
  } = useDashboardLayout();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(visibleWidgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderWidgets(items);
    toast.success('Layout updated');
  };

  const renderWidget = (widget: any) => {
    switch (widget.type) {
      case 'stats':
        return <StatsWidget title={widget.title} size={widget.size} />;
      case 'activity':
        return <ActivityWidget size={widget.size} />;
      case 'upload':
        return <UploadWidget size={widget.size} />;
      case 'chart':
        return <ChartWidget title={widget.title} size={widget.size} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <BreadcrumbNav className="mb-4" />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Customize your view by dragging widgets or configuring visibility
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isConfigMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsConfigMode(!isConfigMode)}
            aria-label={isConfigMode ? 'Exit edit mode' : 'Enter edit mode'}
          >
            <Layout className="h-4 w-4 mr-2" aria-hidden="true" />
            {isConfigMode ? 'Done' : 'Edit Layout'}
          </Button>
          <DashboardConfigPanel
            widgets={widgets}
            onToggleWidget={toggleWidget}
            onResetLayout={resetLayout}
          />
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/afe-management')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AFE Management</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Manage AFEs and track budgets</CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/field-tickets')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Tickets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Verify and link field tickets</CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/uwi-registry')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UWI Registry</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Manage well identifiers</CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/reports')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports & Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>View comprehensive reports</CardDescription>
          </CardContent>
        </Card>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-widgets" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {visibleWidgets.map((widget, index) => (
                <Draggable
                  key={widget.id}
                  draggableId={widget.id}
                  index={index}
                  isDragDisabled={!isConfigMode}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        'relative transition-all',
                        snapshot.isDragging && 'z-50 rotate-2 scale-105',
                        isConfigMode && 'ring-2 ring-primary/20 rounded-lg'
                      )}
                    >
                      {isConfigMode && (
                        <div
                          {...provided.dragHandleProps}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center h-6 w-16 bg-primary text-primary-foreground rounded-full cursor-grab active:cursor-grabbing shadow-lg"
                          aria-label="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4" aria-hidden="true" />
                        </div>
                      )}
                      {renderWidget(widget)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {visibleWidgets.length === 0 && (
        <div className="text-center py-16">
          <Layout className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold mb-2">No Widgets Visible</h3>
          <p className="text-muted-foreground mb-4">
            Enable some widgets to customize your dashboard
          </p>
          <Button onClick={resetLayout}>Reset to Default Layout</Button>
        </div>
      )}

      <SupportChat 
        isMinimized={isSupportMinimized} 
        onMinimize={() => setIsSupportMinimized(!isSupportMinimized)} 
      />
    </div>
  );
}
