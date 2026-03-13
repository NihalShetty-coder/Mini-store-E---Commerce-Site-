import { Loader2 } from 'lucide-react';

/**
 * Loading UI for the shop page
 * Displayed while fetching products
 */
export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-custom">
          Loading Products...
        </p>
      </div>
    </div>
  );
}
