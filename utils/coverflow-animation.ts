/**
 * Utility functions for 3D Coverflow Animation
 * Handles calculations for center focus, opacity, scale, and rotation effects
 */

export interface CoverflowItemStyle {
  transform: string;
  opacity: number;
  zIndex: number;
}

export interface CoverflowConfig {
  totalItems: number;
  centerIndex: number;
  maxVisibleItems: number;
  rotateAngle: number;
  scaleStep: number;
  opacityStep: number;
  translateStep: number;
}

/**
 * Calculate the distance from center for a given item index
 */
export const getDistanceFromCenter = (
  itemIndex: number,
  centerIndex: number,
  totalItems: number
): number => {
  const distance = Math.abs(itemIndex - centerIndex);
  const wrappedDistance = Math.min(distance, totalItems - distance);
  return wrappedDistance;
};

/**
 * Calculate 3D transform styles for coverflow effect
 */
export const calculateCoverflowStyle = (
  itemIndex: number,
  config: CoverflowConfig
): CoverflowItemStyle => {
  const { centerIndex, rotateAngle, scaleStep, opacityStep, translateStep } = config;
  const distance = getDistanceFromCenter(itemIndex, centerIndex, config.totalItems);
  
  // Center item (distance = 0)
  if (distance === 0) {
    return {
      transform: 'translateX(0) scale(1) rotateY(0deg) translateZ(0)',
      opacity: 1,
      zIndex: 10
    };
  }

  // Side items
  const isLeft = (itemIndex < centerIndex) || 
    (centerIndex < config.totalItems / 2 && itemIndex > centerIndex + config.totalItems / 2);
  
  const direction = isLeft ? -1 : 1;
  const rotation = direction * rotateAngle * Math.min(distance, 3);
  const scale = Math.max(0.6, 1 - (distance * scaleStep));
  const opacity = Math.max(0.3, 1 - (distance * opacityStep));
  const translateX = direction * translateStep * distance;
  const translateZ = -distance * 50; // Move back in 3D space

  return {
    transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotation}deg) translateZ(${translateZ}px)`,
    opacity,
    zIndex: Math.max(1, 10 - distance)
  };
};

/**
 * Get the next center index for animation progression
 */
export const getNextCenterIndex = (
  currentCenter: number,
  totalItems: number,
  direction: 'forward' | 'backward' = 'forward'
): number => {
  if (direction === 'forward') {
    return (currentCenter + 1) % totalItems;
  } else {
    return currentCenter === 0 ? totalItems - 1 : currentCenter - 1;
  }
};

/**
 * Calculate responsive configuration based on screen size
 */
export const getResponsiveConfig = (screenWidth: number): Partial<CoverflowConfig> => {
  if (screenWidth < 640) {
    // Mobile
    return {
      maxVisibleItems: 3,
      rotateAngle: 45,
      scaleStep: 0.2,
      opacityStep: 0.3,
      translateStep: 60
    };
  } else if (screenWidth < 1024) {
    // Tablet
    return {
      maxVisibleItems: 5,
      rotateAngle: 35,
      scaleStep: 0.15,
      opacityStep: 0.25,
      translateStep: 80
    };
  } else {
    // Desktop
    return {
      maxVisibleItems: 7,
      rotateAngle: 30,
      scaleStep: 0.1,
      opacityStep: 0.2,
      translateStep: 100
    };
  }
};

/**
 * Create smooth easing function for animations
 */
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};