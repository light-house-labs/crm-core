import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client for the webhook.
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
    const { 
      company_name, 
      client_role, 
      client_email, 
      client_phone, 
      project_goals, 
      brand_assets_link, 
      digital_signature, 
      signature_timestamp 
    } = body;

    // Validate essential fields if needed
    if (!client_email || !digital_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Insert into the projects table so it shows up in the CRM UI!
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          project_name: `${company_name} - Onboarding`,
          description: project_goals,
          deliverables: `Role: ${client_role}\nEmail: ${client_email}\nPhone: ${client_phone}\nBrand Assets: ${brand_assets_link}\n\nDigital Signature: ${digital_signature}\nTimestamp: ${signature_timestamp}`,
          brand_kit_ready: !!brand_assets_link,
          phase: 'discovery',
          status: 'active',
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
    console.error('Onboarding Webhook Error:', error);
    return NextResponse.json({ error: message }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
