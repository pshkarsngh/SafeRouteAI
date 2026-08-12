export interface MenuItem {
  title: string;
  href: string;
}

export const defaultMenuItems: MenuItem[] = [
  { title: "Home", href: "/" },
  { title: "Projects", href: "/projects" },
  { title: "About", href: "/about" },
  { title: "Services", href: "/services" },
  { title: "Contact", href: "/contact" },
];

export const defaultSocialLinks: MenuItem[] = [
  { title: "Instagram", href: "https://instagram.com" },
  { title: "LinkedIn", href: "https://linkedin.com" },
  { title: "GitHub", href: "https://github.com" },
  { title: "X", href: "https://x.com" },
];

export const DEFAULT_BRAND = "STUDIO";
export const YEAR_LABEL = "2026";
export const COPYRIGHT_LABEL = "© 2026";
