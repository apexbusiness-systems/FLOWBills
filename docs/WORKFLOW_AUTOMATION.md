# Workflow Automation System

## Overview

FlowBills.ca includes a comprehensive workflow automation system that allows users to create custom approval workflows with conditional routing based on invoice amounts, AFE budgets, and vendor types.

## Features

### 1. Visual Workflow Builder

- **Drag-and-Drop Interface**: Easily create workflows by dragging steps onto the canvas
- **Step Types**:
  - **Condition**: Route invoices based on data values (amount, AFE budget, vendor)
  - **Validation**: Validate invoice data against custom rules
  - **Approval**: Require manual approval from specific roles
  - **Notification**: Send automated notifications
  - **Integration**: Connect to external systems

### 2. Conditional Routing

Create sophisticated routing logic based on:

- **Invoice Amount**: Route high-value invoices to senior approvers
- **AFE Budget Status**: Special handling for over-budget invoices
- **Vendor Type**: Route to specialized approvers based on vendor
- **Multiple Conditions**: Combine multiple conditions with AND logic

### 3. Pre-Built Templates

#### Approval Workflow Templates

1. **Amount-Based Approval**
   - Route invoices to different approvers based on amount thresholds
   - Simple: Manager approval for <$10k, Director approval for >$10k

2. **AFE Budget Validation**
   - Validate invoice against AFE budget
   - Route over-budget invoices to CFO for exception approval
   - Standard approval for within-budget invoices

3. **Vendor Type Routing**
   - Route invoices to specialized approvers based on vendor type
   - Example: Drilling vendors → Drilling Manager

4. **Multi-Condition Approval**
   - Complex routing based on amount, AFE budget, and vendor
   - Executive approval for >$50k
   - Budget exception approval for over-budget
   - Standard approval otherwise

5. **Auto-Approve Within Budget**
   - Automatically approve invoices within AFE budget and under threshold
   - Manual approval for exceptions

### 4. Automatic Workflow Execution

Workflows are automatically triggered when invoices are uploaded and extracted:

1. Invoice uploaded → File uploaded to storage
2. AI extraction → Extract AFE, UWI, and other data
3. Workflow triggered → Active workflows automatically execute
4. Conditional routing → Invoice routed based on conditions
5. Approval or auto-approve → Based on workflow configuration

## Creating a Workflow

### Step 1: Choose a Template

1. Navigate to **Workflows** page
2. Click **Approval Templates** tab
3. Browse pre-built templates
4. Click **Use Template** to start with a template

### Step 2: Customize the Workflow

1. **Add Steps**: Click step type buttons to add new steps
2. **Configure Conditions**:
   - Select field (amount, AFE budget status, vendor name)
   - Choose operator (equals, greater than, less than, etc.)
   - Enter value to compare against
3. **Set Approval Rules**: Choose approver role and threshold
4. **Configure Notifications**: Set email template and recipients

### Step 3: Save and Activate

1. **Name Your Workflow**: Give it a descriptive name
2. **Add Description**: Optional description of the workflow purpose
3. **Save**: Click **Save Workflow**
4. **Activate**: Workflow is active by default and will trigger automatically

## Workflow Execution

### How It Works

1. **Invoice Upload**: User uploads invoice via dashboard
2. **AI Extraction**: System extracts data (amount, AFE, vendor, etc.)
3. **Workflow Matching**: System finds active workflows of type `invoice_processing`
4. **Conditional Evaluation**: System evaluates conditions against invoice data
5. **Step Execution**: System executes steps in order:
   - Validation checks
   - Conditional routing
   - Approval requirements
   - Notifications
6. **Status Update**: Invoice status updated based on workflow result

### Workflow Instance Tracking

- View running workflow instances in **Running Instances** tab
- See current step and status for each instance
- Track completion times and results

## Condition Builder

### Available Fields

- `amount`: Invoice total amount
- `vendor_name`: Vendor/supplier name
- `status`: Invoice status
- `invoice_extractions.budget_status`: AFE budget status (within_budget, over_budget, afe_not_found)
- `invoice_extractions.budget_remaining`: Remaining AFE budget amount
- `invoice_extractions.afe_number`: AFE number extracted
- `invoice_date`: Invoice date
- `due_date`: Payment due date

### Operators

- **equals**: Field equals value
- **not_equals**: Field does not equal value
- **greater_than**: Field is greater than value (numbers/dates)
- **less_than**: Field is less than value (numbers/dates)
- **greater_or_equal**: Field is greater than or equal to value
- **less_or_equal**: Field is less than or equal to value
- **contains**: Field contains text (strings)
- **in**: Field is in list of values

### Condition Logic

- Multiple conditions in a single step use **AND** logic
- All conditions must be met for true path
- If any condition fails, false path is taken

## Best Practices

### 1. Start Simple

- Begin with a single-condition workflow
- Test thoroughly before adding complexity
- Use templates as starting points

### 2. Use Meaningful Names

- Name steps clearly: "Check Amount > $10k" not "Condition 1"
- Use descriptive workflow names
- Add comments in descriptions

### 3. Test Workflows

- Test with sample invoices before activating
- Verify conditions evaluate correctly
- Check approval routing

### 4. Monitor Instances

- Review running instances regularly
- Check for failed workflows
- Adjust conditions based on results

### 5. Limit Active Workflows

- Keep only necessary workflows active
- Deactivate workflows when not needed
- One workflow per invoice type

## Technical Details

### Database Schema

#### workflows Table

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL,
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### workflow_instances Table

```sql
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  workflow_id UUID REFERENCES workflows,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  status TEXT NOT NULL,
  current_step INTEGER,
  step_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Edge Function

The `workflow-execute` edge function handles workflow execution:

- Fetches workflow definition
- Retrieves invoice data
- Evaluates conditions
- Executes steps in order
- Updates invoice status
- Tracks instance progress

### Integration Points

1. **Invoice Upload**: Automatically triggers workflows after extraction
2. **AFE Management**: Validates against AFE budgets
3. **Three-Way Matching**: Can be integrated into approval workflows
4. **Notifications**: Sends emails based on workflow results

## Troubleshooting

### Workflow Not Triggering

1. Check workflow is **active** (toggle in workflow list)
2. Verify workflow type is `invoice_processing`
3. Ensure invoice extraction completed successfully
4. Check edge function logs for errors

### Conditions Not Evaluating

1. Verify field names match exactly (case-sensitive)
2. Check data type matches (number vs string)
3. Use correct operator for field type
4. Test conditions with sample data

### Approval Not Required

1. Check condition logic (AND vs OR)
2. Verify approval step is connected correctly
3. Review step configuration
4. Check approver role exists

## Future Enhancements

- [ ] OR logic for conditions
- [ ] Parallel approval paths
- [ ] Time-based routing
- [ ] SLA monitoring
- [ ] Advanced notification templates
- [ ] Workflow analytics and reporting
- [ ] A/B testing for workflow optimization
- [ ] Machine learning-based routing suggestions

## Support

For questions or issues with workflow automation:

1. Check this documentation first
2. Review workflow templates for examples
3. Test with simple workflows
4. Contact support with specific workflow ID if issues persist
