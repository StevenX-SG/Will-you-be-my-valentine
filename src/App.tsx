"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import "./valentine.css";

function Disclaimer({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 text-center px-6">
      <h1 className="text-4xl font-bold">Disclaimer</h1>

      <p className="text-lg leading-relaxed max-w-xl">
        This webpage is harmless.<br />
        Someone sent you this because they wanted to be honest with you.<br />
        If you're comfortable, click "Yes" to continue.
      </p>

      <div className="flex gap-4 mt-4">
        <button
          onClick={onContinue}
          className="rounded bg-green-500 px-6 py-3 font-bold text-white hover:bg-green-600 transition"
        >
          Yes
        </button>

        <button
          onClick={() => window.close()}
          className="rounded bg-gray-400 px-6 py-3 font-bold text-white hover:bg-gray-500 transition"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [noCount, setNoCount] = useState(0);
  const [yesPressed, setYesPressed] = useState(false);
  const [noButtonPos, setNoButtonPos] = useState({ x: 120, y: 20 }); // Fixed initial position
  const [showDialog, setShowDialog] = useState(false);
  const [rejectedDialog, setRejectedDialog] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const noBtnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDodgeRef = useRef<number>(0);

  const yesButtonSize = noCount * 15 + 16;
  const OFFSET = isMobile ? 120 : 100;

  // Detect mobile on mount
  useEffect(() => {
    const isTouchDevice = () => {
      return (
        (typeof window !== "undefined" &&
          ("ontouchstart" in window ||
            (window.navigator as any).maxTouchPoints > 0)) ||
        false
      );
    };
    setIsMobile(isTouchDevice());
    
    // Also check on resize
    const handleResize = () => {
      setIsMobile(isTouchDevice() || window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Move No button far away when it becomes fixed (noCount >= 2)
  useEffect(() => {
    if (noCount === 2 && noBtnRef.current) {
      const btnWidth = noBtnRef.current.offsetWidth;
      const btnHeight = noBtnRef.current.offsetHeight;
      const maxX = window.innerWidth - btnWidth - 20;
      const maxY = window.innerHeight - btnHeight - 20;
      
      // Start at a far position (bottom right)
      setNoButtonPos({
        x: maxX * 0.8,
        y: maxY * 0.8
      });
      setMoveCount(0);
    }
  }, [noCount]);

  // Track mouse globally
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // Track touch globally
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, []);

  // Instant dodging with throttle - works for both mouse proximity and touch attempts
  useEffect(() => {
    if (!noBtnRef.current || yesPressed || showDialog || rejectedDialog || noCount < 2) return;
    
    if (noCount === 2 && moveCount >= 4) return;
    if (noCount === 3 && moveCount >= 5) return;

    const buttonRect = noBtnRef.current.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    const distance = Math.hypot(mousePos.x - buttonCenterX, mousePos.y - buttonCenterY);

    // Debug logging
    console.log(`Distance: ${distance.toFixed(0)}px | Offset: ${OFFSET}px | noCount: ${noCount} | moveCount: ${moveCount}`);

    if (distance < OFFSET) {
      const now = Date.now();
      // Throttle that allows state updates to complete (120ms desktop, 100ms mobile)
      if (now - lastDodgeRef.current > (isMobile ? 100 : 120)) {
        lastDodgeRef.current = now;
        
        const btnWidth = buttonRect.width;
        const btnHeight = buttonRect.height;
        const maxX = window.innerWidth - btnWidth - 20;
        const maxY = window.innerHeight - btnHeight - 20;
        
        // Keep generating a new position until it's far enough from cursor
        let newX, newY, newDistance;
        do {
          newX = Math.random() * maxX;
          newY = Math.random() * maxY;
          newDistance = Math.hypot(mousePos.x - (newX + btnWidth / 2), mousePos.y - (newY + btnHeight / 2));
        } while (newDistance < OFFSET + 50); // Add 50px buffer to stay well outside detection zone
        
        const newMoveCount = moveCount + 1;
        setMoveCount(newMoveCount);
        console.log(`🔄 DODGING! Move #${newMoveCount} | New distance from cursor: ${newDistance.toFixed(0)}px`);
        
        setNoButtonPos({
          x: newX,
          y: newY
        });
      }
    }
  }, [mousePos, noCount, yesPressed, showDialog, rejectedDialog, isMobile, OFFSET]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  const handleNoClick = () => {
    if (noCount === 0) {
      setNoCount(1);
      return;
    }
    
    if (noCount === 1) {
      setNoCount(2);
      setMoveCount(0);
      return;
    }
    
    if (noCount === 2 && moveCount >= 4) {
      setNoCount(3);
      setMoveCount(0);
      return;
    }
    
    if (noCount === 3 && moveCount >= 5) {
      setShowDialog(true);
      return;
    }
  };

  const getNoButtonText = () => {
    const phrases = [
      "No",
      "Are you sure?",
      "What if I asked really nicely?",
      "Pretty please",
    ];
    return phrases[noCount] || phrases[3];
  };

  const isButtonDisabled = () => {
    if (noCount === 2 && moveCount < 4) return true;
    if (noCount === 3 && moveCount < 5) return true;
    return false;
  };

  return (
    <>
      {showDisclaimer ? (
        <Disclaimer onContinue={() => setShowDisclaimer(false)} />
      ) : (
        <div className={`-mt-16 flex h-screen flex-col items-center justify-center px-4 ${isMobile ? 'pb-8' : ''}`}>
      {yesPressed ? (
        <>
          <img src="https://media.tenor.com/gUiu1zyxfzYAAAAi/bear-kiss-bear-kisses.gif" className="max-w-full h-auto max-h-[300px]" />
          <div className={`my-4 font-bold text-gray-800 text-center ${isMobile ? 'text-2xl' : 'text-4xl'}`}>WOOOOOO!!! I love you pookie!! ;))</div>
        </>
      ) : rejectedDialog ? (
        <>
          <img 
            className={`mb-6 ${isMobile ? 'h-[250px]' : 'h-[300px]'} w-auto`}
            src="https://media1.tenor.com/m/Vkui9SCHCFAAAAAd/meme-emotional.gif" 
            alt="Emotional Damage"
          />
        </>
      ) : (
        <>
          {/* Bear GIF - Always visible */}
          <img
            className={`mb-6 w-auto ${isMobile ? 'h-[150px]' : 'h-[200px]'}`}
            src="https://gifdb.com/images/high/cute-love-bear-roses-ou7zho5oosxnpo6k.gif"
          />
          
          {/* Title - Always visible */}
          <h1 className={`my-4 font-bold text-gray-800 text-center ${isMobile ? 'text-2xl' : 'text-4xl'}`}>Will you be my Valentine?</h1>
          
          {/* 🔥 INLINE DIALOGUE BOX - Appears ABOVE buttons */}
          {showDialog && (
            <div className={`mb-8 p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl shadow-2xl border-4 border-pink-200 max-w-lg text-center backdrop-blur-sm ${isMobile ? 'text-sm' : ''}`}>
              <p className={`leading-relaxed font-medium text-gray-800 mb-4 ${isMobile ? 'text-base' : 'text-xl'}`}>
                I once imagined us being together…<br />
                Maybe it was just a dream, and maybe it'll never happen.
              </p>
              <p className={`font-bold text-pink-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                Do I still have a chance? 💗
              </p>
            </div>
          )}
          
          {/* ✅ BUTTONS - RESPONSIVE LAYOUT */}
          <div ref={containerRef} className={`relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 w-full max-w-2xl ${isMobile ? 'px-2' : ''}`}>
            {/* Yes Button - Fixed size */}
            <button
              onClick={() => setYesPressed(true)}
              className="rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-2xl hover:shadow-3xl hover:scale-[1.05] active:scale-[0.98] transition-all duration-150 z-10 w-full sm:w-auto"
              style={{ 
                padding: isMobile ? '16px 32px' : '20px 64px',
                fontSize: showDialog ? '20px' : `${yesButtonSize}px`,
                minHeight: isMobile ? '60px' : '70px',
                minWidth: isMobile ? '100%' : '220px'
              }}
            >
              {showDialog ? 'Yes' : 'Yes'}
            </button>
            
            {!showDialog ? (
              <button
                ref={noBtnRef}
                onClick={handleNoClick}
                disabled={isButtonDisabled()}
                className={`rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-2xl active:scale-[0.98] transition-all duration-100 z-20 whitespace-nowrap w-full sm:w-auto ${
                  isButtonDisabled()
                    ? 'opacity-90 ring-4 ring-red-200/70 ring-offset-4 cursor-not-allowed'
                    : 'hover:scale-[1.05] hover:-translate-y-1 cursor-pointer hover:shadow-3xl'
                }`}
                style={{
                  position: noCount >= 2 ? "fixed" : "relative",
                  left: noCount >= 2 ? `${noButtonPos.x}px` : "auto",
                  top: noCount >= 2 ? `${noButtonPos.y}px` : "auto",
                  padding: isMobile ? '16px 32px' : '20px 64px',
                  minHeight: isMobile ? '60px' : '70px',
                  minWidth: isMobile ? '100%' : '220px',
                  backgroundColor: '#ef4444 !important',
                }}
              >
                {getNoButtonText()}
              </button>
            ) : (
              <button
                onClick={() => setTimeout(() => setRejectedDialog(true), 1)}
                className="rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-2xl hover:shadow-3xl hover:scale-[1.05] active:scale-[0.98] transition-all duration-150 z-10 w-full sm:w-auto"
                style={{ 
                  padding: isMobile ? '16px 32px' : '20px 64px',
                  minHeight: isMobile ? '60px' : '70px',
                  minWidth: isMobile ? '100%' : '220px'
                }}
              >
                No
              </button>
            )}
          </div>
        </>
      )}
        </div>
      )}
    </>
  );
}
