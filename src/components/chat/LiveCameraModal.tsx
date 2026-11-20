'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File, previewUrl: string) => void;
  onOpenGallery?: () => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  onOpenGallery,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera stream safely
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
  };

  // Start camera stream
  const startCamera = async (mode: 'user' | 'environment') => {
    setIsInitializing(true);
    setErrorMsg(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(
        'Live camera is not supported on this browser or requires a secure HTTPS connection. Please select a photo from your gallery instead.'
      );
      setIsInitializing(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera device was detected on your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMsg('Camera is already in use by another application.');
      } else {
        setErrorMsg(err.message || 'Unable to access the camera.');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  // Capture snapshot to canvas
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front camera
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataUrl(dataUrl);

    // Stop live stream while reviewing captured photo
    stopStream();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera(facingMode);
  };

  const handleSend = () => {
    if (!capturedDataUrl) return;

    // Convert data URL to File object
    fetch(capturedDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `lotta_cam_${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        onPhotoCaptured(file, capturedDataUrl);
        handleClose();
      })
      .catch(e => {
        console.error('Error generating photo file:', e);
      });
  };

  const handleToggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleClose = () => {
    stopStream();
    setCapturedDataUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-navy-950 rounded-3xl border border-indigo-500/20 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-indigo-500/15 flex items-center justify-between bg-navy-900/60 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Live Camera</h3>
              <p className="text-[11px] text-indigo-200/60">Take and send a photo instantly</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Video Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] max-h-[520px] overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm text-rose-200 leading-relaxed">{errorMsg}</p>
              {onOpenGallery && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenGallery();
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-glow transition-all"
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose from Gallery instead
                </button>
              )}
            </div>
          ) : capturedDataUrl ? (
            // Preview captured snapshot
            <img
              src={capturedDataUrl}
              alt="Captured"
              className="w-full h-full object-contain max-h-[520px]"
            />
          ) : (
            // Live video stream
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover max-h-[520px] ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
              {isInitializing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-indigo-200 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                  Initializing camera...
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas for snapshot */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls / Footer */}
        <div className="p-4 bg-navy-900/90 border-t border-indigo-500/15 flex items-center justify-between">
          {!errorMsg && (
            <>
              {capturedDataUrl ? (
                // Captured state actions: Retake & Send
                <div className="flex items-center justify-between w-full gap-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-indigo-500/30 hover:bg-white/5 text-xs font-medium text-indigo-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue text-white text-xs font-semibold shadow-glow transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Send Photo
                  </button>
                </div>
              ) : (
                // Live camera controls: Switch camera & Shutter capture
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    disabled={isInitializing}
                    className="p-3 rounded-2xl bg-navy-800/80 hover:bg-navy-700/80 text-indigo-200 transition-colors border border-indigo-500/20"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  {/* Shutter Button */}
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isInitializing}
                    className="w-16 h-16 rounded-full bg-white p-1.5 shadow-glow hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                    title="Take photo"
                  >
                    <div className="w-full h-full rounded-full border-2 border-navy-950 bg-gradient-to-tr from-brand-600 to-lotta-blue" />
                  </button>

                  {onOpenGallery ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onOpenGallery();
                      }}
                      className="p-3 rounded-2xl bg-navy-800/80 hover:bg-navy-700/80 text-indigo-200 transition-colors border border-indigo-500/20"
                      title="Open Gallery"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-11" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
