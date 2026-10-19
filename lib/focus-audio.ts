export type FocusTrack = {
  id: string;
  title: string;
  mood: string;
  src: string;
};

export const focusTracks: FocusTrack[] = [
  {
    id: "calm-chill-hop",
    title: "Calm Chill Hop",
    mood: "Lofi study beat",
    src: "/audio/-lofi-study-calm-peaceful-chill-hop.mp3",
  },
  {
    id: "lofi-focus",
    title: "Lofi Focus",
    mood: "Warm keys",
    src: "/audio/lofi-focus.wav",
  },
  {
    id: "soft-rain",
    title: "Soft Rain",
    mood: "Gentle noise",
    src: "/audio/soft-rain.wav",
  },
  {
    id: "deep-night",
    title: "Deep Night",
    mood: "Low pad",
    src: "/audio/deep-night.wav",
  },
];
