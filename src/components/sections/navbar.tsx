import { navigation, profile } from "@/lib/data";

export function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 font-general sm:px-8 lg:pl-[clamp(2rem,2.3vw,2.5rem)] lg:pr-[clamp(2.75rem,3.3vw,3.5rem)] lg:pt-[1.25rem]">
      <a
        data-hero-mono
        href="#home"
        aria-label={`${profile.name}, home`}
        className="text-2xl font-semibold leading-none tracking-[-0.03em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
      >
        H
      </a>

      <nav aria-label="Primary navigation">
        <ul className="flex items-center gap-7 sm:gap-10 lg:gap-[clamp(3rem,4.5vw,4.5rem)]">
          {navigation.map((item) => (
            <li key={item.href} data-hero-nav-item>
              <a
                href={item.href}
                className="relative block py-1.5 text-[0.8125rem] font-medium tracking-[-0.01em] text-black/80 transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-black after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.76,0,0.24,1)] hover:text-black hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
