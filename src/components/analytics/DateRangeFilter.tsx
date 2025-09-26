import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AnalyticsFilters } from "@/hooks/useAnalytics";

interface DateRangeFilterProps {
  onFilterChange: (filters: AnalyticsFilters) => void;
  loading?: boolean;
}

const DateRangeFilter = ({ onFilterChange, loading }: DateRangeFilterProps) => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [quickFilter, setQuickFilter] = useState<string>("30d");

  const quickFilters = [
    { label: "Today", value: "today" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "Custom", value: "custom" }
  ];

  const applyQuickFilter = (period: string) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "today":
        startDate = new Date();
        break;
      case "7d":
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const filters: AnalyticsFilters = {
      startDate,
      endDate
    };

    setDateRange({ from: startDate, to: endDate });
    setQuickFilter(period);
    onFilterChange(filters);
  };

  const applyCustomRange = () => {
    if (dateRange?.from && dateRange?.to) {
      const filters: AnalyticsFilters = {
        startDate: dateRange.from,
        endDate: dateRange.to
      };
      setQuickFilter("custom");
      onFilterChange(filters);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Time Range</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.value}
              variant={quickFilter === filter.value ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/20"
              onClick={() => filter.value !== "custom" && applyQuickFilter(filter.value)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>

        {quickFilter === "custom" && (
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            <Button
              onClick={applyCustomRange}
              disabled={!dateRange?.from || !dateRange?.to || loading}
              size="sm"
            >
              Apply
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;