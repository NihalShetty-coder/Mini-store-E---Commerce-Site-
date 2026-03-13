'use client';

import React, { useState } from 'react';
import {
    Image as ImageIcon,
    Video as VideoIcon,
    Plus,
    Star,
    Crop,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Link as LinkIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MultiMediaManagerProps {
    images: string[];
    videos: string[];
    onImagesChange: (images: string[]) => void;
    onVideosChange: (videos: string[]) => void;
    onCropRequest: (imageUrl: string, index: number) => void;
}

export default function MultiMediaManager({
    images,
    videos,
    onImagesChange,
    onVideosChange,
    onCropRequest
}: MultiMediaManagerProps) {
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');

    const addImage = () => {
        if (newImageUrl.trim()) {
            onImagesChange([...images, newImageUrl.trim()]);
            setNewImageUrl('');
        }
    };

    const addVideo = () => {
        if (newVideoUrl.trim()) {
            onVideosChange([...videos, newVideoUrl.trim()]);
            setNewVideoUrl('');
        }
    };

    const removeImage = (index: number) => {
        onImagesChange(images.filter((_, i) => i !== index));
    };

    const removeVideo = (index: number) => {
        onVideosChange(videos.filter((_, i) => i !== index));
    };

    const setPrimaryImage = (index: number) => {
        const newImages = [...images];
        const [primary] = newImages.splice(index, 1);
        onImagesChange([primary, ...newImages]);
    };

    const moveImage = (index: number, direction: 'left' | 'right') => {
        const newImages = [...images];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= images.length) return;

        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-8 border-b border-border-custom">
                <button
                    onClick={() => setActiveTab('images')}
                    className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'images' ? 'text-secondary' : 'text-muted-custom hover:text-secondary'
                        }`}
                >
                    Images ({images.length})
                    {activeTab === 'images' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />}
                </button>
                <button
                    onClick={() => setActiveTab('videos')}
                    className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'videos' ? 'text-secondary' : 'text-muted-custom hover:text-secondary'
                        }`}
                >
                    Videos ({videos.length})
                    {activeTab === 'videos' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />}
                </button>
            </div>

            {activeTab === 'images' ? (
                <div className="space-y-6">
                    {/* Add Image */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                            <input
                                type="url"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="Paste image URL..."
                                className="w-full pl-10 pr-4 py-3 border border-border-custom outline-none focus:border-primary text-sm bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && addImage()}
                            />
                        </div>
                        <button
                            onClick={addImage}
                            className="px-6 bg-secondary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {images.map((img, index) => (
                            <motion.div
                                layout
                                key={img + index}
                                className={`relative aspect-square border group overflow-hidden ${index === 0 ? 'border-secondary ring-1 ring-secondary' : 'border-border-custom'
                                    }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />

                                {index === 0 && (
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-secondary text-white text-[8px] font-black uppercase tracking-tighter">
                                        Primary
                                    </div>
                                )}

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => moveImage(index, 'left')}
                                            disabled={index === 0}
                                            className="p-2 bg-white/20 hover:bg-white/40 text-white disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveImage(index, 'right')}
                                            disabled={index === images.length - 1}
                                            className="p-2 bg-white/20 hover:bg-white/40 text-white disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onCropRequest(img, index)}
                                            className="p-2 bg-white text-secondary hover:bg-primary hover:text-white transition-all shadow-xl"
                                            title="Crop"
                                        >
                                            <Crop className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setPrimaryImage(index)}
                                            className={`p-2 transition-all shadow-xl ${index === 0 ? 'bg-primary text-white' : 'bg-white text-secondary hover:bg-primary hover:text-white'
                                                }`}
                                            title="Set as Primary"
                                        >
                                            <Star className="w-4 h-4" fill={index === 0 ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="p-2 bg-red-500 text-white hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Placeholder for empty state */}
                        {images.length === 0 && (
                            <div className="col-span-full py-12 border-2 border-dashed border-border-custom flex flex-col items-center justify-center text-muted-custom space-y-3">
                                <ImageIcon className="w-8 h-8 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No images added yet</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Add Video */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <VideoIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                            <input
                                type="url"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="Paste video URL (YouTube, Vimeo, etc.)..."
                                className="w-full pl-10 pr-4 py-3 border border-border-custom outline-none focus:border-primary text-sm bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && addVideo()}
                            />
                        </div>
                        <button
                            onClick={addVideo}
                            className="px-6 bg-secondary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>

                    {/* Video list */}
                    <div className="space-y-3">
                        {videos.map((vid, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 border border-border-custom bg-surface group">
                                <div className="w-12 h-12 bg-white flex items-center justify-center border border-border-custom">
                                    <VideoIcon className="w-5 h-5 text-muted-custom" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary truncate">{vid}</p>
                                </div>
                                <button
                                    onClick={() => removeVideo(index)}
                                    className="p-2 text-muted-custom hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {videos.length === 0 && (
                            <div className="py-12 border-2 border-dashed border-border-custom flex flex-col items-center justify-center text-muted-custom space-y-3">
                                <VideoIcon className="w-8 h-8 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No videos added yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
