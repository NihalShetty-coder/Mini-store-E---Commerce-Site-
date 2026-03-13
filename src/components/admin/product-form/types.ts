// ─── Preset Data ──────────────────────────────────────────────
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

export const PRESET_COLORS = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Navy', hex: '#1B2A4A' },
    { name: 'Grey', hex: '#9CA3AF' },
    { name: 'Red', hex: '#DC2626' },
    { name: 'Burgundy', hex: '#7F1D1D' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Green', hex: '#16A34A' },
    { name: 'Beige', hex: '#D4C5A9' },
    { name: 'Brown', hex: '#78350F' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Orange', hex: '#EA580C' },
    { name: 'Purple', hex: '#9333EA' },
    { name: 'Teal', hex: '#0D9488' },
    { name: 'Olive', hex: '#4D7C0F' },
];

export const CATEGORIES = [
    "Women's Clothing", "Men's Clothing", "Accessories",
    "Shoes", "Bags", "Jewelry", "Activewear", "Outerwear",
    "Swimwear", "Lingerie", "Kids", "Home & Living"
];

// ─── Types ──────────────────────────────────────────────────
export interface ProductFormData {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: string;
    subCategory?: string;
    stock: number;
    sku: string;
    status: 'Active' | 'Draft' | 'Out of Stock';
    badge: string;
    image: string;
    images: string[];
    videos: string[];
    sizes: string[];
    colors: string[];
    material: string;
    brand: string;
    tags: string[];
    seo: { title: string; description: string; keywords: string[] };
    // Variant-level inventory: keys are "size|color" e.g. "S|Red"
    variantInventory: Record<string, number>;
    lowStockThreshold: number;
}

export interface ProductFormProps {
    initialData?: Partial<ProductFormData>;
    onSubmit: (data: ProductFormData) => void;
    onCancel: () => void;
    mode: 'add' | 'edit';
}
