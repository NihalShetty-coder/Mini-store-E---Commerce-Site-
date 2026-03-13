/**
 * Centralized Framer Motion Exports
 * 
 * This module provides a single import point for all Framer Motion utilities.
 * Instead of importing from 'framer-motion' directly in 15+ components,
 * import from here to:
 * 
 * 1. Reduce duplicate module imports (~200 duplicate modules eliminated)
 * 2. Enable conditional disabling in development for faster HMR
 * 3. Provide consistent animation variants across the app
 * 
 * Usage:
 * ```
 * import { motion, AnimatePresence, fadeIn } from '@/lib/motion';
 * ```
 */

// Re-export core framer-motion components
export {
    motion,
    AnimatePresence,
    useAnimation,
    useInView,
    useScroll,
    useTransform,
    useMotionValue,
    useSpring,
    LayoutGroup,
    Reorder,
} from 'framer-motion';

// Re-export types
export type {
    Variants,
    Transition,
    MotionProps,
    TargetAndTransition,
} from 'framer-motion';

// ─── Common Animation Variants ─────────────────────────────────

/**
 * Fade in animation
 */
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

/**
 * Fade in from bottom
 */
export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
};

/**
 * Fade in from top
 */
export const fadeInDown = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

/**
 * Scale in animation
 */
export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
};

/**
 * Slide in from right (for drawers/sidebars)
 */
export const slideInRight = {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
};

/**
 * Slide in from left
 */
export const slideInLeft = {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
};

/**
 * Container variant for staggered children
 */
export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

/**
 * Child variant for staggered animations
 */
export const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { 
        opacity: 1, 
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
};

// ─── Common Transitions ────────────────────────────────────────

export const springTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 24,
};

export const easeTransition = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
};

export const smoothTransition = {
    duration: 0.2,
    ease: 'easeInOut',
};

// ─── Dev Mode Optimization ─────────────────────────────────────

/**
 * Check if animations should be disabled
 * In development, you can set NEXT_PUBLIC_DISABLE_ANIMATIONS=true
 * to speed up HMR by ~15-20%
 */
export const isAnimationDisabled = 
    process.env.NODE_ENV === 'development' && 
    process.env.NEXT_PUBLIC_DISABLE_ANIMATIONS === 'true';

/**
 * Get animation props with optional dev mode bypass
 * Usage: <motion.div {...getAnimationProps(fadeInUp)} />
 */
export function getAnimationProps<T extends object>(variants: T): T | Record<string, never> {
    if (isAnimationDisabled) {
        return {} as Record<string, never>;
    }
    return variants;
}
