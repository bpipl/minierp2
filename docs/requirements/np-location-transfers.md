# NP Location & Inter-Location Transfers - Requirements Extract

> **📋 LIVING DOCUMENT INSTRUCTIONS**
> - **When Reading Only**: Use as reference for understanding requirements
> - **When Implementing**: UPDATE this file with implementation details, changes, and decisions
> - **Update Format**: Add "## 🔄 Implementation Updates" section with date, changes, and reasoning
> - **Preservation Rule**: Never delete original requirements - add alongside them

> **Source**: Original Requirements Brain Dump - Detailed explanation for NP location operations and transfer system
> **Related Features**: NPQC module, inter-location transfers, motherboard testing
> **Phase**: Phase 7 (NP Location & Inter-Location Transfers)
> **Priority**: MEDIUM (Essential for two-location operations)

## Core Requirements

### NP Location Context & Purpose

**Business Purpose:**
- **NP Location**: Secondary site focused on specialized tasks like motherboard testing/QC
- **Specific Parts**: Specialized stocking and QC hub for components like motherboards
- **Testing Focus**: Motherboard testing/QC and specific parts arrangement
- **Specialized Workflow**: Different from main SB location operations

### NPQC Module Access & UI

**Distinct Module Design:**
- **Separate Interface**: Distinct "NPQC" module/page separate from main SB interface
- **Access Control**: Access strictly limited to specific roles:
  - "NP Location Manager" role
  - "NP Location QC/Testing Staff" role
  - Directors/Admins (full access)
- **Simpler UI**: Simpler, focused UI than main SB view
- **Role-Appropriate**: Interface designed specifically for NP operations

### Data Visibility Restrictions for NP Staff

**Displayed Information:**
- **Order Line Assignment**: Displays order lines assigned to NP
- **Assignment Criteria**: 
  - "Motherboard" category items
  - Parts explicitly transferred from SB
  - Parts NP procures directly
- **Visible Fields**: Limited, focused field set
  - Order Line UID (for internal reference)
  - Customer Part Number (for part identification)
  - BPI DSC (Internal Description - on-screen editable by NP for their internal notes)
  - Quantity requiring NP action

**Strictly Hidden Information:**
- **Customer Name**: Completely hidden from NP staff
- **Order Price**: No price visibility for NP roles
- **HP-specific Shipping Info**: Shipping details not relevant to NP
- **Extensive SB History**: Limited visibility into SB operational history
- **Limited Historical Data**: Admin-configurable historical data view limits

**Editable Fields for NP:**
- **BPI DSC Editing**: On-screen editable BPI DSC for NP internal notes
- **Internal Comments**: NP-specific comments and notes
- **Test Results**: Input fields for test results and observations

### NP Internal Workflow & Quantity Tracking

**NP-Specific Quantity States (Progressive System using quantityLogsAtNP):**
1. **TotalQuantityForNP** - Total quantity assigned to NP location
2. **PendingAtNP** - Awaiting NP action or assignment
3. **In_NP_QC** - Currently undergoing NP testing/QC
4. **NP_QC_Passed_ReadyForSB** - Completed NP QC, ready for return to SB
5. **NP_QC_Failed_HoldAtNP** - Failed NP QC, on hold at NP for resolution
6. **NP_QC_Failed_ReturnToSource** - Failed NP QC, unfixable at NP, return to vendor
7. **SentToSB** - Transferred to SB and confirmed received
8. **CancelledAtNP** - Cancelled at NP location

**NP Order Card Visualization:**
- **Quantity Display**: NP Order Card visualizes these quantities
- **State-Specific Colors**: Different colors for different NP states
- **Progress Indicators**: Visual progress through NP workflow
- **Status Summaries**: Quick status overview for NP staff

**quantityLogsAtNP System:**
- **Detailed Action Logging**: Record all NP quantity movements
- **NP-Specific Fields**: NP location-specific logging fields
- **Test Result Integration**: Link quantity movements to test results
- **User Attribution**: Track which NP staff performed actions

**Overall Status Derivation:**
- **order.statusAtNP**: Derived from aggregate quantities across NP states
- **SB Integration**: NP status visible to SB for coordination
- **Real-time Updates**: Status updates immediately across locations

### Motherboard Testing & CT Injection Specifics

**NP QC Staff Testing Interface:**
- **Function Test Logging**: NP QC staff log function test results
- **Test Categories**: Different types of motherboard tests
  - POST (Power-On Self-Test)
  - Memory Testing
  - Port Functionality
  - BIOS Functionality
  - Performance Benchmarks

**CT Injection Workflow:**
- **NP CT Assignment**: Input/scan and record unique CTs they inject into motherboard BIOS
- **CT Format**: May differ from SB CT format (configurable)
- **BIOS Integration**: CT numbers injected into motherboard BIOS for tracking
- **NP Internal Tracking**: CTs used for NP internal tracking and transfer documentation

**NP Label Printing:**
- **Generic Internal Labels**: Print generic internal labels (designed in-app)
- **No HP Logos**: Labels must not include HP logos (customer branding restrictions)
- **Label Content**: Include NP-assigned CT, Part No, UID
- **Transfer Labels**: Labels for motherboards transferred to SB
- **Internal Organization**: Labels for NP internal organization and tracking

### Inter-Location Transfer System

**Transfer Creation (SB → NP):**
- **Authorized Users**: Authorized SB users create "Transfer to NP" records
- **Transfer Information**:
  - Parts and quantities being transferred
  - SB CTs if any are assigned
  - Transfer reason (e.g., specialized QC, motherboard testing)
  - Special instructions or requirements
- **Transfer Documentation**: System generates transfer records for audit

**Transfer Creation (NP → SB):**
- **Authorized Users**: Authorized NP users create "Transfer to SB" records
- **Transfer Information**:
  - Processed parts and quantities
  - NP CTs assigned during processing
  - Test results and QC status
  - Any issues or special handling requirements

**Transfer Slip Generation:**
- **Printable Transfer Slip**: System generates basic printable transfer slip for each transfer
- **Transfer Details**: Include all relevant transfer information
- **Barcode Integration**: Include barcodes for easy scanning and tracking
- **Copy Management**: Copies for both sending and receiving locations

### Transfer Receipt & Confirmation System

**Incoming Transfers Interface:**
- **Dedicated Pages**: Both SB and NP have dedicated "Incoming Transfers" pages
- **Transfer Listing**: List all in-transit items with expected arrival
- **Transfer Details**: Full details of incoming transfers
- **Status Tracking**: Track transfer status from creation to receipt

**Receipt Confirmation Workflow:**
- **Receipt Options**: Multiple receipt status options:
  - "Received" - Complete receipt as expected
  - "Partially Received" - Some items missing or damaged
  - "Received with Discrepancies" - Received but with issues
- **Quantity Verification**: Verify received quantities against transfer slip
- **Condition Assessment**: Assess condition of received items
- **Documentation**: Photo documentation of issues if any

**Transfer Rejection & Return:**
- **SB Rejection Capability**: SB can "Reject" items from NP transfer
- **Rejection Reasons**: Mandatory reason selection:
  - Transit damage
  - Failed SB re-inspection
  - Specification mismatch
  - Quality concerns
- **Rejection Actions**: Rejected items can trigger:
  - "Transfer Back to NP" for rework
  - Handled at SB with documentation
- **Rejection Tracking**: Complete audit trail for all rejections

### Automated Notifications for NP

**In-App Notifications:**
- **Transfer Notifications**: When SB creates "Transfer to NP"
- **Assignment Notifications**: When order assigned for NP procurement
- **Status Updates**: Updates on transfer status and completion
- **Priority Alerts**: High-priority transfers and rush orders

**WhatsApp Integration (Optional):**
- **NP Group Messaging**: WhatsApp notifications via N8N to NP group/manager
- **Transfer Alerts**: Immediate WhatsApp alerts for new transfers
- **Custom Instructions**: Include custom instructions in notifications
- **Delivery Confirmation**: WhatsApp confirmations when transfers received

**Notification Content:**
- **Transfer Details**: Part numbers, quantities, UIDs
- **Special Instructions**: Any special handling or testing requirements
- **Timeline**: Expected completion times and deadlines
- **Contact Information**: SB contact for questions or issues

### Luxury Features - NPQC Staff Capabilities

**Image/Video Upload System (Luxury Feature):**
- **Multiple Media Upload**: NP QC staff can upload multiple images/short videos
- **Test Documentation**: Images/videos of motherboard test rig operations
- **Part-Specific Documentation**: Link media to specific part/CT's QC record
- **Quality Evidence**: Visual evidence of testing and QC procedures

**Media Management:**
- **File Organization**: Organize media by part, CT, test type
- **Storage Integration**: Store in same system as FAI/Master images
- **Access Control**: NP staff can view their uploaded media
- **Sharing Capability**: Share relevant media with SB when needed

**FAI/Master Image Access (Luxury Feature):**
- **Read-Only Access**: NP QC staff have read-only access to FAI/Master Images
- **Part-Relevant Images**: Only for parts they handle at NP
- **Reference Material**: Use images as reference for QC procedures
- **Quality Standards**: Ensure consistency with overall quality standards

**Master Image Upload Capability (Luxury Feature):**
- **Upload Permission**: NP staff (with permission) can upload Master Image
- **Quality Improvement**: If one doesn't exist or they have better reference
- **Approval Workflow**: Uploaded images may require approval before becoming Master
- **Contribution Tracking**: Track which NP staff contribute Master Images

### Technical Implementation

**Data Synchronization:**
- **Real-time Updates**: Transfer status updates in real-time across locations
- **Conflict Resolution**: Handle simultaneous updates from both locations
- **Data Consistency**: Ensure data consistency across SB and NP systems
- **Offline Capability**: Basic offline operation for connectivity issues

**Security & Access Control:**
- **Location-Based Access**: Strict separation of SB and NP data access
- **Role-Based Permissions**: Different permissions for NP Manager vs QC staff
- **Data Protection**: Protect sensitive customer information from NP access
- **Audit Trail**: Complete audit trail for all NP operations

**Integration Points:**
- **SB System Integration**: Seamless integration with main SB workflow
- **Transfer Tracking**: Real-time transfer status visible to both locations
- **Quantity Synchronization**: NP quantity changes reflected in overall order status
- **Reporting Integration**: NP activities included in overall reporting

### Success Criteria

**Operational Efficiency:**
- Seamless coordination between SB and NP locations
- Clear visibility into NP operations for SB management
- Efficient transfer process with minimal manual tracking
- Fast NP QC turnaround times

**Quality & Compliance:**
- Consistent quality standards across both locations
- Complete audit trail for all NP operations
- Proper documentation of all transfers and QC activities
- Compliance with customer requirements and specifications

**User Experience:**
- Intuitive NP interface requiring minimal training
- Clear transfer status visibility
- Efficient communication between locations
- Mobile-friendly interface for NP operations

This NP location and transfer system enables efficient two-location operations while maintaining proper data security and operational visibility.