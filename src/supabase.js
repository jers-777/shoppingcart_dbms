import { createClient } from "@supabase/supabase-js";

// 1. Your API URL from the 'Integrations' screenshot
const supabaseUrl = "https://nwdqjccbsmdhdjdohlkb.supabase.co";

// 2. Copy the full 'Publishable key' from your 'API Keys' screenshot
// Click the 'copy' icon next to the key starting with 'sb_publishable_...'
const supabaseKey = "sb_publishable_fBf2PpljKboJh9MjQfphWQ_AMkLpX5m";
export const supabase = createClient(supabaseUrl, supabaseKey);
