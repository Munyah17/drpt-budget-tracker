import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lboanbhltmblyyefzvzr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxib2FuYmhsdG1ibHl5ZWZ6dnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzcxMjUsImV4cCI6MjEwODE1MzEyNX0.jFWIlj53celmxym2JFP1lrjw3H_Ez7wONFoo_I5LUKE';

/**
 * Remember-me-aware auth storage. When the user opted into "Remember me" the
 * session lives in localStorage (survives browser restarts); otherwise it goes
 * to sessionStorage so closing the tab ends the login. Reads check both so a
 * live tab session always resolves.
 */
const authStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('drpatie-remember') === '1') {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
  db: {
    schema: 'public',
  },
});
