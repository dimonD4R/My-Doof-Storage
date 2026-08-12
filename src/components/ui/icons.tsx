import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(props: P) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
);
export const IconFolder = (p: P) => (
  <svg {...base(p)}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
);
export const IconTimeline = (p: P) => (
  <svg {...base(p)}><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="10" r="2.5"/><path d="M6 8.5v7M8.5 6h9.5M7.5 18h8"/></svg>
);
export const IconTags = (p: P) => (
  <svg {...base(p)}><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z"/><circle cx="8.5" cy="8.5" r="1"/><path d="M12 21l9-9"/></svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.3-5 6.5-5s5.9 1.6 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 15.5c2.6.2 4.4 1.6 5 4.5"/></svg>
);
export const IconHeart = (p: P) => (
  <svg {...base(p)}><path d="M12 20.5s-7.5-4.7-9.5-9C1 7.8 3 4.5 6 4.5c2 0 3.5 1 4.5 2.7h3C14.5 5.5 16 4.5 18 4.5c3 0 5 3.3 3.5 7-2 4.3-9.5 9-9.5 9z"/></svg>
);
export const IconHeartFill = (p: P) => (
  <svg {...base({ fill: "currentColor", stroke: "none", ...p })}><path d="M12 20.5s-7.5-4.7-9.5-9C1 7.8 3 4.5 6 4.5c2 0 3.5 1 4.5 2.7h3C14.5 5.5 16 4.5 18 4.5c3 0 5 3.3 3.5 7-2 4.3-9.5 9-9.5 9z"/></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
);
export const IconExternal = (p: P) => (
  <svg {...base(p)}><path d="M13 5h6v6"/><path d="M19 5 10 14"/><path d="M19 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/></svg>
);
export const IconShare = (p: P) => (
  <svg {...base(p)}><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.9 7.6-4.7M8.2 13.1l7.6 4.7"/></svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18"/></svg>
);
export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}><path d="m15 5-7 7 7 7"/></svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base(p)}><path d="m9 5 7 7-7 7"/></svg>
);
export const IconChevronUp = (p: P) => (
  <svg {...base(p)}><path d="m5 15 7-7 7 7"/></svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}><path d="m5 9 7 7 7-7"/></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>
);
export const IconMinus = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14"/></svg>
);
export const IconDots = (p: P) => (
  <svg {...base(p)}><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></svg>
);
export const IconPlay = (p: P) => (
  <svg {...base({ fill: "currentColor", stroke: "none", ...p })}><path d="M8 5.5v13l11-6.5z"/></svg>
);
export const IconPause = (p: P) => (
  <svg {...base({ fill: "currentColor", stroke: "none", ...p })}><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
);
export const IconVolume = (p: P) => (
  <svg {...base(p)}><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>
);
export const IconVolumeMute = (p: P) => (
  <svg {...base(p)}><path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 4 6M21 9l-4 6"/></svg>
);
export const IconZoomIn = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2M11 8v6M8 11h6"/></svg>
);
export const IconZoomOut = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2M8 11h6"/></svg>
);
export const IconMaximize = (p: P) => (
  <svg {...base(p)}><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
);
export const IconMinimize = (p: P) => (
  <svg {...base(p)}><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
);
export const IconPhoto = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m3 17 5-5 4 4 3-3 6 6"/></svg>
);
export const IconFilm = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/></svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/></svg>
);
export const IconLink = (p: P) => (
  <svg {...base(p)}><path d="M9.5 14.5 14.5 9.5"/><path d="M7 17 5.5 18.5a3.5 3.5 0 0 1-5-5L3 11a3.5 3.5 0 0 1 5 0l.7.7"/><path d="M17 7l1.5-1.5a3.5 3.5 0 0 1 5 5L21 13a3.5 3.5 0 0 1-5 0l-.7-.7"/></svg>
);
export const IconQr = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 20h1"/></svg>
);
export const IconRefresh = (p: P) => (
  <svg {...base(p)}><path d="M20 12a8 8 0 1 1-2.3-5.6M20 3v6h-6"/></svg>
);
export const IconFilter = (p: P) => (
  <svg {...base(p)}><path d="M3 5h18M6 12h12M10 19h4"/></svg>
);
export const IconShuffle = (p: P) => (
  <svg {...base(p)}><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6M4 4l5 5"/></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="m5 12 5 5L20 7"/></svg>
);
export const IconEdit = (p: P) => (
  <svg {...base(p)}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>
);
export const IconLock = (p: P) => (
  <svg {...base(p)}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
);
export const IconClose = IconX;
export const IconArrowLeft = (p: P) => (
  <svg {...base(p)}><path d="M19 12H5m0 0 6-6m-6 6 6 6"/></svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14m0 0-6-6m6 6-6 6"/></svg>
);
export const IconSliders = (p: P) => (
  <svg {...base(p)}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>
);
export const IconStar = (p: P) => (
  <svg {...base(p)}><path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z"/></svg>
);
export const IconWarning = (p: P) => (
  <svg {...base(p)}><path d="M12 3 2.5 20h19z"/><path d="M12 9v5M12 17.5v.5"/></svg>
);
export const IconInfo = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 8h0M12 12v5"/></svg>
);
export const IconEye = (p: P) => (
  <svg {...base(p)}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/></svg>
);
export const IconEyeOff = (p: P) => (
  <svg {...base(p)}><path d="M3 3l18 18"/><path d="M10.5 5.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.4 4M6.6 6.6A16 16 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.6-1.1"/></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
);
export const IconSparkles = (p: P) => (
  <svg {...base(p)}><path d="M12 3l1.9 4.8L19 9.7l-4.6 2.8L12 17l-2.4-4.5L5 9.7l5.1-1.9zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
);
export const IconLayoutMasonry = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="8" height="10" rx="1"/><rect x="13" y="3" width="8" height="6" rx="1"/><rect x="13" y="11" width="8" height="10" rx="1"/><rect x="3" y="15" width="8" height="6" rx="1"/></svg>
);
export const IconLayoutTimeline = (p: P) => (
  <svg {...base(p)}><path d="M4 12h16"/><circle cx="7" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="17" cy="12" r="1.6"/></svg>
);
export const IconLayoutGrid = IconGrid;
export const IconMoon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" /></svg>
);
export const IconSun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
);