# CT Approval Workflow - Requirements Extract

> **📋 LIVING DOCUMENT INSTRUCTIONS**
> - **When Reading Only**: Use as reference for understanding requirements
> - **When Implementing**: UPDATE this file with implementation details, changes, and decisions
> - **Update Format**: Add "## 🔄 Implementation Updates" section with date, changes, and reasoning
> - **Preservation Rule**: Never delete original requirements - add alongside them

> **Source**: Original Requirements Brain Dump - Detailed explanation for CT number duplicate approval workflow
> **Related Todo**: ct-approval-workflow
> **Phase**: Phase 3 (CT Number Management & FAI System)
> **Priority**: MEDIUM (Critical for compliance and audit)

## Core Requirements

### CT Number Uniqueness & Duplicate Handling

**Fundamental Business Rule:**
- **CT numbers should ideally be unique forever**
- **14-digit ALPHANUMERIC, with ALL CHARACTERS STRICTLY UPPERCASE**
- **Historical Lookup**: Upon manual entry/scan, system performs immediate historical lookup
- **Zero Auto-Generation of Duplicates**: System will never auto-generate a known duplicate CT

### Duplicate Warning System

**Immediate Duplicate Detection:**
- **Real-time Lookup**: When CT is entered/scanned, immediate database check against all historical CT numbers
- **Comprehensive Warning Message**: If duplicate found, display vigorous warning:
  ```
  WARNING: CT Number '[CT_NUMBER]' is a duplicate. 
  Previously used for Order '[Original_Order_UID]', 
  Part '[Original_Part_Number]', 
  supplied to '[Original_Customer]' 
  on '[Original_Ship_Date]'
  ```
- **Visual Emphasis**: Warning must be prominent and impossible to miss
- **Blocking Behavior**: Duplicate CT cannot be committed without successful override/approval

### Permission-Based Approval Workflow

**Users WITHOUT Direct Override Permission:**
- **Approval Request Trigger**: If user attempts to proceed with duplicate CT, trigger approval request
- **In-App Notification**: Send in-app notification to Directors/Admins immediately
- **Email Notification**: Send email notification to Directors/Admins with duplicate details
- **Blocking State**: User cannot proceed until authorized approver approves within system
- **Request Details**: Include full context (original usage, current intended usage, user requesting, business justification field)

**Users WITH Direct Override Permission:**
- **Warning Display**: Show same warning message but with override option
- **Acknowledge and Proceed**: Button/checkbox: "Acknowledge and Proceed with Duplicate Use"
- **Mandatory Justification**: Require reason/justification text before proceeding
- **Immediate Logging**: Log override action immediately with full details

### Approval Request System

**Request Creation:**
- **Automatic Generation**: System automatically creates approval request when non-privileged user attempts duplicate use
- **Request Details**: 
  - Requesting User ID and name
  - Duplicate CT Number
  - Original usage details (order, part, customer, date)
  - Intended new usage (current order, part, customer)
  - Business justification (user-provided text field)
  - Request timestamp
  - Urgency level (normal/urgent)

**Notification System:**
- **In-App Notifications**: Real-time notifications for Directors/Admins
- **Email Notifications**: Email to all users with approval permissions
- **WhatsApp Integration**: Optional WhatsApp notification via N8N for urgent requests
- **Escalation**: If not approved within configured timeframe, escalate notifications

**Approval Interface:**
- **Dedicated Admin Section**: Approval requests visible in admin panel
- **Request Queue**: List all pending approval requests with key details
- **Detailed View**: Click to see full context and history
- **Decision Options**: Approve, Deny, Request More Information
- **Approval Justification**: Mandatory reason field for approval decision
- **Batch Operations**: Approve/deny multiple requests simultaneously

### Approval Decision Actions

**Approval Granted:**
- **Immediate Notification**: Notify requesting user immediately (in-app, email, optional WhatsApp)
- **CT Usage Permission**: Allow CT to be used in intended context
- **Audit Logging**: Log approval with approver, timestamp, justification
- **Time Limit**: Approval valid for limited time (e.g., 24 hours) for specific usage

**Approval Denied:**
- **Immediate Notification**: Notify requesting user with denial reason
- **Alternative Suggestions**: Suggest alternative CT generation methods
- **Block Usage**: Permanently block that specific duplicate usage
- **Audit Logging**: Log denial with approver, timestamp, justification

**Request for More Information:**
- **User Notification**: Request additional context from user
- **Extended Justification**: Allow user to provide more detailed business justification
- **Stakeholder Consultation**: Enable approver to consult with other stakeholders
- **Status Update**: Keep user informed of review progress

### Comprehensive Audit & Logging System

**Duplicate Usage Logging (All Cases):**
- **Warning Events**: Log every duplicate warning shown to users
- **Override Events**: Log all direct overrides with user, justification, timestamp
- **Approval Requests**: Log all approval requests with full context
- **Approval Decisions**: Log all approvals/denials with approver details
- **CT Usage**: Log final CT usage after approval/override

**Audit Data Requirements:**
- **Timestamp**: Precise date/time for all events
- **User Identification**: User ID, name, role for all actions
- **CT Number**: The duplicate CT number in question
- **Original Usage Context**: Where/when CT was originally used
- **New Usage Context**: Where/when CT is intended to be used
- **Justification Text**: Business reason for duplicate usage
- **Approver Details**: Who approved/denied and when
- **Decision Timeline**: Time from request to decision

**Audit Trail Accessibility:**
- **Admin Reports**: Generate comprehensive audit reports
- **Search Functionality**: Search audit trail by CT number, user, date range
- **Export Capability**: Export audit data for external compliance
- **Real-time Dashboard**: Live view of pending approvals and recent activities

### Permission Matrix for CT Approval

**Role-Based Permissions:**

**Director/Admin:**
- Direct override permission for all duplicate CTs
- Approval authority for all CT duplicate requests
- Access to complete audit trail and reporting
- Configuration of approval workflow settings

**Warehouse Operations Manager:**
- Limited override permission for operational CTs (configurable)
- Cannot approve requests from their own actions
- View audit trail for their location only

**SB/NP Staff:**
- No override permissions
- Must request approval for all duplicate CT usage
- Can view status of their own approval requests
- Limited audit trail access (own actions only)

**Procurement Staff:**
- Limited override permission for vendor-related CTs (configurable)
- Cannot approve requests from their own actions
- Vendor-specific audit trail access

### Approval Workflow Configuration

**Admin-Configurable Settings:**
- **Override Permissions**: Which roles have direct override capabilities
- **Approval Authority**: Which roles can approve duplicate requests
- **Notification Methods**: Email, in-app, WhatsApp preferences per role
- **Escalation Timeframes**: How long before approval requests escalate
- **Auto-Denial Rules**: Automatic denial for certain types of duplicates
- **Approval Validity Period**: How long approval remains valid

**Escalation Rules:**
- **Primary Approvers**: First-level approval authority (Directors)
- **Secondary Approvers**: Escalation level if primary approvers unavailable
- **Escalation Timeframes**: 4 hours -> 24 hours -> 48 hours escalation levels
- **Emergency Override**: Super-admin emergency override capability

### Integration with CT Assignment Interface

**CT Modal Enhancement:**
- **Real-time Duplicate Check**: As each CT is entered, immediate duplicate validation
- **Visual Warning Indicators**: Red highlighting and warning icons for duplicates
- **Approval Status Display**: Show approval status for previously approved duplicates
- **Bulk Approval Requests**: Handle multiple duplicate CTs in single approval request

**User Experience Flow:**
1. User enters/scans CT in CT assignment modal
2. System immediately checks for duplicates
3. If duplicate found, show warning with original usage details
4. User options based on permissions:
   - **With Override**: Acknowledge and proceed with justification
   - **Without Override**: Request approval with business justification
5. If approval needed, show request submitted status
6. User receives notification when approval granted/denied
7. If approved, user can complete CT assignment

### Business Continuity & Emergency Procedures

**Emergency Override Capability:**
- **Super-Admin Override**: Bypass all approvals in true emergencies
- **Emergency Justification**: Mandatory detailed justification for emergency use
- **Post-Emergency Review**: Automatic review process after emergency override
- **Audit Flag**: Emergency overrides prominently flagged in audit trail

**System Failure Handling:**
- **Offline Capability**: Local duplicate checking when database unavailable
- **Manual Approval Process**: Paper-based approval for system outages
- **Post-Recovery Sync**: Sync manual approvals when system restored
- **Audit Reconciliation**: Reconcile offline activities with system records

### Reporting & Analytics

**Duplicate Usage Reports:**
- **Frequency Reports**: Most frequently duplicated CT numbers
- **User Reports**: Users with highest duplicate usage rates
- **Approval Reports**: Approval patterns and decision analytics
- **Trend Analysis**: Duplicate usage trends over time

**Compliance Reports:**
- **Regulatory Export**: Export audit data in required compliance formats
- **Customer Reports**: Customer-specific duplicate usage (for HP, Lenovo)
- **Audit Trail**: Complete chronological audit trail
- **Exception Reports**: Unusual patterns or high-risk duplicate usage

### Success Criteria

**Compliance Requirements:**
- 100% logging of all duplicate CT events
- Complete audit trail for regulatory compliance
- Zero unauthorized duplicate CT usage
- Timely approval workflow (avg <4 hours)

**Operational Efficiency:**
- Minimal workflow disruption for legitimate duplicate needs
- Clear user guidance on approval process
- Fast approval for emergency situations
- Automated routing to appropriate approvers

**Security & Control:**
- Strong permission controls preventing unauthorized overrides
- Complete visibility into all duplicate usage
- Escalation procedures for unresponsive approvers
- Emergency procedures for business continuity

This CT approval workflow is critical for maintaining data integrity while providing necessary flexibility for legitimate business needs in the warehouse environment.