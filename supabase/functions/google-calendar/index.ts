import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  colorId?: string;
}

// Mapeamento das cores do app para colorId do Google Calendar
const hexToColorId: Record<string, string> = {
  '#D50000': '11', // Tomate
  '#E67C73': '4',  // Flamingo
  '#F4511E': '6',  // Tangerina
  '#F6BF26': '5',  // Banana
  '#33B679': '2',  // Salvia
  '#0B8043': '10', // Manjericão
  '#039BE5': '7',  // Pavão
  '#3F51B5': '9',  // Mirtilo
  '#7986CB': '1',  // Lavanda
  '#8E24AA': '3',  // Uva
  '#616161': '8',  // Grafite
};

function getColorId(hex?: string): string | undefined {
  if (!hex) return undefined;
  return hexToColorId[hex.toUpperCase()] || hexToColorId[hex];
}

// Função para gerar prefixo visual baseado no status de confirmação
function getStatusPrefix(status?: string): string {
  switch (status) {
    case 'confirmado':
      return '✓ ';
    case 'atendido':
      return '✓✓ ';
    case 'cancelado':
      return '✗ ';
    default:
      return '';
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('User authenticated:', userId);

    // Parse request body
    const { action, ...params } = await req.json();
    console.log('Action:', action);

    // Get user settings (credentials)
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Settings error:', settingsError);
      throw new Error('Erro ao buscar configurações');
    }

    // Handle different actions
    switch (action) {
      case 'get-auth-url': {
        const { clientId, redirectUri } = params;
        
        if (!clientId) {
          return new Response(
            JSON.stringify({ error: 'Client ID não configurado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${scope}` +
          `&access_type=offline` +
          `&prompt=consent`;

        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exchange-code': {
        const { code, redirectUri } = params;

        if (!settings?.google_client_id || !settings?.google_client_secret) {
          return new Response(
            JSON.stringify({ error: 'Credenciais do Google não configuradas' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Exchanging code for tokens...');
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: settings.google_client_id,
            client_secret: settings.google_client_secret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData: GoogleTokenResponse = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          console.error('Token exchange error:', tokenData);
          return new Response(
            JSON.stringify({ error: 'Erro ao trocar código por token' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Tokens received, saving to database...');

        // Calculate token expiry
        const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000);

        // Save tokens to user settings
        const { error: updateError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            google_access_token: tokenData.access_token,
            google_refresh_token: tokenData.refresh_token || settings?.google_refresh_token,
            google_token_expiry: expiryDate.toISOString(),
            google_calendar_enabled: true,
          }, { onConflict: 'user_id' });

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        console.log('Disconnecting Google Calendar...');
        
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            google_access_token: null,
            google_refresh_token: null,
            google_token_expiry: null,
            google_calendar_enabled: false,
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Disconnect error:', updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync-appointment': {
        const { appointment } = params;

        if (!settings?.google_access_token || !settings?.google_calendar_enabled) {
          return new Response(
            JSON.stringify({ error: 'Google Calendar não conectado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if token needs refresh
        let accessToken = settings.google_access_token;
        const tokenExpiry = settings.google_token_expiry ? new Date(settings.google_token_expiry) : null;
        
        if (tokenExpiry && tokenExpiry <= new Date()) {
          console.log('Token expired, refreshing...');
          accessToken = await refreshAccessToken(supabase, userId, settings);
        }

        // Create or update calendar event
        const startDate = new Date(appointment.date);
        const endDate = new Date(startDate.getTime() + appointment.duration * 60000);
        const colorId = getColorId(appointment.serviceColor);
        const statusPrefix = getStatusPrefix(appointment.confirmationStatus);

        const event: CalendarEvent = {
          summary: `${statusPrefix}${appointment.clientName} - ${appointment.service}`,
          description: `Valor: R$ ${appointment.amount.toFixed(2)}${appointment.notes ? `\n\nObservações: ${appointment.notes}` : ''}`,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          ...(colorId && { colorId }),
        };

        console.log('Event color:', appointment.serviceColor, '->', colorId);

        // Add extendedProperties with appointmentId for idempotency
        const eventWithProps = {
          ...event,
          extendedProperties: {
            private: {
              appointmentId: appointment.id,
            },
          },
        };

        let eventId = appointment.googleEventId;
        let response: Response;

        // If no googleEventId, search for existing event by appointmentId to prevent duplicates
        if (!eventId) {
          console.log('No googleEventId, searching for existing event by appointmentId:', appointment.id);
          const searchResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=appointmentId%3D${appointment.id}&showDeleted=false`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            }
          );
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.items && searchData.items.length > 0) {
              eventId = searchData.items[0].id;
              console.log('Found existing event by appointmentId:', eventId);
            }
          }
        }

        if (eventId) {
          // Update existing event
          console.log('Updating calendar event:', eventId);
          response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventWithProps),
            }
          );
        } else {
          // Create new event
          console.log('Creating new calendar event');
          response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventWithProps),
            }
          );
        }

        // If PUT returned 404, fallback to POST (event was deleted from Google)
        if (eventId && response.status === 404) {
          console.log('Event not found (404), creating new event as fallback...');
          response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventWithProps),
            }
          );
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Calendar API error:', errorData);
          return new Response(
            JSON.stringify({ error: 'Erro ao sincronizar com Google Calendar' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const eventData = await response.json();
        console.log('Event synced:', eventData.id);

        return new Response(
          JSON.stringify({ eventId: eventData.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete-event': {
        const { eventId } = params;

        if (!settings?.google_access_token || !eventId) {
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let accessToken = settings.google_access_token;
        const tokenExpiry = settings.google_token_expiry ? new Date(settings.google_token_expiry) : null;
        
        if (tokenExpiry && tokenExpiry <= new Date()) {
          accessToken = await refreshAccessToken(supabase, userId, settings);
        }

        console.log('Deleting calendar event:', eventId);
        
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        );

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Function error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshAccessToken(supabase: any, userId: string, settings: any): Promise<string> {
  if (!settings.google_refresh_token || !settings.google_client_id || !settings.google_client_secret) {
    throw new Error('Não é possível renovar token - credenciais incompletas');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: settings.google_refresh_token,
      client_id: settings.google_client_id,
      client_secret: settings.google_client_secret,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData: GoogleTokenResponse = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Token refresh error:', tokenData);
    throw new Error('Erro ao renovar token de acesso');
  }

  const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000);

  await supabase
    .from('user_settings')
    .update({
      google_access_token: tokenData.access_token,
      google_token_expiry: expiryDate.toISOString(),
    })
    .eq('user_id', userId);

  return tokenData.access_token;
}
