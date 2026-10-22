import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lboanbhltmblyyefzvzr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxib2FuYmhsdG1ibHl5ZWZ6dnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzcxMjUsImV4cCI6MjEwODE1MzEyNX0.jFWIlj53celmxym2JFP1lrjw3H_Ez7wONFoo_I5LUKE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
