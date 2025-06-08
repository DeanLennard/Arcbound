// arc/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

const heroImages = [
    '/hero1.jpg',
    '/hero2.png',
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Slide every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
      <main>
        {/* Hero Banner */}
        <section className="relative w-full h-80 md:h-96 overflow-hidden">
          {heroImages.map((src, index) => (
              <img
                  key={index}
                  src={src}
                  alt={`Hero Slide ${index + 1}`}
                  className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              />
          ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 flex flex-col items-center justify-center text-center text-white">
                <h1 className="text-3xl md:text-5xl font-bold mb-2">Welcome to Arcbound</h1>
                <p className="text-lg md:text-xl">Shape Your Reality</p>
            </div>
        </section>

        {/* Content Section */}
        <section className="max-w-3xl mx-auto p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Join the Arcbound Community</h2>
          <p className="text-gray-300">
              Embark on a journey to explore the metaphysical galaxy, collaborate with players worldwide, and shape the fate of cosmic mysteries. Dive into evolving lore,
              bespoke rituals, and paradoxes, and become the spark in a universe of drifting empires and fractured timelines.
          </p>
        </section>
      </main>
  );
}
