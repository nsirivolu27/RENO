import { Concept } from '@/lib/concepts';

export function DemoAfterVisual({ concept }: { concept: Concept }) {
  const p1 = concept.palette[0]?.color || '#EBE5D9';
  const p2 = concept.palette[1]?.color || '#F5F5F0';
  const p3 = concept.palette[2]?.color || '#D4C3A3';
  const p4 = concept.palette[3]?.color || '#8C7A6B';
  const p5 = concept.palette[4]?.color || '#C2B8A3';

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col" style={{ backgroundColor: p2 }}>
      {/* Wall */}
      <div className="absolute top-0 left-0 right-0 bottom-1/3 transition-colors duration-1000" style={{ backgroundColor: p2 }}>
         <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none mix-blend-overlay" />
      </div>
      {/* Floor */}
      <div className="absolute left-0 right-0 bottom-0 top-[60%] transition-colors duration-1000" style={{ backgroundColor: p3 }}>
         <div className="absolute inset-0 opacity-30 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      
      {/* Abstract Furniture / Rug */}
      <div className="absolute bottom-[20%] left-[15%] right-[15%] h-[25%] rounded-t-xl transition-colors duration-1000" style={{ backgroundColor: p1, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} />
      <div className="absolute bottom-[20%] left-[30%] right-[30%] h-[15%] rounded-md shadow-lg transition-colors duration-1000" style={{ backgroundColor: p4 }} />
      <div className="absolute bottom-[10%] left-[20%] right-[20%] h-[10%] rounded-[100%] opacity-40 blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />

      {/* Abstract Art / Window */}
      <div className="absolute top-[15%] left-[40%] right-[40%] h-[30%] rounded-sm border-[4px] shadow-sm transition-colors duration-1000" style={{ borderColor: p5, backgroundColor: p2 }} />

      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30 pointer-events-none" />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-xs font-mono uppercase tracking-widest shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ecbf7d] animate-pulse" />
            Demo Concept
         </div>
      </div>
    </div>
  );
}