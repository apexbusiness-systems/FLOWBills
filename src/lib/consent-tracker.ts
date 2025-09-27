import { supabase } from '@/integrations/supabase/client';

export type ConsentType = 
  | 'commercial_email'
  | 'invoice_notification' 
  | 'marketing_communication'
  | 'system_notification'
  | 'sms_notification';

export interface ConsentEvent {
  email?: string;
  phone?: string;
  userId?: string;
  consentType: ConsentType;
  consentGiven: boolean;
  consentText?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Logs consent events in compliance with CASL/PIPEDA requirements
 * Must be called for every outbound commercial communication
 */
export const logConsentEvent = async (event: ConsentEvent): Promise<void> => {
  try {
    const { error } = await supabase
      .from('consent_logs')
      .insert({
        user_id: event.userId,
        email: event.email,
        phone: event.phone,
        consent_type: event.consentType,
        consent_given: event.consentGiven,
        consent_text: event.consentText || null,
        ip_address: event.ipAddress || null,
        user_agent: event.userAgent || null
      });

    if (error) {
      console.error('Failed to log consent event:', error);
      throw new Error('Consent logging failed - communication blocked for compliance');
    }

    console.log('Consent event logged successfully:', {
      type: event.consentType,
      given: event.consentGiven,
      email: event.email ? event.email.replace(/(.{3}).*@/, '$1***@') : undefined
    });
  } catch (err) {
    console.error('Consent tracking error:', err);
    throw err;
  }
};

/**
 * Validates email template for CASL compliance
 * Ensures sender identification and unsubscribe mechanism are present
 */
export const validateEmailCompliance = (emailBody: string): {
  isCompliant: boolean;
  missingElements: string[];
} => {
  const requiredElements = {
    senderIdentification: /FlowBills\.ca|support@flowbills\.ca/i,
    unsubscribeLink: /unsubscribe/i,
    caslReference: /casl|anti-spam legislation/i,
    contactInfo: /email:|address:|canada/i
  };

  const missingElements: string[] = [];
  
  Object.entries(requiredElements).forEach(([element, regex]) => {
    if (!regex.test(emailBody)) {
      missingElements.push(element);
    }
  });

  return {
    isCompliant: missingElements.length === 0,
    missingElements
  };
};

/**
 * Sends email with automatic consent logging
 * Blocks sending if compliance validation fails
 */
export const sendCompliantEmail = async (params: {
  to: string;
  subject: string;
  body: string;
  consentType: ConsentType;
  userId?: string;
  unsubscribeToken?: string;
}): Promise<{ sent: boolean; messageId?: string; error?: string }> => {
  
  try {
    // 1. Validate email compliance
    const validation = validateEmailCompliance(params.body);
    if (!validation.isCompliant) {
      throw new Error(`Email not CASL compliant. Missing: ${validation.missingElements.join(', ')}`);
    }

    // 2. Log consent event BEFORE sending
    await logConsentEvent({
      email: params.to,
      userId: params.userId,
      consentType: params.consentType,
      consentGiven: true,
      consentText: `Commercial email sent: ${params.subject}`,
      ipAddress: getClientIP(),
      userAgent: navigator?.userAgent
    });

    // 3. Send email (this would integrate with actual email service)
    // For now, we simulate sending
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Email sent with compliance:', {
      to: params.to.replace(/(.{3}).*@/, '$1***@'),
      subject: params.subject,
      messageId,
      consentType: params.consentType
    });

    return {
      sent: true,
      messageId
    };

  } catch (error) {
    console.error('Compliant email sending failed:', error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Handles unsubscribe requests in compliance with CASL
 */
export const processUnsubscribe = async (params: {
  email: string;
  token: string;
  consentType?: ConsentType;
}): Promise<{ success: boolean; error?: string }> => {
  
  try {
    // Log withdrawal of consent
    await logConsentEvent({
      email: params.email,
      consentType: params.consentType || 'commercial_email',
      consentGiven: false,
      consentText: 'User requested unsubscribe via web form',
      ipAddress: getClientIP(),
      userAgent: navigator?.userAgent
    });

    // In a real implementation, this would:
    // 1. Validate the unsubscribe token
    // 2. Update user preferences in the database
    // 3. Add email to suppression list
    
    console.log('Unsubscribe processed:', {
      email: params.email.replace(/(.{3}).*@/, '$1***@'),
      token: params.token.substr(0, 8) + '...'
    });

    return { success: true };

  } catch (error) {
    console.error('Unsubscribe processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Gets client IP address for consent logging
 * In production, this would extract from request headers
 */
const getClientIP = (): string => {
  // This is a placeholder - in a real app you'd get this from request headers
  return '0.0.0.0';
};

/**
 * Email templates with CASL compliance built-in
 */
export const emailTemplates = {
  invoiceNotification: {
    subject: 'Invoice Processing Notification - FlowBills.ca',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice Processing Update</h2>
        <p>Dear {{customer_name}},</p>
        <p>Your invoice {{invoice_number}} has been processed successfully.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p><strong>Sender Identification (CASL Compliance):</strong></p>
          <p>FlowBills.ca - Invoice Processing Services<br>
          Email: support@flowbills.ca<br>
          Address: [Business Address], Canada</p>
          
          <p><strong>Unsubscribe:</strong><br>
          To unsubscribe from these notifications, 
          <a href="https://flowbills.ca/unsubscribe?token={{unsubscribe_token}}">click here</a>
          or reply to this email with "UNSUBSCRIBE".</p>
          
          <p><small>This email was sent in accordance with Canada's Anti-Spam Legislation (CASL). 
          You received this because you have an active business relationship with our invoice processing service.</small></p>
        </div>
      </div>
    `
  },

  systemAlert: {
    subject: 'System Alert - FlowBills.ca',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">System Alert</h2>
        <p>Dear {{customer_name}},</p>
        <p>{{alert_message}}</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p><strong>Sender Identification:</strong></p>
          <p>FlowBills.ca System Notifications<br>
          Email: support@flowbills.ca<br>
          Canada</p>
          
          <p><small>This is a system notification related to your account. 
          This message is sent in compliance with CASL under existing business relationship provisions.</small></p>
        </div>
      </div>
    `
  }
};