'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { type UploadProgress } from '@/lib/storage';
import ImageCropper from './ImageCropper';

// Import section components
import {
    ProductImagesSection,
    ProductVideosSection,
    ProductDetailsSection,
    ProductSizesSection,
    ProductColorsSection,
    VariantInventorySection,
    ProductTagsSection,
    ProductSeoSection,
    type ProductFormData,
    type ProductFormProps,
} from './product-form';

// Re-export types for external consumers
export type { ProductFormData, ProductFormProps };

type StringArrayStateAction = React.SetStateAction<string[]>;

function buildVariantInventory(
    sizes: string[],
    colors: string[],
    inventory: Record<string, number>
): Record<string, number> {
    const hasVariants = sizes.length > 0 || colors.length > 0;

    if (!hasVariants) {
        return {};
    }

    const validKeys = new Set<string>();
    const rowValues = sizes.length > 0 ? sizes : [''];
    const colValues = colors.length > 0 ? colors : [''];
    const nextInventory: Record<string, number> = {};

    for (const row of rowValues) {
        for (const col of colValues) {
            const key = `${row}|${col}`;
            validKeys.add(key);
            nextInventory[key] = inventory[key] ?? 0;
        }
    }

    return nextInventory;
}

export default function ProductForm({ initialData, onSubmit, onCancel, mode }: ProductFormProps) {
    // ─── Form State ─────────────────────────────────────────
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [price, setPrice] = useState(initialData?.price?.toString() || '');
    const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
    const [stock, setStock] = useState(initialData?.stock?.toString() || '0');
    const [sku, setSku] = useState(initialData?.sku || '');
    const [status, setStatus] = useState<'Active' | 'Draft' | 'Out of Stock'>(initialData?.status || 'Active');
    const [badge, setBadge] = useState(initialData?.badge || '');
    const [brand, setBrand] = useState(initialData?.brand || '');
    const [material, setMaterial] = useState(initialData?.material || '');

    // Media
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [videos, setVideos] = useState<string[]>(initialData?.videos || []);

    // Attributes
    const [sizes, setSizes] = useState<string[]>(initialData?.sizes || []);
    const [colors, setColors] = useState<string[]>(initialData?.colors || []);

    // Tags & SEO
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [seoTitle, setSeoTitle] = useState(initialData?.seo?.title || '');
    const [seoDescription, setSeoDescription] = useState(initialData?.seo?.description || '');

    // Variant Inventory
    const [variantInventory, setVariantInventory] = useState<Record<string, number>>(
        initialData?.variantInventory || {}
    );
    const [lowStockThreshold, setLowStockThreshold] = useState(
        initialData?.lowStockThreshold?.toString() || '5'
    );

    // UI state
    const [cropImage, setCropImage] = useState<{ url: string; index: number } | null>(null);
    const [uploadingImages, setUploadingImages] = useState<Map<number, UploadProgress>>(new Map());
    const [uploadingVideos, setUploadingVideos] = useState<Map<number, UploadProgress>>(new Map());
    const [uploadError, setUploadError] = useState<string | null>(null);

    // ─── Crop Handler ───────────────────────────────────────
    const onCropComplete = useCallback((croppedUrl: string) => {
        if (cropImage !== null) {
            setImages(prev => {
                const next = [...prev];
                next[cropImage.index] = croppedUrl;
                return next;
            });
            setCropImage(null);
        }
    }, [cropImage]);

    // ─── Auto-calc stock from variant inventory ─────────────
    const hasVariants = sizes.length > 0 || colors.length > 0;
    const normalizedVariantInventory = useMemo(
        () => buildVariantInventory(sizes, colors, variantInventory),
        [sizes, colors, variantInventory]
    );
    const variantTotal = useMemo(() => {
        if (!hasVariants || Object.keys(normalizedVariantInventory).length === 0) return null;
        return Object.values(normalizedVariantInventory).reduce((sum, v) => sum + (v || 0), 0);
    }, [hasVariants, normalizedVariantInventory]);

    const displayedStock = hasVariants && variantTotal !== null
        ? variantTotal.toString()
        : stock;

    const handleSizesChange = useCallback((value: StringArrayStateAction) => {
        setSizes((currentSizes) => {
            const nextSizes = typeof value === 'function' ? value(currentSizes) : value;
            setVariantInventory((currentInventory) => buildVariantInventory(nextSizes, colors, currentInventory));
            return nextSizes;
        });
    }, [colors]);

    const handleColorsChange = useCallback((value: StringArrayStateAction) => {
        setColors((currentColors) => {
            const nextColors = typeof value === 'function' ? value(currentColors) : value;
            setVariantInventory((currentInventory) => buildVariantInventory(sizes, nextColors, currentInventory));
            return nextColors;
        });
    }, [sizes]);

    const handleVariantInventoryChange = useCallback((nextInventory: Record<string, number>) => {
        setVariantInventory(buildVariantInventory(sizes, colors, nextInventory));
    }, [sizes, colors]);

    // ─── Submit ─────────────────────────────────────────────
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent submission if uploads are in progress
        if (uploadingImages.size > 0 || uploadingVideos.size > 0) {
            setUploadError('Please wait for all uploads to complete before submitting');
            return;
        }

        const priceNum = parseFloat(price);
        const originalPriceNum = originalPrice ? parseFloat(originalPrice) : undefined;
        const stockValue = hasVariants && variantTotal !== null ? variantTotal.toString() : stock;
        const stockNum = parseInt(stockValue, 10);

        if (isNaN(priceNum) || priceNum < 0) return;
        if (isNaN(stockNum) || stockNum < 0) return;

        // Filter out empty image/video URLs (placeholders)
        const validImages = images.filter(img => img !== '');
        const validVideos = videos.filter(vid => vid !== '');

        onSubmit({
            name: name.trim(),
            description: description.trim(),
            price: priceNum,
            originalPrice: originalPriceNum,
            category,
            subCategory: subCategory || undefined,
            stock: stockNum,
            sku: sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
            status,
            badge,
            image: validImages[0] || '',
            images: validImages,
            videos: validVideos,
            sizes,
            colors,
            material,
            brand,
            tags,
            seo: {
                title: seoTitle || name,
                description: seoDescription,
                keywords: tags,
            },
            variantInventory: normalizedVariantInventory,
            lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
        });
    };

    return (
        <>
            <form onSubmit={handleFormSubmit} className="h-full flex flex-col">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">

                    {/* Error Display */}
                    {uploadError && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 flex items-start gap-3">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-red-900 uppercase tracking-wider mb-1">Upload Error</p>
                                <p className="text-xs text-red-700">{uploadError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUploadError(null)}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Section 1: Product Images */}
                    <ProductImagesSection
                        images={images}
                        setImages={setImages}
                        uploadingImages={uploadingImages}
                        setUploadingImages={setUploadingImages}
                        setUploadError={setUploadError}
                        setCropImage={setCropImage}
                    />

                    {/* Section 2: Videos */}
                    <ProductVideosSection
                        videos={videos}
                        setVideos={setVideos}
                        uploadingVideos={uploadingVideos}
                        setUploadingVideos={setUploadingVideos}
                        setUploadError={setUploadError}
                    />

                    {/* Section 3: Basic Info */}
                    <ProductDetailsSection
                        name={name} setName={setName}
                        description={description} setDescription={setDescription}
                        price={price} setPrice={setPrice}
                        originalPrice={originalPrice} setOriginalPrice={setOriginalPrice}
                        stock={displayedStock} setStock={setStock}
                        sku={sku} setSku={setSku}
                        category={category} setCategory={setCategory}
                        subCategory={subCategory} setSubCategory={setSubCategory}
                        brand={brand} setBrand={setBrand}
                        material={material} setMaterial={setMaterial}
                        status={status} setStatus={setStatus}
                        badge={badge} setBadge={setBadge}
                        lowStockThreshold={lowStockThreshold}
                        setLowStockThreshold={setLowStockThreshold}
                        hasVariants={hasVariants}
                    />

                    {/* Section 4: Sizes */}
                    <ProductSizesSection
                        sizes={sizes}
                        setSizes={handleSizesChange}
                    />

                    {/* Section 5: Colors */}
                    <ProductColorsSection
                        colors={colors}
                        setColors={handleColorsChange}
                    />

                    {/* Section 6: Variant Inventory (auto-appears when sizes/colors exist) */}
                    <VariantInventorySection
                        sizes={sizes}
                        colors={colors}
                        variantInventory={normalizedVariantInventory}
                        setVariantInventory={handleVariantInventoryChange}
                        lowStockThreshold={parseInt(lowStockThreshold, 10) || 5}
                    />

                    {/* Section 7: Tags */}
                    <ProductTagsSection
                        tags={tags}
                        setTags={setTags}
                    />

                    {/* Section 7: SEO (Collapsible) */}
                    <ProductSeoSection
                        seoTitle={seoTitle}
                        setSeoTitle={setSeoTitle}
                        seoDescription={seoDescription}
                        setSeoDescription={setSeoDescription}
                    />
                </div>

                {/* ═══ Sticky Footer ═══ */}
                <div className="shrink-0 p-6 border-t border-border-custom bg-white flex gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={uploadingImages.size > 0 || uploadingVideos.size > 0}
                        className="flex-[2] py-4 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadingImages.size > 0 || uploadingVideos.size > 0 ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                {mode === 'add' ? <Plus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                {mode === 'add' ? 'Create Product' : 'Save Changes'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Image Cropper Overlay */}
            <AnimatePresence>
                {cropImage && (
                    <ImageCropper
                        image={cropImage.url}
                        onCropComplete={onCropComplete}
                        onCancel={() => setCropImage(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
