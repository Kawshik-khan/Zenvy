import { registerGlobals } from "@livekit/react-native";

// WebRTC globals LiveKit needs; must run before any call screen mounts.
registerGlobals();
