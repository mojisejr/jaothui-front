import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear all authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(0), // Set expiry to past date to delete cookie
    };

    res.setHeader('Set-Cookie', [
      `access_token=; ${Object.entries(cookieOptions).map(([key, value]) => `${key}=${value}`).join('; ')}`,
      `refresh_token=; ${Object.entries(cookieOptions).map(([key, value]) => `${key}=${value}`).join('; ')}`,
      `session_token=; ${Object.entries(cookieOptions).map(([key, value]) => `${key}=${value}`).join('; ')}`,
    ]);

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}