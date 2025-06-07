# FAI Document Integration & Master Image System - Requirements Extract

> **📋 LIVING DOCUMENT INSTRUCTIONS**
> - **When Reading Only**: Use as reference for understanding requirements
> - **When Implementing**: UPDATE this file with implementation details, changes, and decisions
> - **Update Format**: Add "## 🔄 Implementation Updates" section with date, changes, and reasoning
> - **Preservation Rule**: Never delete original requirements - add alongside them

> **Source**: Original Requirements Brain Dump - Detailed explanation for FAI document management and master image system
> **Related Todo**: fai-document-integration
> **Phase**: Phase 3 (CT Number Management & FAI System) & Phase 4 (SB Workflow)
> **Priority**: LOW (Essential for QC workflow)

## Core Requirements

### FAI (First Article Inspection) Document Management

**Association & Storage Requirements:**
- **Part Number Association**: Ability to associate FAI Excel files with specific **Customer Part Numbers**
- **Configurable Storage**: Configurable storage location for FAI Excels (local NAS path or cloud storage bucket)
- **File Management**: Upload, organize, and manage FAI Excel files per part number
- **Version Control**: Handle multiple versions of FAI documents for same part
- **Storage Configuration**: Admin-configurable storage location via environment or settings

**File Upload & Management:**
- **File Format Support**: Specifically Excel files (.xlsx, .xls) containing FAI documentation
- **Upload Interface**: Drag & drop upload interface for FAI files
- **File Validation**: Validate file format and basic structure before acceptance
- **Metadata Capture**: Capture upload date, user, file size, version information
- **File Organization**: Organize files by Customer Part Number, date, version

### FAI Image Extraction System

**Specific Image Source Requirements:**
- **Sheet2 Requirement**: Images are extracted **only from "Sheet2"** of HP FAI Excels
- **Complete Extraction**: System attempts to grab **all images** from this sheet
- **Image Format Support**: Support for embedded images in various formats (PNG, JPG, etc.)
- **Extraction Automation**: Automatic image extraction upon FAI file upload
- **Error Handling**: Handle files without Sheet2 or with no images gracefully

**Image Processing & Storage:**
- **Image Extraction**: Extract all embedded images from Excel Sheet2
- **Image Storage**: Store extracted images with reference to source FAI file
- **Image Optimization**: Optimize images for web display (thumbnails and full size)
- **Metadata Preservation**: Maintain image metadata and extraction details
- **Cloud Storage Integration**: Store images in configurable cloud storage (Supabase Storage)

### Image Viewing & Access System

**"View FAI Images" Button Integration:**
- **Button Location**: "View FAI Images" button on order lines and QC/Screening UIs
- **Access Control**: Button visible only when FAI images exist for the part
- **Quick Access**: Single-click access to part-specific FAI images
- **Context Awareness**: Button behavior adapts based on user role and location

**Image Viewer Interface:**
- **Modal/Viewer**: Clicking button opens modal/viewer interface
- **Thumbnail Grid**: Initially display thumbnail grid of all extracted FAI images for the part
- **Grid Layout**: Responsive grid layout showing all available images
- **Image Count**: Display total count of available images
- **Loading States**: Professional loading indicators during image retrieval

**Full-Screen Image View:**
- **Thumbnail Click**: Clicking thumbnail opens image in larger, full-screen/near-full-screen view
- **Image Quality**: High-resolution display with zoom capabilities
- **Navigation Controls**: Easy navigation (swipe/buttons) through all available images
- **Image Sequence**: Master Image displayed first, then FAI images in logical order
- **Zoom & Pan**: Image zoom and pan functionality for detailed inspection

### Master Image Upload & Management

**Master Image Concept:**
- **Purpose**: High-resolution "Master Pictures" for each unique Customer Part Number
- **Reference Standard**: Used as reference standard for quality control comparisons
- **Multiple Images**: Support for multiple Master Images per part (different angles, views)
- **Primary Designation**: Most recent/designated Master Picture is primary and displayed first

**Master Image Upload System:**
- **Authorized Users**: Only authorized users can upload Master Images
- **File Format Support**: Support high-resolution image formats (PNG, JPG, TIFF)
- **Upload Interface**: Dedicated upload interface for Master Images
- **Quality Validation**: Validate image quality and resolution before acceptance
- **Metadata Capture**: Capture upload date, user, camera/source information

**Master Image Management:**
- **Part Number Association**: Link Master Images to specific Customer Part Numbers
- **Version Control**: Handle multiple versions/views of Master Images
- **Primary Selection**: Designate which Master Image is primary for each part
- **Access Control**: Role-based access for uploading and managing Master Images
- **Storage Organization**: Organize Master Images separately from FAI images

### QC/Screening UI Integration

**SB Screening/QC Staff Interface:**
- **Integrated Access**: FAI and Master images accessible from SB Screening/QC interface
- **Visual Comparison**: Enable visual comparison between FAI/Master images and actual parts
- **Side-by-Side View**: Optional side-by-side comparison interface
- **Quick Reference**: Fast access to reference images during QC process
- **Annotation Capability**: Ability to mark or annotate images during QC (future enhancement)

**Mobile/Tablet Support:**
- **Touch Interface**: Touch-friendly interface for tablet-based QC stations
- **Swipe Navigation**: Intuitive swipe navigation between images
- **Pinch Zoom**: Touch zoom and pan for detailed inspection
- **Offline Capability**: Cache frequently accessed images for offline QC

### NP Location Integration

**NPQC Staff Access (Luxury Feature):**
- **Read-Only Access**: NP QC staff have read-only access to FAI/Master Images for parts they handle
- **Part Relevance**: Only show images for parts currently at NP location
- **Simplified Interface**: Streamlined interface appropriate for NP operations
- **Mobile Optimization**: Optimized for mobile/tablet devices used at NP

**NP Master Image Upload (Luxury Feature):**
- **Upload Capability**: NP staff (with permission) can upload Master Image if one doesn't exist
- **Quality Improvement**: Allow upload of better reference images if available
- **Approval Workflow**: Uploaded images may require approval before becoming Master
- **Contribution Tracking**: Track which NP staff contribute Master Images

### Image Storage & Configuration

**Storage Location Configuration:**
- **Local NAS Option**: Support for local Network Attached Storage (NAS) path
- **Cloud Storage Option**: Cloud storage bucket (Supabase Storage preferred)
- **Hybrid Approach**: Support both local and cloud storage simultaneously
- **Admin Configuration**: Admin-configurable storage preferences
- **Migration Support**: Ability to migrate between storage systems

**File Organization Structure:**
```
Storage Root/
├── FAI_Documents/
│   ├── [CustomerPartNumber]/
│   │   ├── [Version]/
│   │   │   ├── original_file.xlsx
│   │   │   └── extracted_images/
│   │   │       ├── image1.png
│   │   │       ├── image2.jpg
│   │   │       └── ...
├── Master_Images/
│   ├── [CustomerPartNumber]/
│   │   ├── primary_master.jpg
│   │   ├── master_v2.jpg
│   │   └── ...
```

### AI-Powered Enhancements (Luxury Features)

**AI-Powered FAI Image Extraction & Association:**
- **Automated Scanning**: N8N or "MCP Server" scans Gmail/shared drive for FAI Excels
- **AI Extraction**: AI extracts all images from Sheet2 automatically
- **Auto-Association**: System attempts auto-association with Customer Part Numbers
- **User Review**: User review/confirmation workflow for AI associations
- **Learning System**: AI learns from user confirmations to improve accuracy

**Intelligent File Processing:**
- **Content Recognition**: AI recognition of part numbers and descriptions in FAI files
- **Quality Assessment**: AI assessment of image quality and suitability
- **Duplicate Detection**: AI detection of duplicate or similar images
- **Auto-Categorization**: Intelligent categorization of images by type/angle

### Integration Points

**Order Management Integration:**
- **Order Line Association**: FAI images linked to specific order lines via Customer Part Number
- **Card Integration**: "View FAI Images" button on order line cards
- **Status Integration**: Show FAI availability status on order cards
- **Quick Access**: Direct links from order management to FAI images

**CT Number System Integration:**
- **CT-Level Access**: Access FAI images from CT assignment interface
- **QC Documentation**: Link FAI image viewing to CT-level QC results
- **Audit Trail**: Log FAI image access in CT audit logs
- **Reference Tracking**: Track which FAI images were used for specific CT QC

**Quality Control Workflow Integration:**
- **QC Station Integration**: Seamless access from QC workstations
- **Pass/Fail Criteria**: FAI images as reference for pass/fail decisions
- **Hold Resolution**: Use FAI images to resolve parts on hold
- **Training Tool**: FAI images for training new QC staff

### Technical Implementation

**File Processing System:**
- **Excel Library Integration**: Use library for Excel file processing (e.g., ExcelJS, SheetJS)
- **Image Extraction**: Extract embedded images from Excel sheets programmatically
- **Format Conversion**: Convert extracted images to web-optimized formats
- **Batch Processing**: Handle batch upload and processing of multiple FAI files

**Image Management System:**
- **CDN Integration**: Content Delivery Network for fast image delivery
- **Caching Strategy**: Intelligent caching for frequently accessed images
- **Lazy Loading**: Load images on demand to optimize performance
- **Progressive Loading**: Load thumbnails first, then full resolution on demand

**Search & Discovery:**
- **Image Search**: Search FAI images by part number, date, keywords
- **Visual Search**: Future capability for visual similarity search
- **Tag System**: Tagging system for better organization and discovery
- **Filter Options**: Filter by upload date, user, part category, etc.

### Security & Access Control

**Role-Based Access:**
- **Upload Permissions**: Control who can upload FAI files and Master Images
- **View Permissions**: Control access to FAI images based on user role
- **Customer Restrictions**: Restrict access based on customer assignment
- **Location-Based Access**: Different access levels for SB vs NP staff

**Data Protection:**
- **File Integrity**: Ensure uploaded files are not corrupted or malicious
- **Access Logging**: Log all access to FAI images for audit purposes
- **Backup Strategy**: Regular backup of FAI files and extracted images
- **Version Control**: Maintain history of file versions and changes

### Success Criteria

**Operational Efficiency:**
- QC staff can access reference images within 5 seconds
- 100% availability of FAI images for parts that have them
- Intuitive interface requiring minimal training
- Mobile-friendly access for tablet-based QC

**Quality Improvement:**
- Standardized reference materials for all QC decisions
- Reduced QC errors through visual comparison
- Consistent quality standards across shifts and staff
- Historical reference for quality trend analysis

**System Performance:**
- Fast image loading even for high-resolution Master Images
- Reliable image extraction from Excel files
- Scalable storage solution for growing image library
- Efficient search and discovery of relevant images

This FAI document integration is essential for maintaining quality standards and providing visual reference materials for the quality control workflow.