import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

const STORAGE_KEY = "flowbills_shown_tooltips";

export const useFirstUseTooltip = (tooltipId: string) => {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const storageKey = `${STORAGE_KEY}_${user.id}`;
    const shownTooltips = JSON.parse(localStorage.getItem(storageKey) || "{}");

    if (!shownTooltips[tooltipId]) {
      setShouldShow(true);
      setIsOpen(true);
    }
  }, [tooltipId, user]);

  const markAsShown = () => {
    if (!user) return;

    const storageKey = `${STORAGE_KEY}_${user.id}`;
    const shownTooltips = JSON.parse(localStorage.getItem(storageKey) || "{}");
    shownTooltips[tooltipId] = true;
    localStorage.setItem(storageKey, JSON.stringify(shownTooltips));
    setShouldShow(false);
    setIsOpen(false);
  };

  return {
    shouldShow,
    isOpen,
    setIsOpen,
    markAsShown,
  };
};
