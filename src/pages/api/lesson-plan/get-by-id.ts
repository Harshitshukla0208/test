import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lessonPlanId } = req.query;

    if (!lessonPlanId || typeof lessonPlanId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid lessonPlanId parameter'
      });
    }

    const authToken = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!authToken) {
      return res.status(401).json({ error: 'Authorization token not configured' });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/utilities/get-lesson-plan/${lessonPlanId}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get lesson plan by ID error:', errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch lesson plan',
        details: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching lesson plan:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}