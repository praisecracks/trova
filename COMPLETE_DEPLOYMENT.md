# Complete Deployment Guide — Supabase + Edge Function + RLS Fixes

This guide will take you from current state to a fully working signup/login system.

## What We're Fixing

1. **RLS Policy errors (42P17)** — nested subqueries causing 500 errors on profile lookup
2. **Email confirmation delays** — new users created as unconfirmed, blocking login
3. **CORS errors** — Edge Function not responding to browser preflight requests
4. **Error messages** — UI now shows actual errors instead of generic messages

---

## Step 1: Deploy the Updated Edge Function (CORS Headers)

The Edge Function was updated to include CORS headers. Deploy it now:

```bash
npx supabase functions deploy create-seller-user
```

**Expected output:**
```
Function URL: https://vkcqtfmczirfrpgjwqba.supabase.co/functions/v1/create-seller-user
✓ Deployed successfully
```

**Note:** Replace `vkcqtfmczirfrpgjwqba` with your actual Supabase project ref.

---

## Step 2: Run the RLS Policy Fixes in Supabase

The old RLS policies have nested subqueries that cause 500 errors. We've created a migration to fix them.

### Option A: Use Supabase CLI

```bash
npx supabase migration up
```

This runs all pending migrations including `004_fix_rls_policies.sql`.

### Option B: Manual SQL in Supabase Dashboard

1. Go to **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Copy the entire contents of `supabase/migrations/004_fix_rls_policies.sql`
3. Click **Run**
4. Verify no errors

---

## Step 3: Verify Admin User (if needed)

If you're testing staff login, ensure an admin user exists and is confirmed:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. Look for a user with `role = 'admin'` in `trova_profiles`
3. If the user row shows `Waiting for verification`:
   - Click the user
   - Click **Resend email** or manually confirm via the dashboard

**Or create a test admin user:**

1. **SQL Editor** → **New Query:**
```sql
-- Create a test admin user (confirmed)
insert into public.trova_profiles (id, email, role, display_name)
values ('00000000-0000-0000-0000-000000000001', 'admin@test.co', 'admin', 'Test Admin')
on conflict do nothing;
```

2. In **Authentication** → **Users**, create a user with:
   - Email: `admin@test.co`
   - Password: (any password)
   - Check **Auto-confirm user** ✓

---

## Step 4: Test Signup

1. Open your app at `http://localhost:3003/` (or the dev server port)
2. Click **Create Free Account** tab
3. Fill in form:
   - Name/Business: `Test Business`
   - Email: **use a NEW email** (not previously tried)
   - Password: `Test123!@`
   - Slide to verify
4. Click **Create My Free Account**

### Expected outcome
- ✅ Spinner shows "Creating your account..."
- ✅ Within 2-3 seconds: "Account Created!"
- ✅ Dashboard appears (logged in)

### If you see errors
- **"Email already exists"** → use a different email
- **"Email ratio limit exceeded"** → Supabase rate limit, wait 1 hour or use different email
- **"Signup failed: Service unavailable"** → Edge Function not deployed or URL mismatch
  - Verify: `VITE_SUPABASE_URL` in `.env` matches the function URL from Step 1

---

## Step 5: Test Staff/Admin Login

1. Go to `/staff/login` (or click "Staff Login" if visible)
2. Enter credentials:
   - Email: `admin@test.co` (from Step 3)
   - Password: (the password you set)
3. Click **Sign In**

### Expected outcome
- ✅ Login succeeds
- ✅ Redirects to `/admin` dashboard
- ✅ No "Invalid credentials" error

### If you see errors
- **"Email not confirmed"** → the admin user is not confirmed; re-run Step 3
- **"500 Internal Server Error"** → RLS policy issue; verify Step 2 ran successfully
- **"Invalid credentials"** → email/password mismatch or user doesn't exist

---

## Step 6: Verify Database State

After signup, confirm data was created:

1. **Supabase Dashboard** → **Table Editor**
2. Click `trova_profiles`
3. You should see the new profile with:
   - `id` = the user's UUID
   - `email` = the signup email
   - `role` = `seller`
   - `display_name` = the name you entered

4. Click `trova_sellers`
5. You should see the corresponding seller row with:
   - `id` = same as profile `id`
   - `profile_id` = same as profile `id`
   - `business_name` = the name you entered

---

## Troubleshooting

### Signup: "Failed to fetch" or CORS error
- **Fix:** Verify Edge Function was deployed (`supabase functions deploy create-seller-user`)
- **Check:** Browser Console → Network tab → look for `create-seller-user` request
- If status is **pending** or **blocked**, the function URL is wrong or not deployed

### Login: 500 error on profile fetch
- **Fix:** Run `004_fix_rls_policies.sql` (Step 2)
- **Check:** Supabase Dashboard → Logs → Postgres Logs for `42P17` or other SQL errors
- If still failing, paste the exact error log here

### Login: "Email not confirmed"
- **Fix:** User must be confirmed in Supabase
- Check **Authentication** → **Users** → user row → **Status** column
- If "Waiting for verification", either:
  - Click **Resend email** and confirm via email link, or
  - Click the user → **Confirm** to manually confirm

### Edge Function deployment fails
- Run: `npx supabase login` (if you haven't)
- Run: `npx supabase link --project-ref YOUR_PROJECT_REF`
- Then retry: `npx supabase functions deploy create-seller-user`

---

## Final Checklist

- [ ] Edge Function deployed (`supabase functions deploy create-seller-user`)
- [ ] RLS policy migration applied (`004_fix_rls_policies.sql` run in SQL Editor)
- [ ] Admin user created and confirmed (if testing staff login)
- [ ] `.env` has correct `VITE_SUPABASE_URL` matching your Supabase project
- [ ] Dev server running (`npm run dev`)
- [ ] Signup tested with new email → success
- [ ] Login tested with created account → dashboard appears
- [ ] Staff login tested with admin account → admin dashboard appears

---

## Questions?

If any step fails, provide:
1. The exact error message from the UI
2. The error from browser Console
3. The error from Supabase Dashboard → Logs → Postgres Logs
4. Which step it failed on

Paste those here and I'll diagnose the exact issue.
