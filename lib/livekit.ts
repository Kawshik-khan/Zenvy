import { AccessToken } from "livekit-server-sdk";

export type LiveKitCallCredentials = {
  token: string;
  serverUrl: string;
  roomName: string;
};

export async function createLiveKitCallCredentials(params: {
  callId: string;
  userId: string;
  userName?: string | null;
}): Promise<LiveKitCallCredentials> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !serverUrl) {
    throw new Error("LiveKit is not configured");
  }

  const roomName = `call:${params.callId}`;
  const token = new AccessToken(apiKey, apiSecret, {
    identity: params.userId,
    name: params.userName || "Scholar",
    ttl: "2h",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    token: await token.toJwt(),
    serverUrl,
    roomName,
  };
}
