import type { LiveKitCredentials } from "../api/types";

export type LiveCallViewProps = {
  credentials: LiveKitCredentials;
  /** Start with the camera on. */
  video: boolean;
  onLeave: () => void;
};
