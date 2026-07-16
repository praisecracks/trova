declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore Supabase Edge Function uses Deno's remote import support.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface CreateSellerUserRequest {
  email: string;
  password: string;
  fullName: string;
  businessName?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const jsonResponse = (body: object, status: number) =>
  new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { email, password, fullName, businessName } =
      (await req.json()) as CreateSellerUserRequest;

    if (!email || !password || !fullName) {
      return jsonResponse(
        { error: 'Missing required fields: email, password, fullName' },
        400
      );
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return jsonResponse(
        { error: authError?.message || 'Failed to create user' },
        400
      );
    }

    const userId = authData.user.id;

    const { error: profileError } = await supabase.from('trova_profiles').insert([
      { id: userId, email, role: 'seller', display_name: fullName },
    ]);
    if (profileError) {
      return jsonResponse(
        { error: `Profile creation failed: ${profileError.message}` },
        400
      );
    }

    const { error: sellerError } = await supabase.from('trova_sellers').insert([
      { id: userId, profile_id: userId, business_name: businessName || fullName },
    ]);
    if (sellerError) {
      return jsonResponse(
        { error: `Seller creation failed: ${sellerError.message}` },
        400
      );
    }

    return jsonResponse(
      {
        success: true,
        userId,
        email,
        message: 'User and profile created successfully',
      },
      200
    );
  } catch (error: any) {
    return jsonResponse(
      { error: error?.message || 'Internal server error' },
      500
    );
  }
};
