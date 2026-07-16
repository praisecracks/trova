import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	const message = 'Missing Supabase environment variables. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and restart the dev server.';
	// Friendly console message
	// Try to render to DOM early so the dev page isn't blank
	if (typeof document !== 'undefined') {
		try {
			const root = document.getElementById('root');
			if (root) root.innerHTML = `<pre style="white-space:pre-wrap;color:#ff6b6b;background:#111;padding:16px;border-radius:8px;font-family:monospace">${message}</pre>`;
		} catch (e) {}
	}
	throw new Error(message);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');

      return fetch(input, {
        ...init,
        headers
      });
    }
  }
});

export default supabase;
