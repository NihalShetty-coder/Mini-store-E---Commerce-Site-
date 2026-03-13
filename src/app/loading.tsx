import { Loader2 } from 'lucide-react';

/**
 * Root loading UI
 * Displayed during initial page loads
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="font-playfair text-4xl md:text-5xl font-black text-secondary tracking-tighter">
          Nihal Shetty
        </div>
        <Loader2 className="w-8 h-8 text-secondary animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-custom">
          Loading...
        </p>
      </div>
    </div>
  );
}
