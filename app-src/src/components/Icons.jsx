const Svg = ({ size = 18, sw = 2, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{children}</svg>
);

export const Bell = (p) => <Svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Svg>;
export const LogoutIcon = (p) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>;
export const ArrowRight = (p) => <Svg size={16} sw={2.4} {...p}><path d="M5 12h14M12 5l7 7-7 7" /></Svg>;
export const ArrowLeft = (p) => <Svg size={20} sw={2.2} {...p}><path d="m12 19-7-7 7-7M19 12H5" /></Svg>;
export const ChevronDown = (p) => <Svg size={16} sw={2.4} {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const ChevronLeft = (p) => <Svg size={14} sw={2.4} {...p}><path d="m15 18-6-6 6-6" /></Svg>;
export const ChevronRight = (p) => <Svg size={14} sw={2.4} {...p}><path d="m9 18 6-6-6-6" /></Svg>;
export const Check = (p) => <Svg size={11} sw={4} {...p}><path d="M20 6 9 17l-5-5" /></Svg>;
export const Calendar = (p) => <Svg size={11} sw={2.2} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>;
export const Clock = (p) => <Svg size={11} sw={2.2} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const Search = (p) => <Svg size={18} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>;
export const LinkIcon = (p) => <Svg size={11} sw={2.2} {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Svg>;
export const External = (p) => <Svg size={14} {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" /></Svg>;
export const Play = (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M6 4l14 8-14 8z" /></svg>;
export const Eye = (p) => <Svg {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg>;
export const EyeOff = (p) => <Svg {...p}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" /></Svg>;

export const TabHome = (p) => <Svg size={20} {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></Svg>;
export const TabCalendar = (p) => <Svg size={20} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>;
export const TabFolder = (p) => <Svg size={20} {...p}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></Svg>;
export const TabList = (p) => <Svg size={20} {...p}><path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8" /></Svg>;
export const TabSend = (p) => <Svg size={20} {...p}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Svg>;
export const TabSent = (p) => <Svg size={20} {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></Svg>;
export const Trash = (p) => <Svg size={16} {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></Svg>;
export const Pin = (p) => <Svg size={14} sw={2.2} {...p}><path d="M12 17v5M9 3h6l-1 7 3 3v2H7v-2l3-3z" /></Svg>;
export const Lock = (p) => <Svg size={14} sw={2.2} {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>;
export const More = (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>;
export const Send = (p) => <Svg size={20} sw={2.2} {...p}><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></Svg>;
export const ImageIcon = (p) => <Svg size={20} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></Svg>;
export const Close = (p) => <Svg size={16} sw={2.4} {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const Comment = (p) => <Svg size={14} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>;
export const Shield = (p) => <Svg size={18} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>;
export const Edit = (p) => <Svg size={16} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>;
export const Ban = (p) => <Svg size={16} sw={2.2} {...p}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></Svg>;
export const Plus = (p) => <Svg size={18} sw={2.4} {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const TabForum = (p) => <Svg size={20} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>;
