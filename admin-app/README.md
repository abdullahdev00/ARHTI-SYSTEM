# ARHTI Admin Panel

A React Native Expo app for managing ARHTI System users, subscriptions, and payments.

## Features

### 🔐 **Admin Authentication**
- Secure admin login with Supabase Auth
- Role-based access control
- Admin-only access validation

### 👥 **User Management**
- View all registered users
- Search and filter users
- Update user subscription status
- Activate/deactivate user accounts
- Set subscription plans (monthly/yearly)

### 📊 **Dashboard**
- Real-time user statistics
- Active subscriptions count
- Revenue tracking
- Trial users monitoring

### 💳 **Payment Management** (Coming Soon)
- Approve/reject payment requests
- Manual subscription activation
- Payment history tracking
- Revenue reports

## Setup Instructions

### 1. Install Dependencies
```bash
cd admin-app
npm install
```

### 2. Environment Configuration
Create `.env` file with:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ADMIN_SECRET=your-admin-secret
```

### 3. Admin Access Setup
To grant admin access, ensure your email contains 'admin' or is in the approved list:
- `admin@arhti.com`
- `abdullah@arhti.com`
- Any email containing 'admin'

### 4. Run the App
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## App Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (AdminAuth)
├── navigation/         # Navigation setup
├── screens/
│   ├── auth/          # Authentication screens
│   └── admin/         # Admin management screens
├── config/            # App configuration
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Key Screens

### 1. **Admin Login**
- Secure authentication for admin users
- Email/password login
- Admin role validation

### 2. **Dashboard**
- Overview of system statistics
- Quick action buttons
- Real-time data updates

### 3. **Users Management**
- Complete user list with search
- User detail modal
- Subscription management actions
- Status updates (Active/Trial/Inactive)

## Admin Actions

### User Subscription Management
- **Activate Monthly Plan**: Set user to active with 30-day subscription
- **Activate Yearly Plan**: Set user to active with 365-day subscription  
- **Set to Trial**: Reset user to trial mode
- **Deactivate**: Disable user access

### Statistics Tracking
- Total registered users
- Active subscription count
- Trial users count
- Monthly revenue estimation

## Database Integration

The app connects to the same Supabase database as the main ARHTI System:

### Tables Used:
- `user_profiles`: User information and subscription status
- `auth.users`: Supabase authentication data

### Key Fields:
- `subscription_status`: 'active' | 'trial' | 'inactive'
- `subscription_plan`: 'monthly' | 'yearly'
- `subscription_start_date`: Plan activation date
- `subscription_end_date`: Plan expiration date
- `payment_status`: 'paid' | 'pending' | 'failed'

## Security Features

### Admin Authentication
- Supabase Auth integration
- Email-based admin validation
- Secure session management

### Data Protection
- Row Level Security (RLS) on database
- Admin-only data access
- Secure API calls

## Building for Production

### Android APK
```bash
# Build APK for internal distribution
eas build --platform android --profile preview
```

### iOS Build
```bash
# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

## Usage Workflow

1. **Login**: Admin logs in with authorized email
2. **Dashboard**: View system overview and statistics
3. **User Management**: 
   - Search for specific users
   - View user details
   - Update subscription status
   - Activate/deactivate accounts
4. **Payment Processing**: 
   - Review payment requests (coming soon)
   - Manually activate subscriptions
   - Track revenue and payments

## Future Enhancements

### Planned Features
- **Payment Requests**: Approve/reject user payment submissions
- **Revenue Reports**: Detailed financial analytics
- **User Communication**: Send notifications to users
- **Bulk Actions**: Mass user management operations
- **Advanced Analytics**: User behavior and engagement metrics
- **Backup Management**: Database backup and restore

### Technical Improvements
- Push notifications for admin alerts
- Offline data caching
- Advanced search and filtering
- Export functionality for reports
- Multi-admin role management

## Support

For technical support or feature requests, contact the development team.

---

**ARHTI Admin Panel v1.0.0**  
*Secure • Efficient • User-Friendly*
