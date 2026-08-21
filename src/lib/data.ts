/**
 * Single source of truth for ALL site content.
 * PLACEHOLDERS ONLY — replace with real data when Himel provides it.
 * Never invent projects, clients, or experience.
 */

export interface ImpactStat {
  /** The headline number, e.g. "35%", "6 wks". */
  value: string;
  /** Short label describing what the number means, e.g. "conversion lift". */
  label: string;
}

export interface Project {
  title: string;
  year: string;
  role: string;
  description: string;
  /** Client-visible business outcomes. Placeholders until Himel provides real metrics. */
  impact: ImpactStat[];
  href?: string;
  image?: string;
}

export interface Service {
  title: string;
  description: string;
  tags: string[];
  icon: ServiceIcon;
  image: string;
}

export type ServiceIcon =
  | "landing-page"
  | "web-design"
  | "web-development"
  | "app-development"
  | "ai-automation";

export type ProcessIcon = "idea" | "design" | "build" | "ship";

export const serviceIconSources: Record<
  ServiceIcon,
  { alt: string; src: string }
> = {
  "landing-page": {
    alt: "Landing page service icon",
    src: "/img/services/icons/landing-page.png",
  },
  "web-design": {
    alt: "Website design service icon",
    src: "/img/services/icons/web-design.png",
  },
  "web-development": {
    alt: "Web development service icon",
    src: "/img/services/icons/web-dev.png",
  },
  "app-development": {
    alt: "App development service icon",
    src: "/img/services/icons/app-dev.png",
  },
  "ai-automation": {
    alt: "AI automation service icon",
    src: "/img/services/icons/ai-automation.png",
  },
};

export interface StackItem {
  name: string;
  /** Brand color used for the grayscale → color hover effect. */
  color: string;
}

export interface StackCapability {
  title: string;
  description: string;
  tools: string[];
  icon: ServiceIcon;
}

export interface ProcessStep {
  title: string;
  description: string;
  eyebrow: string;
  icon: ProcessIcon;
  image: string;
  imageAlt: string;
  video: string;
}

export type SocialIcon = "github" | "linkedin" | "x" | "email";

export interface SocialLink {
  label: string;
  href: string;
  icon: SocialIcon;
}

export interface NavigationItem {
  label: string;
  href: `#${string}`;
}

export interface HeroAction extends NavigationItem {
  variant: "solid" | "outline";
  icon?: "arrow-up-right";
}

export const profile = {
  name: "Himel",
  brand: "H.dev",
  role: "Design Engineer",
  tagline:
    "Have a business idea in mind? Let’s turn it into a digital product.",
  availability: "Available for freelance & remote",
  location: "Dhaka, Bangladesh",
  email: "hello@himel.dev",
  experienceYears: 4,
};

export const contact = {
  ctaLabel: "Start a project",
};

export const siteFooter = {
  locationLabel: "Location",
  contactLabel: "Contact",
  linksLabel: "Links",
  socialsLabel: "Socials",
  profileLabel: "Profile",
  copyright: "All rights reserved.",
};

export const navigation: NavigationItem[] = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "What I Use", href: "#stack" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const hero = {
  filledTitle: "SHAHADAT",
  outlinedTitle: "HIMEL",
  actions: [
    {
      label: "View selected work",
      href: "#work",
      variant: "solid",
      icon: "arrow-up-right",
    },
    {
      label: "Let’s talk",
      href: "#contact",
      variant: "outline",
    },
  ] satisfies HeroAction[],
};

export const work = {
  index: "01",
  filledTitle: "Selected",
  outlinedTitle: "Projects",
};

/**
 * About section manifesto. Rendered as a single left-aligned paragraph
 * that flows and wraps naturally; the section grows slightly beyond the
 * 60vh frame to accommodate the copy.
 */
export const about = {
  manifesto:
    "Crafting design that turns ambitious ideas into products people trust. " +
    "Turning complex experiences into interfaces that feel simple, intuitive, and human. " +
    "Bringing every detail together to create products that perform beautifully and endure.",
};

export const stats = [
  { value: 4, suffix: "+", label: "Years of experience" },
  { value: 20, suffix: "+", label: "Projects shipped" },
  { value: 10, suffix: "+", label: "Clients" },
];

export const projects: Project[] = [
  {
    title: "Project One",
    year: "2025",
    role: "Design Engineer",
    description:
      "Placeholder description. What the product was, the problem it solved, and the impact you delivered.",
    impact: [
      { value: "35%", label: "conversion lift" },
      { value: "6 wks", label: "MVP to launch" },
    ],
    href: "",
    image: "/img/projects/project01.webp",
  },
  {
    title: "Project Two",
    year: "2024",
    role: "Design Engineer",
    description:
      "Placeholder description. What the product was, the problem it solved, and the impact you delivered.",
    impact: [
      { value: "2×", label: "faster page loads" },
      { value: "1.4×", label: "signup growth" },
    ],
    href: "",
    image: "/img/projects/project02.webp",
  },
  {
    title: "Project Three",
    year: "2023",
    role: "Design Engineer",
    description:
      "Placeholder description. What the product was, the problem it solved, and the impact you delivered.",
    impact: [
      { value: "8 wks", label: "end-to-end rebuild" },
      { value: "+28%", label: "retention" },
    ],
    href: "",
    image: "/img/projects/project03.webp",
  },
  {
    title: "Project Four",
    year: "2022",
    role: "Frontend Developer",
    description:
      "Placeholder description. What the product was, the problem it solved, and the impact you delivered.",
    impact: [
      { value: "40%", label: "less dev time" },
      { value: "12k", label: "users onboarded" },
    ],
    href: "",
    image: "/img/projects/project04.webp",
  },
];

export const services: Service[] = [
  {
    title: "Landing Page Design",
    description:
      "Designing focused landing pages that make the value clear, build trust quickly, and guide visitors toward action.",
    tags: ["React", "Next.js", "GSAP", "Motion"],
    icon: "landing-page",
    image: "/img/projects/project01.webp",
  },
  {
    title: "Website Design / Redesign",
    description:
      "Designing and refining structured websites with clear navigation, strong visual hierarchy, and a system that stays consistent.",
    tags: ["Figma", "Tailwind", "Design Systems"],
    icon: "web-design",
    image: "/img/projects/project02.webp",
  },
  {
    title: "Web / App Development",
    description:
      "Building responsive, maintainable web experiences with clear architecture, fast interactions, and a strong technical foundation.",
    tags: ["React", "Next.js", "TypeScript", "Node.js"],
    icon: "web-development",
    image: "/img/projects/project04.webp",
  },
  {
    title: "AI Automation",
    description:
      "Designing practical AI-powered workflows that reduce repetitive work, connect the right tools, and keep people in control.",
    tags: ["AI Workflows", "APIs", "Automation", "Integrations"],
    icon: "ai-automation",
    image: "/img/projects/project03.webp",
  },
];

export const servicesSection = {
  index: "02",
  filledTitle: "What I",
  outlinedTitle: "Offer",
};

export const stackCapabilities: StackCapability[] = [
  {
    title: "Landing Page Design",
    description:
      "Designing focused landing pages that make the value clear, build trust quickly, and guide visitors toward action.",
    tools: ["React", "Next.js", "GSAP", "Motion"],
    icon: "landing-page",
  },
  {
    title: "Website Design / Redesign",
    description:
      "Designing and refining structured websites with clear navigation, strong visual hierarchy, and a system that stays consistent.",
    tools: ["Figma", "Tailwind", "Design Systems"],
    icon: "web-design",
  },
  {
    title: "Web / App Development",
    description:
      "Building web and app experiences with responsive interfaces, clear architecture, and dependable performance.",
    tools: ["React", "Next.js", "TypeScript", "Node.js", "APIs"],
    icon: "app-development",
  },
  {
    title: "AI Automation",
    description:
      "Connecting practical AI workflows that reduce repetitive work, link useful tools, and keep people in control.",
    tools: ["AI Workflows", "APIs", "Automation", "Integrations"],
    icon: "ai-automation",
  },
];

export const stackSection = {
  index: "03",
  filledTitle: "What I",
  outlinedTitle: "Use",
};

export const processSteps: ProcessStep[] = [
  {
    title: "Idea",
    eyebrow: "01 / CLARITY",
    description:
      "We start by clarifying the problem, the audience, and the feeling the experience should leave behind. We align on direction before design begins.",
    icon: "idea",
    image: "/videos/idea.jpg",
    imageAlt: "Hands writing notes beside a laptop",
    video: "/videos/idea.mp4",
  },
  {
    title: "Design",
    eyebrow: "02 / DIRECTION",
    description:
      "The direction takes shape through structure, typography, and interaction decisions that make the product feel intentional. We keep it clear and consistent.",
    icon: "design",
    image: "/videos/design.jpg",
    imageAlt: "Code and interface work on a computer screen",
    video: "/videos/design.mp4",
  },
  {
    title: "Build",
    eyebrow: "03 / PRECISION",
    description:
      "I translate the design into responsive, maintainable code while protecting the details that make the interface feel alive. The foundation stays flexible and fast.",
    icon: "build",
    image: "/videos/build.jpg",
    imageAlt: "Software developer working at a computer",
    video: "/videos/build.mp4",
  },
  {
    title: "Ship",
    eyebrow: "04 / MOMENTUM",
    description:
      "Before launch, I refine the final details, test the experience, and make sure it is fast, clear, and ready to perform. The release is ready for real users.",
    icon: "ship",
    image: "/videos/ship.jpg",
    imageAlt: "Developer working on a laptop at a desk",
    video: "/videos/ship.mp4",
  },
];

export const processSection = {
  index: "04",
  filledTitle: "How I",
  outlinedTitle: "Work",
};

export const stack: StackItem[] = [
  { name: "React", color: "#61DAFB" },
  { name: "Next.js", color: "#000000" },
  { name: "TypeScript", color: "#3178C6" },
  { name: "Tailwind CSS", color: "#06B6D4" },
  { name: "GSAP", color: "#88CE02" },
  { name: "Motion", color: "#0055FF" },
  { name: "Node.js", color: "#339933" },
  { name: "JavaScript", color: "#F7DF1E" },
];

export const socials: SocialLink[] = [
  { label: "GitHub", href: "", icon: "github" },
  { label: "LinkedIn", href: "", icon: "linkedin" },
  { label: "X / Twitter", href: "", icon: "x" },
  { label: "Email", href: "", icon: "email" },
];

/** 404 page copy. */
export const notFound = {
  status: "404",
  label: "Page not found",
  message: "This page doesn’t exist. It never did.",
  actions: [
    { label: "Back home", href: "/" },
    { label: "Say hello", href: `mailto:${profile.email}` },
  ],
};
