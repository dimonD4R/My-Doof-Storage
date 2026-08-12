import type { ReactNode } from "react";
import {
  IconCalendar,
  IconFolder,
  IconGrid,
  IconHeart,
  IconHome,
  IconTags,
  IconTimeline,
  IconUsers,
} from "../ui/icons";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: <IconHome width={18} height={18} />, end: true },
  { to: "/memories", label: "Memories", icon: <IconGrid width={18} height={18} /> },
  { to: "/events", label: "Events", icon: <IconCalendar width={18} height={18} /> },
  { to: "/timeline", label: "Timeline", icon: <IconTimeline width={18} height={18} /> },
  { to: "/collections", label: "Collections", icon: <IconFolder width={18} height={18} /> },
  { to: "/favorites", label: "Favorites", icon: <IconHeart width={18} height={18} /> },
  { to: "/categories", label: "Categories", icon: <IconTags width={18} height={18} /> },
  { to: "/people", label: "People", icon: <IconUsers width={18} height={18} /> },
];

export const MOBILE_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: <IconHome width={20} height={20} />, end: true },
  { to: "/memories", label: "Memories", icon: <IconGrid width={20} height={20} /> },
  { to: "/events", label: "Events", icon: <IconCalendar width={20} height={20} /> },
  { to: "/collections", label: "Collections", icon: <IconFolder width={20} height={20} /> },
  { to: "/timeline", label: "Timeline", icon: <IconTimeline width={20} height={20} /> },
];