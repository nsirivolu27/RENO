import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ComparisonView({
  beforeImage,
  afterComponent
}: {
  beforeImage: string;
  afterComponent: React.ReactNode;
}) {
  const [split, setSplit] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSplit(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSplit(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateSplit = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newSplit = ((clientX - rect.left) / rect.width) * 100;
    newSplit = Math.max(0, Math.min(100, newSplit));
    setSplit(newSplit);
  };

  return (
    <div 
      className="relative w-full h-full min-h-[400px] overflow-hidden select-none touch-none bg-[hsl(var(--card))]"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Base: After */}
      <div className="absolute inset-0 pointer-events-none">
        {afterComponent}
      </div>

      {/* Overlay: Before */}
      <div 
        className="absolute inset-0 pointer-events-none border-r-2 border-white/50"
        style={{ clipPath: `polygon(0 0, ${split}% 0, ${split}% 100%, 0 100%)` }}
      >
        <img 
          src={beforeImage} 
          alt="Before" 
          className="absolute inset-0 w-full h-full object-cover" 
          draggable={false}
        />
        <div className="absolute left-4 top-4">
          <div className="bg-black/50 text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">Before</div>
        </div>
      </div>

      {/* After Label */}
      <div className="absolute right-4 top-4 pointer-events-none">
         <div className="bg-black/50 text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">After</div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-[4px] bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-colors hover:bg-[hsl(var(--primary))]"
        style={{ left: `calc(${split}% - 2px)` }}
      >
        <div className="h-8 w-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg transform -translate-x-1/2 absolute">
          <ChevronLeft size={14} className="-mr-1" />
          <ChevronRight size={14} className="-ml-1" />
        </div>
      </div>
    </div>
  );
}