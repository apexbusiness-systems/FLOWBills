import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTour } from '@/hooks/useTour';
import { cn } from '@/lib/utils';

export const TourOverlay = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour, endTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
  const [isCentered, setIsCentered] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  // Handle escape key to exit tour
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      skipTour();
    }
  }, [skipTour]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isActive, handleKeyDown]);

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const updatePosition = () => {
      const target = document.querySelector(currentStepData.target);
      
      // If target is body or not found, center the card
      if (!target || currentStepData.target === 'body') {
        setIsCentered(true);
        setTargetRect(null);
        setCardPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 200,
        });
        return;
      }

      setIsCentered(false);
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate card position based on placement
      const placement = currentStepData.placement || 'bottom';
      const cardWidth = 400;
      const cardHeight = 200;
      const gap = 20;

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.top - cardHeight - gap;
          left = rect.left + rect.width / 2 - cardWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + gap;
          left = rect.left + rect.width / 2 - cardWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - cardHeight / 2;
          left = rect.left - cardWidth - gap;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - cardHeight / 2;
          left = rect.right + gap;
          break;
      }

      // Ensure card stays within viewport
      const padding = 20;
      top = Math.max(padding, Math.min(top, window.innerHeight - cardHeight - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));

      setCardPosition({ top, left });

      // Scroll target into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ pointerEvents: 'none' }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Highlight target element */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute border-4 border-primary rounded-lg shadow-2xl"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Spotlight effect */}
        {targetRect && (
          <div
            className="absolute bg-background/5 backdrop-blur-[1px]"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              borderRadius: '12px',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tour card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{
            position: 'absolute',
            top: cardPosition.top,
            left: cardPosition.left,
            pointerEvents: 'auto',
          }}
        >
          <Card className="w-[400px] shadow-2xl border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      Step {currentStep + 1} of {steps.length}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipTour}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-base mt-2">
                {currentStepData.content}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        index === currentStep
                          ? 'w-6 bg-primary'
                          : index < currentStep
                          ? 'w-1.5 bg-primary/50'
                          : 'w-1.5 bg-muted'
                      )}
                    />
                  ))}
                </div>

                {currentStep < steps.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={endTour}
                    className="flex items-center gap-1"
                  >
                    Finish
                    <SkipForward className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
