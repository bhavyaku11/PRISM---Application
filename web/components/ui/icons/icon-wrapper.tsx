'use client';

import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps, type TargetAndTransition } from 'motion/react';
import type { LucideIcon, LucideProps } from 'lucide-react';

export type AnimationType =
  | 'slide-right'
  | 'slide-left'
  | 'slide-up'
  | 'slide-down'
  | 'pulse'
  | 'sparkle'
  | 'rotate-subtle'
  | 'pop'
  | 'default';

export interface AnimateIconProps extends HTMLMotionProps<'span'> {
  animateOnHover?: boolean | string;
  animateOnTap?: boolean | string;
  animateOnView?: boolean | string;
  animationType?: AnimationType;
  children?: React.ReactNode;
  className?: string;
}

export function AnimateIcon({
  animateOnHover = false,
  animateOnTap = false,
  animateOnView = false,
  animationType = 'default',
  children,
  className = '',
  ...props
}: AnimateIconProps) {
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, render without motion variants
  if (shouldReduceMotion) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} {...(props as React.HTMLAttributes<HTMLSpanElement>)}>
        {children}
      </span>
    );
  }

  const getHoverAnimation = (): TargetAndTransition | undefined => {
    if (!animateOnHover) return undefined;
    switch (animationType) {
      case 'slide-right':
        return { x: 3, transition: { type: 'spring', stiffness: 400, damping: 25 } };
      case 'slide-left':
        return { x: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } };
      case 'slide-up':
        return { y: -2.5, transition: { type: 'spring', stiffness: 400, damping: 25 } };
      case 'slide-down':
        return { y: 2.5, transition: { type: 'spring', stiffness: 400, damping: 25 } };
      case 'sparkle':
        return { rotate: [-4, 4, 0], scale: 1.08, transition: { duration: 0.35, ease: 'easeInOut' } };
      case 'rotate-subtle':
        return { rotate: 20, transition: { type: 'spring', stiffness: 350, damping: 20 } };
      case 'pulse':
        return { scale: 1.08, transition: { duration: 0.2, ease: 'easeOut' } };
      case 'pop':
        return { scale: 1.1, transition: { type: 'spring', stiffness: 500, damping: 20 } };
      case 'default':
      default:
        return { scale: 1.05, transition: { duration: 0.18, ease: 'easeOut' } };
    }
  };

  const getTapAnimation = (): TargetAndTransition | undefined => {
    if (!animateOnTap) return undefined;
    return { scale: 0.94, transition: { duration: 0.1 } };
  };

  const getViewAnimation = (): TargetAndTransition | undefined => {
    if (!animateOnView) return undefined;
    return { scale: [0.92, 1], opacity: [0.8, 1], transition: { duration: 0.3, ease: 'easeOut' } };
  };

  return (
    <motion.span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      whileHover={getHoverAnimation()}
      whileTap={getTapAnimation()}
      animate={getViewAnimation()}
      {...props}
    >
      {children}
    </motion.span>
  );
}

export interface AnimatedLucideProps extends LucideProps {
  animateOnHover?: boolean;
  animateOnTap?: boolean;
  animateOnView?: boolean;
  animationType?: AnimationType;
  wrapperClassName?: string;
}

export function createAnimatedIcon(Icon: LucideIcon, defaultAnimation: AnimationType = 'default') {
  return function AnimatedIconComponent({
    animateOnHover = false,
    animateOnTap = false,
    animateOnView = false,
    animationType = defaultAnimation,
    wrapperClassName = '',
    size = 20,
    strokeWidth = 1.75,
    className = '',
    ...iconProps
  }: AnimatedLucideProps) {
    const isInteractive = animateOnHover || animateOnTap || animateOnView;

    if (!isInteractive) {
      return (
        <span className={`inline-flex items-center justify-center shrink-0 ${wrapperClassName}`}>
          <Icon size={size} strokeWidth={strokeWidth} className={className} {...iconProps} />
        </span>
      );
    }

    return (
      <AnimateIcon
        animateOnHover={animateOnHover}
        animateOnTap={animateOnTap}
        animateOnView={animateOnView}
        animationType={animationType}
        className={wrapperClassName}
      >
        <Icon size={size} strokeWidth={strokeWidth} className={className} {...iconProps} />
      </AnimateIcon>
    );
  };
}
