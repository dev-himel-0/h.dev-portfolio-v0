/**
 * Single source of truth for ALL site content.
 * PLACEHOLDERS ONLY — replace with real data when Himel provides it.
 * Never invent projects, clients, or experience.
 */

export interface Project {
  title: string;
  year: string;
  role: string;
  description: string;
  stack: string[];
  href?: string;
  image?: string;
}

export interface Service {
  title: string;
  description: string;
  tags: string[];
}

export interface StackItem {
  name: string;
  /** Brand color used for the grayscale → color hover effect. */
  color: string;
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
    stack: ["Next.js", "TypeScript", "Tailwind CSS"],
    href: "",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Project Two",
    year: "2024",
    role: "Frontend Engineer",
    description:
      "Placeholder description. What the product was, the problem it solved, and the impact you delivered.",
    stack: ["React", "Redux", "Styled Components"],
    href: "",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Project Three",
    year: "2023",
    role: "Frontend Engineer",
    description:
      "Placeholder description. What the product was, the problem it solved, and the impact you delivered.",
    stack: ["Vue", "Nuxt", "SCSS"],
    href: "",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Project Four",
    year: "2022",
    role: "Frontend Developer",
    description:
      "Placeholder description. What the product was, the problem it solved, and the impact you delivered.",
    stack: ["JavaScript", "GSAP", "Webflow"],
    href: "",
    image:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1600&auto=format&fit=crop",
  },
];

export const services: Service[] = [
  {
    title: "Web Development",
    description:
      "Placeholder copy. Production-ready websites and web apps built with modern frameworks, clean architecture, and obsessive attention to detail.",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    title: "UI Implementation",
    description:
      "Placeholder copy. Pixel-perfect conversion of design to code, with a strong eye for typography, spacing, and visual hierarchy.",
    tags: ["Tailwind", "Design Systems"],
  },
  {
    title: "Motion & Interaction",
    description:
      "Placeholder copy. Smooth scroll experiences, micro-interactions, and animation that makes interfaces feel alive without slowing them down.",
    tags: ["GSAP", "Lenis", "Motion"],
  },
  {
    title: "Performance",
    description:
      "Placeholder copy. Auditing and optimizing load times, Core Web Vitals, and rendering — because speed is part of the design.",
    tags: ["Lighthouse", "Core Web Vitals"],
  },
];

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
