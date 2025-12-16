import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Zap, ZapOff, Image as ImageIcon } from 'lucide-react';
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

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Apply flash setting if track supports it
          const track = stream.getVideoTracks()[0];
          if (track) {
             const capabilities = track.getCapabilities?.() as any; // Cast to avoid TS issues if types missing
             if (capabilities && capabilities.torch) {
                 track.applyConstraints({
                    advanced: [{ torch: flashOn }] as any
                 }).catch(e => console.log("Flash not supported", e));
             }
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
      if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
      }
    };
  }, [flashOn]); // Re-run to apply flash if needed, though usually applyConstraints is better on existing track. 
  
  // Effect specifically for Flash toggling without restarting stream if possible
  useEffect(() => {
     if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         const track = stream.getVideoTracks()[0];
         if (track) {
             // Type assertion for advanced constraints
             const constraints = {
                 advanced: [{ torch: flashOn }]
             } as any;
             track.applyConstraints(constraints).catch(e => {
                 // Ignore errors if torch not supported
             });
         }
     }
  }, [flashOn]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video is ready
      if (video.readyState !== 4) { // HAVE_ENOUGH_DATA
          console.warn("Video not ready");
          return;
      }

      // Resize logic: Max dimension 1024px to save bandwidth/processing time
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
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageSrc);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // We can also resize uploaded images here if needed
        const base64String = reader.result as string;
        
        // Quick resize for upload
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
                 onCapture(canvas.toDataURL('image/jpeg', 0.8));
             } else {
                 onCapture(base64String); // Fallback
             }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6 z-50">
        <Camera size={48} className="mb-4 text-gray-400" />
        <h2 className="text-xl font-bold mb-2">Camera Access Needed</h2>
        <p className="text-center text-gray-400 mb-6">VitalSense needs camera access to scan ingredients. Please enable it in your browser settings.</p>
        <Button onClick={onClose} variant="secondary">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-10">
        <button onClick={onClose} className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white">
          <X size={24} />
        </button>
        <div className="px-4 py-1 bg-black/40 backdrop-blur-md rounded-full">
          <span className="text-white text-xs font-medium tracking-wide">SCAN INGREDIENTS</span>
        </div>
        <button 
          onClick={() => setFlashOn(!flashOn)} 
          className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white"
        >
          {flashOn ? <Zap size={24} fill="currentColor" /> : <ZapOff size={24} />}
        </button>
      </div>

      {/* Video Feed */}
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Safe Area Guide / Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-80 border-2 border-white/50 rounded-3xl relative">
             <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#6FAE9A] -mt-1 -ml-1 rounded-tl-xl"></div>
             <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#6FAE9A] -mt-1 -mr-1 rounded-tr-xl"></div>
             <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#6FAE9A] -mb-1 -ml-1 rounded-bl-xl"></div>
             <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#6FAE9A] -mb-1 -mr-1 rounded-br-xl"></div>
             
             <div className="absolute -bottom-12 left-0 right-0 text-center">
                <p className="text-white/80 text-sm font-medium bg-black/30 backdrop-blur-md inline-block px-3 py-1 rounded-lg">
                   Point at text, not barcode
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-32 bg-black/40 backdrop-blur-xl absolute bottom-0 left-0 right-0 flex justify-between items-center px-8 pb-4">
         {/* Gallery Picker */}
         <div className="w-12 h-12">
            <label className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg cursor-pointer active:scale-95 transition-transform">
               <ImageIcon size={20} className="text-white" />
               <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
         </div>

         {/* Shutter Button */}
         <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group active:scale-95 transition-transform"
         >
            <div className="w-16 h-16 bg-[#6FAE9A] rounded-full group-hover:bg-[#5D9A88] transition-colors"></div>
         </button>

         {/* Spacer for balance */}
         <div className="w-12 h-12"></div>
      </div>
    </div>
  );
};

export default Scanner;