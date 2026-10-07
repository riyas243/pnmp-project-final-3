import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  X,
  FileCheck,
  CheckCircle2,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { FoodScanData, AIStatusType } from '../types.ts';
import { ResultCard } from './ResultCard.tsx';
import { SAMPLE_DISHES, createSampleFile, SampleDish } from '../utils/sampleImages.ts';

interface FoodScannerProps {
  aiStatus: AIStatusType;
  setAiStatus: (status: AIStatusType) => void;
  modelName: string;
  onMealLogged: (meal: FoodScanData, mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => Promise<void>;
  onGoToGuide: () => void;
}

export const FoodScanner: React.FC<FoodScannerProps> = ({
  aiStatus,
  setAiStatus,
  modelName,
  onMealLogged,
  onGoToGuide,
}) => {
  // State for image handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Scanning flow states
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FoodScanData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prevent duplicate clicks ref
  const isRequestInProgressRef = useRef(false);

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Frontend image validation
  const validateAndSetImage = (file: File) => {
    setValidationError(null);
    setApiError(null);
    setScanResult(null);

    // 1. Check file existence
    if (!file) {
      setValidationError('Please upload a valid food image.');
      return false;
    }

    // 2. Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExt) {
      setValidationError('Please upload a valid food image (JPG, PNG, or WEBP).');
      return false;
    }

    // 3. Check MIME type
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError('Please upload a valid food image (JPG, PNG, or WEBP).');
      return false;
    }

    // 4. Check file size limit
    if (file.size > MAX_FILE_SIZE) {
      setValidationError('Image size is too large. Please upload an image smaller than 10MB.');
      return false;
    }

    // Valid file: create object URL preview
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetImage(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetImage(e.dataTransfer.files[0]);
    }
  };

  // Start Camera
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to access device camera. Please check permissions or upload a photo.');
    }
  };

  // Stop Camera
  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture Snapshot from Camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      blob => {
        if (!blob) return;
        const file = new File([blob], `meal-snapshot-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        validateAndSetImage(file);
        handleStopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  // Load a pre-rendered sample dish
  const handleSelectSampleDish = async (dish: SampleDish) => {
    try {
      const file = await createSampleFile(dish);
      validateAndSetImage(file);
    } catch (err) {
      console.error('Failed to create sample file:', err);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setValidationError(null);
    setApiError(null);
    setScanResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Main Scan Food Execution Flow
  const handleScanFood = async () => {
    // 1. Confirm an image exists
    if (!selectedFile) {
      setValidationError('Please select or upload an image first.');
      return;
    }

    // Prevent duplicate API requests while a scan is already running
    if (isRequestInProgressRef.current || isScanning) {
      return;
    }

    isRequestInProgressRef.current = true;
    setIsScanning(true);
    setApiError(null);
    setValidationError(null);
    setAiStatus('Analyzing Image');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/food-scan', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'AI food recognition is temporarily unavailable.';
        setApiError(errorMsg);
        setAiStatus('Recognition Failed');
        return;
      }

      // Success: display results
      setScanResult(result.data);
      setAiStatus('Recognition Successful');
    } catch (err) {
      console.error('Network or client error during food scan:', err);
      setApiError('AI food recognition is temporarily unavailable. Please try again later.');
      setAiStatus('AI Service Temporarily Unavailable');
    } finally {
      setIsScanning(false);
      isRequestInProgressRef.current = false;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* AI Configuration Missing Banner */}
      {aiStatus === 'AI Configuration Missing' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Gemini API Key Required</h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Food recognition is not configured. Please add your <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-xs">GEMINI_API_KEY</code> in <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-xs">.env</code> or AI Studio Secrets.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToGuide}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
          >
            View Setup Guide
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AI Multimodal Food Scanner
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
          Upload any food photo or snap a plate with your camera. Google Gemini analyzes the visual ingredients, predicts accurate portion size, and calculates comprehensive macronutrients in real time.
        </p>
      </div>

      {/* Main Upload / Camera / Recognition Area */}
      {!scanResult ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Active Camera View */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[460px] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={handleStopCamera}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/40 transition-transform active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  <span>Snap Plate</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Image Upload Dropzone */}
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="food-image-input"
                  />

                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                      <UploadCloud className="w-8 h-8" />
                    </div>

                    <div>
                      <label
                        htmlFor="food-image-input"
                        className="cursor-pointer text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold text-base hover:underline"
                      >
                        Choose an image
                      </label>
                      <span className="text-slate-600 dark:text-slate-400 text-base"> or drag and drop here</span>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Supports JPG, PNG, WEBP (Maximum size: 10MB)
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Browse Files
                      </button>

                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Use Camera
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Selected File Preview Card */
                <div className="p-4 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-slate-900 shadow-md shrink-0">
                      {imagePreviewUrl && (
                        <img
                          src={imagePreviewUrl}
                          alt="Food Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                        {selectedFile.type.split('/')[1] || 'IMAGE'}
                      </span>
                    </div>

                    <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full w-fit mx-auto sm:mx-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for Analysis</span>
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-lg break-all">
                        {selectedFile.name}
                      </h3>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>Size: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>MIME: {selectedFile.type || 'image/*'}</span>
                      </div>

                      <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isScanning}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          disabled={isScanning}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{validationError}</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Allowed formats: .jpg, .jpeg, .png, .webp (max size 10MB).
                </p>
              </div>
            </div>
          )}

          {/* API Error Message */}
          {apiError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{apiError}</p>
                {apiError.includes('configured') && (
                  <button
                    onClick={onGoToGuide}
                    className="mt-2 text-xs font-bold text-rose-900 dark:text-rose-200 underline hover:no-underline block"
                  >
                    Open Google AI Studio Setup Guide →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scan Food Action Button */}
          <div className="pt-2">
            <button
              type="button"
              id="scan-food-btn"
              onClick={handleScanFood}
              disabled={!selectedFile || isScanning}
              className={`w-full py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all flex items-center justify-center gap-3 shadow-lg cursor-pointer ${
                !selectedFile || isScanning
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-[0.99]'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-white">Analyzing your food with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                  <span>Scan Food</span>
                </>
              )}
            </button>
          </div>

          {/* Quick 1-Click Sample Dishes for Instant Testing */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Quick Test Dishes (JPG / PNG / WEBP)
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Click to load instantly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SAMPLE_DISHES.map(dish => (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => handleSelectSampleDish(dish)}
                  disabled={isScanning}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 hover:bg-emerald-50/30 dark:hover:bg-slate-700 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                      {dish.format.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{dish.category}</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {dish.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {dish.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Recognition Results Card */
        <ResultCard
          data={scanResult}
          imagePreviewUrl={imagePreviewUrl}
          onScanAnother={handleClearImage}
          onMealLogged={onMealLogged}
        />
      )}
    </div>
  );
};
