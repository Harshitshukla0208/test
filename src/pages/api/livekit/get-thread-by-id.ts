import type { NextApiRequest, NextApiResponse } from 'next';

const EXTERNAL_URL = 'http://ec2-43-205-101-85.ap-south-1.compute.amazonaws.com:8400/api/livekit/get-thread_by_id';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { threadId } = req.query;
    
    if (!threadId) {
      return res.status(400).json({ error: 'Missing required parameter: threadId' });
    }

    const url = `${EXTERNAL_URL}/${threadId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('get-thread-by-id API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to fetch thread' 
    });
  }
}