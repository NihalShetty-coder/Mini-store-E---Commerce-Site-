# imgbb Image Hosting Setup Guide

## Overview
This project uses **imgbb** as a free alternative to Firebase Storage for hosting product images and videos.

## Why imgbb?
- ✅ **100% Free** - Unlimited uploads with API key
- ✅ **No file expiration** - Images stored permanently
- ✅ **32MB file limit** - Generous for images and small videos
- ✅ **No credit card required**
- ✅ **Fast CDN delivery**
- ✅ **Simple REST API**

## Setup Instructions

### Step 1: Get Your imgbb API Key

1. Visit: https://api.imgbb.com/
2. Click **"Get API Key"** button
3. Sign up with email or Google account (free, no credit card)
4. Once logged in, your API key will be displayed
5. Copy your API key (looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 2: Add API Key to Your Project

1. Open your `.env.local` file (create it if it doesn't exist)
2. Add this line:
   ```
   NEXT_PUBLIC_IMGBB_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key
4. Save the file

### Step 3: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test Image Upload

1. Navigate to `/admin/products`
2. Click "Add Product" or edit existing product
3. Click "Upload Images"
4. Select an image (max 32MB)
5. Watch the progress bar
6. Image should upload successfully!

## Features

### Image Upload
- ✅ Max size: 32MB
- ✅ Supported formats: JPEG, PNG, WEBP, GIF, BMP
- ✅ Progress tracking with percentage
- ✅ Error handling with user-friendly messages
- ✅ Automatic validation

### Video Upload
- ✅ Max size: 32MB
- ✅ Supported formats: MP4, WEBM, QuickTime, AVI
- ✅ Progress tracking
- ⚠️ Note: For better video hosting, consider alternatives like YouTube embeds

## Limitations

### imgbb Free Tier:
- ❌ **No file deletion via API** - Files uploaded stay permanently (can only delete via dashboard)
- ⚠️ **32MB file limit** - Larger files will be rejected
- ⚠️ **Limited video support** - Better for images than videos

### Alternatives (if you need more):
- **Cloudinary** - 25GB storage + 25GB bandwidth/month free
- **Supabase Storage** - 1GB storage + 2GB bandwidth/month free
- **Upgrade Firebase** - Pay-as-you-go with better features

## API Usage

### Upload Image
```typescript
import { uploadImage } from '@/lib/storage';

const result = await uploadImage(
  file,
  'products/images',
  (progress) => {
    console.log(`Upload: ${progress.progress}%`);
  }
);
console.log('Image URL:', result.url);
```

### Upload Video
```typescript
import { uploadVideo } from '@/lib/storage';

const result = await uploadVideo(
  file,
  'products/videos',
  (progress) => {
    console.log(`Upload: ${progress.progress}%`);
  }
);
console.log('Video URL:', result.url);
```

## Troubleshooting

### Error: "imgbb API key not configured"
- Make sure you added `NEXT_PUBLIC_IMGBB_API_KEY` to `.env.local`
- Restart your dev server after adding the key
- Check that the key doesn't have extra spaces

### Error: "File size exceeds 32MB limit"
- Compress your images before uploading
- Use online tools like TinyPNG or ImageOptim
- For videos, consider YouTube embeds instead

### Upload fails with "Invalid response"
- Check your internet connection
- Verify your API key is correct
- Try a different image file

### CORS Errors
- imgbb has CORS enabled by default - no configuration needed!
- If you see CORS errors, check browser console for details

## Files Modified

### Created:
- `docs/IMGBB_SETUP.md` - This guide

### Modified:
- `src/lib/storage.ts` - Replaced Firebase Storage with imgbb API
- `src/components/admin/ProductForm.tsx` - Already using storage.ts (no changes needed)
- `.env.local.example` - Added imgbb API key template

## Security Notes

- ✅ API key is in environment variable (not committed to Git)
- ✅ File validation prevents malicious uploads
- ✅ Size limits prevent abuse
- ✅ Only admins can upload via your app

## Support

- imgbb API Docs: https://api.imgbb.com/
- imgbb Support: https://imgbb.com/help

---

**Next Steps:**
1. Get your API key from https://api.imgbb.com/
2. Add it to `.env.local`
3. Restart dev server
4. Test uploading an image!
