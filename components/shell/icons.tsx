import { Briefcase, Home, MessageCircle, Timer, User, Users, type LucideIcon } from "lucide-react";
import type { NavKey } from "./nav";

export const navIcons: Record<NavKey, LucideIcon> = {
  home: Home,
  partners: Users,
  messages: MessageCircle,
  jobs: Briefcase,
  focus: Timer,
  profile: User,
};
