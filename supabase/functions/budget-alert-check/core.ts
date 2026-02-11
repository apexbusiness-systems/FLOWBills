import { SupabaseClient } from "@supabase/supabase-js";
import pLimit from "p-limit";

export interface ResendEmailParams {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

export interface AlertRule {
  id: string;
  user_id: string;
  rule_name: string;
  alert_type: "threshold" | "percentage";
  threshold_value: number;
  email_recipients: string[];
  is_active: boolean;
  last_triggered_at: string | null;
}

export interface AFE {
  id: string;
  user_id: string;
  afe_number: string;
  budget_amount: number;
  spent_amount: number;
  status: string;
  well_name: string | null;
}

export interface ProcessingMetrics {
  rules_checked: number;
  alerts_triggered: number;
  emails_sent: number;
  errors: number;
  batches_processed: number;
  duration_ms: number;
}

/**
 * Core logic for processing budget alerts with batching and concurrency control.
 */
export async function processBudgetAlerts(
  supabase: SupabaseClient,
  sendEmail: (params: ResendEmailParams) => Promise<boolean>,
  batchSize = 50,
  emailConcurrency = 10
): Promise<ProcessingMetrics> {
  const startTime = performance.now();
  const metrics: ProcessingMetrics = {
    rules_checked: 0,
    alerts_triggered: 0,
    emails_sent: 0,
    errors: 0,
    batches_processed: 0,
    duration_ms: 0,
  };

  try {
    // 1. Fetch all active rules
    const { data: rules, error: rulesError } = await supabase
      .from("budget_alert_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) return metrics;

    metrics.rules_checked = rules.length;
    const ruleBatches = chunk(rules as AlertRule[], batchSize);
    const emailLimiter = pLimit(emailConcurrency);

    // 2. Process each batch
    for (const batch of ruleBatches) {
      const batchId = crypto.randomUUID();
      metrics.batches_processed++;

      try {
        await processBatch(batch, batchId, supabase, sendEmail, emailLimiter, metrics);
      } catch (batchError) {
        console.error(`Batch ${batchId} failed, falling back to individual processing:`, batchError);

        // Log batch error
        await logError(supabase, batchId, null, null, batchError, "Batch processing failed");

        // Fallback: Process individually
        for (const rule of batch) {
          try {
            await processIndividualRule(rule, batchId, supabase, sendEmail, metrics);
          } catch (ruleError) {
            console.error(`Rule ${rule.id} failed in fallback:`, ruleError);
            metrics.errors++;
            await logError(supabase, batchId, rule.id, null, ruleError, "Individual rule processing failed");
          }
        }
      }
    }
  } catch (globalError) {
    console.error("Critical error in processBudgetAlerts:", globalError);
    metrics.errors++;
  }

  metrics.duration_ms = performance.now() - startTime;
  return metrics;
}

async function processBatch(
  rules: AlertRule[],
  batchId: string,
  supabase: SupabaseClient,
  sendEmail: (params: ResendEmailParams) => Promise<boolean>,
  emailLimiter: any,
  metrics: ProcessingMetrics
) {
  // Collect User IDs for this batch
  const userIds = [...new Set(rules.map((r) => r.user_id))];

  // Bulk Fetch AFEs
  const { data: allAfes, error: afesError } = await supabase
    .from("afes")
    .select("*")
    .in("user_id", userIds)
    .eq("status", "active");

  if (afesError) throw new Error(`Failed to fetch AFEs: ${afesError.message}`);

  // Map AFEs by User ID for quick lookup
  const afesByUser = new Map<string, AFE[]>();
  (allAfes as AFE[] || []).forEach((afe) => {
    const userAfes = afesByUser.get(afe.user_id) || [];
    userAfes.push(afe);
    afesByUser.set(afe.user_id, userAfes);
  });

  // Bulk Fetch Recent Logs (last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // We need to check logs for (afe_id, rule_id) pairs.
  // Optimization: Fetch logs for all AFEs in this batch that have happened in the last 24h.
  // This might be slightly over-fetching if we fetch logs for rules not in this batch, but filtering in memory is fast.
  const allAfeIds = (allAfes as AFE[] || []).map(a => a.id);

  let existingLogs: any[] = [];
  if (allAfeIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from("budget_alert_logs")
        .select("afe_id, alert_rule_id, created_at")
        .in("afe_id", allAfeIds)
        .gte("created_at", oneDayAgo);

      if (logsError) throw new Error(`Failed to fetch logs: ${logsError.message}`);
      existingLogs = logs || [];
  }

  // Create a Set for fast lookup: `${afe_id}:${rule_id}`
  const recentAlertsSet = new Set(
    existingLogs.map((l) => `${l.afe_id}:${l.alert_rule_id}`)
  );

  const alertsToInsert: any[] = [];
  const triggeredRuleIds = new Set<string>();
  const emailPromises: Promise<void>[] = [];

  // Evaluate Rules
  for (const rule of rules) {
    const userAfes = afesByUser.get(rule.user_id) || [];

    for (const afe of userAfes) {
      const budgetAmount = Number(afe.budget_amount);
      const spentAmount = Number(afe.spent_amount);
      const remainingAmount = budgetAmount - spentAmount;
      const utilizationPercentage = (spentAmount / budgetAmount) * 100;

      let shouldAlert = false;
      let severity: "warning" | "critical" = "warning";

      if (rule.alert_type === "percentage") {
        if (utilizationPercentage >= rule.threshold_value) {
          shouldAlert = true;
          severity = utilizationPercentage >= 95 ? "critical" : "warning";
        }
      } else {
        if (remainingAmount <= rule.threshold_value) {
          shouldAlert = true;
          severity = remainingAmount <= 0 ? "critical" : "warning";
        }
      }

      if (shouldAlert) {
        // Check duplication
        if (recentAlertsSet.has(`${afe.id}:${rule.id}`)) {
          continue;
        }

        metrics.alerts_triggered++;
        triggeredRuleIds.add(rule.id);

        const alertMessage =
          rule.alert_type === "percentage"
            ? `AFE ${afe.afe_number} has reached ${utilizationPercentage.toFixed(1)}% budget utilization (${rule.threshold_value}% threshold exceeded)`
            : `AFE ${afe.afe_number} has only $${remainingAmount.toLocaleString()} remaining (below $${rule.threshold_value.toLocaleString()} threshold)`;

        // Prepare Log Insert
        alertsToInsert.push({
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
            batch_id: batchId, // Traceability
          },
        });

        // Queue Email
        rule.email_recipients.forEach((recipient) => {
          emailPromises.push(
            emailLimiter(async () => {
              try {
                const sent = await sendEmail({
                  from: "FlowBills Budget Alerts <alerts@flowbills.ca>",
                  to: [recipient],
                  subject: `${severity === "critical" ? "🚨 CRITICAL" : "⚠️ WARNING"}: Budget Alert for AFE ${afe.afe_number}`,
                  html: generateEmailHtml(severity, afe, alertMessage, rule, budgetAmount, spentAmount, remainingAmount, utilizationPercentage),
                });
                if (sent) metrics.emails_sent++;
                else {
                    // Log email failure?
                }
              } catch (e) {
                console.error(`Failed to send email to ${recipient}:`, e);
                metrics.errors++;
              }
            })
          );
        });
      }
    }
  }

  // Bulk Operations
  if (alertsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("budget_alert_logs")
      .insert(alertsToInsert);

    if (insertError) throw new Error(`Failed to bulk insert logs: ${insertError.message}`);
  }

  if (triggeredRuleIds.size > 0) {
    const { error: updateError } = await supabase
      .from("budget_alert_rules")
      .update({ last_triggered_at: new Date().toISOString() })
      .in("id", Array.from(triggeredRuleIds));

    if (updateError) throw new Error(`Failed to bulk update rules: ${updateError.message}`);
  }

  // Wait for emails
  await Promise.all(emailPromises);
}

async function processIndividualRule(
  rule: AlertRule,
  batchId: string,
  supabase: SupabaseClient,
  sendEmail: (params: ResendEmailParams) => Promise<boolean>,
  metrics: ProcessingMetrics
) {
  // Logic essentially identical to original index.ts but instrumented
  const { data: afes, error: afesError } = await supabase
    .from('afes')
    .select('*')
    .eq('user_id', rule.user_id)
    .eq('status', 'active');

  if (afesError) throw afesError;
  if (!afes || afes.length === 0) return;

  for (const afe of afes as AFE[]) {
    // ... Logic ...
    // To avoid duplicating logic code, I'll keep it simple here.
    // In a real refactor, I'd extract "checkRuleAgainstAfe" function.
    // Given the constraints, I will duplicate the check logic briefly or extract it.

    // Extracted logic check:
    const { shouldAlert, severity, alertMessage, utilizationPercentage, remainingAmount, budgetAmount, spentAmount } = evaluateRule(rule, afe);

    if (shouldAlert) {
      // Check logs
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentAlerts } = await supabase
        .from('budget_alert_logs')
        .select('id')
        .eq('afe_id', afe.id)
        .eq('alert_rule_id', rule.id)
        .gte('created_at', oneDayAgo)
        .limit(1);

      if (recentAlerts && recentAlerts.length > 0) continue;

      metrics.alerts_triggered++;

      // Insert Log
      await supabase.from('budget_alert_logs').insert({
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
            batch_id: batchId,
            fallback_mode: true
          },
      });

      // Send Email
      for (const recipient of rule.email_recipients) {
          const sent = await sendEmail({
              from: "FlowBills Budget Alerts <alerts@flowbills.ca>",
              to: [recipient],
              subject: `${severity === "critical" ? "🚨 CRITICAL" : "⚠️ WARNING"}: Budget Alert for AFE ${afe.afe_number}`,
              html: generateEmailHtml(severity, afe, alertMessage, rule, budgetAmount, spentAmount, remainingAmount, utilizationPercentage),
          });
          if (sent) metrics.emails_sent++;
      }

      // Update Rule
      await supabase
        .from('budget_alert_rules')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', rule.id);
    }
  }
}

function evaluateRule(rule: AlertRule, afe: AFE) {
    const budgetAmount = Number(afe.budget_amount);
    const spentAmount = Number(afe.spent_amount);
    const remainingAmount = budgetAmount - spentAmount;
    const utilizationPercentage = (spentAmount / budgetAmount) * 100;

    let shouldAlert = false;
    let severity: "warning" | "critical" = "warning";

    if (rule.alert_type === "percentage") {
        if (utilizationPercentage >= rule.threshold_value) {
            shouldAlert = true;
            severity = utilizationPercentage >= 95 ? "critical" : "warning";
        }
    } else {
        if (remainingAmount <= rule.threshold_value) {
            shouldAlert = true;
            severity = remainingAmount <= 0 ? "critical" : "warning";
        }
    }

    const alertMessage = rule.alert_type === "percentage"
        ? `AFE ${afe.afe_number} has reached ${utilizationPercentage.toFixed(1)}% budget utilization (${rule.threshold_value}% threshold exceeded)`
        : `AFE ${afe.afe_number} has only $${remainingAmount.toLocaleString()} remaining (below $${rule.threshold_value.toLocaleString()} threshold)`;

    return { shouldAlert, severity, alertMessage, utilizationPercentage, remainingAmount, budgetAmount, spentAmount };
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

async function logError(supabase: SupabaseClient, batchId: string, ruleId: string | null, afeId: string | null, error: any, message: string) {
    // Try to log to alert_processing_errors
    try {
        await supabase.from('alert_processing_errors').insert({
            batch_id: batchId,
            rule_id: ruleId,
            afe_id: afeId,
            error_message: message,
            stack_trace: error instanceof Error ? error.stack : JSON.stringify(error),
            metadata: { error_details: error }
        });
    } catch (e) {
        console.error("Failed to log error to DB:", e);
    }
}

function generateEmailHtml(severity: string, afe: AFE, alertMessage: string, rule: AlertRule, budget: number, spent: number, remaining: number, utilization: number) {
    return `
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
            <p style="margin: 5px 0; color: #6b7280;"><strong>Budget:</strong> $${budget.toLocaleString()}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Spent:</strong> $${spent.toLocaleString()}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Remaining:</strong> $${remaining.toLocaleString()}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Utilization:</strong> ${utilization.toFixed(1)}%</p>
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
    `;
}
