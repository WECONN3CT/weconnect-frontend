import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Container } from '../ui';

const steps = [
  {
    number: '01',
    title: 'Connect Your Accounts',
    description: 'Link all your social media profiles in under 60 seconds. We support 10+ platforms.',
  },
  {
    number: '02',
    title: 'Create & Schedule Content',
    description: 'Use AI to generate captions, schedule posts, or let our algorithm find the best posting times.',
  },
  {
    number: '03',
    title: 'Track & Optimize',
    description: 'Monitor performance, analyze engagement, and refine your strategy with actionable insights.',
  },
];

export const HowItWorks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const orbRefs = useRef<HTMLDivElement[]>([]);

  cardsRef.current = [];
  orbRefs.current = [];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (sectionRef.current) {
      gsap.fromTo(
        cardsRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.18,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );
    }

    orbRefs.current.forEach((orb, index) => {
      gsap.to(orb, {
        x: index % 2 === 0 ? 18 : -18,
        y: index % 2 === 0 ? -22 : 22,
        duration: 6 + index * 0.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });
  }, []);

  return (
    <section className="relative py-24 bg-gradient-to-b from-white via-primary-50/30 to-white overflow-hidden">
      {/* Background accents */}
      <div
        ref={(node: HTMLDivElement | null) => { if (node) orbRefs.current.push(node); }}
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-200/30 blur-3xl"
      ></div>
      <div
        ref={(node: HTMLDivElement | null) => { if (node) orbRefs.current.push(node); }}
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl"
      ></div>
      <div
        ref={(node: HTMLDivElement | null) => { if (node) orbRefs.current.push(node); }}
        className="pointer-events-none absolute top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary-300/20 blur-2xl"
      ></div>
      <div
        ref={(node: HTMLDivElement | null) => { if (node) orbRefs.current.push(node); }}
        className="pointer-events-none absolute bottom-10 right-16 h-32 w-32 rounded-full bg-purple-300/20 blur-2xl"
      ></div>
      <div
        ref={(node: HTMLDivElement | null) => { if (node) orbRefs.current.push(node); }}
        className="pointer-events-none absolute top-24 right-10 h-20 w-20 rounded-full bg-primary-400/20 blur-xl"
      ></div>
      <div
        ref={(node: HTMLDivElement | null) => { if (node) orbRefs.current.push(node); }}
        className="pointer-events-none absolute bottom-24 left-10 h-24 w-24 rounded-full border border-primary-300/30 bg-white/10 backdrop-blur-sm"
      ></div>

      <Container className="relative" ref={sectionRef}>
        {/* Section Header */}
        <div className="text-center mb-16">
          
          <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started in minutes. No credit card required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {steps.map((step) => (
              <div
                key={step.number}
                ref={(node: HTMLDivElement | null) => { if (node) cardsRef.current.push(node); }}
                className="group relative rounded-2xl border border-primary-100/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary-300/80 hover:shadow-xl"
              >
                {/* Step Number Circle */}
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-2xl font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
                  {step.number}
                  <span className="absolute inset-0 rounded-full ring-2 ring-white/60"></span>
                </div>

                {/* Step Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>

                {/* Hover Highlight */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-br from-primary-500/0 via-purple-500/0 to-primary-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>

              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
