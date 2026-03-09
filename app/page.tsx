"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameCount = 192;
  const currentFrame = useRef(0);
  const targetFrame = useRef(0);

  useEffect(() => {
    const loadImagesFast = async () => {
      const promises = [];
      const loadedImages: HTMLImageElement[] = new Array(frameCount);
      let loaded = 0;
      
      for (let i = 1; i <= frameCount; i++) {
        const promise = new Promise<void>((resolve) => {
          const img = new Image();
          const frameIndex = i.toString().padStart(3, '0');
          img.src = `/sequence/ezgif-frame-${frameIndex}.jpg`;
          img.onload = () => {
             loadedImages[i-1] = img;
             loaded++;
             setLoadProgress(Math.round((loaded / frameCount) * 100));
             resolve();
          };
          img.onerror = () => {
            resolve();
          }
        });
        promises.push(promise);
      }
      
      await Promise.all(promises);
      imagesRef.current = loadedImages.filter(Boolean);
      setImagesLoaded(true);
    };

    loadImagesFast();
  }, [frameCount]);

  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationFrameId: number;
    
    const render = () => {
      // Lerp for smooth performance
      currentFrame.current += (targetFrame.current - currentFrame.current) * 0.1;
      
      const frameIndex = Math.min(
        frameCount - 1,
        Math.max(0, Math.round(currentFrame.current))
      );
      
      const img = imagesRef.current[frameIndex];
      // When scrolling quickly, we might not hit an integer instantly, but round to nearest loaded frame
      if (img) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Similar to object-fit: cover, calculate dimensions
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (imgRatio > canvasRatio) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * imgRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        } else {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    const unsubscribeY = scrollYProgress.on("change", (v) => {
      targetFrame.current = v * (frameCount - 1);
    });
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      unsubscribeY();
    };
  }, [imagesLoaded, scrollYProgress, frameCount]);

  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            
            // Re-render immediate frame if resize occurs without scrolling
            if(imagesLoaded) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");
              const frameIndex = Math.min(
                frameCount - 1,
                Math.max(0, Math.round(currentFrame.current))
              );
              const img = imagesRef.current[frameIndex];
              if (img && ctx) {
                 const canvasRatio = canvas.width / canvas.height;
                 const imgRatio = img.width / img.height;
                 let drawWidth = canvas.width;
                 let drawHeight = canvas.height;
                 let offsetX = 0;
                 let offsetY = 0;
      
                 if (imgRatio > canvasRatio) {
                     drawHeight = canvas.height;
                     drawWidth = canvas.height * imgRatio;
                     offsetX = (canvas.width - drawWidth) / 2;
                 } else {
                     drawWidth = canvas.width;
                     drawHeight = canvas.width / imgRatio;
                     offsetY = (canvas.height - drawHeight) / 2;
                 }
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
              }
            }
        }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imagesLoaded, frameCount]);

  // Framer Motion transforms mapped to exact scroll percentages
  // 0% -> 0.0
  // 40% -> 0.4
  // 90% -> 0.9

  // 1st text: visible at 0%, fades out by 20%
  const opacity1 = useTransform(scrollYProgress, [0, 0.15, 0.25], [1, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0, 0.25], [0, -50]);

  // 2nd text: fades in at 25%, fully visible at 40%, fades out by 65%
  const opacity2 = useTransform(scrollYProgress, [0.25, 0.4, 0.55, 0.7], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.25, 0.4, 0.55, 0.7], [50, 0, 0, -50]);

  // 3rd text: fades in at 75%, fully visible at 90%, stays till 100%
  const opacity3 = useTransform(scrollYProgress, [0.75, 0.9, 1], [0, 1, 1]);
  const y3 = useTransform(scrollYProgress, [0.75, 0.9, 1], [50, 0, 0]);

  return (
    <div ref={containerRef} className="relative h-[400vh] bg-black">
      {/* Sticky Canvas Container */}
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        
        {/* Loading Overlay */}
        {!imagesLoaded && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-white">
            <div className="flex flex-col items-center">
              <div className="mb-4 h-1 w-64 overflow-hidden rounded-full bg-neutral-800">
                <div 
                  className="h-full bg-white transition-all duration-300 ease-out"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <p className="font-mono text-xs sm:text-sm tracking-widest text-neutral-400">ĐANG TẢI {loadProgress}%</p>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover"
        />

        {/* Text Overlays Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          
          {/* Overlay 1: 0% Scroll */}
          <motion.div 
            style={{ opacity: opacity1, y: y1 }}
            className="absolute flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter text-white mb-2 md:mb-4 lg:mb-6 drop-shadow-xl">
              Chuột Gaming HP
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-3xl text-neutral-300 font-light tracking-wide">
              Độ chính xác trong tầm tay.
            </p>
          </motion.div>

          {/* Overlay 2: 40% Scroll */}
          <motion.div 
            style={{ opacity: opacity2, y: y2 }}
            className="absolute flex flex-col items-center text-center px-6 w-full"
          >
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter text-white mb-2 md:mb-4 lg:mb-6 drop-shadow-xl">
              Cấu trúc Đa lớp
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-3xl text-neutral-300 font-light tracking-wide">
              Khám phá bên trong.
            </p>
          </motion.div>

          {/* Overlay 3: 90% Scroll */}
          <motion.div 
            style={{ opacity: opacity3, y: y3 }}
            className="absolute flex flex-col items-center text-center px-6 w-full"
          >
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter text-white mb-2 md:mb-4 lg:mb-6 drop-shadow-xl">
              Sẵn sàng Chiến đấu
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-3xl text-neutral-300 font-light tracking-wide mb-6 lg:mb-12">
              Cuộn lên để lắp ráp.
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-neutral-100 font-medium tracking-widest uppercase">
              Được tạo bởi Nguyen Van Duy
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
