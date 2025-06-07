# Supabase Database Setup Guide

This guide will help you set up your Supabase database for the Mini-ERP Order Management QC App.

## 🚀 Step 1: Create Supabase Project

1. **Go to Supabase**: Visit [supabase.com](https://supabase.com)
2. **Sign In/Sign Up**: Create an account or sign in
3. **Create New Project**: 
   - Click "New Project"
   - Choose your organization
   - Name: `mini-erp-order-management`
   - Database Password: Choose a strong password (save this!)
   - Region: Choose closest to your location
   - Click "Create new project"

## 🔑 Step 2: Get Your API Keys

Once your project is created:

1. **Go to Settings**: Click the gear icon in the left sidebar
2. **API Settings**: Click on "API" in the settings menu
3. **Copy Your Keys**:
   - **Project URL**: Copy the "Project URL" 
   - **anon public key**: Copy the "anon public" key

## 📝 Step 3: Configure Environment Variables

1. **Create .env file**: In your project root, create a `.env` file
2. **Add your Supabase credentials**:

```bash
# Copy from .env.example and fill in your actual values
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# These can be configured later
VITE_N8N_WEBHOOK_URL=
VITE_NPS_URL=
VITE_APP_TITLE="Mini-ERP Order Management QC App"
VITE_UID_PREFIX=A
```

## 🗄️ Step 4: Set Up Database Schema

### Option A: Using SQL Editor (Recommended)

1. **Open SQL Editor**: In Supabase dashboard, click "SQL Editor" in the left sidebar
2. **Create New Query**: Click "New Query"
3. **Run Schema Script**:
   - Copy the contents of `supabase/schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute
   - Wait for completion (should show "Success")

4. **Run RLS Policies**:
   - Create another new query
   - Copy the contents of `supabase/rls_policies.sql`
   - Paste and run
   - Wait for completion

5. **Run Initial Data**:
   - Create another new query
   - Copy the contents of `supabase/initial_data.sql`
   - Paste and run
   - This creates default roles, customers, and settings

### Option B: Using Supabase CLI (Advanced)

If you prefer using the CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push the schema
supabase db push
```

## 👤 Step 5: Create Your First Admin User

Since the app uses role-based permissions, you need to create an admin user:

### Method 1: Through Supabase Dashboard

1. **Go to Authentication**: Click "Authentication" → "Users" in Supabase dashboard
2. **Add User**: Click "Add User"
3. **Fill Details**:
   - Email: your-email@company.com
   - Password: Choose a strong password
   - Email Confirm: Check this if you want to skip email confirmation
4. **Click "Create User"**

### Method 2: Using SQL (After creating the user above)

1. **Get User ID**: From the Users table, copy your user's ID
2. **Run SQL**: In SQL Editor, run this query (replace the IDs):

```sql
-- First, get the Director/Admin role ID
SELECT id FROM roles WHERE name = 'Director/Admin';

-- Then insert your user profile (replace with actual IDs)
INSERT INTO users (id, email, role_id, first_name, last_name, is_active)
VALUES (
    'your-user-id-from-auth-users',
    'your-email@company.com',
    'director-role-id-from-above-query',
    'Your First Name',
    'Your Last Name',
    true
);
```

## ✅ Step 6: Test the Setup

1. **Start Your App**: Run `npm run dev` in your project
2. **Try to Login**: Use the email/password you created
3. **Check Access**: You should have full admin access

## 🔧 Step 7: Enable Real-time (Optional but Recommended)

1. **Go to Database**: Click "Database" → "Replication" in Supabase dashboard
2. **Enable Real-time**: Toggle on for these tables:
   - `order_lines`
   - `order_line_quantities`
   - `quantity_logs`
   - `ct_numbers`
   - `transfers`

## 📊 Step 8: Verify Database Structure

In Supabase dashboard, go to "Database" → "Tables" and verify you have:

### Core Tables:
- ✅ `users` - User profiles and roles
- ✅ `roles` - Role definitions with permissions
- ✅ `order_lines` - Main order data
- ✅ `order_line_quantities` - Quantity tracking
- ✅ `quantity_logs` - Audit trail
- ✅ `ct_numbers` - Serial number management
- ✅ `customers` - Customer master data
- ✅ `product_categories` - Product categories

### Supporting Tables:
- ✅ `fai_documents` - FAI document management
- ✅ `fai_images` - FAI image storage
- ✅ `master_images` - Master image storage
- ✅ `vendors` - Vendor information
- ✅ `transfers` - Inter-location transfers
- ✅ `invoices` - Invoice management
- ✅ `np_quantities` - NP location quantities
- ✅ `audit_logs` - System audit trail
- ✅ `system_settings` - Application settings

## 🛡️ Step 9: Security Checklist

Verify these security features are working:

1. **RLS Enabled**: All tables should show "RLS Enabled" in the Database view
2. **Policies Active**: Each table should have multiple policies
3. **Auth Working**: You can login/logout successfully
4. **Role Permissions**: Different roles see different data

## 🚨 Troubleshooting

### Common Issues:

1. **"relation does not exist" error**:
   - Make sure you ran the schema.sql file completely
   - Check for any SQL errors in the output

2. **"permission denied" error**:
   - Ensure RLS policies were applied correctly
   - Check that your user has the right role assigned

3. **Can't login**:
   - Verify your environment variables are correct
   - Check that the user was created successfully in auth.users

4. **Real-time not working**:
   - Enable replication for the required tables
   - Check browser console for connection errors

## 🎯 Next Steps

Once your database is set up:

1. **Test the Development Server**: Verify your app connects to Supabase
2. **Create Additional Users**: Add users for different roles
3. **Import Initial Orders**: Start adding your order data
4. **Configure WhatsApp**: Set up N8N webhooks for notifications
5. **Set Up Label Printing**: Configure your Network Print Server

---

**Need Help?** 
- Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review the error logs in Supabase dashboard
- Verify each step was completed successfully

This setup creates a robust, secure database foundation for your Mini-ERP system!