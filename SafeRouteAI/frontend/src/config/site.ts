export const siteConfig = {
  name: "Navora",
  description: "Built with Next.js 16, React 19, and TypeScript",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/og.png`,
  links: {
    twitter: "https://twitter.com/username",
    github: "https://github.com/username",
  },
};

export const navigationItems = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About",
    href: "/about",
  },
  {
    title: "Contact",
    href: "/contact",
  },
];
