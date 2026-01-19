# Payment Cleanup System Setup

## 🎯 **Overview**
Automatically delete payment submissions older than 3 days to keep your database clean and maintain privacy.

## 📋 **Setup Instructions**

### **Step 1: Run Database Setup**
Execute this in Supabase SQL Editor:
```sql
-- Copy and paste content from scripts/auto-cleanup-payments.sql
```

### **Step 2: Choose Cleanup Method**

#### **Option A: Manual Cleanup (Recommended for Start)**
- Admin can manually run cleanup from the payments page
- Click "🗑️ Cleanup Old" button when old payments exist
- Safe and controlled cleanup process

#### **Option B: Automatic Cleanup via Edge Function**
1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy cleanup-payments
   ```

2. **Set up Cron Job (External Service):**
   - Use services like GitHub Actions, Vercel Cron, or Upstash
   - Call the Edge Function daily:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/cleanup-payments \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

#### **Option C: Application-Level Cleanup**
Add to your application startup or daily tasks:
```typescript
import { runPaymentCleanup } from '@/lib/cleanup'

// Run cleanup daily
setInterval(async () => {
  const result = await runPaymentCleanup()
  console.log('Cleanup result:', result)
}, 24 * 60 * 60 * 1000) // 24 hours
```

## 🔧 **Available Functions**

### **Database Functions:**
- `cleanup_old_payments()` - Delete old payments
- `run_payment_cleanup()` - Delete and return statistics
- `log_payment_cleanup()` - Delete and log activity

### **Client Functions:**
- `runPaymentCleanup()` - Manual cleanup from admin panel
- `checkOldPayments()` - Count old payments
- `getCleanupLogs()` - View cleanup history

## 📊 **Monitoring**

### **Check Old Payments:**
```sql
SELECT COUNT(*) FROM payment_submissions 
WHERE created_at < NOW() - INTERVAL '3 days';
```

### **View Cleanup Logs:**
```sql
SELECT * FROM payment_cleanup_log 
ORDER BY created_at DESC LIMIT 10;
```

### **Manual Cleanup:**
```sql
SELECT * FROM run_payment_cleanup();
```

## ⚙️ **Configuration**

### **Change Cleanup Period:**
To change from 3 days to another period, update the functions:
```sql
-- Change INTERVAL '3 days' to your preferred period
-- Example: INTERVAL '7 days' for weekly cleanup
-- Example: INTERVAL '1 day' for daily cleanup
```

### **Disable Cleanup:**
```sql
-- To temporarily disable, you can rename the functions
ALTER FUNCTION cleanup_old_payments RENAME TO cleanup_old_payments_disabled;
```

## 🚨 **Important Notes**

1. **Data Loss:** Cleanup permanently deletes payment records
2. **Approved Payments:** Consider keeping approved payments longer
3. **Screenshots:** Payment screenshots in storage are not automatically deleted
4. **Backup:** Consider backing up important payment data before cleanup
5. **Testing:** Test cleanup on staging environment first

## 🎯 **Recommended Schedule**

- **Development:** Manual cleanup as needed
- **Production:** Daily automatic cleanup
- **High Volume:** Twice daily cleanup

## 📈 **Benefits**

✅ **Database Performance:** Keeps payment table small and fast  
✅ **Privacy Compliance:** Automatically removes old payment data  
✅ **Storage Optimization:** Reduces database storage costs  
✅ **Admin Efficiency:** Less clutter in payment management  
✅ **Automated Maintenance:** Set-and-forget cleanup system  

## 🔍 **Troubleshooting**

### **Cleanup Not Working:**
1. Check function permissions
2. Verify RLS settings on payment_submissions table
3. Check Edge Function logs if using automatic cleanup

### **Performance Issues:**
1. Add indexes on created_at column
2. Run cleanup during low-traffic hours
3. Consider batch deletion for large datasets

### **Monitoring Cleanup:**
1. Check payment_cleanup_log table
2. Monitor database size trends
3. Set up alerts for cleanup failures