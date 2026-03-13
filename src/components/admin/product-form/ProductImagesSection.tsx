'use client';

import React, { useRef } from 'react';
import { Plus, Trash2, Star, Crop, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type UploadProgress } from '@/lib/storage';
import { SectionHeader } from './SectionHeader';

interface ProductImagesSectionProps {
    images: string[];
    setImages: React.Dispatch<React.SetStateAction<string[]>>;
    uploadingImages: Map<number, UploadProgress>;
    setUploadingImages: React.Dispatch<React.SetStateAction<Map<number, UploadProgress>>>;
    setUploadError: React.Dispatch<React.SetStateAction<string | null>>;
    setCropImage: React.Dispatch<React.SetStateAction<{ url: string; index: number } | null>>;
}

export function ProductImagesSection({
    images,
    setImages,
    uploadingImages,
    setUploadingImages,
    setUploadError,
    setCropImage,
}: ProductImagesSectionProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploadError(null);
        const filesArray = Array.from(files);
        
        const placeholderCount = images.length;
        setImages(prev => [...prev, ...filesArray.map(() => '')]);

        // Lazy-load storage and logger modules only when upload is triggered
        const [{ uploadImage }, { logger }] = await Promise.all([
            import('@/lib/storage'),
            import('@/lib/logger')
        ]);

        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            const currentIndex = placeholderCount + i;

            try {
                const result = await uploadImage(
                    file,
                    'products/images',
                    (progress) => {
                        setUploadingImages(prev => new Map(prev).set(currentIndex, progress));
                    }
                );

                setImages(prev => {
                    const next = [...prev];
                    next[currentIndex] = result.url;
                    return next;
                });

                setUploadingImages(prev => {
                    const next = new Map(prev);
                    next.delete(currentIndex);
                    return next;
                });

                logger.info('Image uploaded successfully', { url: result.url });
            } catch (error) {
                const { logger: log } = await import('@/lib/logger');
                log.error('Image upload failed', { error });
                const errorMessage = error instanceof Error ? error.message : 'Upload failed';
                setUploadError(errorMessage);

                setImages(prev => prev.filter((_, idx) => idx !== currentIndex));
                setUploadingImages(prev => {
                    const next = new Map(prev);
                    next.delete(currentIndex);
                    return next;
                });
            }
        }

        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const setPrimaryImage = (index: number) => {
        setImages(prev => {
            const next = [...prev];
            const [primary] = next.splice(index, 1);
            return [primary, ...next];
        });
    };

    return (
        <section>
            <SectionHeader icon={ImageIcon} title="Product Images" subtitle="Upload product photos. First image is the primary." />
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFiles}
                className="hidden"
            />

            {images.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                    {images.map((img, index) => {
                        const uploadProgress = uploadingImages.get(index);
                        const isUploading = uploadProgress !== undefined;
                        
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "relative aspect-square border-2 group overflow-hidden bg-surface",
                                    index === 0 ? "border-primary ring-2 ring-primary/20" : "border-border-custom"
                                )}
                            >
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                                        <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                        <span className="text-white text-xs font-bold">{uploadProgress.progress}%</span>
                                        <div className="w-3/4 h-1 bg-white/20 mt-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-white transition-all duration-300"
                                                style={{ width: `${uploadProgress.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                                
                                {index === 0 && img && (
                                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-primary text-white text-[7px] font-black uppercase tracking-tight">
                                        Primary
                                    </div>
                                )}
                                
                                {!isUploading && img && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                        {index !== 0 && (
                                            <button type="button" onClick={() => setPrimaryImage(index)} className="p-1.5 bg-white/90 text-secondary hover:bg-primary hover:text-white transition-all" title="Set Primary">
                                                <Star className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button type="button" onClick={() => setCropImage({ url: img, index })} className="p-1.5 bg-white/90 text-secondary hover:bg-primary hover:text-white transition-all" title="Crop">
                                            <Crop className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => removeImage(index)} className="p-1.5 bg-red-500 text-white hover:bg-red-600 transition-all" title="Remove">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-border-custom flex flex-col items-center justify-center gap-2 text-muted-custom hover:border-primary hover:text-primary transition-all"
                        disabled={uploadingImages.size > 0}
                    >
                        <Plus className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Add More</span>
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full py-16 border-2 border-dashed border-border-custom flex flex-col items-center justify-center gap-3 text-muted-custom hover:border-primary hover:text-primary transition-all hover:bg-primary/5 group"
                >
                    <div className="p-4 bg-surface border border-border-custom group-hover:border-primary/30 transition-colors">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest">Click to upload images</p>
                        <p className="text-[9px] mt-1">PNG, JPG, WEBP — Multiple files allowed</p>
                    </div>
                </button>
            )}
        </section>
    );
}
