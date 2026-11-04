import { NextApiRequest, NextApiResponse } from 'next';
import { setCookie } from 'cookies-next';
import { BROWSER_COOKIE, revokeBrowser, sameOrigin, ssoEnabled, ssoFailure } from '../../../server/auth/event-sso';
import { revokeCurrentWebInstallation } from '../../../server/notifications/http';
import { LINE_WEB_SESSION_COOKIE } from '../../../server/auth/line-web-session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pushRevocationProcessed = await revokeCurrentWebInstallation(req, res);
    if (ssoEnabled()) { sameOrigin(req); await revokeBrowser({ req, res }); }
    // Clear all authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(0), // Set expiry to past date to delete cookie
    };

    for (const name of [BROWSER_COOKIE, "access_token", "refresh_token", "session_token", LINE_WEB_SESSION_COOKIE]) {
      setCookie(name, "", { req, res, ...cookieOptions, maxAge: 0 });
    }

    res.status(200).json({ success: true, message: 'Logged out successfully', ...(pushRevocationProcessed ? {pushRevocationProcessed:true} : {}) });
  } catch (error) {
    // Auth errors contain no raw credentials or database parameters in logs.
    res.status(ssoEnabled() ? ssoFailure(error).status : 500).json({ error: 'Internal server error' });
  }
}
