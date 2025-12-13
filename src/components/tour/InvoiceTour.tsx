import { useEffect } from 'react';
import { useTour } from '@/hooks/useTour';

const INVOICE_TOUR_STEPS = [
  {
    id: 'welcome',
    target: '[data-tour="dashboard-header"]',
    title: 'Welcome to FLOWBills! 👋',
    content: 'Let\'s take a quick tour of the invoice processing workflow. This will only take 2 minutes.',
    placement: 'bottom' as const,
  },
  {
    id: 'upload-widget',
    target: '[data-tour="upload-widget"]',
    title: 'Upload Invoices',
    content: 'Start by uploading your invoice documents here. We support PDF, images, and common document formats.',
    placement: 'right' as const,
  },
  {
    id: 'stats-overview',
    target: '[data-tour="stats-widget"]',
    title: 'Track Your Metrics',
    content: 'Monitor invoice counts, processing status, and financial metrics at a glance.',
    placement: 'bottom' as const,
  },
  {
    id: 'activity-feed',
    target: '[data-tour="activity-widget"]',
    title: 'Recent Activity',
    content: 'Stay updated with real-time activity feed showing recent invoice actions and system events.',
    placement: 'left' as const,
  },
  {
    id: 'afe-management',
    target: '[data-tour="afe-card"]',
    title: 'AFE Management',
    content: 'Manage Authorization for Expenditure (AFE) budgets and track spending against approved amounts.',
    placement: 'bottom' as const,
  },
  {
    id: 'field-tickets',
    target: '[data-tour="field-tickets-card"]',
    title: 'Field Tickets',
    content: 'Verify and link field tickets to invoices for accurate tracking of field services.',
    placement: 'bottom' as const,
  },
  {
    id: 'uwi-registry',
    target: '[data-tour="uwi-card"]',
    title: 'UWI Registry',
    content: 'Manage Unique Well Identifiers (UWI) to organize invoices by well location.',
    placement: 'bottom' as const,
  },
  {
    id: 'three-way-matching',
    target: '[data-tour="matching-card"]',
    title: 'Automated Matching',
    content: 'Leverage three-way matching to automatically verify invoices against POs and field tickets.',
    placement: 'top' as const,
  },
  {
    id: 'command-palette',
    target: 'body',
    title: 'Power User Tip: Command Palette ⌘K',
    content: 'Press ⌘K (Ctrl+K on Windows) anytime to quickly navigate, search, and perform actions without using the mouse.',
    placement: 'bottom' as const,
  },
];

export const InvoiceTour = () => {
  const { setSteps, startTour, hasCompletedTour } = useTour();

  useEffect(() => {
    setSteps(INVOICE_TOUR_STEPS);
    
    // Auto-start tour for new users after a short delay
    const timer = setTimeout(() => {
      if (!hasCompletedTour('invoice-workflow')) {
        startTour('invoice-workflow');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [setSteps, startTour, hasCompletedTour]);

  return null;
};
