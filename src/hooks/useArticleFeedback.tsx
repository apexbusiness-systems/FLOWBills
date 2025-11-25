import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ArticleFeedback {
  id: string;
  user_id: string;
  article_id: string;
  rating: "helpful" | "not_helpful";
  feedback_text: string | null;
  created_at: string;
  updated_at: string;
}

export const useArticleFeedback = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitFeedback = async (
    articleId: string,
    rating: "helpful" | "not_helpful",
    feedbackText?: string
  ) => {
    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to provide feedback.",
          variant: "destructive",
        });
        return null;
      }

      // Check if user already rated this article
      const { data: existing } = await supabase
        .from("article_feedback")
        .select("*")
        .eq("user_id", user.id)
        .eq("article_id", articleId)
        .single();

      if (existing) {
        // Update existing feedback
        const { data, error } = await supabase
          .from("article_feedback")
          .update({
            rating,
            feedback_text: feedbackText || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Feedback updated",
          description: "Thank you for updating your feedback!",
        });

        return data;
      } else {
        // Create new feedback
        const { data, error } = await supabase
          .from("article_feedback")
          .insert({
            user_id: user.id,
            article_id: articleId,
            rating,
            feedback_text: feedbackText || null,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Feedback submitted",
          description: "Thank you for your feedback!",
        });

        return data;
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserFeedback = async (articleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("article_feedback")
        .select("*")
        .eq("user_id", user.id)
        .eq("article_id", articleId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return null;
    }
  };

  return {
    submitFeedback,
    getUserFeedback,
    isSubmitting,
  };
};
