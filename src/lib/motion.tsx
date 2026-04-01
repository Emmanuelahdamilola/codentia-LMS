/**
 * motion.tsx — Re-exports from framer-motion.
 * This file previously contained a zero-dependency polyfill.
 * All animation is now handled by the real framer-motion package.
 *
 * Variant helpers and re-exports preserved for backward compatibility
 * with any files that still import from @/lib/motion.
 */
export {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimate,
  useInView,
  stagger,
  type MotionProps,
  type Variants,
  type Transition,
  type TargetAndTransition,
} from 'framer-motion'

// ─── Shared animation variants ───────────────────────────────────────────────

export const fadeUp: import('framer-motion').Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
}

export const fadeIn: import('framer-motion').Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
}

export const scaleIn: import('framer-motion').Variants = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 28 },
  },
}

export const slideRight: import('framer-motion').Variants = {
  hidden:  { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
}

export const slideUp: import('framer-motion').Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 30 },
  },
}

export const container: import('framer-motion').Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

export const listItem: import('framer-motion').Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 28 },
  },
}

// ─── Stagger helper ───────────────────────────────────────────────────────────

export function staggerChildren(staggerAmt = 0.05, delayChildren = 0): import('framer-motion').Transition {
  return { staggerChildren: staggerAmt, delayChildren }
}
