import React, { useEffect, useRef, ReactNode } from 'react';
import GearAnimation from './GearAnimation';

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
  withGears?: boolean;
  className?: string;
}

export default function ParallaxSection({
  children,
  speed = 0.5,
  withGears = true,
  className = '',
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const handleScroll = () => {
      if (!sectionRef.current || !contentRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollProgress = -rect.top;
      const translateY = scrollProgress * speed;
      
      contentRef.current.style.transform = `translateY(${translateY}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={sectionRef} className={`parallax-section relative overflow-hidden ${className}`}>
      {withGears && (
        <>
          <div className="absolute top-10 left-10 opacity-10 z-0">
            <GearAnimation size={150} speed={25} direction="clockwise" interactive />
          </div>
          <div className="absolute top-1/2 right-20 opacity-10 z-0">
            <GearAnimation size={100} speed={18} direction="counterclockwise" interactive />
          </div>
          <div className="absolute bottom-20 left-1/3 opacity-10 z-0">
            <GearAnimation size={80} speed={22} direction="clockwise" interactive />
          </div>
        </>
      )}
      
      <div ref={contentRef} className="relative z-10">
        {children}
      </div>
    </div>
  );
}
