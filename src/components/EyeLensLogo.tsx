import React from "react";

interface EyeLensLogoProps {
  className?: string;
  size?: number | string;
}

export function EyeLensLogo({ className = "text-white", size = 40 }: EyeLensLogoProps) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer eye contour */}
      <path 
        d="M10 50C25 22 75 22 90 50C75 78 25 78 10 50Z" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Lens Frame / Iris */}
      <circle 
        cx="50" 
        cy="50" 
        r="21" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      
      {/* Inner Lens reflections and target crosshairs (representing optical precision / reticle / astigmatism test) */}
      <circle 
        cx="50" 
        cy="50" 
        r="13" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeDasharray="6 3" 
        className="opacity-80"
      />
      
      {/* Light center reflection / Pupil */}
      <circle 
        cx="46" 
        cy="46" 
        r="5" 
        className="fill-current" 
      />
      
      {/* Sparkle of light/clarity (Noor) */}
      <path 
        d="M50 6V16M50 84V94M6 50H16M84 50H94" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        className="opacity-70"
      />
    </svg>
  );
}
