import React from 'react';
import Link from 'next/link';

interface PrismLogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

export function PrismLogo({
  className = '',
  showWordmark = true,
  size = 'md',
  href = '/',
}: PrismLogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg tracking-wider',
    md: 'text-xl tracking-widest',
    lg: 'text-2xl tracking-widest',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Refined geometric Prism icon with subtle gradient refraction */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Base facet */}
          <path
            d="M18 4L4 28H32L18 4Z"
            fill="url(#prism-base)"
            opacity="0.9"
          />
          {/* Refraction facets */}
          <path
            d="M18 4L18 28L32 28L18 4Z"
            fill="url(#prism-right)"
            opacity="0.85"
          />
          <path
            d="M18 4L11 28L18 28L18 4Z"
            fill="url(#prism-center)"
            opacity="0.9"
          />
          {/* Subtle light refraction ray */}
          <path
            d="M18 4L22 18L18 28L18 4Z"
            fill="#6ED7E8"
            opacity="0.4"
          />
          <defs>
            <linearGradient id="prism-base" x1="4" y1="4" x2="32" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#162A46" />
              <stop offset="1" stopColor="#0B1220" />
            </linearGradient>
            <linearGradient id="prism-right" x1="18" y1="4" x2="32" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4F8CFF" />
              <stop offset="1" stopColor="#162A46" />
            </linearGradient>
            <linearGradient id="prism-center" x1="11" y1="4" x2="18" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6ED7E8" />
              <stop offset="1" stopColor="#4F8CFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showWordmark && (
        <span
          className={`font-semibold font-sans uppercase text-[#0B1220] dark:text-[#F6F8FB] ${textSizes[size]}`}
        >
          PRISM
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
