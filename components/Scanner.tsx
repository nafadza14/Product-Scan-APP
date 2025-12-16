import React, { useRef, useEffect, useState } from 'react';
import { X, Zap, ZapOff, Image as ImageIcon, ScanLine } from 'lucide-react';
import Button from './Button';

interface ScannerProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // Request higher resolution for better OCR accuracy
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { min: 1280, ideal: 1920, max: 3840 },
            height: { min: 720, ideal: 1080, max: 2160 },
          }
        });
        
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Apply Focus Mode if supported
          const track = stream.getVideoTracks()[0];
          const capabilities = (track.getCapabilities && track.getCapabilities()) || {};

          try {
             // Attempt to force continuous focus
             if ((capabilities as any).focusMode && (capabilities as any).focusMode.includes('continuous')) {
                await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
             }
          } catch (e) {
             console.log("Focus mode not supported on this device.");
          }
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera error:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); 
  
  // Toggle Flash
  useEffect(() => {
     if (streamRef.current) {
         const track = streamRef.current.getVideoTracks()[0];
         if (track) {
             const capabilities = (track.getCapabilities && track.getCapabilities()) || {};
             if ((capabilities as any).torch) {
                 track.applyConstraints({
                     advanced: [{ torch: flashOn }]
                 } as any).catch(e => console.log("Flash error", e));
             }
         }
     }
  }, [flashOn]);

  // Tap to Focus (Experimental)
  const handleTapToFocus = async () => {
      if (streamRef.current) {
          const track = streamRef.current.getVideoTracks()[0];
          const capabilities = (track.getCapabilities && track.getCapabilities()) || {};
          
          if ((capabilities as any).focusMode && (capabilities as any).focusMode.includes('continuous')) {
             try {
                 // Briefly switch to manual then back to continuous to trigger refocus
                 await track.applyConstraints({ advanced: [{ focusMode: 'manual', focusDistance: 0.5 }] } as any);
                 setTimeout(async () => {
                     await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
                 }, 200);
             } catch (e) {
                 // Ignore if not supported
             }
          }
      }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState !== 4) return;

      const MAX_DIMENSION = 1024;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
              height = (height / width) * MAX_DIMENSION;
              width = MAX_DIMENSION;
          } else {
              width = (width / height) * MAX_DIMENSION;
              height = MAX_DIMENSION;
          }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(imageSrc);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const img = new Image();
        img.src = base64String;
        img.onload = () => {
             const canvas = document.createElement('canvas');
             const MAX_DIMENSION = 1024;
             let width = img.width;
             let height = img.height;

             if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = (height / width) * MAX_DIMENSION;
                    width = MAX_DIMENSION;
                } else {
                    width = (width / height) * MAX_DIMENSION;
                    height = MAX_DIMENSION;
                }
             }
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 ctx.drawImage(img, 0, 0, width, height);
                 onCapture(canvas.toDataURL('image/jpeg', 0.85));
             } else {
                 onCapture(base64String); 
             }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6 z-50">
        <h2 className="text-xl font-bold mb-2">Camera Access Needed</h2>
        <p className="text-center text-gray-400 mb-6">VitalSense needs camera access to scan ingredients.</p>
        <Button onClick={onClose} variant="secondary">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-20">
        <button onClick={onClose} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition-all border border-white/10 active:scale-95">
          <X size={24} />
        </button>
        
        <div className="px-4 py-2 bg-black/30 backdrop-blur-xl rounded-full border border-white/10 shadow-lg flex items-center gap-2">
          <ScanLine size={14} className="text-[#6FAE9A] animate-pulse" />
          <span className="text-white text-xs font-bold tracking-widest uppercase">AI Scanner</span>
        </div>

        <button 
          onClick={() => setFlashOn(!flashOn)} 
          className={`p-3 rounded-full text-white transition-all border active:scale-95 ${flashOn ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20'}`}
        >
          {flashOn ? <Zap size={24} fill="currentColor" /> : <ZapOff size={24} />}
        </button>
      </div>

      {/* Video Feed */}
      <div className="flex-1 relative overflow-hidden bg-gray-900 rounded-b-[2.5rem]" onClick={handleTapToFocus}>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Soft Green Gradient Overlay for Branding */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#6FAE9A]/20 pointer-events-none"></div>

        {/* Focus Frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-80 rounded-[2rem] relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] border border-white/20">
             {/* Animated Corners */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
             
             {/* Scanning Line Animation - Green */}
             <div className="absolute left-4 right-4 h-0.5 bg-[#6FAE9A] shadow-[0_0_25px_#6FAE9A] animate-[float_2s_ease-in-out_infinite] top-1/2 opacity-90"></div>

             <div className="absolute -bottom-16 left-0 right-0 text-center">
                <p className="text-white/90 text-sm font-semibold bg-black/40 backdrop-blur-md inline-block px-4 py-2 rounded-xl border border-white/10">
                   Tap screen to focus
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-36 bg-black flex justify-between items-center px-10 pb-6 pt-4 z-20">
         {/* Gallery Picker */}
         <div className="w-14 h-14">
            <label className="w-full h-full flex items-center justify-center bg-white/10 rounded-2xl cursor-pointer active:scale-95 transition-all hover:bg-white/20 border border-white/10 hover:border-[#6FAE9A]/50">
               <ImageIcon size={24} className="text-white/80" />
               <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
         </div>

         {/* Shutter Button - Gradient Ring */}
         <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center relative group active:scale-95 transition-transform"
         >
            <div className="absolute inset-0 rounded-full border-2 border-[#6FAE9A] opacity-80 animate-pulse-soft"></div>
            <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform shadow-[0_0_30px_rgba(111,174,154,0.6)]"></div>
         </button>

         {/* Spacer for balance */}
         <div className="w-14 h-14"></div>
      </div>
    </div>
  );
};

export default Scanner;