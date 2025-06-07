# Invoicing & Procurement Features - Requirements Extract

> **📋 LIVING DOCUMENT INSTRUCTIONS**
> - **When Reading Only**: Use as reference for understanding requirements
> - **When Implementing**: UPDATE this file with implementation details, changes, and decisions
> - **Update Format**: Add "## 🔄 Implementation Updates" section with date, changes, and reasoning
> - **Preservation Rule**: Never delete original requirements - add alongside them

> **Source**: Original Requirements Brain Dump - Detailed explanation for invoicing and procurement support features
> **Related Features**: Invoicing interface, vendor communication, procurement tools
> **Phase**: Phase 6 (Invoicing & Procurement Features)
> **Priority**: MEDIUM (Essential for business operations)

## Core Requirements

### Invoicing Interface for Accountants

**Dedicated Invoicing/Accounting Section:**
- **Access Control**: Dedicated "Invoicing" or "Accounting" section for Accountants (and Directors/Admins)
- **Default View**: Order lines/quantities in ScreeningQCPassed_ReadyForInvoice status
- **Price Visibility**: Accountants see order prices (strictly permission-controlled)
- **PO Number Display**: PO Number clearly displayed and prominent
- **Visual Grouping**: Order lines visually grouped by PO Number for easy processing

**Click-to-Copy Functionality:**
- **Critical Fields**: "Click-to-Copy" icons next to critical fields for external accounting software
- **Copyable Fields**: Part No, Desc, Qty, Price, Total
- **Efficiency**: Designed for fast data entry into external accounting systems
- **User Experience**: Single-click copying with visual feedback

**Multi-PO Invoice Warning System:**
- **Warning Logic**: Warning if accountant attempts to assign single invoice number to lines from multiple POs
- **Warning Message**: "...HP may not allow this. Proceed?"
- **Override Capability**: Accountant can acknowledge and proceed if business requires it
- **Audit Logging**: Log all multi-PO invoice decisions with accountant and reason

### Invoice Data Entry & Management

**Invoice Number Assignment:**
- **External Integration**: Field for Invoice Number from accounting software
- **Multi-Line Selection**: Ability to select multiple lines (ideally from same PO)
- **Single Invoice Assignment**: Assign single Invoice Number to selected lines
- **Batch Processing**: Efficient processing of multiple order lines

**Additional Invoice Fields:**
- **Eway Bill Number**: Optional Eway Bill Number field for shipping compliance
- **Quantity Adjustment**: Accountant can adjust quantity being invoiced
- **Adjustment Logging**: All quantity adjustments logged with reason and timestamp
- **Partial Invoicing**: Support for partial quantity invoicing

**Status Management:**
- **Invoice Status Update**: Mark lines/quantities as "Invoiced"
- **State Transition**: Move invoiced quantities to Invoiced state
- **Real-time Updates**: Immediate status updates across all connected clients
- **Audit Trail**: Complete tracking of invoice creation and modifications

### Data Export for Accounting

**Export Functionality:**
- **Pending Items**: Download list of items pending invoicing (CSV/Excel)
- **Just Invoiced**: Export items that were just invoiced
- **Custom Fields**: Configurable field selection for export
- **Format Options**: Multiple export formats for different accounting systems

**Advanced Filtering & Search:**
- **Historical Invoices**: Advanced filtering for historical invoices/lines
- **Search Capabilities**: Comprehensive search across invoice data
- **Date Range Filtering**: Filter by invoice date, order date, ETA, etc.
- **Customer Filtering**: Filter by specific customers or customer groups
- **Status Filtering**: Filter by invoice status, payment status, etc.

### Document Upload & Management

**Signed Document Upload:**
- **Delivery Reports**: Upload scanned signed Delivery Reports
- **Customer Invoices**: Upload customer-stamped Invoice copies
- **Document Linking**: Link documents to system Invoice Number and/or order lines
- **Multiple Documents**: Multiple documents per invoice allowed

**Document Management:**
- **Easy Retrieval**: Easily retrievable documents for proof and audit
- **Document Types**: Support various document types (PDF, images, scans)
- **Version Control**: Handle multiple versions of same document
- **Access Control**: Role-based access to uploaded documents

**Delivery Acceptance Tracking:**
- **Partial Acceptance**: Allow notation if delivery partially accepted by customer
- **Acceptance Status**: Track full/partial/rejected delivery status
- **Customer Feedback**: Capture customer feedback and issues
- **Follow-up Actions**: Track required follow-up actions

### Procurement Snippet Generator

**Modal Dialog from Order Line:**
- **Access Point**: "P" button on order line cards opens procurement dialog
- **Integrated Interface**: Modal dialog with comprehensive procurement tools
- **Context Awareness**: Pre-populated with order line data
- **User-Friendly**: Intuitive interface requiring minimal training

**Image Preview & Selection System:**
- **Image Sources**: Thumbnails of Master & FAI images for the part
- **User Selection**: User selects which images to include in communication
- **Image Quality**: High-quality images suitable for vendor communication
- **Format Options**: Multiple image formats and sizes available

**Data Field Selection:**
- **Available Fields**: Checkboxes for all relevant procurement data
  - Customer Part No (essential for vendor matching)
  - BPI DSC (internal description for context)
  - Customer Desc (customer's description)
  - Quantity Required (PendingProcurementArrangement qty)
- **User Control**: User selects which fields to include in snippet
- **Smart Defaults**: Commonly used fields pre-selected

**Live Snippet Preview:**
- **Real-time Generation**: Text area dynamically shows message as selections are made
- **WhatsApp/WeChat Format**: Formatted specifically for chat platforms
- **Editable Content**: Generated snippet is editable before sending
- **Template Integration**: Can use predefined templates as starting point

**Image Handling for Chat Platforms:**
- **Base64 Small Images**: Attempt to make images easily pastable
- **Hosted URLs**: Accessible URLs if images hosted by app
- **Platform Compatibility**: Technical feasibility varies by chat platform
- **Fallback Options**: Alternative methods when direct paste not available

**Copy to Clipboard Functionality:**
- **One-Click Copy**: "Copy to Clipboard" button for entire formatted snippet
- **Format Preservation**: Maintain formatting when copying
- **Cross-Platform**: Works across different operating systems
- **User Feedback**: Clear confirmation when copy successful

### Template Management Within Dialog

**Template Save/Load:**
- **Template Creation**: Save current field/image selection preferences as named template
- **Quick Reuse**: Users select from saved templates for quick reuse
- **Default Templates**: Option to "Set as Default Template" for user
- **Template Sharing**: Share templates between users (admin controlled)

**Template Categories:**
- **By Vendor**: Templates specific to different vendors
- **By Part Type**: Templates for different part categories
- **By Purpose**: Templates for quotes, delivery updates, quality issues
- **Personal Templates**: User-specific template library

### Bulk Procurement Operations

**Multi-Line Selection:**
- **Bulk Selection**: Select multiple order lines from main order list view
- **Filter Integration**: Select filtered results for bulk operations
- **Smart Selection**: Tools for selecting related order lines efficiently
- **Selection Limits**: Reasonable limits to prevent system overload

**Bulk Action Toolbar:**
- **Combined Snippet**: Generate Combined Procurement Snippet for one vendor message
- **Template Logic**: Use saved template logic for bulk operations
- **Excel Export**: Export Selected to Excel for Vendors with chosen fields
- **Bulk Assignment**: Bulk Assign VID/MSC to selected lines

**Bulk Snippet Generation:**
- **Vendor Consolidation**: Consolidate information for single vendor message
- **Smart Grouping**: Group related parts and quantities intelligently
- **Template Application**: Apply procurement templates to bulk data
- **Review Interface**: Review generated content before sending

### Vendor Management & Tracking

**VID (Vendor ID) System:**
- **Autocomplete System**: VID text field with autocomplete from globally unique list
- **Vendor Short Codes**: Internal vendor identification system
- **Quick-Add Capability**: Quick-add for new VIDs by permissioned users
- **Vendor Database**: Maintain comprehensive vendor information

**MSC (Master Shipping Carton) Tracking:**
- **MSC ID Format**: Alphanumeric 5-6 digit text field
- **Vendor Association**: Unique per vendor's incoming consignment from China
- **No Strict Validation**: For user reference, flexible format
- **Consignment Tracking**: Track shipments from vendors

**ETA Management for MSC:**
- **MSC ETA Entry**: Ability to manually enter ETA for specific MSC number
- **Customer ETA Link**: When updating customer-facing ETAs for order lines associated with MSC
- **ETA Reference**: MSC's ETA clearly visible as reference during customer ETA updates
- **ETA Coordination**: Coordinate vendor ETAs with customer commitments

### Vendor Communication Enhancement

**Direct Vendor Communication (Luxury Feature):**
- **Extended Dialog**: Extend procurement snippet dialog for direct sending
- **Vendor Contacts**: Select vendor contact from system-managed list
- **WhatsApp Integration**: "Send via WhatsApp" button directly sends snippet
- **Message Delivery**: Send text and image URLs via Evolution API/N8N
- **Delivery Tracking**: Track message delivery and vendor responses

### Integration Points

**Order Management Integration:**
- **Status Updates**: Procurement actions update order status
- **ETA Coordination**: Vendor ETAs feed into order ETA management
- **Priority Handling**: Rush orders flagged in procurement interface
- **Customer Requirements**: Customer-specific procurement requirements

**Invoice System Integration:**
- **Ready for Invoice**: Integration with ScreeningQCPassed_ReadyForInvoice status
- **Invoice Generation**: Streamlined path from procurement to invoicing
- **Document Flow**: Procurement documents linked to final invoices
- **Audit Trail**: Complete trail from procurement through invoicing

**WhatsApp System Integration:**
- **Message Templates**: Procurement-specific WhatsApp templates
- **Vendor Groups**: WhatsApp groups for different vendor categories
- **Automated Notifications**: Automatic vendor notifications for urgent requests
- **Delivery Confirmations**: WhatsApp confirmations of part deliveries

### Success Criteria

**Operational Efficiency:**
- Reduce invoice processing time by 70%
- Streamline vendor communication workflow
- Eliminate manual data re-entry between systems
- Improve procurement response times

**Accuracy & Compliance:**
- Zero invoice processing errors
- Complete audit trail for all transactions
- Proper document management and retrieval
- Compliance with customer invoicing requirements

**User Experience:**
- Intuitive interface requiring minimal training
- Fast invoice processing workflow
- Efficient procurement communication tools
- Clear status visibility and tracking

This invoicing and procurement system is essential for business operations and customer satisfaction, particularly for HP and Lenovo accounts requiring precise invoicing and delivery documentation.