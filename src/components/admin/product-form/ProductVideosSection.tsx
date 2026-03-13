'use client';

import React, { useRef } from 'react';
import { Trash2, Loader2, Upload, Video as VideoIcon } from 'lucide-react';
import { type UploadProgress } from '@/lib/storage';
import { SectionHeader } from './SectionHeader';

interface ProductVideosSectionProps {
    videos: string[];
    setVideos: React.Dispatch<React.SetStateAction<string[]>>;
    uploadingVideos: Map<number, UploadProgress>;
    setUploadingVideos: React.Dispatch<React.SetStateAction<Map<number, UploadProgress>>>;
    setUploadError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function ProductVideosSection({
    videos,
    setVideos,
    uploadingVideos,
    setUploadingVideos,
    setUploadError,
}: ProductVideosSectionProps) {
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleVideoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploadError(null);
        const filesArray = Array.from(files);
        
        const placeholderCount = videos.length;
        setVideos(prev => [...prev, ...filesArray.map(() => '')]);

        // Lazy-load storage and logger modules only when upload is triggered
        const [{ uploadVideo }, { logger }] = await Promise.all([
            import('@/lib/storage'),
            import('@/lib/logger')
        ]);

        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            const currentIndex = placeholderCount + i;

            try {
                const result = await uploadVideo(
                    file,
                    'products/videos',
                    (progress) => {
                        setUploadingVideos(prev => new Map(prev).set(currentIndex, progress));
                    }
                );

                setVideos(prev => {
                    const next = [...prev];
                    next[currentIndex] = result.url;
                    return next;
                });

                setUploadingVideos(prev => {
                    const next = new Map(prev);
                    next.delete(currentIndex);
                    return next;
                });

                logger.info('Video uploaded successfully', { url: result.url });
            } catch (error) {
                const { logger: log } = await import('@/lib/logger');
                log.error('Video upload failed', { error });
                const errorMessage = error instanceof Error ? error.message : 'Upload failed';
                setUploadError(errorMessage);

                setVideos(prev => prev.filter((_, idx) => idx !== currentIndex));
                setUploadingVideos(prev => {
                    const next = new Map(prev);
                    next.delete(currentIndex);
                    return next;
                });
            }
        }

        e.target.value = '';
    };

    const removeVideo = (index: number) => {
        setVideos(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <section>
            <SectionHeader icon={VideoIcon} title="Product Videos" subtitle="Upload product demo videos (optional)." />
            <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoFiles}
                className="hidden"
            />

            {videos.length > 0 && (
                <div className="space-y-2 mb-4">
                    {videos.map((vid, index) => {
                        const uploadProgress = uploadingVideos.get(index);
                        const isUploading = uploadProgress !== undefined;
                        
                        return (
                            <div key={index} className="flex items-center gap-3 p-3 border border-border-custom bg-white group relative overflow-hidden">
                                {isUploading && (
                                    <div className="absolute inset-0 bg-primary/10 flex items-center z-10">
                                        <div 
                                            className="h-full bg-primary/20 transition-all duration-300"
                                            style={{ width: `${uploadProgress.progress}%` }}
                                        />
                                    </div>
                                )}
                                
                                <div className="w-10 h-10 bg-surface flex items-center justify-center border border-border-custom shrink-0 relative z-20">
                                    {isUploading ? (
                                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    ) : (
                                        <VideoIcon className="w-4 h-4 text-muted-custom" />
                                    )}
                                </div>
                                
                                <div className="flex-1 relative z-20">
                                    <span className="text-xs text-secondary truncate font-medium block">
                                        {isUploading ? `Uploading... ${uploadProgress.progress}%` : `Video ${index + 1}`}
                                    </span>
                                    {isUploading && (
                                        <span className="text-[10px] text-muted-custom">
                                            {Math.round(uploadProgress.bytesTransferred / 1024 / 1024)}MB / {Math.round(uploadProgress.totalBytes / 1024 / 1024)}MB
                                        </span>
                                    )}
                                </div>
                                
                                {!isUploading && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeVideo(index)} 
                                        className="p-1.5 text-muted-custom hover:text-red-500 transition-colors relative z-20"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideos.size > 0}
                className="w-full py-8 border-2 border-dashed border-border-custom flex items-center justify-center gap-3 text-muted-custom hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {uploadingVideos.size > 0 ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Uploading...</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {videos.length > 0 ? 'Add More Videos' : 'Upload Videos'}
                        </span>
                    </>
                )}
            </button>
        </section>
    );
}
