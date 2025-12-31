export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get credentials from environment variables
  const CURRENT_RMS_SUBDOMAIN = process.env.CURRENT_RMS_SUBDOMAIN;
  const CURRENT_RMS_AUTH_TOKEN = process.env.CURRENT_RMS_AUTH_TOKEN;

  if (!CURRENT_RMS_SUBDOMAIN || !CURRENT_RMS_AUTH_TOKEN) {
    return res.status(500).json({ 
      error: 'Server configuration error: Missing API credentials' 
    });
  }

  const { endpoint, method = 'GET', body } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  try {
    const cleanSubdomain = CURRENT_RMS_SUBDOMAIN.replace('.current-rms.com', '').trim();
    const url = `https://api.current-rms.com/api/v1/${endpoint}?subdomain=${cleanSubdomain}`;

    const options = {
      method: method,
      headers: {
        'X-SUBDOMAIN': cleanSubdomain,
        'X-AUTH-TOKEN': CURRENT_RMS_AUTH_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Current RMS API error', 
        details: data 
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
