import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRule {
  id: string;
  user_id: string;
  rule_name: string;
  alert_type: 'threshold' | 'percentage';
  threshold_value: number;
  email_recipients: string[];
  is_active: boolean;
  last_triggered_at: string | null;
}

interface AFE {
  id: string;
  user_id: string;
  afe_number: string;
  budget_amount: number;
  spent_amount: number;
  status: string;
  well_name: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting budget alert check...');

    // Fetch all active alert rules
    const { data: rules, error: rulesError } = await supabase
      .from('budget_alert_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) throw rulesError;

    if (!rules || rules.length === 0) {
      console.log('No active alert rules found');
      return new Response(
        JSON.stringify({ message: 'No active rules', checked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${rules.length} active alert rules`);

    let alertsTriggered = 0;

    // Check each rule
    for (const rule of rules as AlertRule[]) {
      console.log(`Checking rule: ${rule.rule_name} for user ${rule.user_id}`);

      // Fetch active AFEs for this user
      const { data: afes, error: afesError } = await supabase
        .from('afes')
        .select('*')
        .eq('user_id', rule.user_id)
        .eq('status', 'active');

      if (afesError) {
        console.error(`Error fetching AFEs for user ${rule.user_id}:`, afesError);
        continue;
      }

      if (!afes || afes.length === 0) {
        console.log(`No active AFEs found for user ${rule.user_id}`);
        continue;
      }

      // Check each AFE against the rule
      for (const afe of afes as AFE[]) {
        const budgetAmount = Number(afe.budget_amount);
        const spentAmount = Number(afe.spent_amount);
        const remainingAmount = budgetAmount - spentAmount;
        const utilizationPercentage = (spentAmount / budgetAmount) * 100;

        let shouldAlert = false;
        let severity: 'warning' | 'critical' = 'warning';

        if (rule.alert_type === 'percentage') {
          // Alert if utilization exceeds threshold
          if (utilizationPercentage >= rule.threshold_value) {
            shouldAlert = true;
            severity = utilizationPercentage >= 95 ? 'critical' : 'warning';
          }
        } else {
          // Alert if remaining budget falls below threshold
          if (remainingAmount <= rule.threshold_value) {
            shouldAlert = true;
            severity = remainingAmount <= 0 ? 'critical' : 'warning';
          }
        }

        if (shouldAlert) {
          console.log(`Alert triggered for AFE ${afe.afe_number}`);

          // Check if we already alerted for this AFE in the last 24 hours
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: recentAlerts } = await supabase
            .from('budget_alert_logs')
            .select('id')
            .eq('afe_id', afe.id)
            .eq('alert_rule_id', rule.id)
            .gte('created_at', oneDayAgo)
            .limit(1);

          if (recentAlerts && recentAlerts.length > 0) {
            console.log(`Alert already sent for AFE ${afe.afe_number} in the last 24 hours`);
            continue;
          }

          const alertMessage = rule.alert_type === 'percentage'
            ? `AFE ${afe.afe_number} has reached ${utilizationPercentage.toFixed(1)}% budget utilization (${rule.threshold_value}% threshold exceeded)`
            : `AFE ${afe.afe_number} has only $${remainingAmount.toLocaleString()} remaining (below $${rule.threshold_value.toLocaleString()} threshold)`;

          // Create alert log
          await supabase
            .from('budget_alert_logs')
            .insert({
              user_id: rule.user_id,
              afe_id: afe.id,
              alert_rule_id: rule.id,
              alert_message: alertMessage,
              severity,
              budget_utilization: utilizationPercentage,
              metadata: {
                budget_amount: budgetAmount,
                spent_amount: spentAmount,
                remaining_amount: remainingAmount,
              },
            });

          // Send email notifications
          for (const recipient of rule.email_recipients) {
            try {
              await resend.emails.send({
                from: 'FlowBills Budget Alerts <alerts@flowbills.ca>',
                to: [recipient],
                subject: `${severity === 'critical' ? '🚨 CRITICAL' : '⚠️ WARNING'}: Budget Alert for AFE ${afe.afe_number}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: ${severity === 'critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; font-size: 24px;">${severity === 'critical' ? '🚨 Critical' : '⚠️ Warning'} Budget Alert</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                      <h2 style="margin-top: 0; color: #111827;">AFE: ${afe.afe_number}</h2>
                      ${afe.well_name ? `<p style="color: #6b7280; margin: 5px 0;"><strong>Well:</strong> ${afe.well_name}</p>` : ''}
                      
                      <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #111827;"><strong>Alert:</strong> ${alertMessage}</p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                        <p style="margin: 5px 0; color: #6b7280;"><strong>Budget:</strong> $${budgetAmount.toLocaleString()}</p>
                        <p style="margin: 5px 0; color: #6b7280;"><strong>Spent:</strong> $${spentAmount.toLocaleString()}</p>
                        <p style="margin: 5px 0; color: #6b7280;"><strong>Remaining:</strong> $${remainingAmount.toLocaleString()}</p>
                        <p style="margin: 5px 0; color: #6b7280;"><strong>Utilization:</strong> ${utilizationPercentage.toFixed(1)}%</p>
                      </div>
                      
                      <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px;">
                        This alert was triggered by rule: <strong>${rule.rule_name}</strong>
                      </p>
                      
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          You're receiving this email because you're subscribed to budget alerts for FlowBills.ca.
                        </p>
                      </div>
                    </div>
                  </div>
                `,
              });

              console.log(`Email sent to ${recipient} for AFE ${afe.afe_number}`);
            } catch (emailError) {
              console.error(`Failed to send email to ${recipient}:`, emailError);
            }
          }

          // Update last triggered timestamp
          await supabase
            .from('budget_alert_rules')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', rule.id);

          alertsTriggered++;
        }
      }
    }

    console.log(`Budget alert check complete. ${alertsTriggered} alerts triggered.`);

    return new Response(
      JSON.stringify({
        success: true,
        rules_checked: rules.length,
        alerts_triggered: alertsTriggered,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in budget-alert-check:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
