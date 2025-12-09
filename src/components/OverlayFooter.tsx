import React from 'react';

const OverlayFooter: React.FC = () => {
  const scrollText = "©️ 2025 Attendance Management System. Developed by Mokshyagna Yadav, Department of Computer Science and Engineering. All Rights Reserved.";
  
  return (
    <>
      {/* Top overlay for mobile/tablet screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-transparent backdrop-blur-sm"></div>
        <div className="relative overflow-hidden py-1">
          <div className="inline-flex animate-scroll-seamless whitespace-nowrap gap-20" style={{ WebkitFontSmoothing: 'antialiased' }}>
            <span className="inline-block px-10 py-2 rounded-full bg-black/40 shadow-md text-xs font-elegant text-white drop-shadow-lg" style={{ fontWeight: 500 }}>
              {scrollText}
            </span>
            <span className="inline-block px-10 py-2 rounded-full bg-black/40 shadow-md text-xs font-elegant text-white drop-shadow-lg" style={{ fontWeight: 500 }}>
              {scrollText}
            </span>
            <span className="inline-block px-10 py-2 rounded-full bg-black/40 shadow-md text-xs font-elegant text-white drop-shadow-lg" style={{ fontWeight: 500 }}>
              {scrollText}
            </span>
            <span className="inline-block px-10 py-2 rounded-full bg-black/40 shadow-md text-xs font-elegant text-white drop-shadow-lg" style={{ fontWeight: 500 }}>
              {scrollText}
            </span>
          </div>
        </div>
      </div>
      {/* Bottom overlay for desktop screens */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 z-[35] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent backdrop-blur-sm"></div>
        <div className="relative overflow-hidden py-1">
          <div className="inline-flex animate-scroll-seamless whitespace-nowrap gap-20" style={{ WebkitFontSmoothing: 'antialiased' }}>
            <span className="inline-block px-10 py-2 rounded-full bg-black/40 shadow-md text-sm font-elegant text-white drop-shadow-lg" style={{ fontWeight: 500 }}>
              {scrollText}
            </span>
            <span className="inline-block px-10 py-2 rounded-full bg-black/40 shadow-md text-sm font-elegant text-white drop-shadow-lg" style={{ fontWeight: 500 }}>
              {scrollText}
            </span>
            <span className="inline-block px-10 py-2 rounded-full bg-black/40 shadow-md text-sm font-elegant text-white drop-shadow-lg" style={{ fontWeight: 500 }}>
              {scrollText}
            </span>
            <span className="inline-block px-10 py-2 rounded-full bg-black/40 shadow-md text-sm font-elegant text-white drop-shadow-lg" style={{ fontWeight: 500 }}>
              {scrollText}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverlayFooter;