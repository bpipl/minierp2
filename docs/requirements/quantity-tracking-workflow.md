# Quantity Tracking Workflow - Requirements Extract

> **📋 LIVING DOCUMENT INSTRUCTIONS**
> - **When Reading Only**: Use as reference for understanding requirements
> - **When Implementing**: UPDATE this file with implementation details, changes, and decisions
> - **Update Format**: Add "## 🔄 Implementation Updates" section with date, changes, and reasoning
> - **Preservation Rule**: Never delete original requirements - add alongside them

> **Source**: Original Requirements Brain Dump - Detailed explanation for progressive quantity tracking system
> **Related Features**: SB Workflow, quantity states, audit trail
> **Phase**: Phase 4 (SB Workflow & Quantity Tracking)
> **Priority**: MEDIUM (Core operational workflow)

## Core Requirements

### Progressive Quantity Tracking System Overview

**Fundamental Concept:**
- **Real-time Quantity Tracking**: Detailed, real-time view of unit quantities across all operational stages
- **Progressive System**: Quantities flow through defined states from order to delivery
- **quantityLogs Array**: Comprehensive audit trail per order line for all quantity movements
- **Denormalized Current State**: order_line_quantities table for fast current state queries
- **Traceability**: All movements must be traceable with user, timestamp, and reason

### SB Order Line States (Complete Progressive System)

**Primary Quantity States:**
1. **TotalOrderQuantity** - Total quantity ordered by customer
2. **PendingProcurementArrangement** - Awaiting procurement action or parts sourcing
3. **RequestedFromStock** - Requested from existing inventory
4. **AwaitingKittingPacking** - Parts available, waiting for kitting/packing assignment
5. **InKittingPacking** - Currently being kitted/packed by SB staff
6. **OnHoldAtKittingPacking** - On hold during kitting/packing stage
7. **KittedPacked_AwaitingScreeningQC** - Completed kitting/packing, ready for QC
8. **InScreeningQC** - Currently undergoing screening/QC process
9. **OnHoldAtScreeningQC** - On hold during screening/QC stage
10. **ScreeningQCPassed_ReadyForInvoice** - Passed QC, ready for invoicing
11. **ScreeningQCRejected** - Failed QC, returns to PendingProcurementArrangement
12. **Invoiced** - Included in customer invoice
13. **ShippedDelivered** - Shipped to customer and delivered
14. **CustomerReturned** - Returned by customer (placeholder for future)
15. **Cancelled** - Order line cancelled

**State Transition Rules:**
- **Forward Progression**: Generally moves forward through states
- **Rejection Returns**: ScreeningQCRejected returns to PendingProcurementArrangement
- **Hold States**: Parts can be held at Kitting/Packing or Screening/QC stages
- **Skip States**: Some states may be skipped based on workflow (e.g., direct from stock)

### Quantity Logs System (quantityLogs)

**Required Log Entry Fields:**
- **action_type**: Type of quantity movement (e.g., "moved_to_kitting", "qc_passed", "placed_on_hold")
- **quantity_moved**: Number of units involved in this movement
- **from_state**: Previous quantity state (null for initial entry)
- **to_state**: New quantity state after movement
- **timestamp**: Precise date/time of movement
- **user_id**: User who performed the action
- **reason_text**: Business reason for the movement (mandatory for holds/rejects)
- **associated_ct_numbers**: Array of CT numbers involved in this movement
- **metadata**: Additional context (location, equipment, batch number, etc.)

**Log Entry Examples:**
```json
{
  "action_type": "moved_to_kitting",
  "quantity_moved": 5,
  "from_state": "AwaitingKittingPacking",
  "to_state": "InKittingPacking",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_sb_kitting_01",
  "reason_text": "Assigned to John for afternoon kitting batch",
  "associated_ct_numbers": ["CT001", "CT002", "CT003", "CT004", "CT005"],
  "metadata": {
    "workstation": "Kitting_Station_A",
    "batch_id": "BATCH_070125_A"
  }
}
```

### Visual Quantity Display on Order Cards

**Order Card Quantity Visualization:**
- **Current Quantities Display**: Show current quantities in each state
- **Format Examples**: "Pending Proc: 5", "On Hold QC: 1", "Ready Invoice: 10"
- **Color Coding**: Different colors for different states
  - Green: Completed/Ready states
  - Yellow: In-Progress states
  - Red: Hold/Rejected states
  - Blue: Pending/Waiting states
- **Progressive Bar**: Visual bar showing quantity distribution across states
- **Hover Details**: Hover over quantities to see detailed breakdown and recent movements

**Global Pending Calculation:**
- **"Global Pending for HP" Display**: Show remaining quantity not yet completed
- **Calculation**: Total Order - Sent to SB - Cancelled = Global Pending
- **Real-time Updates**: Update immediately when quantities change
- **Customer-Specific**: Calculate separately for each customer

### SB Kitting/Packing Workflow Integration

**Kitting/Packing State Management:**
- **AwaitingKittingPacking → InKittingPacking**: When staff starts kitting
- **InKittingPacking → KittedPacked_AwaitingScreeningQC**: When kitting completed
- **InKittingPacking → OnHoldAtKittingPacking**: When issues arise during kitting
- **OnHoldAtKittingPacking → InKittingPacking**: When hold resolved
- **OnHoldAtKittingPacking → PendingProcurementArrangement**: When hold escalated to rejection

**Staff Interface Integration:**
- **Task Assignment**: Assign specific quantities to specific staff members
- **CT-Level Tracking**: Track individual CT numbers through kitting process
- **Completion Logging**: Log completion with user, timestamp, and CT numbers
- **Hold/Rejection Interface**: Easy interface for placing items on hold or rejecting

### SB Screening/QC Workflow Integration

**Screening/QC State Management:**
- **KittedPacked_AwaitingScreeningQC → InScreeningQC**: When QC starts
- **InScreeningQC → ScreeningQCPassed_ReadyForInvoice**: When QC passes
- **InScreeningQC → OnHoldAtScreeningQC**: When issues found during QC
- **InScreeningQC → ScreeningQCRejected**: When QC definitively fails
- **OnHoldAtScreeningQC → InScreeningQC**: When hold resolved
- **OnHoldAtScreeningQC → ScreeningQCRejected**: When hold escalated to rejection

**QC Staff Interface:**
- **QC Assignment**: Assign specific CTs to QC staff
- **Pass/Fail/Hold Logging**: Record QC results at CT level
- **Reason Codes**: Mandatory reason codes for failures and holds
- **Visual Reference**: Integration with FAI and Master images for comparison

### Hold Functionality System

**Hold State Management:**
- **OnHoldAtKittingPacking**: Issues during kitting/packing stage
- **OnHoldAtScreeningQC**: Issues during screening/QC stage
- **Hold Reasons**: Predefined list + free text for hold reasons
- **Hold Resolution**: Two outcomes - "Hold Resolved - Passed" or "Hold Escalated - Reject Part"

**Hold Interface Requirements:**
- **Easy Hold Placement**: Simple interface for staff to place items on hold
- **Mandatory Reason**: Cannot place on hold without selecting/entering reason
- **Hold Visibility**: Held quantities clearly visible on order cards
- **Hold Management**: Interface for managers to review and resolve holds
- **Hold Analytics**: Reporting on hold patterns and resolution times

**Hold Reason Categories:**
- **Kitting/Packing Holds**:
  - Parts damage during handling
  - Missing components
  - Quality concerns
  - Equipment issues
  - Training/clarification needed
- **Screening/QC Holds**:
  - Visual defects requiring review
  - Functional testing anomalies
  - Documentation discrepancies
  - Customer specification questions
  - Reference image unclear

### Rejection Workflow System

**Rejection State Management:**
- **Direct Rejection**: Can be triggered directly from any active state
- **Hold Escalation**: Result of escalating unresolved holds
- **Return to Pool**: Rejected quantities immediately return to PendingProcurementArrangement
- **Reason Tracking**: Mandatory rejection reason with predefined categories

**Rejection Process:**
- **Immediate Return**: Quantity for rejected CT(s) immediately returns to procurement pool
- **Reason Logging**: Detailed reason logged against CT and order line history
- **WhatsApp Notification**: Automatic notification for definitive QC rejections
- **Audit Trail**: Complete tracking of rejection decision and follow-up actions

**Rejection Reason Categories:**
- **Quality Issues**: Visual defects, functional failures, specification mismatches
- **Damage**: Transit damage, handling damage, storage damage
- **Documentation**: Missing documentation, incorrect specifications
- **Customer Changes**: Customer specification changes, order modifications
- **Process Issues**: Internal process failures, handling errors

### Real-Time Quantity Calculations

**Denormalized Current State (order_line_quantities):**
- **Performance Optimization**: Pre-calculated current quantities for fast queries
- **Real-Time Updates**: Updated immediately when quantity movements occur
- **Consistency Checks**: Regular reconciliation with quantityLogs for data integrity
- **Efficient Queries**: Enable fast dashboard and card displays

**State Calculation Logic:**
- **Current State Derivation**: Calculate current quantities from quantityLogs
- **Historical Accuracy**: Ability to calculate state at any point in time
- **Consistency Validation**: Ensure sum of all states equals TotalOrderQuantity
- **Error Detection**: Identify and alert on quantity calculation discrepancies

### WhatsApp Notification Integration

**QC Rejection Notifications:**
- **Trigger**: When part is "Rejected at Screening/QC" (not just held)
- **Automation**: Instant, automated WhatsApp message via Evolution API/N8N
- **Recipients**: Pre-configured Director/Manager group
- **Message Format**: "QC REJECTION ALERT: Order UID [UID], Part [Part#], CT [CT#], Reason: [Rejection Reason]"
- **Follow-up**: Include next steps and required actions

### Audit Trail & History

**Comprehensive Tracking:**
- **Every Movement**: Log every quantity movement with full context
- **User Attribution**: Track which user performed each action
- **Timestamp Precision**: Precise timestamps for all movements
- **Reason Documentation**: Business reason for every movement
- **CT Association**: Link movements to specific CT numbers

**Historical Analysis:**
- **Movement History**: Complete history of quantity movements for each order
- **Performance Analytics**: Analysis of time spent in each state
- **Bottleneck Identification**: Identify stages with longest processing times
- **Staff Performance**: Track individual staff productivity and quality

### Integration Points

**Order Management Integration:**
- **Order Card Display**: Real-time quantity display on order cards
- **Status Updates**: Order status derived from quantity distribution
- **ETA Impact**: Quantity states impact ETA calculations
- **Customer Communication**: Use quantity status for customer updates

**CT Number System Integration:**
- **CT-Level Tracking**: Track individual CTs through all quantity states
- **CT Assignment**: Link CT assignments to quantity movements
- **CT Status**: Derive CT status from quantity state
- **CT History**: Complete history of CT movements through workflow

**Invoicing Integration:**
- **Ready for Invoice**: ScreeningQCPassed_ReadyForInvoice feeds invoicing
- **Invoiced Tracking**: Track quantities moved to Invoiced state
- **Shipment Preparation**: Use quantity status for shipment planning
- **Customer Reporting**: Generate customer reports from quantity data

### Technical Implementation

**Database Design:**
- **Optimized Queries**: Design for fast quantity calculations
- **Scalable Storage**: Handle high volume of quantity logs
- **Data Integrity**: Constraints to ensure quantity consistency
- **Performance Indexes**: Indexes for fast historical queries

**Real-Time Updates:**
- **WebSocket Integration**: Real-time quantity updates via Supabase Realtime
- **Optimistic Updates**: Immediate UI feedback for quantity changes
- **Conflict Resolution**: Handle simultaneous quantity updates
- **State Synchronization**: Keep all connected clients synchronized

**Business Logic:**
- **State Transition Validation**: Ensure valid state transitions
- **Quantity Conservation**: Ensure quantities are conserved through movements
- **Automatic Calculations**: Derive states and totals automatically
- **Error Recovery**: Handle and recover from quantity discrepancies

### Success Criteria

**Operational Excellence:**
- Real-time visibility into all quantity states
- Zero quantity discrepancies or lost tracking
- Fast identification of bottlenecks and issues
- Complete audit trail for compliance

**Performance Requirements:**
- Quantity updates visible across all clients within 2 seconds
- Dashboard queries complete in under 1 second
- Support for 1000+ concurrent quantity movements per hour
- Historical analysis available for any time period

**Business Value:**
- Eliminate manual quantity tracking
- Reduce errors and lost parts
- Improve workflow efficiency and throughput
- Provide data-driven insights for process improvement

This quantity tracking workflow is the backbone of the entire SB location operations and essential for maintaining visibility and control over all parts processing.