import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Zap, ZapOff, Image as ImageIcon, Check, CameraOff, AlertCircle } from 'lucide-react';
import { AnalysisError, AnalysisErrorCode, ScanMode } from '../types';
import { Translator, TranslationKey } from '../i18n';
import { IconButton, Pressable, PrimaryButton, Segmented, haptic, sheetTransition } from './ui';

interface Props {
  t: Translator;
  rtl: boolean;
  initialMode: ScanMode;
  onClose: () => void;
  analyze: (mode: ScanMode, base64: string) => Promise<void>;
}

type Phase = 'camera' | 'analyzing' | 'error';

const MAX_DIMENSION = 1024;

const downscale = (source: CanvasImageSource, w: number, h: number, mirror = false): string => {
  let width = w;
  let height = h;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height / width) * MAX_DIMENSION);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width / height) * MAX_DIMENSION);
      height = MAX_DIMENSION;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.75);
};

const STEPS: Record<ScanMode, TranslationKey[]> = {
  product: ['stepReadLabel', 'stepCheckIngredients', 'stepMatchProfile'],
  skin: ['stepMapFace', 'stepReadSkin', 'stepBuildRoutine']
};

const ERRORS: Record<AnalysisErrorCode, [TranslationKey, TranslationKey]> = {
  missing_key: ['errMissingKeyTitle', 'errMissingKeyBody'],
  not_recognized: ['errNotRecognizedTitle', 'errNotRecognizedBody'],
  no_face: ['errNoFaceTitle', 'errNoFaceBody'],
  network: ['errNetworkTitle', 'errNetworkBody'],
  unknown: ['errUnknownTitle', 'errUnknownBody']
};

// Decorative face mesh shown while a selfie is being analyzed (coordinates in a 200x260 box).
const MESH_POINTS: [number, number][] = [
  [100, 18], [52, 40], [148, 40], [30, 92], [170, 92], [62, 108], [82, 112], [118, 112], [138, 108],
  [100, 128], [100, 158], [70, 168], [130, 168], [52, 196], [148, 196], [76, 206], [124, 206], [100, 214], [100, 246], [64, 232], [136, 232]
];
const MESH_LINES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 8], [5, 6], [7, 8], [6, 9], [7, 9], [9, 10], [10, 11], [10, 12],
  [3, 13], [4, 14], [11, 15], [12, 16], [15, 17], [16, 17], [13, 19], [14, 20], [19, 18], [20, 18], [17, 18], [0, 9]
];

const Scanner: React.FC<Props> = ({ t, rtl, initialMode, onClose, analyze }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ScanMode>(initialMode);
  const [phase, setPhase] = useState<Phase>('camera');
  const [permission, setPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [torchSupported, setTorchSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [errorCode, setErrorCode] = useState<AnalysisErrorCode>('unknown');
  const [shutterFlash, setShutterFlash] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number; k: number } | null>(null);

  const facing = mode === 'skin' ? 'user' : 'environment';

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  // Start (or restart) the camera whenever the facing direction changes.
  useEffect(() => {
    if (phase !== 'camera') return;
    let cancelled = false;
    (async () => {
      stopStream();
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        const caps: any = track?.getCapabilities?.() || {};
        setTorchSupported(!!caps.torch);
        if (caps.focusMode?.includes?.('continuous')) {
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }).catch(() => {});
        }
        setPermission('granted');
      } catch {
        if (!cancelled) setPermission('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [facing, phase]);

  useEffect(() => () => stopStream(), []);

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && torchSupported) track.applyConstraints({ advanced: [{ torch: flashOn } as any] }).catch(() => {});
  }, [flashOn, torchSupported]);

  // Progress through the analysis steps while waiting.
  useEffect(() => {
    if (phase !== 'analyzing') return;
    setStep(0);
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, 2)), 1700);
    return () => window.clearInterval(id);
  }, [phase]);

  const run = useCallback(
    async (dataUrl: string) => {
      setSnapshot(dataUrl);
      setPhase('analyzing');
      stopStream();
      try {
        await analyze(mode, dataUrl.split(',')[1]);
        haptic(14);
      } catch (e) {
        setErrorCode(e instanceof AnalysisError ? e.code : 'unknown');
        setPhase('error');
        haptic(30);
      }
    },
    [analyze, mode]
  );

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return;
    setShutterFlash(true);
    window.setTimeout(() => setShutterFlash(false), 180);
    const data = downscale(video, video.videoWidth, video.videoHeight, facing === 'user');
    if (data) run(data);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const data = downscale(img, img.naturalWidth, img.naturalHeight);
        run(data || (reader.result as string));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const tapFocus = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'camera' || mode !== 'product') return;
    const rect = e.currentTarget.getBoundingClientRect();
    setFocusPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top, k: Date.now() });
    const track = streamRef.current?.getVideoTracks()[0];
    const caps: any = track?.getCapabilities?.() || {};
    if (track && caps.focusMode?.includes?.('single-shot')) {
      track.applyConstraints({ advanced: [{ focusMode: 'single-shot' } as any] }).catch(() => {});
    }
  };

  const retake = () => {
    setSnapshot(null);
    setPermission('pending');
    setPhase('camera');
  };

  const [errTitle, errBody] = ERRORS[errorCode];

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex justify-center"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label={t('tabScan')}
    >
      <div className="relative w-full max-w-[450px] h-full overflow-hidden" onClick={tapFocus}>
        {/* Live camera or frozen frame */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${facing === 'user' ? '-scale-x-100' : ''} ${
            snapshot || permission !== 'granted' ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {snapshot && <img src={snapshot} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60 pointer-events-none" />

        {/* Shutter flash */}
        <AnimatePresence>
          {shutterFlash && (
            <motion.div className="absolute inset-0 bg-white pointer-events-none z-30" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
          )}
        </AnimatePresence>

        {/* Camera denied */}
        {permission === 'denied' && phase === 'camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 text-white">
            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-5">
              <CameraOff size={28} />
            </div>
            <p className="text-[19px] font-semibold mb-2">{t('cameraDeniedTitle')}</p>
            <p className="text-[15px] text-white/70 leading-relaxed mb-7">{t('cameraDeniedBody')}</p>
            <PrimaryButton className="!bg-white !text-ink max-w-[240px]" onClick={() => fileRef.current?.click()}>
              <ImageIcon size={20} /> {t('uploadInstead')}
            </PrimaryButton>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-20 px-5 pt-safe flex items-center justify-between">
          <IconButton tone="glass" label={t('close')} onClick={onClose}>
            <X size={22} />
          </IconButton>
          <AnimatePresence mode="wait">
            <motion.p
              key={phase === 'analyzing' ? `a${step}` : phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-white text-[16px] font-medium drop-shadow"
            >
              {phase === 'analyzing' ? `${t(STEPS[mode][step])}...` : phase === 'camera' ? (mode === 'skin' ? t('modeSkin') : t('modeProduct')) : ''}
            </motion.p>
          </AnimatePresence>
          {phase === 'camera' && torchSupported && mode === 'product' ? (
            <IconButton tone="glass" label={flashOn ? t('flashOn') : t('flashOff')} onClick={() => setFlashOn((f) => !f)} className={flashOn ? '!bg-white !text-ink' : ''}>
              {flashOn ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
            </IconButton>
          ) : (
            <span className="w-11" />
          )}
        </div>

        {/* Framing guides */}
        {permission !== 'denied' || phase !== 'camera' ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-28">
            <AnimatePresence mode="wait">
              {mode === 'product' ? (
                <motion.div
                  key="product"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={sheetTransition}
                  className="relative w-[74%] aspect-[4/5] rounded-[28px]"
                  style={{ boxShadow: phase === 'camera' ? '0 0 0 9999px rgba(0,0,0,0.35)' : 'none' }}
                >
                  {['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-[28px]', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-[28px]', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[28px]', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[28px]'].map((c) => (
                    <span key={c} className={`absolute w-10 h-10 border-white ${c}`} />
                  ))}
                  {phase === 'analyzing' && (
                    <motion.span
                      className="absolute inset-x-3 h-[2px] rounded-full bg-coral shadow-[0_0_24px_4px_rgba(238,95,59,0.65)]"
                      initial={{ top: '6%' }}
                      animate={{ top: ['6%', '94%', '6%'] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.svg
                  key="skin"
                  viewBox="0 0 200 260"
                  className="w-[66%] max-w-[300px]"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={sheetTransition}
                >
                  <ellipse cx="100" cy="130" rx="92" ry="124" fill="none" stroke="white" strokeOpacity={phase === 'camera' ? 0.9 : 0.35} strokeWidth="2" strokeDasharray={phase === 'camera' ? '0' : '3 6'} />
                  {phase !== 'camera' && (
                    <g>
                      {MESH_LINES.map(([a, b], i) => (
                        <motion.line
                          key={i}
                          x1={MESH_POINTS[a][0]}
                          y1={MESH_POINTS[a][1]}
                          x2={MESH_POINTS[b][0]}
                          y2={MESH_POINTS[b][1]}
                          stroke="white"
                          strokeOpacity="0.55"
                          strokeWidth="0.8"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.04 }}
                        />
                      ))}
                      {MESH_POINTS.map(([x, y], i) => (
                        <motion.circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="2.6"
                          fill="white"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.4, 1], opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                        />
                      ))}
                    </g>
                  )}
                </motion.svg>
              )}
            </AnimatePresence>
          </div>
        ) : null}

        {/* Tap-to-focus ring */}
        <AnimatePresence>
          {focusPoint && phase === 'camera' && (
            <motion.span
              key={focusPoint.k}
              className="absolute z-10 w-16 h-16 -ml-8 -mt-8 rounded-2xl border-2 border-coral-light pointer-events-none"
              style={{ left: focusPoint.x, top: focusPoint.y }}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.1 }}
              onAnimationComplete={() => setFocusPoint(null)}
            />
          )}
        </AnimatePresence>

        {/* Bottom area */}
        <div className="absolute bottom-0 inset-x-0 z-20 pb-safe" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {phase === 'camera' && (
              <motion.div key="controls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="px-6 pb-4">
                {permission === 'granted' && (
                  <p className="text-center text-white/90 text-[14px] font-medium mb-4 drop-shadow">{mode === 'skin' ? t('guideSkin') : t('guideProduct')}</p>
                )}
                <div className="flex justify-center mb-6">
                  <Segmented
                    dark
                    layoutId="scan-mode"
                    value={mode}
                    onChange={(m) => {
                      setMode(m);
                      setFlashOn(false);
                    }}
                    options={[
                      { value: 'product', label: t('modeProduct') },
                      { value: 'skin', label: t('modeSkin') }
                    ]}
                  />
                </div>
                <div className="flex items-center justify-between px-4">
                  <IconButton tone="glass" label={t('upload')} onClick={() => fileRef.current?.click()} className="!w-12 !h-12">
                    <ImageIcon size={22} />
                  </IconButton>
                  <Pressable
                    aria-label={t('capture')}
                    onClick={capture}
                    disabled={permission !== 'granted'}
                    className="w-[78px] h-[78px] rounded-full border-[4px] border-white flex items-center justify-center"
                  >
                    <span className="w-[62px] h-[62px] rounded-full bg-white" />
                  </Pressable>
                  <span className="w-12" />
                </div>
              </motion.div>
            )}

            {phase === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={sheetTransition}
                className="mx-4 mb-3 rounded-[28px] bg-white p-5 shadow-sheet"
              >
                <ul className="space-y-3.5" aria-live="polite">
                  {STEPS[mode].map((k, i) => (
                    <li key={k} className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 relative">
                        {i < step ? (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center">
                            <Check size={15} strokeWidth={3} />
                          </motion.span>
                        ) : i === step ? (
                          <span className="w-6 h-6 rounded-full border-[3px] border-sage-soft border-t-coral animate-spin" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-sage" />
                        )}
                      </span>
                      <span className={`text-[16px] ${i <= step ? 'text-ink font-semibold' : 'text-ink-faint font-medium'}`}>{t(k)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {phase === 'error' && (
              <motion.div
                key="error"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={sheetTransition}
                className="mx-4 mb-3 rounded-[28px] bg-white p-5 shadow-sheet"
                role="alert"
              >
                <div className="flex gap-3 mb-5">
                  <span className="w-10 h-10 rounded-2xl bg-avoid/10 text-avoid flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </span>
                  <div>
                    <p className="text-[17px] font-semibold text-ink">{t(errTitle)}</p>
                    <p className="text-[14px] text-ink-muted leading-snug mt-1">{t(errBody)}</p>
                  </div>
                </div>
                {errorCode === 'missing_key' ? (
                  <PrimaryButton onClick={onClose}>{t('close')}</PrimaryButton>
                ) : (
                  <div className="flex gap-3">
                    <Pressable onClick={retake} className="flex-1 h-12 rounded-full bg-sage-soft text-ink font-semibold">
                      {t('retake')}
                    </Pressable>
                    <Pressable onClick={() => snapshot && run(snapshot)} className="flex-1 h-12 rounded-full bg-ink text-white font-semibold">
                      {t('tryAgain')}
                    </Pressable>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} data-testid="file-input" />
      </div>
    </motion.div>
  );
};

export default Scanner;
