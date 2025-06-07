# Mini-ERP Order Management QC App - Feature TODO List

## Phase 1: Foundation & Authentication (100% Complete) ✅

### Project Setup
- [x] Initialize React + Vite project with TypeScript
- [x] Configure Tailwind CSS
- [x] Install and configure Shadcn/ui
- [x] Set up Supabase project and environment variables
- [x] Configure React Router for navigation
- [x] Set up React Query for server state management
- [x] Configure authentication state management
- [x] Set up development environment and scripts

### Database Schema Implementation
- [x] Design users and roles tables with RLS policies
- [x] Design order_lines table with all required fields
- [x] Design quantity_logs and order_line_quantities tables
- [x] Design ct_numbers table with uniqueness constraints
- [x] Design fai_documents and related image tables
- [x] Design customers and product_categories tables
- [x] Design vendors and procurement-related tables
- [x] Design invoices and invoice_line_items tables
- [x] Design transfers table for inter-location operations
- [x] Design audit_logs table for comprehensive tracking
- [x] Design RLS policies for all tables
- [x] Design database functions for complex operations
- [x] **Execute all SQL scripts in Supabase - DEPLOYED**

### Authentication System
- [x] Implement Supabase Auth integration
- [x] Create login/logout functionality
- [x] Implement role-based access control (RBAC)
- [x] Create permission checking utilities
- [x] **Fix authentication issues - Context-based auth working**
- [x] Implement new device login detection logic
- [x] Add configurable access delay logic
- [x] Create password reset functionality framework
- [x] Implement session management
- [x] **Admin user created: admin@minierp.test / Admin@123**

### Admin Panel - User Management
- [ ] Create admin dashboard layout
- [ ] Implement user CRUD operations
- [ ] Create role management interface
- [ ] Implement user-role assignment
- [ ] Add user activation/deactivation
- [ ] Create password reset for admin
- [ ] Implement user activity logging

### Basic Navigation & Layout
- [x] Create responsive navigation bar
- [x] Implement role-based menu items
- [x] Create basic page layouts
- [x] Add loading states and error boundaries
- [x] Implement light theme only (dark mode removed per requirements)
- [x] Create mobile-responsive layout structure
- [x] **Fix CSS styling issues - Tailwind working perfectly**

---

## Phase 2: Order Management Core (47% Complete) 🚀

### Order Import & Creation
- [ ] Create manual order entry form with validation
- [ ] Implement CSV/Excel import functionality  
- [ ] Create import template and validation rules
- [ ] Set up Google Sheets integration via N8N
- [ ] Implement order line data structure validation
- [ ] Create duplicate detection for order imports
- [ ] Add bulk order operations interface

### Order Data Management
- [ ] Implement UID generation system (A001, A002, etc.)
- [ ] Create customer dropdown with admin management
- [ ] Implement product category management
- [ ] Create editable BPI description with auto-population
- [ ] Add VID (Vendor ID) autocomplete system
- [ ] Implement MSC (Master Shipping Carton) tracking
- [ ] Create miscellaneous data fields (3 generic fields)

### Order Card UI System
- [x] Design and implement order line card component
- [x] Add UID display (e.g., Q1234)
- [x] Show part number and status tag
- [x] Display BPI description and customer description
- [x] Implement key dates display (PO Date, Current ETA)
- [x] Create progressive quantity bar visualization
- [x] Add quantity badges (Pending, QC, Completed, etc.)
- [x] Show "Global Pending for HP" calculation
- [x] Implement card action buttons (Print, CT, Status, etc.)
- [ ] Add expandable card details (future enhancement)

### ETA Management System
- [x] Implement ETA tracking display (RFQ, First, Second, Third, Final)
- [x] Create ETA status indicator bubble with color coding
- [x] Add configurable color scheme for ETA stages
- [x] Implement blinking animation for overdue ETAs
- [ ] Create ETA history tooltip on hover (needs DB data)
- [ ] Add ETA delay reason logging (needs DB)
- [ ] Create bulk ETA update interface (needs DB)
- [ ] Implement Excel/CSV export for HP ETA updates
- [ ] Add ETA filtering and sorting options

### Pre-Order vs Actual PO Handling
- [ ] Accept pre-order data without PO numbers
- [ ] Implement PO update workflow
- [ ] Create quantity change highlighting and tooltips
- [ ] Handle missing parts (mark as "Cancelled by Customer")
- [ ] Add new parts from PO not in pre-order
- [ ] Implement visual indicators for PO vs pre-order status

### User Assignment & Communication
- [ ] Implement user assignment to order lines
- [ ] Create user selection interface
- [ ] Display assigned users on order cards
- [ ] Add assignment change tracking

### Real-time Updates
- [ ] **Set up Supabase realtime subscriptions for orders (HIGH PRIORITY)**
- [ ] Implement optimistic updates for immediate feedback
- [ ] Create conflict resolution for concurrent edits
- [ ] **Add real-time quantity updates across all connected clients**

---

## Phase 3: CT Number Management & FAI System

### CT Number Core System
- [ ] Implement 14-digit alphanumeric validation (uppercase)
- [ ] Create CT number uniqueness checking
- [ ] Implement historical lookup for duplicates
- [ ] Create duplicate warning system with detailed messages
- [ ] Implement approval workflow for duplicate CT usage
- [ ] Add direct override permissions for authorized users
- [ ] Create comprehensive CT number logging

### CT Number Generation
- [ ] Create CT generation modal interface
- [ ] Implement FAI Master CT string option
- [ ] Add Last Used CT for same part option
- [ ] Create Global Prefix + Random Suffix option
- [ ] Add randomization length selection (2-5 characters)
- [ ] Implement CT generation templates
- [ ] Create template saving and management

### CT Number Assignment Interface
- [ ] Create CT assignment modal from order line
- [ ] Implement multi-line text box for scanning/typing
- [ ] Add real-time format validation
- [ ] Implement instant duplicate checking
- [ ] Create visual flagging for duplicates (red highlight)
- [ ] Add numbered list display for entered CTs
- [ ] Implement "Copy to Clipboard" functionality
- [ ] Show "X of Y CTs assigned" progress indicator
- [ ] Create CT-to-order line linking system

### FAI Document Management
- [ ] Create FAI Excel upload interface
- [ ] Implement association with Customer Part Numbers
- [ ] Configure storage location (local NAS or cloud)
- [ ] Add FAI document listing and management
- [ ] Implement file validation and error handling

### FAI Image System
- [ ] Create image extraction from Excel Sheet2
- [ ] Implement thumbnail grid display
- [ ] Create full-screen image viewer
- [ ] Add image navigation (swipe/buttons)
- [ ] Implement "View FAI Images" button on order cards
- [ ] Create image modal with Master Image priority
- [ ] Add image zoom and pan functionality

### Master Image Management
- [ ] Create Master Image upload interface
- [ ] Implement high-resolution image handling
- [ ] Add Master Image association with Customer Part Numbers
- [ ] Create Master Image designation system (primary)
- [ ] Implement Master Image management interface
- [ ] Add Master Image display priority in viewers

---

## Phase 4: SB Workflow & Quantity Tracking

### Progressive Quantity Tracking System
- [ ] Implement complete quantity state management
- [ ] Create quantity_logs table operations
- [ ] Add real-time quantity calculations
- [ ] Implement order_line_quantities denormalization
- [ ] Create quantity state transitions validation
- [ ] Add quantity movement audit trail

### SB Order Line States Implementation
- [ ] TotalOrderQuantity tracking
- [ ] PendingProcurementArrangement management
- [ ] RequestedFromStock tracking
- [ ] AwaitingKittingPacking state
- [ ] InKittingPacking workflow
- [ ] OnHoldAtKittingPacking handling
- [ ] KittedPacked_AwaitingScreeningQC state
- [ ] InScreeningQC workflow
- [ ] OnHoldAtScreeningQC handling
- [ ] ScreeningQCPassed_ReadyForInvoice state
- [ ] ScreeningQCRejected processing
- [ ] Invoiced state management
- [ ] ShippedDelivered tracking
- [ ] CustomerReturned placeholder
- [ ] Cancelled state handling

### SB Kitting/Packing Interface
- [ ] Create simplified interface for SB Kitting/Packing staff
- [ ] Show only parts assigned to kitting/packing
- [ ] Implement task completion logging against CT numbers
- [ ] Add label printing access from interface
- [ ] Create "Hold at Kitting/Packing" functionality
- [ ] Implement "Reject at Kitting/Packing" process
- [ ] Add mandatory reason selection for holds/rejects
- [ ] Create completion timestamp tracking per CT

### SB Screening/QC Interface
- [ ] Create simplified interface for SB Screening/QC staff
- [ ] Show only kitted/packed parts for screening
- [ ] Implement Pass/Fail/Hold status logging
- [ ] Add CT-level result tracking
- [ ] Integrate FAI and Master image access
- [ ] Create "Hold at Screening/QC" functionality
- [ ] Implement "Reject at Screening/QC" process
- [ ] Add mandatory reason selection system

### Hold Functionality System
- [ ] Implement OnHoldAtKittingPacking state management
- [ ] Create OnHoldAtScreeningQC state management
- [ ] Add predefined reason lists for holds
- [ ] Implement free text reason input
- [ ] Create hold resolution workflow ("Passed" or "Escalated")
- [ ] Add hold quantity visibility on order cards
- [ ] Implement hold tracking and reporting

### Reject Functionality System
- [ ] Create reject workflow (direct or from hold escalation)
- [ ] Implement return to PendingProcurementArrangement pool
- [ ] Add mandatory rejection reason logging
- [ ] Create predefined rejection reason lists
- [ ] Implement reject tracking in quantity logs
- [ ] Add rejection reporting and analytics

### WhatsApp Integration for QC
- [ ] Set up Evolution API integration via N8N
- [ ] Create QC rejection alert system
- [ ] Implement instant WhatsApp notifications
- [ ] Add message template for rejection alerts
- [ ] Create admin configuration for WhatsApp groups
- [ ] Implement notification delivery tracking

### Part Mapping Approval Workflow
- [ ] Create WhatsApp message for part mapping approval
- [ ] Implement templated approval message with part details
- [ ] Add image inclusion in approval messages
- [ ] Create "Part Mapping Approved" status field
- [ ] Implement approval blocking for kitting workflow
- [ ] Add manual approval update interface for managers

---

## Phase 5: Label Design & Printing System

### Label Design Canvas
- [ ] Integrate open-source JavaScript label designer
- [ ] Create visual design canvas with WYSIWYG preview
- [ ] Add text editing tools (font, size, style)
- [ ] Implement shape tools (lines, rectangles, circles)
- [ ] Add barcode support (Code 128, Code 39, QR)
- [ ] Create static image support (logos)
- [ ] Implement custom label size configuration (mm/inches)
- [ ] Add canvas zoom and pan functionality

### Dynamic Data Integration
- [ ] Create dynamic field selection interface
- [ ] Implement field placement on label canvas
- [ ] Add data field mapping (UID, Part No, BPI DSC, etc.)
- [ ] Create real-time data preview
- [ ] Implement barcode data linking to dynamic fields
- [ ] Add date field formatting options
- [ ] Create custom text with dynamic field insertion

### Label Template Management
- [ ] Implement template save/load functionality
- [ ] Create named template system
- [ ] Add admin template designation (defaults per customer/category)
- [ ] Implement global default template settings
- [ ] Create template sharing and permissions
- [ ] Add template versioning and history

### ZPL Generation System
- [ ] Implement visual design to ZPL conversion
- [ ] Create ZPL code generation with dynamic data
- [ ] Add ZPL preview and testing capability
- [ ] Implement ZPL file download option
- [ ] Create Labelary testing integration
- [ ] Add ZPL code manual editing for advanced users

### Network Printer Integration
- [ ] Set up Network Print Server (NPS) communication
- [ ] Create printer configuration interface
- [ ] Add Zebra printer management (Name, IP, Port)
- [ ] Implement print job submission via HTTP POST
- [ ] Create printer status monitoring
- [ ] Add multi-printer support with selection
- [ ] Implement default printer assignment per template

### Quick Print Functionality
- [ ] Create quick print menu with 5-10 predefined templates
- [ ] Add generic label templates (HP ORDER, FRAGILE, etc.)
- [ ] Implement template quantity selection
- [ ] Create printer selection for quick print
- [ ] Add template customization for quick print
- [ ] Implement print job tracking and status

---

## Phase 6: Invoicing & Procurement Features

### Invoicing Interface for Accountants
- [ ] Create dedicated Invoicing/Accounting section
- [ ] Implement view for ScreeningQCPassed_ReadyForInvoice orders
- [ ] Add order price visibility for accountants
- [ ] Create PO Number grouping and display
- [ ] Implement visual grouping by PO Number
- [ ] Add click-to-copy functionality for critical fields
- [ ] Create multi-PO invoice warning system
- [ ] Implement invoice number assignment interface

### Invoice Data Management
- [ ] Create Invoice Number input from accounting software
- [ ] Implement multi-line selection for single invoice
- [ ] Add optional Eway Bill Number field
- [ ] Create quantity adjustment capability with reason logging
- [ ] Implement "Invoiced" status update system
- [ ] Add invoice creation timestamp tracking
- [ ] Create invoice-to-order line linking

### Invoice Document Management
- [ ] Implement signed Delivery Report upload
- [ ] Create customer-stamped invoice copy upload
- [ ] Add multiple documents per invoice support
- [ ] Implement document retrieval and viewing
- [ ] Create delivery acceptance notation system
- [ ] Add document version control

### Data Export for Accounting
- [ ] Create CSV/Excel export for pending invoices
- [ ] Implement just-invoiced items export
- [ ] Add customizable field selection for export
- [ ] Create formatted export for external accounting software
- [ ] Implement automated export scheduling (future)
- [ ] Add export history and tracking

### Advanced Invoice Management
- [ ] Create advanced filtering for historical invoices
- [ ] Implement comprehensive invoice search
- [ ] Add invoice status tracking and reporting
- [ ] Create invoice analytics and summaries
- [ ] Implement partial delivery tracking
- [ ] Add customer acceptance status management

### Procurement Snippet Generator
- [ ] Create modal dialog from order line "P" button
- [ ] Implement image preview and selection system
- [ ] Add data field selection checkboxes
- [ ] Create live snippet preview area
- [ ] Implement base64 image handling for chat platforms
- [ ] Add "Copy to Clipboard" functionality
- [ ] Create snippet template saving within dialog
- [ ] Implement template selection for quick reuse

### Bulk Procurement Operations
- [ ] Create multi-order line selection interface
- [ ] Implement combined procurement snippet generation
- [ ] Add Excel export for vendor communications
- [ ] Create bulk VID/MSC assignment tools
- [ ] Implement bulk operation templates
- [ ] Add bulk operation audit trail

### Vendor Management System
- [ ] Create VID (Vendor ID) autocomplete system
- [ ] Implement globally unique vendor short codes
- [ ] Add quick-add functionality for new VIDs
- [ ] Create vendor contact management
- [ ] Implement vendor performance tracking
- [ ] Add vendor communication history

### MSC and ETA Tracking
- [ ] Implement MSC (Master Shipping Carton) management
- [ ] Create MSC ETA entry system
- [ ] Add MSC-to-order line association
- [ ] Implement MSC ETA reference in customer ETA updates
- [ ] Create MSC tracking and reporting
- [ ] Add MSC shipment status management

---

## Phase 7: NP Location & Inter-Location Transfers

### NPQC Module Access & UI
- [ ] Create distinct NPQC module/page
- [ ] Implement strict role-based access (NP staff only)
- [ ] Design simplified, focused UI for NP operations
- [ ] Create NP-specific navigation and menus
- [ ] Implement NP dashboard with key metrics
- [ ] Add NP user preference management

### NP Data Visibility Controls
- [ ] Display only NP-assigned order lines
- [ ] Show UID, Customer Part Number, BPI DSC
- [ ] Implement quantity requiring NP action display
- [ ] Hide customer names, order prices, HP shipping info
- [ ] Restrict extensive SB history visibility
- [ ] Create admin-configurable historical data limits
- [ ] Add on-screen editable BPI DSC for NP notes

### NP Quantity Tracking System
- [ ] Implement NP-specific quantity states
- [ ] Create TotalQuantityForNP tracking
- [ ] Add PendingAtNP state management
- [ ] Implement In_NP_QC workflow
- [ ] Create NP_QC_Passed_ReadyForSB state
- [ ] Add NP_QC_Failed_HoldAtNP handling
- [ ] Implement NP_QC_Failed_ReturnToSource state
- [ ] Create SentToSB confirmation system
- [ ] Add CancelledAtNP state management
- [ ] Implement quantityLogsAtNP system

### Motherboard Testing Workflow
- [ ] Create NP QC staff interface for function testing
- [ ] Implement test result logging system
- [ ] Add CT injection workflow for motherboard BIOS
- [ ] Create unique NP CT tracking system
- [ ] Implement test result pass/fail/hold states
- [ ] Add test equipment integration (future)
- [ ] Create NP-specific label printing (no HP logos)

### Inter-Location Transfer System
- [ ] Create "Transfer to NP" interface for SB users
- [ ] Implement "Transfer to SB" interface for NP users
- [ ] Add transfer reason selection and free text
- [ ] Create transfer slip generation and printing
- [ ] Implement transfer quantity and CT tracking
- [ ] Add transfer status management (pending/in-transit/received)

### Transfer Receipt and Confirmation
- [ ] Create "Incoming Transfers" pages for both locations
- [ ] Implement transfer receipt confirmation workflow
- [ ] Add "Received," "Partially Received," "Received with Discrepancies" options
- [ ] Create transfer rejection workflow with reasons
- [ ] Implement "Transfer Back to NP" capability
- [ ] Add transfer audit trail and tracking

### NP Notifications System
- [ ] Implement in-app notifications for NP
- [ ] Create WhatsApp notifications via N8N for NP group
- [ ] Add notifications for "Transfer to NP" creation
- [ ] Implement NP procurement assignment notifications
- [ ] Create custom instruction delivery system
- [ ] Add notification preferences for NP users

### NP Advanced Features (Luxury)
- [ ] Implement NP QC image/video upload system
- [ ] Create multiple image upload for specific CT QC records
- [ ] Add short video upload capability for test rigs
- [ ] Implement read-only FAI/Master image access for NP
- [ ] Create Master image upload capability for NP staff
- [ ] Add NP-specific image management and organization

---

## Phase 8: System Integration & Communication

### WhatsApp Integration System-Wide
- [ ] Set up Evolution API configuration
- [ ] Create N8N webhook management system
- [ ] Implement message template management
- [ ] Add internal user WhatsApp number management
- [ ] Create WhatsApp group configuration
- [ ] Implement message delivery tracking and status

### Internal Communication System
- [ ] Create WhatsApp button on order line cards
- [ ] Implement message template selection dialog
- [ ] Add dynamic data population in templates
- [ ] Create recipient selection from internal users list
- [ ] Implement message sending via N8N webhook
- [ ] Add communication event logging

### System Settings Management
- [ ] Create global admin settings interface
- [ ] Implement UID prefix configuration
- [ ] Add ETA color logic parameter management
- [ ] Create product category management
- [ ] Implement predefined rejection reason lists
- [ ] Add NPS URL configuration
- [ ] Create printer configuration management
- [ ] Implement WhatsApp settings centralization

### Audit Trail & History System
- [ ] Implement comprehensive order line audit trail
- [ ] Add creation and modification tracking
- [ ] Create field-level change logging (old/new values)
- [ ] Implement quantity flow status change tracking
- [ ] Add CT assignment/unassignment logging
- [ ] Create label print tracking (template, user)
- [ ] Implement communication event logging
- [ ] Add override event tracking with approver details

### Security & Monitoring
- [ ] Implement new device login detection
- [ ] Create automated email alerts for new device logins
- [ ] Add WhatsApp alerts for security events
- [ ] Implement configurable access delay for new devices
- [ ] Create waiting screen with countdown for new devices
- [ ] Add IP address and browser tracking
- [ ] Implement session management and timeout

---

## Post-MVP Luxury Features (Phase 8+)

### AI-Powered Email Scanning
- [ ] Set up N8N for basic rule-based email scanning
- [ ] Implement MCP Server for advanced AI parsing
- [ ] Create semantic parsing for unstructured emails
- [ ] Add auto-creation of order lines from emails
- [ ] Implement email attachment processing
- [ ] Create user review and confirmation workflow

### AI-Powered FAI Management
- [ ] Set up automated FAI Excel scanning
- [ ] Implement AI image extraction from Sheet2
- [ ] Create auto-association with Customer Part Numbers
- [ ] Add user review and confirmation system
- [ ] Implement intelligent file organization
- [ ] Create duplicate FAI detection and management

### AI-Assisted Visual QC
- [ ] Set up camera and tablet integration
- [ ] Implement image capture with foot-switch/button
- [ ] Create AI comparison with Master/FAI images
- [ ] Add abnormality detection and flagging
- [ ] Implement human QC alert system with highlighted comparisons
- [ ] Create AI finding logging and analysis

### Direct Vendor WhatsApp Communication
- [ ] Extend procurement snippet dialog for direct sending
- [ ] Create vendor contact management system
- [ ] Implement "Send via WhatsApp" functionality
- [ ] Add image URL hosting for app-hosted images
- [ ] Create vendor communication tracking
- [ ] Implement response tracking and follow-up

### Mobile Scanning Interface
- [ ] Create mobile-responsive web UI for Zebra TC26
- [ ] Implement shipment/invoice ID selection
- [ ] Add part number and expected quantity display
- [ ] Create barcode scanning for part identification
- [ ] Implement CT scanning with validation
- [ ] Add real-time validation (Green=match, Red=error)
- [ ] Create running tally and completion tracking

### Interactive Dashboards
- [ ] Create visual KPI dashboards
- [ ] Implement pending orders tracking (Global Pending for HP)
- [ ] Add ETA status distribution charts
- [ ] Create items by stage visualization
- [ ] Implement daily/weekly throughput analytics
- [ ] Add rejection rate tracking and trends
- [ ] Create role-based dashboard views

### RAG-based AI Chatbot
- [ ] Implement AI chatbot with app knowledge base
- [ ] Create in-app chat widget ("Ask AI Agent")
- [ ] Add WhatsApp interaction via dedicated number
- [ ] Implement real-time data access (RAG pattern)
- [ ] Create question answering capability
- [ ] Add information retrieval functions
- [ ] Implement summary generation and email capability

---

## Continuous Development Tasks

### Testing & Quality Assurance
- [ ] Set up unit testing framework (Jest/Vitest)
- [ ] Create integration tests for critical workflows
- [ ] Implement permission testing for all role combinations
- [ ] Add real-time update testing
- [ ] Create load testing for concurrent users
- [ ] Implement end-to-end workflow testing
- [ ] Add automated UI testing

### Documentation
- [ ] Create README.md with setup instructions
- [ ] Implement API documentation (docs/API.md)
- [ ] Create component library documentation (docs/COMPONENTS.md)
- [ ] Add permission matrix documentation (docs/PERMISSIONS.md)
- [ ] Create workflow documentation (docs/WORKFLOWS.md)
- [ ] Implement deployment guide (docs/DEPLOYMENT.md)
- [ ] Add troubleshooting guide

### Performance & Optimization
- [ ] Implement code splitting by feature modules
- [ ] Add image optimization and lazy loading
- [ ] Create virtual scrolling for large lists
- [ ] Implement debounced search and filtering
- [ ] Add React.memo for expensive components
- [ ] Optimize database queries and indexes
- [ ] Implement caching strategies

### Deployment & DevOps
- [ ] Set up CI/CD pipeline
- [ ] Create automated testing in pipeline
- [ ] Implement environment management (dev/staging/prod)
- [ ] Add database migration strategy
- [ ] Create backup and recovery procedures
- [ ] Implement monitoring and alerting
- [ ] Add error tracking and logging

---

## Progress Tracking

**Phase 1 Progress**: 45/45 tasks completed (100%) ✅  
**Phase 2 Progress**: 18/38 tasks completed (47%) 🚀  
**Phase 3 Progress**: 0/32 tasks completed
**Phase 4 Progress**: 0/47 tasks completed
**Phase 5 Progress**: 0/28 tasks completed
**Phase 6 Progress**: 0/35 tasks completed
**Phase 7 Progress**: 0/33 tasks completed
**Phase 8 Progress**: 0/31 tasks completed
**Luxury Features**: 0/35 tasks completed
**Continuous Tasks**: 2/28 tasks completed

**Overall Progress**: 65/352 tasks completed (18%)

---

*Last Updated: December 6, 2024*  
*Major Milestone: ✅ Phase 1 Complete - Database Deployed & Authentication Working*  
*Current Focus: Phase 2 Order Management Core Development*