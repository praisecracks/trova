# Supabase Integration & Server-Side User Creation — Complete Setup Guide

## Status: Ready to Deploy

Your Trova app now has:
- ✅ **Supabase client & auth helpers** (`frontend/src/lib/auth.ts`)
- ✅ **Edge Function for server-side user creation** (`supabase/functions/create-seller-user/index.ts`)
- ✅ **Updated signup UI** (wired to call the Edge Function)
- ✅ **Database schema** with RLS policies, profiles, and sellers table
- ✅ **DB trigger** to auto-create profiles/sellers on auth.users insert (fallback)

---

## 🚀 Quick Setup (3 steps)

### Step 1: Deploy the Edge Function

Install Supabase CLI if you haven't:
```bash
# macOS/Linux:
brew install supabase/tap/supabase

# Windows: Download installer or use:
choco install supabase
```

Then from your repo root, authenticate and deploy:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-seller-user
```

Replace `YOUR_PROJECT_REF` with the ref from your Supabase dashboard URL (e.g., `supabase.com/dashboard/project/abc123xyz/...` → `abc123xyz`).

**Expected output:**
```
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-seller-user
```

✅ Copy this URL — verify it matches `VITE_SUPABASE_URL` in your `.env`.

---

### Step 2: Run Optional DB Migrations (recommended for production)

These set up server-side safety nets:

1. In Supabase dashboard → **SQL Editor** → **New Query**.
2. Paste contents of `supabase/migrations/002_fix_sellers_id_default.sql` and run.
3. Paste contents of `supabase/migrations/003_create_profiles_on_auth.sql` and run.

(These are optional for local testing but recommended for live deployments.)

---

### Step 3: Test Signup

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3003 (or the port Vite shows).

3. Go to **Sign Up** tab.

4. Fill in a **new email address** (not one you've tried before — Supabase has rate limits).

5. Fill in **Name/Business Name**, password, and complete the **Slide to Verify**.

6. Click **Create My Free Account**.

**Expected flow:**
- ✅ Spinner shows "Creating your account..."
- ✅ Edge Function creates a confirmed user (no email verification needed).
- ✅ Profile & seller rows inserted server-side.
- ✅ User auto-signs in.
- ✅ You see "Account Created!" and are logged into the dashboard.

---

## 🔧 If Something Goes Wrong

### Error: "Email ratio limit exceeded" (HTTP 429)
- **Cause:** Too many signup requests in a short time.
- **Fix:** Wait ~1 hour or use a different email address.

### Error: "Invalid request body" or CORS error
- **Cause:** Edge Function URL mismatch or `.env` not set.
- **Check:** Verify `VITE_SUPABASE_URL` in `.env` matches the function URL from Step 1.
- **Fix:** Restart dev server (`npm run dev`).

### Error: "Email already exists"
- **Cause:** That email was already used.
- **Fix:** Use a different email (e.g., test+2@example.com).

### User created but can't sign in
- **Cause:** Email confirmation is required (shouldn't happen with Edge Function).
- **Workaround:** Delete the user from Supabase dashboard (Authentication → Users → delete) and try again.

### Function returns 500
- **Check logs:**
  ```bash
  supabase functions list create-seller-user
  supabase functions logs create-seller-user
  ```
  Or in dashboard: **Functions** → **create-seller-user** → **Logs**.

---

## 📋 What Each File Does

| File | Purpose |
|------|---------|
| `frontend/src/lib/supabaseClient.ts` | Supabase client initializer |
| `frontend/src/lib/auth.ts` | Auth helpers (signUpSeller now calls Edge Function) |
| `supabase/functions/create-seller-user/index.ts` | Edge Function (server-side user creation) |
| `frontend/src/components/auth/SignUpForm.tsx` | Signup UI (calls signUpSeller) |
| `supabase/migrations/001_initial_schema.sql` | DB schema, tables, RLS policies |
| `supabase/migrations/002_fix_sellers_id_default.sql` | Default UUID for sellers.id |
| `supabase/migrations/003_create_profiles_on_auth.sql` | DB trigger (auto-create profiles on auth.users insert) |

---

## 🔒 Security Notes

- **Service role key:** Never exposed to the client. Only runs server-side in the Edge Function.
- **RLS policies:** Protect all DB tables (only authenticated users can read/write their own data).
- **Edge Functions:** Supabase-managed, no infrastructure to maintain.
- **User data:** Passwords hashed by Supabase Auth, stored securely.

---

## ✨ Next Steps (After Testing)

1. **Deploy to production:** Use `supabase functions deploy create-seller-user` again from your production branch.
2. **Set up email confirmation (optional):** Dashboard → Authentication → Settings → "Enable email confirmations" (currently OFF for easy testing).
3. **Add Paystack integration:** Wire payment flow to accept `VITE_PAYSTACK_KEY` from `.env`.
4. **Implement staff login:** Protected routes already set up; link to staff-only dashboard in Sidebar.

---

## 📞 Support

If you get stuck:
1. Check the **Supabase Logs**: Dashboard → Logs & Analytics → Postgres Logs (for DB errors).
2. Check **Edge Function Logs**: `supabase functions logs create-seller-user`.
3. Check **Browser Console** (F12 → Console) for client-side errors.
