import { logger } from './logger';

// imgbb API configuration
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 32 * 1024 * 1024; // 32MB - imgbb limit
const MAX_VIDEO_SIZE = 32 * 1024 * 1024; // 32MB - imgbb limit for videos

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

export interface UploadProgress {
    progress: number; // 0-100
    bytesTransferred: number;
    totalBytes: number;
}

export interface UploadResult {
    url: string;
    path: string;
}

/**
 * Validates file type and size
 */
function validateFile(file: File, type: 'image' | 'video'): void {
    const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
    const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }
}

/**
 * Generates a unique filename to prevent collisions
 */
function generateFileName(file: File): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop() || 'jpg';
    return `${timestamp}_${randomStr}.${extension}`;
}

/**
 * Converts file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data URL prefix (data:image/png;base64,)
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Upload an image to imgbb
 * @param file - The image file to upload
 * @param path - Not used for imgbb (kept for compatibility)
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with download URL and path
 */
export async function uploadImage(
    file: File,
    _path: string = 'products/images',
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
    try {
        // Validate API key
        if (!IMGBB_API_KEY) {
            throw new Error('imgbb API key not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your .env.local file');
        }

        // Validate file
        validateFile(file, 'image');

        // Start progress
        if (onProgress) {
            onProgress({ progress: 10, bytesTransferred: 0, totalBytes: file.size });
        }

        // Convert to base64
        const base64Image = await fileToBase64(file);
        
        if (onProgress) {
            onProgress({ progress: 50, bytesTransferred: file.size / 2, totalBytes: file.size });
        }

        // Create form data
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64Image);
        formData.append('name', generateFileName(file));

        // Upload to imgbb
        const response = await fetch(IMGBB_API_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.data?.url) {
            throw new Error('Upload failed: Invalid response from imgbb');
        }

        if (onProgress) {
            onProgress({ progress: 100, bytesTransferred: file.size, totalBytes: file.size });
        }

        const result = {
            url: data.data.url,
            path: data.data.id || generateFileName(file),
        };

        logger.info('Image uploaded successfully to imgbb', { url: result.url });
        return result;

    } catch (error) {
        logger.error('Image upload failed', { error });
        throw error;
    }
}

/**
 * Upload a video to imgbb
 * Note: imgbb has limited video support. For better video hosting, consider alternatives.
 * @param file - The video file to upload
 * @param path - Not used for imgbb (kept for compatibility)
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with download URL and path
 */
export async function uploadVideo(
    file: File,
    _path: string = 'products/videos',
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
    try {
        // Validate API key
        if (!IMGBB_API_KEY) {
            throw new Error('imgbb API key not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your .env.local file');
        }

        // Validate file
        validateFile(file, 'video');

        // Start progress
        if (onProgress) {
            onProgress({ progress: 10, bytesTransferred: 0, totalBytes: file.size });
        }

        // Convert to base64
        const base64Video = await fileToBase64(file);
        
        if (onProgress) {
            onProgress({ progress: 50, bytesTransferred: file.size / 2, totalBytes: file.size });
        }

        // Create form data
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64Video); // imgbb uses 'image' field even for videos
        formData.append('name', generateFileName(file));

        // Upload to imgbb
        const response = await fetch(IMGBB_API_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.data?.url) {
            throw new Error('Upload failed: Invalid response from imgbb');
        }

        if (onProgress) {
            onProgress({ progress: 100, bytesTransferred: file.size, totalBytes: file.size });
        }

        const result = {
            url: data.data.url,
            path: data.data.id || generateFileName(file),
        };

        logger.info('Video uploaded successfully to imgbb', { url: result.url });
        return result;

    } catch (error) {
        logger.error('Video upload failed', { error });
        throw error;
    }
}

/**
 * Upload a base64 data URL to imgbb (used after image cropping)
 * @param base64DataUrl - The data URL string (data:image/jpeg;base64,...)
 * @returns Promise with hosted URL
 */
export async function uploadBase64Image(base64DataUrl: string): Promise<string> {
    if (!IMGBB_API_KEY) {
        throw new Error('imgbb API key not configured');
    }

    // Strip the data URL prefix to get raw base64
    const base64 = base64DataUrl.split(',')[1];
    if (!base64) throw new Error('Invalid base64 data URL');

    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64);
    formData.append('name', `crop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

    const response = await fetch(IMGBB_API_URL, { method: 'POST', body: formData });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data?.url) {
        throw new Error('Upload failed: Invalid response from imgbb');
    }

    logger.info('Cropped image uploaded to imgbb', { url: data.data.url });
    return data.data.url;
}

/**
 * Delete a file from imgbb
 * Note: imgbb free tier doesn't support deletion via API
 * Files are stored permanently unless manually deleted from dashboard
 * @param path - The file ID or path (not used for imgbb)
 */
export async function deleteFile(path: string): Promise<void> {
    // imgbb free tier doesn't support deletion via API
    // Files remain on imgbb servers
    logger.warn('imgbb free tier does not support file deletion via API', { path });
    // No-op: Files will remain on imgbb
}

/**
 * Extract file ID from imgbb URL
 * @param url - The imgbb download URL
 * @returns The file ID or null if invalid URL
 */
export function extractStoragePath(url: string): string | null {
    try {
        const urlObj = new URL(url);
        // imgbb URLs look like: https://i.ibb.co/xxxxx/filename.png
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length >= 2) {
            return pathParts[1]; // Return the file ID
        }
        return null;
    } catch (error) {
        logger.error('Failed to extract path from URL', { error, url });
        return null;
    }
}
