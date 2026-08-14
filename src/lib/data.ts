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
  | "product-design"
  | "framer-development"
  | "ui-ux-design"
  | "creative-direction";

export const serviceIconSources: Record<
  ServiceIcon,
  { alt: string; src: string }
> = {
  "product-design": {
    alt: "Product design icon",
    src: "https://framerusercontent.com/images/rA85Y0EWOdi7zZR56JJDPw4A.png?width=512&height=512",
  },
  "framer-development": {
    alt: "Framer development icon",
    src: "https://framerusercontent.com/images/Or7wABqMyvcDnGzNVDaUoWHodS4.png?width=512&height=512",
  },
  "ui-ux-design": {
    alt: "UI/UX design icon",
    src: "https://framerusercontent.com/images/dyqoaLEefg6sDhPk1JjxTFRigI.png?width=512&height=512",
  },
  "creative-direction": {
    alt: "Creative direction icon",
    src: "https://framerusercontent.com/images/ktaqYAtXQMTeq7J0vNxH0Mkhoc.png?width=512&height=512",
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
}

export interface ProcessStep {
  title: string;
  description: string;
  eyebrow: string;
  icon: ServiceIcon;
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
  role: "Frontend Engineer",
  tagline: "I build fast, precise, and memorable web interfaces.",
  availability: "Available for freelance & remote",
  location: "Dhaka, Bangladesh",
  email: "hello@himel.dev",
  experienceYears: 4,
};

export const navigation: NavigationItem[] = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "What I Use", href: "#stack" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const hero = {
  filledTitle: "Frontend",
  outlinedTitle: "Engineer",
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
  index: "02",
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
    role: "Frontend Engineer",
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
    role: "Frontend Engineer",
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
    role: "Frontend Engineer",
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
    title: "Web Development",
    description:
      "Placeholder copy. Production-ready websites and web apps built with modern frameworks, clean architecture, and obsessive attention to detail.",
    tags: ["React", "Next.js", "TypeScript"],
    icon: "framer-development",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "UI Implementation",
    description:
      "Placeholder copy. Pixel-perfect conversion of design to code, with a strong eye for typography, spacing, and visual hierarchy.",
    tags: ["Tailwind", "Design Systems"],
    icon: "ui-ux-design",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Motion & Interaction",
    description:
      "Placeholder copy. Smooth scroll experiences, micro-interactions, and animation that makes interfaces feel alive without slowing them down.",
    tags: ["GSAP", "Lenis", "Motion"],
    icon: "creative-direction",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Performance",
    description:
      "Placeholder copy. Auditing and optimizing load times, Core Web Vitals, and rendering — because speed is part of the design.",
    tags: ["Lighthouse", "Core Web Vitals"],
    icon: "product-design",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop",
  },
];

export const servicesSection = {
  index: "03",
  filledTitle: "What I",
  outlinedTitle: "Offer",
  label: "CAPABILITIES",
};

export const stackCapabilities: StackCapability[] = [
  {
    title: "Web Development",
    description:
      "A focused frontend foundation for products that need to feel fast, stable, and effortless to use.",
    tools: ["React", "Next.js", "TypeScript", "Node.js"],
  },
  {
    title: "UI Implementation",
    description:
      "Design systems and interfaces translated into precise, responsive code without losing the original intent.",
    tools: ["Figma", "Tailwind CSS", "Storybook", "TypeScript"],
  },
  {
    title: "Motion & Interaction",
    description:
      "Motion with purpose: clear transitions, tactile feedback, and smooth scroll experiences that support the story.",
    tools: ["GSAP", "Motion", "Lenis", "React"],
  },
  {
    title: "Performance",
    description:
      "A performance-first workflow that keeps the experience quick from the first render through every interaction.",
    tools: ["Lighthouse", "Chrome DevTools", "Vercel", "Core Web Vitals"],
  },
];

export const stackSection = {
  index: "04",
  filledTitle: "What I",
  outlinedTitle: "Use",
};

export const processSteps: ProcessStep[] = [
  {
    title: "Idea",
    eyebrow: "01 / CLARITY",
    description:
      "We start by clarifying the problem, the audience, and the feeling the experience should leave behind. We align on direction before design begins.",
    icon: "product-design",
    image: "/videos/idea.jpg",
    imageAlt: "Hands writing notes beside a laptop",
    video: "/videos/idea.mp4",
  },
  {
    title: "Design",
    eyebrow: "02 / DIRECTION",
    description:
      "The direction takes shape through structure, typography, and interaction decisions that make the product feel intentional. We keep it clear and consistent.",
    icon: "ui-ux-design",
    image: "/videos/design.jpg",
    imageAlt: "Code and interface work on a computer screen",
    video: "/videos/design.mp4",
  },
  {
    title: "Build",
    eyebrow: "03 / PRECISION",
    description:
      "I translate the design into responsive, maintainable code while protecting the details that make the interface feel alive. The foundation stays flexible and fast.",
    icon: "framer-development",
    image: "/videos/build.jpg",
    imageAlt: "Software developer working at a computer",
    video: "/videos/build.mp4",
  },
  {
    title: "Ship",
    eyebrow: "04 / MOMENTUM",
    description:
      "Before launch, I refine the final details, test the experience, and make sure it is fast, clear, and ready to perform. The release is ready for real users.",
    icon: "creative-direction",
    image: "/videos/ship.jpg",
    imageAlt: "Developer working on a laptop at a desk",
    video: "/videos/ship.mp4",
  },
];

export const processSection = {
  index: "05",
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
