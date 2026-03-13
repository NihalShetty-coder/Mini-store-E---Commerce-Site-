'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, RotateCcw, Square, Circle, RectangleHorizontal, Lock, Unlock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
    aspectRatio?: number;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [circularCrop, setCircularCrop] = useState(false);
    const [aspect, setAspect] = useState<number | undefined>(undefined);
    const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // ─── Pre-fetch image as blob to avoid CORS canvas issues ──
    useEffect(() => {
        let revoke = '';
        (async () => {
            try {
                const res = await fetch(image);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                revoke = url;
                setBlobUrl(url);
            } catch {
                // If fetch fails (e.g. opaque response), use original URL
                setBlobUrl(image);
            }
        })();
        return () => { if (revoke) URL.revokeObjectURL(revoke); };
    }, [image]);

    // ─── Initialize crop when image loads ─────────────────────
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
        setImgDimensions({ w: naturalWidth, h: naturalHeight });

        const initialCrop: Crop = centerCrop(
            { unit: '%' as const, width: 70, height: 70 },
            width,
            height
        );
        setCrop(initialCrop);
    }, []);

    // ─── Reset when aspect changes ────────────────────────────
    useEffect(() => {
        if (!imgRef.current) return;
        const { width, height } = imgRef.current;
        if (aspect) {
            const newCrop = centerCrop(
                makeAspectCrop({ unit: '%', width: 70 }, aspect, width, height),
                width,
                height
            );
            setCrop(newCrop);
        }
    }, [aspect]);

    // ─── Crop the image using canvas ──────────────────────────
    const getCroppedImg = useCallback(async (): Promise<string> => {
        const img = imgRef.current;
        if (!img || !completedCrop) return '';

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';

            const scaleX = img.naturalWidth / img.width;
            const scaleY = img.naturalHeight / img.height;

            const pixelX = completedCrop.x * scaleX;
            const pixelY = completedCrop.y * scaleY;
            const pixelW = completedCrop.width * scaleX;
            const pixelH = completedCrop.height * scaleY;

            canvas.width = pixelW;
            canvas.height = pixelH;

            if (circularCrop) {
                ctx.beginPath();
                ctx.arc(
                    canvas.width / 2,
                    canvas.height / 2,
                    Math.min(canvas.width, canvas.height) / 2,
                    0,
                    Math.PI * 2
                );
                ctx.clip();
            }

            ctx.drawImage(img, pixelX, pixelY, pixelW, pixelH, 0, 0, pixelW, pixelH);

            return canvas.toDataURL('image/jpeg', 0.92);
        } catch {
            return '';
        }
    }, [completedCrop, circularCrop]);

    // ─── Handle apply ─────────────────────────────────────────
    const handleConfirm = async () => {
        setIsUploading(true);
        try {
            const croppedDataUrl = await getCroppedImg();
            if (!croppedDataUrl) {
                setIsUploading(false);
                return;
            }

            const { uploadBase64Image } = await import('@/lib/storage');
            const hostedUrl = await uploadBase64Image(croppedDataUrl);
            onCropComplete(hostedUrl);
        } catch {
            // If everything fails, use original image unchanged
            onCropComplete(image);
        } finally {
            setIsUploading(false);
        }
    };

    // ─── Handle reset ─────────────────────────────────────────
    const handleReset = () => {
        if (!imgRef.current) return;
        const { width, height } = imgRef.current;
        setCircularCrop(false);
        setAspect(undefined);
        setCrop(centerCrop(
            { unit: '%' as const, width: 70, height: 70 },
            width, height
        ));
    };

    // ─── Toggle aspect ratio ─────────────────────────────────
    const toggleAspect = (newAspect: number | undefined) => {
        setAspect(aspect === newAspect ? undefined : newAspect);
    };

    // ─── Crop dimensions display ─────────────────────────────
    const cropPixels = completedCrop && imgRef.current
        ? {
            w: Math.round(completedCrop.width * (imgRef.current.naturalWidth / imgRef.current.width)),
            h: Math.round(completedCrop.height * (imgRef.current.naturalHeight / imgRef.current.height)),
        }
        : null;

    // Don't render until blob is ready
    if (!blobUrl) {
        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center">
                <div className="absolute inset-0 bg-secondary/80 backdrop-blur-xl" />
                <Loader2 className="w-8 h-8 text-white animate-spin relative z-10" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCancel}
                className="absolute inset-0 bg-secondary/80 backdrop-blur-xl"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-border-custom flex items-center justify-between shrink-0">
                    <div className="space-y-1">
                        <h3 className="font-playfair text-xl font-black text-secondary uppercase tracking-wider">Crop Image</h3>
                        <p className="text-[10px] text-muted-custom font-bold uppercase tracking-widest">Drag corners and edges to resize</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-surface rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-border-custom flex items-center gap-2 shrink-0 bg-surface/50">
                    {/* Shape Toggle */}
                    <div className="flex items-center gap-1 border border-border-custom rounded-md overflow-hidden">
                        <button
                            onClick={() => setCircularCrop(false)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                                !circularCrop
                                    ? 'bg-secondary text-white'
                                    : 'bg-white text-muted-custom hover:text-secondary'
                            }`}
                            title="Rectangle crop"
                        >
                            <Square className="w-3 h-3" /> Rect
                        </button>
                        <button
                            onClick={() => {
                                setCircularCrop(true);
                                if (!aspect) setAspect(1);
                            }}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                                circularCrop
                                    ? 'bg-secondary text-white'
                                    : 'bg-white text-muted-custom hover:text-secondary'
                            }`}
                            title="Circle crop"
                        >
                            <Circle className="w-3 h-3" /> Circle
                        </button>
                    </div>

                    <div className="w-px h-6 bg-border-custom mx-1" />

                    {/* Aspect Ratio Presets */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => toggleAspect(undefined)}
                            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-1 ${
                                !aspect
                                    ? 'bg-secondary text-white'
                                    : 'text-muted-custom hover:text-secondary hover:bg-surface'
                            }`}
                            title="Free-form crop"
                            disabled={circularCrop}
                        >
                            <Unlock className="w-3 h-3" /> Free
                        </button>
                        <button
                            onClick={() => toggleAspect(1)}
                            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${
                                aspect === 1
                                    ? 'bg-secondary text-white'
                                    : 'text-muted-custom hover:text-secondary hover:bg-surface'
                            }`}
                            title="1:1 Square"
                        >
                            1:1
                        </button>
                        <button
                            onClick={() => {
                                if (circularCrop) setCircularCrop(false);
                                toggleAspect(4 / 3);
                            }}
                            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${
                                aspect === 4 / 3
                                    ? 'bg-secondary text-white'
                                    : 'text-muted-custom hover:text-secondary hover:bg-surface'
                            }`}
                            title="4:3 Landscape"
                        >
                            4:3
                        </button>
                        <button
                            onClick={() => {
                                if (circularCrop) setCircularCrop(false);
                                toggleAspect(16 / 9);
                            }}
                            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${
                                aspect === 16 / 9
                                    ? 'bg-secondary text-white'
                                    : 'text-muted-custom hover:text-secondary hover:bg-surface'
                            }`}
                            title="16:9 Widescreen"
                        >
                            16:9
                        </button>
                    </div>

                    <div className="flex-1" />

                    {/* Reset */}
                    <button
                        onClick={handleReset}
                        className="p-2 hover:bg-surface rounded-full transition-colors"
                        title="Reset crop"
                    >
                        <RotateCcw className="w-4 h-4 text-muted-custom" />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="flex-1 overflow-auto bg-neutral-900 flex items-center justify-center p-4 min-h-0">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                        circularCrop={circularCrop}
                        keepSelection
                        ruleOfThirds
                        minWidth={30}
                        minHeight={30}
                        className="max-h-full [&_.ReactCrop__crop-selection]:!border-2 [&_.ReactCrop__crop-selection]:!border-white [&_.ReactCrop__drag-handle]:!bg-white [&_.ReactCrop__drag-handle]:!border-2 [&_.ReactCrop__drag-handle]:!border-secondary [&_.ReactCrop__drag-handle]:!rounded-full [&_.ReactCrop__drag-handle]:!shadow-md"
                    >
                        <img
                            ref={imgRef}
                            src={blobUrl}
                            alt="Crop preview"
                            onLoad={onImageLoad}
                            className="max-h-[55vh] w-auto object-contain"
                        />
                    </ReactCrop>
                </div>

                {/* Footer */}
                <div className="p-6 space-y-4 bg-white shrink-0 border-t border-border-custom">
                    {/* Crop info bar */}
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-custom">
                        <div className="flex items-center gap-4">
                            {cropPixels && (
                                <span className="flex items-center gap-1.5">
                                    <RectangleHorizontal className="w-3.5 h-3.5" />
                                    {cropPixels.w} x {cropPixels.h} px
                                </span>
                            )}
                            {aspect && (
                                <span className="flex items-center gap-1.5">
                                    <Lock className="w-3 h-3" />
                                    {aspect === 1 ? '1:1' : aspect === 4 / 3 ? '4:3' : aspect === 16 / 9 ? '16:9' : 'Locked'}
                                </span>
                            )}
                            {circularCrop && (
                                <span className="flex items-center gap-1.5">
                                    <Circle className="w-3 h-3" /> Circular
                                </span>
                            )}
                        </div>
                        {imgDimensions && (
                            <span>
                                Original: {imgDimensions.w} x {imgDimensions.h}
                            </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            disabled={isUploading}
                            className="flex-1 px-8 py-4 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!completedCrop || isUploading}
                            className="flex-1 px-8 py-4 bg-secondary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-xl shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                            ) : (
                                <><Check className="w-4 h-4" /> Apply Crop</>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
