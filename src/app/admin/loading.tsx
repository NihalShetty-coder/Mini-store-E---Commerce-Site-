import { Loader2 } from 'lucide-react';

/**
 * Loading UI for admin pages
 */
export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-custom">
          Loading Dashboard...
        </p>
      </div>
    </div>
  );
}
