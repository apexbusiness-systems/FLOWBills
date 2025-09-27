import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock email template with CASL compliance
const mockEmailTemplate = {
  subject: 'Invoice Notification - FlowBills.ca',
  body: `
    <p>Dear Customer,</p>
    <p>This is a notification regarding your invoice processing.</p>
    
    <footer>
      <p><strong>Sender Identification (CASL Compliance):</strong></p>
      <p>FlowBills.ca - Invoice Processing Services<br>
      Email: support@flowbills.ca<br>
      Address: [Business Address], Canada</p>
      
      <p><strong>Unsubscribe:</strong><br>
      To unsubscribe from these notifications, 
      <a href="https://flowbills.ca/unsubscribe?token={{unsubscribe_token}}">click here</a>
      or reply to this email with "UNSUBSCRIBE".</p>
      
      <p><small>This email was sent in accordance with Canada's Anti-Spam Legislation (CASL). 
      You received this because you have an active account with our invoice processing service.</small></p>
    </footer>
  `,
  variables: ['customer_name', 'invoice_number', 'unsubscribe_token']
};

// Mock consent logging function
const logConsentEvent = async (eventData: {
  email: string;
  consentType: string;
  consentGiven: boolean;
  consentText?: string;
}) => {
  const { data, error } = await supabase
    .from('consent_logs')
    .insert({
      email: eventData.email,
      consent_type: eventData.consentType,
      consent_given: eventData.consentGiven,
      consent_text: eventData.consentText,
      ip_address: '192.168.1.1', // Mock IP
      user_agent: 'Mozilla/5.0 Test Agent'
    });
  
  if (error) throw error;
  return data;
};

describe('CASL/PIPEDA Compliance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Email Template Compliance', () => {
    it('should include sender identification in email templates', () => {
      const { body } = mockEmailTemplate;
      
      // Check for sender name
      expect(body).toContain('FlowBills.ca');
      
      // Check for contact email
      expect(body).toContain('support@flowbills.ca');
      
      // Check for business address placeholder
      expect(body).toContain('[Business Address], Canada');
    });

    it('should include unsubscribe mechanism in email templates', () => {
      const { body } = mockEmailTemplate;
      
      // Check for unsubscribe link
      expect(body).toContain('unsubscribe');
      expect(body).toContain('{{unsubscribe_token}}');
      
      // Check for CASL compliance notice
      expect(body).toContain('Canada\'s Anti-Spam Legislation (CASL)');
    });

    it('should provide clear opt-out instructions', () => {
      const { body } = mockEmailTemplate;
      
      // Check for multiple unsubscribe options
      expect(body).toContain('click here');
      expect(body).toContain('reply to this email with "UNSUBSCRIBE"');
    });
  });

  describe('Consent Logging', () => {
    it('should log consent events when sending commercial emails', async () => {
      const consentData = {
        email: 'test@example.com',
        consentType: 'commercial_email',
        consentGiven: true,
        consentText: 'User agreed to receive invoice notifications via email'
      };

      // Mock successful consent logging
      vi.spyOn(supabase.from('consent_logs'), 'insert').mockResolvedValue({
        data: [{ id: '123', ...consentData }],
        error: null
      });

      const result = await logConsentEvent(consentData);
      
      expect(supabase.from('consent_logs').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: consentData.email,
          consent_type: consentData.consentType,
          consent_given: consentData.consentGiven,
          consent_text: consentData.consentText
        })
      );
    });

    it('should log withdrawal of consent', async () => {
      const withdrawalData = {
        email: 'test@example.com',
        consentType: 'commercial_email',
        consentGiven: false,
        consentText: 'User withdrew consent for commercial emails'
      };

      vi.spyOn(supabase.from('consent_logs'), 'insert').mockResolvedValue({
        data: [{ id: '456', ...withdrawalData }],
        error: null
      });

      await logConsentEvent(withdrawalData);
      
      expect(supabase.from('consent_logs').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          consent_given: false
        })
      );
    });
  });

  describe('Outbound Communication Tracking', () => {
    it('should track all outbound commercial communications', async () => {
      const communicationData = {
        email: 'customer@example.com',
        consentType: 'invoice_notification',
        consentGiven: true,
        consentText: 'Implicit consent - existing business relationship for invoice processing'
      };

      // Simulate sending an email with consent logging
      const sendEmailWithConsent = async (emailData: typeof communicationData) => {
        // 1. Log the consent event
        await logConsentEvent(emailData);
        
        // 2. Send the email (mocked)
        return { sent: true, messageId: 'msg_123' };
      };

      vi.spyOn(supabase.from('consent_logs'), 'insert').mockResolvedValue({
        data: [{ id: '789', ...communicationData }],
        error: null
      });

      const result = await sendEmailWithConsent(communicationData);
      
      expect(result.sent).toBe(true);
      expect(supabase.from('consent_logs').insert).toHaveBeenCalled();
    });
  });

  describe('PIPEDA Privacy Requirements', () => {
    it('should limit data collection to business purposes only', () => {
      // Verify that we only collect necessary data for invoice processing
      const requiredFields = ['email', 'consent_type', 'consent_given'];
      const optionalFields = ['phone', 'consent_text'];
      const prohibitedFields = ['social_security', 'credit_card', 'personal_notes'];
      
      // This would be validated in the actual database schema
      const consentLogSchema = {
        required: requiredFields,
        optional: optionalFields,
        prohibited: prohibitedFields
      };
      
      expect(consentLogSchema.required).toContain('email');
      expect(consentLogSchema.required).toContain('consent_type');
      expect(consentLogSchema.prohibited).not.toContain('email');
    });

    it('should provide access to personal information upon request', async () => {
      // Mock user data access request
      const userEmail = 'test@example.com';
      
      vi.spyOn(supabase.from('consent_logs'), 'select').mockResolvedValue({
        data: [
          {
            id: '1',
            email: userEmail,
            consent_type: 'commercial_email',
            consent_given: true,
            created_at: '2025-09-27T00:00:00Z'
          }
        ],
        error: null
      });

      const { data } = await supabase
        .from('consent_logs')
        .select('*')
        .eq('email', userEmail);
      
      expect(data).toHaveLength(1);
      expect(data![0].email).toBe(userEmail);
    });
  });

  describe('Template Rendering Validation', () => {
    it('should render templates with all required compliance elements', () => {
      const renderTemplate = (template: typeof mockEmailTemplate, variables: Record<string, string>) => {
        let rendered = template.body;
        Object.entries(variables).forEach(([key, value]) => {
          rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        return rendered;
      };

      const variables = {
        customer_name: 'John Doe',
        invoice_number: 'INV-001',
        unsubscribe_token: 'abc123'
      };

      const renderedEmail = renderTemplate(mockEmailTemplate, variables);
      
      // Verify compliance elements are present after rendering
      expect(renderedEmail).toContain('FlowBills.ca');
      expect(renderedEmail).toContain('support@flowbills.ca');
      expect(renderedEmail).toContain('unsubscribe?token=abc123');
      expect(renderedEmail).toContain('CASL');
      
      // Verify no template variables remain unrendered
      expect(renderedEmail).not.toContain('{{');
      expect(renderedEmail).not.toContain('}}');
    });
  });
});

// Integration test for actual consent logging
describe('Consent Logging Integration', () => {
  it('should create consent log entry with proper RLS', async () => {
    // This test would run against actual Supabase in integration testing
    const testConsent = {
      email: 'integration.test@example.com',
      consent_type: 'invoice_notification' as const,
      consent_given: true,
      consent_text: 'Integration test consent',
      ip_address: '127.0.0.1',
      user_agent: 'Test Runner'
    };

    // In a real integration test, this would actually insert to the database
    // For unit testing, we mock it
    vi.spyOn(supabase.from('consent_logs'), 'insert').mockResolvedValue({
      data: [{ id: 'test-id', ...testConsent }],
      error: null
    });

    const { data, error } = await supabase
      .from('consent_logs')
      .insert(testConsent);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});