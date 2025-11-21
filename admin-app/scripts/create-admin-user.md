# Create First Admin User in Supabase

Since we can't use the MCP tool to insert data directly, you need to manually create the first admin user in your Supabase database.

## Step 1: Go to Supabase SQL Editor

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query

## Step 2: Run This SQL to Create First Admin User

```sql
-- Create the first super admin user
INSERT INTO admin_users (
  email, 
  password_hash, 
  name, 
  role, 
  permissions,
  is_active
) VALUES (
  'admin@arhti.com',
  'hashed_admin123',  -- Change this password immediately!
  'Super Administrator',
  'super_admin',
  '{
    "manage_users": true,
    "manage_payments": true,
    "manage_plans": true,
    "view_analytics": true,
    "manage_admins": true
  }',
  true
) ON CONFLICT (email) DO NOTHING;

-- Verify the admin user was created
SELECT id, email, name, role, is_active, created_at FROM admin_users;
```

## Step 3: Test Admin Login

Use these credentials to test the admin login:
- **Email:** `admin@arhti.com`
- **Password:** `admin123`

## Step 4: Change Default Password (IMPORTANT!)

After first login, immediately change the password using the admin panel or run:

```sql
-- Update admin password (replace with proper hash in production)
UPDATE admin_users 
SET password_hash = 'hashed_your_new_password'
WHERE email = 'admin@arhti.com';
```

## Step 5: Create Additional Admin Users

Once logged in as super admin, you can create additional admin users through the admin panel with different roles:

### Admin Role Permissions:
- **super_admin**: Full access to everything
- **admin**: Can manage payments, verify transactions, view users
- **moderator**: Can only verify payments and view users

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Password Hashing**: The current implementation uses simple hashing for development. For production, implement proper bcrypt hashing.

2. **Session Security**: Sessions are stored in localStorage. For production, consider more secure session management.

3. **HTTPS Only**: Always use HTTPS in production for admin authentication.

4. **Regular Password Changes**: Enforce regular password changes for admin users.

5. **Audit Logging**: Consider adding audit logs for admin actions.

## Production Setup Checklist

- [ ] Implement proper bcrypt password hashing
- [ ] Set up HTTPS for admin panel
- [ ] Configure secure session management
- [ ] Set up audit logging for admin actions
- [ ] Create backup admin accounts
- [ ] Set up 2FA for super admin accounts
- [ ] Regular security reviews of admin permissions

## Troubleshooting

### If admin login fails:
1. Check if admin_users table exists
2. Verify the admin user record exists
3. Check if RLS policies are blocking access
4. Verify session management is working

### If permissions don't work:
1. Check the permissions JSON structure
2. Verify RLS policies on target tables
3. Check admin role assignment

## Database Schema Reference

The admin system uses these tables:
- `admin_users`: Admin user accounts with roles and permissions
- `admin_sessions`: Active admin sessions for authentication
- All other tables have RLS policies that check admin permissions
