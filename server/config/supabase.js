const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Global Supabase admin client for the server.
 * Used for authenticated server-side operations in video creation.
 */
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = { supabase };
