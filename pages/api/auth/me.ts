import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { getCookie } from "cookies-next";
import { getUserData } from "../../../helpers/getUserData";

interface UserResponse {
  success: boolean;
  wallet_address?: string;
  email?: string;
  access_token?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse>
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
    return;
  }

  try {
    // Get tokens from cookies
    const accessToken = getCookie("access_token", { req, res }) as string;
    const refreshToken = getCookie("refresh_token", { req, res }) as string;
    const sessionToken = getCookie("session_token", { req, res }) as string;

    // If no access token, return not authenticated
    if (!accessToken) {
      res.status(401).json({ success: false, message: "No access token found" });
      return;
    }

    // Verify session token if it exists
    if (sessionToken) {
      try {
        const decoded = jwt.verify(sessionToken, process.env.private_procedure_secret!) as { wallet: string };
        // Session token is valid, get fresh user data
        const userData = await getUserData(accessToken);
        
        if (userData.success) {
          res.status(200).json({
            success: true,
            wallet_address: userData.wallet_address,
            email: userData.email,
            access_token: accessToken,
          });
          return;
        }
      } catch (jwtError) {
        // Session token is invalid, continue with access token validation
        console.log("Session token invalid, validating access token");
      }
    }

    // Validate access token with BitkubNext API
    const userData = await getUserData(accessToken);
    
    if (userData.success) {
      res.status(200).json({
        success: true,
        wallet_address: userData.wallet_address,
        email: userData.email,
        access_token: accessToken,
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid access token" });
    }
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}