/* The anon/publishable key is safe in a browser when RLS policies are enabled. Never use a service_role key here. */
window.SECRETARIAT_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY'
};
