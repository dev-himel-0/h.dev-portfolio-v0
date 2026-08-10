"use client";

import { useRef } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { navigation, profile, socials } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The closing frame of the portfolio: the contact panel slides upward over a
 * footer layer, while the oversized brand keeps its own masked reveal.
 */
export function SiteFooter() {
  const rootRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const brandStageRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const contact = contactRef.current;
      const brand = brandRef.current;
      const stage = brandStageRef.current;
      if (!contact || !brand || !stage) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(contact, { clearProps: "transform,willChange" });
        gsap.set(brand, { yPercent: 0, autoAlpha: 1, clearProps: "willChange" });
        return;
      }

      gsap.to(contact, {
        y: () => -(stage.offsetHeight * 0.25),
        ease: "none",
        scrollTrigger: {
          trigger: contact,
          start: "bottom bottom",
          end: "bottom top",
          scrub: 0.8,
          onToggle: (self) =>
            gsap.set(contact, {
              willChange: self.isActive ? "transform" : "auto",
            }),
        },
      });

      gsap.set(brand, {
        yPercent: 112,
        autoAlpha: 0,
        willChange: "transform, opacity",
      });

      gsap.to(brand, {
        yPercent: 0,
        autoAlpha: 1,
        duration: 1.25,
        ease: "expo.out",
        scrollTrigger: {
          trigger: stage,
          start: "top 92%",
          once: true,
        },
        onComplete: () => gsap.set(brand, { clearProps: "willChange" }),
      });
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      data-footer-reveal
      className="relative isolate overflow-clip bg-white text-black"
    >
      <section
        ref={contactRef}
        id="contact"
        aria-labelledby="contact-heading"
        data-footer-contact
        className="relative z-10 overflow-clip bg-white py-24 sm:py-28 lg:py-36"
      >
        <div className="mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-10">
          <div className="mx-auto grid gap-12 lg:max-w-[76rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:gap-20">
            <div>
              <p className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-black/45">
                Contact
              </p>
              <h2
                id="contact-heading"
                className="mt-6 max-w-[38rem] font-heading text-[clamp(2rem,4.6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.055em]"
              >
                {profile.tagline}
              </h2>
              <a
                href={`mailto:${profile.email}`}
                className="group mt-10 inline-flex items-center gap-3 border-b border-black/20 pb-2 font-heading text-[clamp(1.1rem,2vw,1.5rem)] font-medium tracking-[-0.02em] transition-colors duration-300 hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
              >
                {profile.email}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-y-10 self-end lg:justify-items-end lg:text-right">
              <FooterColumn label="Based in">
                <p>{profile.location}</p>
                <p className="mt-1 text-black/45">{profile.availability}</p>
              </FooterColumn>

              <FooterColumn label="Navigate">
                <nav aria-label="Footer navigation" data-footer-nav>
                  <ul className="space-y-2">
                    {navigation.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="group inline-flex items-center gap-2 text-black/60 transition-colors duration-300 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          {item.label}
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-3 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </FooterColumn>

              <FooterColumn label="Elsewhere" className="col-span-2 sm:col-span-1">
                <ul
                  data-footer-socials
                  className="flex flex-wrap justify-start gap-x-4 gap-y-1 sm:flex-nowrap sm:justify-end"
                >
                  {socials.map((social) => (
                    <li key={social.label} className="whitespace-nowrap">
                      {social.href ? (
                        <a
                          href={social.href}
                          className="text-black/60 transition-colors duration-300 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          {social.label}
                        </a>
                      ) : (
                        <span className="text-black/60">{social.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </FooterColumn>
            </div>
          </div>
        </div>
      </section>

      <footer
        aria-label="Site footer"
        data-site-footer
        className="relative z-0 bg-white text-black"
      >
        <div
          ref={brandStageRef}
          data-footer-stage
          className="relative overflow-hidden px-2 pt-[clamp(1rem,2vw,2rem)] sm:px-4"
        >
          <span
            ref={brandRef}
            data-footer-brand
            className="footer-brand-fade block origin-bottom whitespace-nowrap text-center font-heading text-[clamp(6.5rem,27vw,27rem)] font-semibold leading-[0.76] tracking-[-0.095em]"
          >
            {profile.brand}
          </span>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-4 font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-black/45">
        {label}
      </p>
      <div className="font-sans text-sm leading-[1.55]">{children}</div>
    </div>
  );
}
