import { Settings, X, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WidgetConfig } from "@/hooks/useDashboardLayout";

interface DashboardConfigPanelProps {
  widgets: WidgetConfig[];
  onToggleWidget: (id: string) => void;
  onResetLayout: () => void;
}

export const DashboardConfigPanel = ({
  widgets,
  onToggleWidget,
  onResetLayout,
}: DashboardConfigPanelProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Configure dashboard">
          <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
          Configure
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Dashboard Configuration</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-4">Widget Visibility</h3>
            <div className="space-y-4">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {widget.visible ? (
                      <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                    <div>
                      <Label
                        htmlFor={`widget-${widget.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {widget.title}
                      </Label>
                      <p className="text-xs text-muted-foreground capitalize">
                        {widget.type} • {widget.size}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`widget-${widget.id}`}
                    checked={widget.visible}
                    onCheckedChange={() => onToggleWidget(widget.id)}
                    aria-label={`Toggle ${widget.title} widget`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetLayout}
              className="w-full"
              aria-label="Reset dashboard to default layout"
            >
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
              Reset to Default Layout
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Drag widgets to reorder them</li>
              <li>Toggle visibility to customize your view</li>
              <li>Your layout is saved automatically</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
