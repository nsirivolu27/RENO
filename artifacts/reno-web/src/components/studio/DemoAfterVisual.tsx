import { Concept } from '@/lib/concepts';

export function DemoAfterVisual({ concept }: { concept: Concept }) {
  const p1 = concept.palette[0]?.color || '#EBE5D9';
  const p2 = concept.palette[1]?.color || '#F5F5F0';
  const p3 = concept.palette[2]?.color || '#D4C3A3';
  const p4 = concept.palette[3]?.color || '#8C7A6B';
  const p5 = concept.palette[4]?.color || '#C2B8A3';

  const isRenovate = concept.scope === 'Renovate';
  const isLivingRoom = concept.room === 'Living room';
  const isKitchen = concept.room === 'Kitchen';

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col" style={{ backgroundColor: p2 }}>
      {/* Wall with noise texture */}
      <div className="absolute top-0 left-0 right-0 bottom-[35%] transition-colors duration-1000" style={{ backgroundColor: isRenovate ? p2 : '#E5E0D8' }}>
         <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none mix-blend-overlay" />
         
         {/* Subtle lighting gradient on wall */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent mix-blend-multiply" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay opacity-50 blur-2xl" />
      </div>

      {/* Baseboard/Trim */}
      <div className="absolute left-0 right-0 bottom-[35%] h-[2%] shadow-sm transition-colors duration-1000 z-10" style={{ backgroundColor: isRenovate ? p1 : '#D6CFBB' }} />

      {/* Floor with perspective gradient */}
      <div className="absolute left-0 right-0 bottom-0 top-[65%] transition-colors duration-1000 overflow-hidden" style={{ backgroundColor: isRenovate ? p3 : '#C1B6A6' }}>
         {/* Floor planks/texture suggestion */}
         <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,transparent_49%,rgba(0,0,0,0.1)_50%,transparent_51%)] bg-[length:40px_100%] transform skew-x-[-15deg] scale-150" />
         <div className="absolute inset-0 opacity-30 bg-gradient-to-t from-black/60 via-black/10 to-transparent mix-blend-multiply" />
      </div>
      
      {/* Furniture Composition based on Room */}
      {isKitchen ? (
        <>
          {/* Kitchen Island */}
          <div className="absolute bottom-[15%] left-[20%] right-[20%] h-[35%] rounded-sm transition-colors duration-1000 shadow-2xl z-20" style={{ backgroundColor: p4 }}>
            {/* Island Countertop */}
            <div className="absolute top-0 left-[-2%] right-[-2%] h-[12%] rounded-sm shadow-md transition-colors duration-1000" style={{ backgroundColor: p1 }} />
            {/* Island shadow on floor */}
            <div className="absolute -bottom-8 left-[5%] right-[5%] h-8 bg-black/40 blur-xl rounded-[100%]" />
          </div>
          {/* Pendant Lights */}
          <div className="absolute top-[10%] left-[35%] w-[4%] h-[20%] bg-gradient-to-b from-black/20 to-transparent z-10">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300%] h-[40%] rounded-b-full transition-colors duration-1000 shadow-[0_15px_30px_rgba(255,255,255,0.2)]" style={{ backgroundColor: p5 }} />
          </div>
          <div className="absolute top-[10%] right-[35%] w-[4%] h-[20%] bg-gradient-to-b from-black/20 to-transparent z-10">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300%] h-[40%] rounded-b-full transition-colors duration-1000 shadow-[0_15px_30px_rgba(255,255,255,0.2)]" style={{ backgroundColor: p5 }} />
          </div>
        </>
      ) : isLivingRoom ? (
        <>
          {/* Rug */}
          <div className="absolute bottom-[5%] left-[10%] right-[10%] h-[25%] rounded-[100%] transition-colors duration-1000 opacity-90 shadow-inner z-10" style={{ backgroundColor: p2, transform: 'scaleY(0.4)' }} />
          
          {/* Sofa */}
          <div className="absolute bottom-[20%] left-[25%] right-[25%] h-[25%] rounded-t-xl transition-colors duration-1000 shadow-2xl z-20 flex flex-col justify-end" style={{ backgroundColor: p1 }}>
             {/* Sofa cushions */}
             <div className="w-full h-[60%] flex gap-2 px-2 pb-2">
               <div className="flex-1 bg-black/5 rounded-sm shadow-inner" />
               <div className="flex-1 bg-black/5 rounded-sm shadow-inner" />
             </div>
             {/* Sofa shadow */}
             <div className="absolute -bottom-10 left-[10%] right-[10%] h-10 bg-black/40 blur-xl rounded-[100%] -z-10" />
          </div>

          {/* Coffee Table */}
          <div className="absolute bottom-[12%] left-[40%] right-[40%] h-[8%] rounded-full shadow-xl transition-colors duration-1000 z-30" style={{ backgroundColor: p4 }}>
            {/* Table top sheen */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
            <div className="absolute -bottom-4 left-[20%] right-[20%] h-4 bg-black/50 blur-md rounded-[100%] -z-10" />
          </div>
        </>
      ) : (
        <>
          {/* Generic/Bedroom Bed */}
          <div className="absolute bottom-[25%] left-[20%] right-[20%] h-[30%] transition-colors duration-1000 z-20" style={{ backgroundColor: p1 }}>
            {/* Headboard */}
            <div className="absolute -top-[40%] left-[10%] right-[10%] h-[40%] rounded-t-md shadow-md transition-colors duration-1000" style={{ backgroundColor: p5 }} />
            {/* Pillows */}
            <div className="absolute -top-[15%] left-[15%] right-[55%] h-[30%] rounded-sm shadow-sm transition-colors duration-1000" style={{ backgroundColor: p2 }} />
            <div className="absolute -top-[15%] left-[55%] right-[15%] h-[30%] rounded-sm shadow-sm transition-colors duration-1000" style={{ backgroundColor: p2 }} />
            {/* Bed shadow */}
            <div className="absolute -bottom-8 left-[5%] right-[5%] h-8 bg-black/30 blur-xl rounded-[100%] -z-10" />
          </div>
        </>
      )}

      {/* Abstract Art / Window */}
      <div className="absolute top-[12%] left-[40%] right-[40%] h-[22%] rounded-sm border-[4px] shadow-lg transition-colors duration-1000 z-10 overflow-hidden flex flex-col" style={{ borderColor: p5, backgroundColor: p3 }}>
         <div className="flex-1 bg-white/10" />
         <div className="flex-1 bg-black/5" />
      </div>

      {/* Global Room Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)] pointer-events-none z-40 mix-blend-multiply" />
      
      {/* Demo Badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
         <div className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-[10px] font-mono uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2.5 transform scale-90 sm:scale-100 transition-transform">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ecbf7d] animate-pulse" />
            Demo Concept
         </div>
      </div>
    </div>
  );
}
