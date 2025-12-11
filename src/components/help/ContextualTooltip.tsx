import { ReactNode, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { HelpCircle, BookOpen, Play, X } from 'lucide-react';
import { useFirstUseTooltip } from '@/hooks/useFirstUseTooltip';
import { useTour } from '@/hooks/useTour';
import { useNavigate } from 'react-router-dom';

interface ContextualTooltipProps {
  id: string;
  children: ReactNode;
  title: string;
  description: string;
  helpArticleId?: string;
  tourId?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export const ContextualTooltip = ({
  id,
  children,
  title,
  description,
  helpArticleId,
  tourId,
  placement = 'right',
}: ContextualTooltipProps) => {
  const { shouldShow, isOpen, setIsOpen, markAsShown } = useFirstUseTooltip(id);
  const { startTour } = useTour();
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldShow && isOpen) {
      const timer = setTimeout(() => {
        markAsShown();
      }, 10000); // Auto-close after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [shouldShow, isOpen, markAsShown]);

  const handleStartTour = () => {
    if (tourId) {
      startTour(tourId);
      markAsShown();
    }
  };

  const handleViewHelp = () => {
    if (helpArticleId) {
      navigate(`/help?article=${helpArticleId}`);
      markAsShown();
    }
  };

  const handleDismiss = () => {
    markAsShown();
  };

  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={placement}
          className="max-w-sm p-4 bg-card border-primary/20 shadow-xl"
          sideOffset={8}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                <h4 className="font-semibold text-sm text-foreground">{title}</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {helpArticleId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleViewHelp}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Learn More
                </Button>
              )}
              {tourId && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleStartTour}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Start Tour
                </Button>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
