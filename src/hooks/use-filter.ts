import { create } from 'zustand';

export type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-az' | 'name-za';
export type PriceFilter = 'all' | 'under-50' | '50-100' | '100-200' | '200-500' | '500-plus';

interface FilterState {
    searchQuery: string;
    selectedCategory: string;
    selectedBadge: string | null;
    selectedSizes: string[];
    selectedColors: string[];
    selectedMaterials: string[];
    priceFilter: PriceFilter;
    sortBy: SortOption;
    setSearchQuery: (query: string) => void;
    setCategory: (category: string) => void;
    setBadge: (badge: string | null) => void;
    toggleSize: (size: string) => void;
    toggleColor: (color: string) => void;
    toggleMaterial: (material: string) => void;
    setPriceFilter: (filter: PriceFilter) => void;
    setSortBy: (sort: SortOption) => void;
    resetFilters: () => void;
}

export const useFilter = create<FilterState>((set) => ({
    searchQuery: '',
    selectedCategory: 'All',
    selectedBadge: null,
    selectedSizes: [],
    selectedColors: [],
    selectedMaterials: [],
    priceFilter: 'all',
    sortBy: 'newest',
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setCategory: (category: string) => set({ selectedCategory: category }),
    setBadge: (badge: string | null) => set({ selectedBadge: badge }),
    toggleSize: (size: string) => set((state) => ({
        selectedSizes: state.selectedSizes.includes(size)
            ? state.selectedSizes.filter(s => s !== size)
            : [...state.selectedSizes, size]
    })),
    toggleColor: (color: string) => set((state) => ({
        selectedColors: state.selectedColors.includes(color)
            ? state.selectedColors.filter(c => c !== color)
            : [...state.selectedColors, color]
    })),
    toggleMaterial: (material: string) => set((state) => ({
        selectedMaterials: state.selectedMaterials.includes(material)
            ? state.selectedMaterials.filter(m => m !== material)
            : [...state.selectedMaterials, material]
    })),
    setPriceFilter: (filter: PriceFilter) => set({ priceFilter: filter }),
    setSortBy: (sort: SortOption) => set({ sortBy: sort }),
    resetFilters: () => set({
        searchQuery: '',
        selectedCategory: 'All',
        selectedBadge: null,
        selectedSizes: [],
        selectedColors: [],
        selectedMaterials: [],
        priceFilter: 'all',
        sortBy: 'newest'
    }),
}));
