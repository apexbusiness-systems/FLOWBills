import { HelpCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTour } from "@/hooks/useTour";

interface TourOption {
  id: string;
  name: string;
  description: string;
}

const AVAILABLE_TOURS: TourOption[] = [
  {
    id: "invoice-workflow",
    name: "Invoice Processing",
    description: "Learn the complete invoice workflow",
  },
  {
    id: "afe-management",
    name: "AFE Management",
    description: "Master budget tracking and AFE features",
  },
  {
    id: "field-tickets",
    name: "Field Tickets",
    description: "Understand field ticket verification",
  },
];

export const TourTrigger = () => {
  const { startTour, hasCompletedTour } = useTour();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden md:inline">Product Tours</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Interactive Tutorials</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AVAILABLE_TOURS.map((tour) => (
          <DropdownMenuItem
            key={tour.id}
            onClick={() => startTour(tour.id)}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <Play className="h-4 w-4 mt-1 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{tour.name}</span>
                {hasCompletedTour(tour.id) && (
                  <span className="text-xs text-green-600">✓ Completed</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{tour.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
