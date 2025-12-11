import { Palette, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThemeDisplay = () => {
  const colorSwatches = [
    { name: "Primary", bg: "bg-primary", text: "text-primary-foreground", value: "45° 95% 35%" },
    { name: "Primary Light", bg: "bg-primary-light", text: "text-primary-foreground", value: "48° 95% 45%" },
    { name: "Primary Dark", bg: "bg-primary-dark", text: "text-primary-foreground", value: "42° 85% 25%" },
    { name: "Secondary", bg: "bg-secondary", text: "text-secondary-foreground", value: "25° 95% 48%" },
    { name: "Status Pending", bg: "bg-status-pending", text: "text-status-pending-foreground", value: "35° 95% 55%" },
    { name: "Status Approved", bg: "bg-status-approved", text: "text-status-approved-foreground", value: "142° 70% 35%" },
    { name: "Status Processing", bg: "bg-status-processing", text: "text-status-processing-foreground", value: "45° 85% 45%" },
  ];

  return (
    <div className="card-enterprise">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Yellow Theme Color Palette
        </h3>
        <p className="text-sm text-muted-foreground">
          Professional amber/yellow theme with proper contrast ratios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colorSwatches.map((swatch) => (
          <div 
            key={swatch.name}
            className={`${swatch.bg} ${swatch.text} p-4 rounded-lg shadow-sm border border-border/20`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{swatch.name}</h4>
              <Eye className="h-4 w-4" />
            </div>
            <p className="text-xs opacity-90">HSL: {swatch.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm">Primary Button</Button>
          <Button variant="secondary" size="sm">Secondary Button</Button>
          <Button variant="outline" size="sm">Outline Button</Button>
          <Button variant="ghost" size="sm">Ghost Button</Button>
        </div>
      </div>
    </div>
  );
};

export default ThemeDisplay;