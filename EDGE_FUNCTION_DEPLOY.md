# Edge Function Deployment Guide

## What is the `create-seller-user` function?

The `supabase/functions/create-seller-user` is a **Supabase Edge Function** (TypeScript, runs server-side) that:
1. Receives email, password, fullName, and businessName from the client.
2. Uses the **admin API** (with `SUPABASE_SERVICE_ROLE_KEY`) to create a confirmed user.
3. Atomically inserts the `trova_profiles` and `trova_sellers` records.
4. Returns success or an error.

**Why this approach?**
- Avoids client-side rate limits (429 "email ratio limit exceeded").
- Users are created as **confirmed** immediately (no email verification wait).
- Avoids RLS/session timing issues (server-side inserts use service role with full permissions).
- All operations are atomic (all-or-nothing).

---

## Prerequisites

You must have the **Supabase CLI** installed locally:

```bash
brew install supabase/tap/supabase  # macOS
# or on Windows, use the installer or choco install supabase
# https://supabase.com/docs/guides/cli/getting-started
```

---

## Deploy the Function

1. **Authenticate with Supabase CLI:**
   ```bash
   supabase login
   ```
   (Follow the browser prompt to create an access token.)

2. **Link your Supabase project:**
   From the repo root, run:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Find `YOUR_PROJECT_REF` in your Supabase dashboard URL: `supabase.com/dashboard/project/YOUR_PROJECT_REF/...`)

3. **Deploy the function:**
   ```bash
   supabase functions deploy create-seller-user
   ```

4. **Confirm deployment:**
   The CLI will output a function URL like:
   ```
   Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-seller-user
   ```

---

## Environment Variables

The function **automatically inherits** these from your Supabase project:
- `SUPABASE_URL` — your Supabase project URL (injected by Supabase runtime).
- `SUPABASE_SERVICE_ROLE_KEY` — admin API key (injected securely by Supabase).

**No manual env var setup is needed.** Supabase Edge Functions have built-in access to these.

---

## Testing

After deployment, test the function from your client (already wired in `SignUpForm.tsx`):

1. Open http://localhost:3003/ (or your dev server).
2. Fill out the signup form.
3. Submit.

Expected flow:
- Client calls the Edge Function with email, password, fullName, businessName.
- Edge Function creates a confirmed user and profile/seller rows.
- Client receives success and automatically signs the user in.
- User is logged in and can access the dashboard.

---

## Troubleshooting

**Function returns 400 "email already exists":**
- The email is already registered. Use a different email.

**Function returns 500:**
- Check the Supabase function logs:
  ```bash
  supabase functions list create-seller-user
  supabase functions logs create-seller-user
  ```
  Or check in the Supabase dashboard: **Functions** → **create-seller-user** → **Logs**.

**Client can't call the function (CORS error):**
- Edge Functions are public by default, but CORS policy may block them.
- Solution: Ensure your client's `.env.VITE_SUPABASE_URL` matches the URL returned by `supabase functions deploy`.

**"Function URL not found" when client calls it:**
- The function may not be deployed yet. Run `supabase functions deploy create-seller-user` again.
- Verify the `VITE_SUPABASE_URL` in your `.env` is correct.

---

## Next Steps

1. Deploy the function.
2. Test signup from the app.
3. Verify a new user appears in Supabase dashboard (Authentication → Users) with "Confirmed" status.
4. Verify `trova_profiles` and `trova_sellers` rows were inserted in your database.
