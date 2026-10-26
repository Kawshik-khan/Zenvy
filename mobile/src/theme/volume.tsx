import { createContext, useContext, type ReactNode } from "react";
import { volumes, type Volume, type VolumeTokens } from "./tokens";

const VolumeContext = createContext<VolumeTokens>(volumes.loud);

/** Switches every component inside to the loud or quiet volume, like `.quiet` on the web. */
export function VolumeProvider({ volume, children }: { volume: Volume; children: ReactNode }) {
  return <VolumeContext.Provider value={volumes[volume]}>{children}</VolumeContext.Provider>;
}

export function useVolume() {
  return useContext(VolumeContext);
}
