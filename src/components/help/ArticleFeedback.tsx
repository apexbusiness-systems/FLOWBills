import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useArticleFeedback } from "@/hooks/useArticleFeedback";
import { cn } from "@/lib/utils";

interface ArticleFeedbackProps {
  articleId: string;
  articleTitle: string;
}

export const ArticleFeedback = ({ articleId, articleTitle }: ArticleFeedbackProps) => {
  const { submitFeedback, getUserFeedback, isSubmitting } = useArticleFeedback();
  const [userRating, setUserRating] = useState<"helpful" | "not_helpful" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<"helpful" | "not_helpful" | null>(null);

  useEffect(() => {
    const loadFeedback = async () => {
      const feedback = await getUserFeedback(articleId);
      if (feedback) {
        setUserRating(feedback.rating as "helpful" | "not_helpful");
        setFeedbackText(feedback.feedback_text || "");
      }
    };
    loadFeedback();
  }, [articleId]);

  const handleRating = async (rating: "helpful" | "not_helpful") => {
    setPendingRating(rating);
    setDialogOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!pendingRating) return;

    const result = await submitFeedback(articleId, pendingRating, feedbackText);
    if (result) {
      setUserRating(pendingRating);
      setDialogOpen(false);
      setPendingRating(null);
    }
  };

  const handleQuickRating = async (rating: "helpful" | "not_helpful") => {
    const result = await submitFeedback(articleId, rating);
    if (result) {
      setUserRating(rating);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-border">
      <span className="text-sm text-muted-foreground mr-2">Was this helpful?</span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickRating("helpful")}
        disabled={isSubmitting}
        className={cn(
          "gap-2",
          userRating === "helpful" && "bg-green-500/10 border-green-500 text-green-600"
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        Yes
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickRating("not_helpful")}
        disabled={isSubmitting}
        className={cn(
          "gap-2",
          userRating === "not_helpful" && "bg-red-500/10 border-red-500 text-red-600"
        )}
      >
        <ThumbsDown className="h-4 w-4" />
        No
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 ml-2"
            onClick={() => setDialogOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            Add Comment
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Help us improve "{articleTitle}" by sharing your thoughts or suggestions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Button
                variant={pendingRating === "helpful" ? "default" : "outline"}
                size="sm"
                onClick={() => setPendingRating("helpful")}
                className="flex-1 gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </Button>
              <Button
                variant={pendingRating === "not_helpful" ? "default" : "outline"}
                size="sm"
                onClick={() => setPendingRating("not_helpful")}
                className="flex-1 gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Not Helpful
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional comments (optional)
              </label>
              <Textarea
                placeholder="What could we improve? What information was missing?"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSubmitFeedback}
              disabled={!pendingRating || isSubmitting}
              className="w-full"
            >
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
