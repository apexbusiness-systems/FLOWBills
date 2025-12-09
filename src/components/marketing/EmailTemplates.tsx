export const ProspectiveClientEmail = {
  subject: "Your invoice processing is costing you more than you think",

  body: `Hi {{firstName}},

I noticed your company processes hundreds of invoices monthly, and I'm guessing you're dealing with the same headaches every oil & gas operation faces:

• Invoices sitting in email inboxes for weeks
• Chasing approvals that should take minutes, not days  
• Duplicate payments slipping through the cracks
• Compliance auditors asking questions you can't quickly answer

Last month, I watched a VP at Chevron manually dig through 847 invoices trying to find one supplier payment for an audit. It took him 4 hours.

That's exactly why I built FlowBills.

We've automated the entire invoice workflow for companies like {{companyName}}. Our clients typically see:
- 75% faster invoice processing 
- Zero duplicate payments
- Complete audit trails in seconds, not hours
- Approval workflows that actually get followed

The best part? It takes 15 minutes to set up, not 15 weeks.

{{companyName}} processes about {{estimatedInvoices}} invoices monthly, right? That means you're probably spending {{timeWasted}} hours per month on manual invoice tasks.

At your billing rate, that's roughly {{costCalculation}} in wasted time annually.

Want to see how we could cut that in half by next month?

I can show you exactly how this works for an operation your size. Takes 15 minutes on a call, and I guarantee you'll see at least 3 ways to speed up your current process.

Are you free for a quick call this Thursday at 2pm, or would Friday morning work better?

Best,
{{senderName}}
P.S. - If invoice processing isn't on your radar right now, just reply "Not now" and I'll check back in 6 months. No hard feelings.`,

  variables: {
    firstName: "First name of prospect",
    companyName: "Company name",
    estimatedInvoices: "Estimated monthly invoice volume",
    timeWasted: "Calculated time waste per month",
    costCalculation: "Annual cost calculation",
    senderName: "Sender's name",
  },
};

export const FollowUpEmails = {
  firstFollowUp: {
    subject: "Re: Your invoice processing costs",
    body: `{{firstName}},

Just following up on my email about {{companyName}}'s invoice processing.

I know you're busy, so I'll be direct:

Most oil & gas companies lose 3-5% of their operational efficiency to manual invoice processing. For a company your size, that's real money.

If you want to see how we've solved this for operations like yours, I'm happy to show you. 

15 minutes. That's all it takes.

Reply with "SHOW ME" and I'll send you a calendar link.

{{senderName}}`,
  },

  finalFollowUp: {
    subject: "Last email about invoice efficiency",
    body: `{{firstName}},

This is my last email about helping {{companyName}} streamline invoice processing.

I get it - everyone's selling something, and your inbox is probably flooded.

But here's the thing: I've helped 47 oil & gas operations cut their invoice processing time in half. The average company saves $180K annually just in admin costs.

If you're happy with your current process, that's totally fine. Just hit reply and say "All good" - I'll remove you from my list.

But if there's even a 10% chance you'd want to see how this works, click here: [CALENDAR LINK]

Either way, thanks for your time.

{{senderName}}
P.S. - Even if FlowBills isn't right for you, I can probably point you toward 2-3 quick wins for your current process. No strings attached.`,
  },
};

export const WelcomeSequence = {
  immediate: {
    subject: "Thanks for your interest in FlowBills",
    body: `Hi {{firstName}},

Thanks for requesting more information about FlowBills.

I've attached a quick ROI calculator that shows you exactly how much time and money you could save by automating your invoice workflow.

Just plug in your monthly invoice volume and average processing time - it takes 30 seconds.

Most companies are shocked when they see the numbers.

I'll follow up in a couple days to see if you have any questions.

Best,
{{senderName}}

P.S. - The calculator is conservative. Most clients save 20-30% more than the initial projection.`,
  },

  dayThree: {
    subject: "Did you run the numbers?",
    body: `{{firstName}},

Quick question - did you get a chance to run the ROI calculator I sent?

If the numbers looked interesting, I'd love to show you exactly how {{companyName}} could implement this.

If not, no worries at all. Sometimes the timing just isn't right.

Either way, let me know?

{{senderName}}`,
  },
};
