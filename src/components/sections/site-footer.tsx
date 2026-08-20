"use client";

import { FlipLink } from "@/components/ui/flip-link";
import { SectionReveal } from "@/components/ui/section-reveal";
import {
  contact,
  navigation,
  profile,
  siteFooter,
  stats,
  socials,
} from "@/lib/data";
import { useGSAP } from "@gsap/react";
import {
  ArrowUpRight,
  EnvelopeSimple,
  GithubLogo,
  LinkedinLogo,
  MapPin,
  XLogo,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import type { SocialIcon } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FOOTER_SOCIAL_ICONS: Record<SocialIcon, Icon> = {
  github: GithubLogo,
  linkedin: LinkedinLogo,
  x: XLogo,
  email: EnvelopeSimple,
};

/**
 * The closing frame of the portfolio: the footer information panel masks the
 * oversized brand while it drifts down into its final frame.
 */
export function SiteFooter() {
  const rootRef = useRef<HTMLDivElement>(null);
  const brandStageRef = useRef<HTMLDivElement>(null);
  const brandRevealRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const footerInfo =
        rootRef.current?.querySelector<HTMLElement>("[data-footer-info]");
      const stage = brandStageRef.current;
      const brand = brandRevealRef.current;
      if (!footerInfo || !stage || !brand) return;

      const media = gsap.matchMedia();

      media.add(
        "(min-width: 810px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const hiddenY = () => {
            const footerInfoBottom = footerInfo.getBoundingClientRect().bottom;
            const stageTop = stage.getBoundingClientRect().top;
            const overlap = Math.min(
              stage.offsetHeight,
              Math.max(0, footerInfoBottom - stageTop),
            );

            // Park the complete word behind the footer information panel until
            // the stage scrolls into its reveal range.
            return -(stage.offsetHeight - overlap);
          };

          gsap.fromTo(
            brand,
            { y: hiddenY },
            {
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: stage,
                start: "top bottom",
                end: "bottom bottom",
                scrub: 1.1,
                invalidateOnRefresh: true,
                onToggle: (self) =>
                  gsap.set(brand, {
                    willChange: self.isActive ? "transform" : "auto",
                  }),
              },
            },
          );
        },
      );

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(brand, {
          y: 0,
          clearProps: "transform,will-change",
        });
      });

      return () => media.revert();
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      data-footer-reveal
      className="relative isolate overflow-clip bg-white text-black"
    >
      <section
        id="contact"
        aria-labelledby="contact-heading"
        data-footer-contact
        className="relative z-10 overflow-clip bg-white pb-8 sm:pb-10 lg:pb-12"
      >
        <div className="w-full items-center justify-center">
          <div
            data-contact-stage
            className="relative overflow-hidden border-x border-black/10 bg-white text-black"
          >
            <SectionReveal
              variant="fade"
              distance={100}
              stagger={0.16}
              className="relative z-10 mx-auto grid min-h-[clamp(28rem,52svh,34rem)] max-w-[76rem] content-center gap-14 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[minmax(0,1.22fr)_minmax(18rem,0.78fr)] lg:items-center lg:gap-20 lg:px-0 lg:py-0"
            >
              <div
                data-reveal
                data-contact-reveal
                className="max-w-[48rem]"
              >
                <h2
                  id="contact-heading"
                  className="max-w-[48rem] font-heading text-[clamp(2rem,4.6vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.055em] text-balance text-black"
                >
                  {profile.tagline}
                </h2>
              </div>

              <div
                data-reveal
                data-contact-reveal
                data-contact-actions
                className="flex flex-col items-start gap-5 lg:items-end lg:text-right"
              >
                <div
                  data-contact-cta
                  className="w-full sm:w-auto"
                >
                  <FlipLink
                    href={`mailto:${profile.email}`}
                    label={contact.ctaLabel}
                    icon={ArrowUpRight}
                    variant="solid"
                    className="focus-visible:ring-black focus-visible:ring-offset-white lg:min-w-[16rem]"
                  />
                </div>
                <a
                  href={`mailto:${profile.email}`}
                  data-contact-email
                  className="group inline-flex min-h-11 items-center gap-3 border-b border-black/25 pb-2 font-heading text-[clamp(1.1rem,2vw,1.5rem)] font-medium tracking-[-0.02em] text-black transition-colors duration-300 hover:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white focus-visible:outline-none"
                >
                  {profile.email}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </a>
                <p
                  data-contact-availability
                  className="max-w-[18rem] font-sans text-xs leading-[1.5] text-black/55 lg:text-right"
                >
                  {profile.availability}
                </p>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      <footer
        aria-label="Site footer"
        data-site-footer
        className="relative z-0 bg-white text-black"
      >
        <div
          data-footer-info
          className="relative z-10 bg-white"
        >
          <SectionReveal
            variant="fade"
            distance={40}
            stagger={0.12}
            start="top 82%"
            className="mx-auto grid max-w-[76rem] justify-items-start gap-7 px-6 py-[clamp(2rem,3.5vw,3rem)] text-left sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:gap-8 lg:px-0"
          >
            <div
              data-reveal
              data-footer-contact-info
              className="grid justify-items-start gap-5 sm:col-span-2 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1 lg:gap-4"
            >
              <div>
                <p className="font-sans text-[0.6875rem] font-medium tracking-[0.22em] text-black/60 uppercase">
                  {siteFooter.locationLabel}
                </p>
                <div className="mt-2 flex items-center justify-start gap-2 font-heading text-[clamp(1rem,1.8vw,1.25rem)] leading-[1.2] font-medium tracking-[-0.025em] text-black/90">
                  <MapPin
                    aria-hidden="true"
                    weight="regular"
                    className="size-4 shrink-0 text-black/55"
                  />
                  <span>{profile.location}</span>
                </div>
              </div>

              <div className="lg:mt-1">
                <p className="font-sans text-[0.6875rem] font-medium tracking-[0.22em] text-black/60 uppercase">
                  {siteFooter.contactLabel}
                </p>
                <a
                  href={`mailto:${profile.email}`}
                  className="group mt-2 inline-flex min-h-11 items-center justify-start gap-2 font-heading text-[clamp(1rem,1.8vw,1.25rem)] leading-[1.2] font-medium tracking-[-0.025em] text-black/90 transition-colors duration-300 hover:text-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white focus-visible:outline-none"
                >
                  <EnvelopeSimple
                    aria-hidden="true"
                    weight="regular"
                    className="size-4 shrink-0 text-black/55"
                  />
                  {profile.email}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </a>
                <p className="mt-1 max-w-[16rem] font-sans text-xs leading-[1.5] text-black/60">
                  {profile.availability}
                </p>
              </div>
            </div>

            <nav
              data-reveal
              data-footer-nav
              aria-label="Footer navigation"
            >
              <p className="font-sans text-[0.6875rem] font-medium tracking-[0.22em] text-black/60 uppercase">
                {siteFooter.linksLabel}
              </p>
              <ul className="mt-2 space-y-0">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="group inline-flex min-h-11 items-center justify-start gap-2 font-heading text-[clamp(1.125rem,2.3vw,1.5rem)] leading-none font-medium tracking-[-0.035em] text-black/90 transition-colors duration-300 hover:text-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white focus-visible:outline-none"
                    >
                      {item.label}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div
              data-reveal
              data-footer-socials
            >
              <p className="font-sans text-[0.6875rem] font-medium tracking-[0.22em] text-black/60 uppercase">
                {siteFooter.socialsLabel}
              </p>
              <ul className="mt-2 space-y-0">
                {socials.map((social) => (
                  <li key={social.label}>
                    <FooterSocialItem social={social} />
                  </li>
                ))}
              </ul>
            </div>

            <div
              data-reveal
              data-footer-profile
            >
              <p className="font-sans text-[0.6875rem] font-medium tracking-[0.22em] text-black/60 uppercase">
                {siteFooter.profileLabel}
              </p>
              <p className="mt-2 font-heading text-[clamp(1rem,1.8vw,1.25rem)] leading-[1.2] font-medium tracking-[-0.025em] text-black/90">
                {profile.role}
              </p>
              <div
                data-footer-profile-stats
                className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-1 lg:gap-2"
              >
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    data-footer-profile-stat
                    className="border-t border-black/10 pt-2"
                  >
                    <p
                      data-footer-profile-value
                      className="font-heading text-[clamp(1.25rem,2.4vw,1.5rem)] leading-none font-semibold tracking-[-0.04em] text-black tabular-nums"
                    >
                      {stat.value}
                      {stat.suffix}
                    </p>
                    <p
                      data-footer-profile-label
                      className="mt-1 font-sans text-[0.6875rem] leading-snug font-medium tracking-[0.14em] text-black/60 uppercase"
                    >
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>

        <div
          ref={brandStageRef}
          data-footer-stage
          className="relative z-0 overflow-visible"
        >
          <div
            ref={brandRevealRef}
            data-footer-brand-reveal
            className="absolute inset-x-0 bottom-[-0.1em] h-[1em] font-heading leading-none font-semibold tracking-[-0.095em] whitespace-nowrap"
          >
            <span
              data-footer-brand
              className="absolute inset-0 z-10 block text-center text-black"
            >
              {profile.brand}
            </span>
            <span
              aria-hidden="true"
              data-footer-brand-wash
              className="footer-brand-wash pointer-events-none"
            />
          </div>
        </div>

        <div
          data-footer-meta
          className="relative z-30 mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-white px-6 py-4 text-left sm:px-10 lg:px-0"
        >
          <p className="font-sans text-[0.6875rem] tracking-[0.12em] text-black/60 uppercase">
            © {profile.name}. {siteFooter.copyright}
          </p>
          <a
            href={`mailto:${profile.email}`}
            className="group inline-flex min-h-11 items-center justify-center gap-2 font-sans text-[0.6875rem] font-medium tracking-[0.12em] text-black/60 uppercase transition-colors duration-300 hover:text-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white focus-visible:outline-none"
          >
            <EnvelopeSimple
              aria-hidden="true"
              weight="regular"
              className="size-3.5 transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
            />
            {contact.ctaLabel}
            <ArrowUpRight
              aria-hidden="true"
              className="size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </footer>
    </div>
  );
}

function FooterSocialItem({ social }: { social: (typeof socials)[number] }) {
  const SocialIcon = FOOTER_SOCIAL_ICONS[social.icon];
  const icon = (
    <SocialIcon
      aria-hidden="true"
      weight="regular"
      className="size-4 shrink-0 text-black/55"
    />
  );
  const className =
    "inline-flex min-h-11 items-center justify-start gap-2 font-heading text-[clamp(1.125rem,2.3vw,1.5rem)] leading-none font-medium tracking-[-0.035em] text-black/90";

  return social.href ? (
    <a
      href={social.href}
      aria-label={social.label}
      className={`${className} transition-colors duration-300 hover:text-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white focus-visible:outline-none`}
    >
      {icon}
      {social.label}
    </a>
  ) : (
    <span className={className}>
      {icon}
      {social.label}
    </span>
  );
}
