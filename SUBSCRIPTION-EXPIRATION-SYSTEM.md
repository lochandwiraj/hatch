# Subscription Expiration System

## Overview

The subscription expiration system automatically manages user subscriptions, ensuring that users are downgraded to the free tier when their paid subscriptions expire. This system handles both monthly (30 days) and annual (365 days) subscriptions.

## Key Features

### 1. Automatic Expiration
- **Daily Check**: System runs daily to check for expired subscriptions
- **Automatic Downgrade**: Expired users are automatically moved to 'free' tier
- **Precise Timing**: Uses exact day counts (30 days for monthly, 365 days for annual)

### 2. Subscription Types
- **Monthly Plans**: 30 days exactly
- **Annual Plans**: 365 days exactly (1 year)
- **Free Tier**: No expiration date

### 3. Database Functions

#### Core Functions
```sql
-- Reset expired subscriptions to free tier
SELECT reset_expired_subscriptions();

-- Get subscription status for a user
SELECT * FROM get_user_subscription_status('user-uuid');

-- Extend subscription (admin only)
SELECT extend_user_subscription('user-uuid', 30, 'admin-uuid');

-- Check all subscription statuses
SELECT * FROM check_subscription_expiration();
```

#### Monitoring View
```sql
-- View all active subscriptions with status
SELECT * FROM subscription_status_view;
```

### 4. Payment Processing

When a payment is approved:
1. **New Subscription**: Starts from current time + duration
2. **Renewal**: Extends from current expiry date + duration
3. **Annual Flag**: `is_annual = true` for 365-day subscriptions
4. **Logging**: All activations are logged for audit trail

### 5. Automatic Processing

#### Supabase Edge Function
- **Location**: `supabase/functions/subscription-expiration-checker/`
- **Purpose**: Daily automated check for expired subscriptions
- **Execution**: Can be triggered via cron job or GitHub Actions

#### Setup Instructions

1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy subscription-expiration-checker
   ```

2. **Set up Daily Cron Job** (GitHub Actions example):
   ```yaml
   name: Daily Subscription Check
   on:
     schedule:
       - cron: '0 0 * * *'  # Daily at midnight UTC
   
   jobs:
     check-subscriptions:
       runs-on: ubuntu-latest
       steps:
         - name: Call Subscription Checker
           run: |
             curl -X POST \
               -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
               https://your-project.supabase.co/functions/v1/subscription-expiration-checker
   ```

### 6. Database Schema

#### Tables Created
- `subscription_expiration_log`: Tracks automatic expirations
- `subscription_extension_log`: Tracks manual extensions
- `subscription_activation_log`: Tracks new subscription activations

#### Key Fields in user_profiles
- `subscription_tier`: Current tier ('free', 'explorer_99', 'professional_149')
- `subscription_expires_at`: Exact expiration timestamp
- `subscription_updated_at`: Last update timestamp

#### Key Fields in payment_requests
- `is_annual`: Boolean flag for annual subscriptions
- `plan_tier`: Target subscription tier
- `amount`: Payment amount

### 7. User Experience

#### Payment Flow
1. User selects plan (Explorer/Professional)
2. User chooses billing cycle (Monthly/Annual)
3. Payment modal shows correct duration:
   - Monthly: "30 days"
   - Annual: "365 days (1 year)"
4. Payment processed with correct expiration date

#### Subscription Status
Users can see their subscription status including:
- Current tier
- Expiration date
- Days remaining
- Renewal options

### 8. Admin Features

#### Monitoring
- View all subscriptions and their status
- See expiring subscriptions (within 7 days)
- Track subscription history and changes

#### Manual Management
```sql
-- Extend a user's subscription by 30 days
SELECT extend_user_subscription('user-uuid', 30, 'admin-uuid');

-- Check specific user's status
SELECT * FROM get_user_subscription_status('user-uuid');
```

### 9. Implementation Details

#### Exact Duration Calculation
- **Monthly**: `NOW() + INTERVAL '30 days'`
- **Annual**: `NOW() + INTERVAL '365 days'`
- **Renewal**: Extends from current expiry, not from current time

#### Timezone Handling
- All timestamps use `TIMESTAMP WITH TIME ZONE`
- Consistent UTC-based calculations
- Proper handling across different user timezones

#### Error Handling
- Graceful handling of edge cases
- Comprehensive logging for debugging
- Rollback capabilities for failed operations

### 10. Testing

#### Manual Testing
```sql
-- Check current subscription status
SELECT * FROM subscription_status_view;

-- Manually trigger expiration check
SELECT reset_expired_subscriptions();

-- View expiration logs
SELECT * FROM subscription_expiration_log ORDER BY processed_at DESC;
```

#### Test Scenarios
1. **New Monthly Subscription**: Should expire in exactly 30 days
2. **New Annual Subscription**: Should expire in exactly 365 days
3. **Renewal Before Expiry**: Should extend from current expiry date
4. **Renewal After Expiry**: Should start from current time
5. **Automatic Expiration**: Should downgrade to free tier

### 11. Monitoring and Alerts

#### Key Metrics to Monitor
- Number of active subscriptions
- Daily expiration count
- Subscriptions expiring within 7 days
- Failed payment processing attempts

#### Recommended Alerts
- Daily summary of expiration processing
- Alert when many subscriptions expire simultaneously
- Notification for failed automatic processing

### 12. Security Considerations

#### Row Level Security (RLS)
- Users can only view their own subscription data
- Admins have full access to all subscription data
- Secure function execution with proper permissions

#### Data Privacy
- Subscription logs include minimal personal information
- Secure storage of payment-related data
- Proper cleanup of expired data

## Conclusion

This subscription expiration system provides a robust, automated solution for managing user subscriptions. It ensures accurate billing cycles, automatic downgrades, and comprehensive monitoring while maintaining security and data integrity.

The system is designed to handle scale and provides both automated processing and manual override capabilities for administrative needs.