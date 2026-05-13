import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client for the webhook.
// Using service role key if available, otherwise fallback to anon key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function OPTIONS() {
  // CORS preflight response
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_firstname, user_lastname, user_email, message } = body;

    if (!user_firstname || !user_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Insert directly into leads table
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          first_name: user_firstname,
          last_name: user_lastname,
          email: user_email,
          message: message,
          source: 'Lighthouse Labs Website',
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data }, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Contact Webhook Error:', error);
    return NextResponse.json({ error: message }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
