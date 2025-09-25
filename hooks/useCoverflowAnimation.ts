import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CoverflowConfig,
  CoverflowItemStyle,
  calculateCoverflowStyle,
  getNextCenterIndex,
  getResponsiveConfig
} from '../utils/coverflow-animation';

export interface UseCoverflowAnimationProps {
  items: any[];
  autoPlaySpeed?: number;
  pauseOnHover?: boolean;
}

export interface UseCoverflowAnimationReturn {
  centerIndex: number;
  getItemStyle: (index: number) => CoverflowItemStyle;
  isPlaying: boolean;
  pause: () => void;
  resume: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  config: CoverflowConfig;
}

export const useCoverflowAnimation = ({
  items,
  autoPlaySpeed = 3000,
  pauseOnHover = true
}: UseCoverflowAnimationProps): UseCoverflowAnimationReturn => {
  const [centerIndex, setCenterIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [screenWidth, setScreenWidth] = useState<number>(1024);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create configuration based on screen size
  const config: CoverflowConfig = {
    totalItems: items.length,
    centerIndex,
    ...getResponsiveConfig(screenWidth),
    maxVisibleItems: 7,
    rotateAngle: 30,
    scaleStep: 0.1,
    opacityStep: 0.2,
    translateStep: 100
  };

  // Handle screen resize for responsive behavior
  useEffect(() => {
    const handleResize = (): void => {
      setScreenWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && items.length > 1) {
      intervalRef.current = setInterval(() => {
        setCenterIndex(current => getNextCenterIndex(current, items.length));
      }, autoPlaySpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, items.length, autoPlaySpeed]);

  // Control functions
  const pause = useCallback((): void => {
    setIsPlaying(false);
  }, []);

  const resume = useCallback((): void => {
    setIsPlaying(true);
  }, []);

  const goToNext = useCallback((): void => {
    setCenterIndex(current => getNextCenterIndex(current, items.length));
  }, [items.length]);

  const goToPrevious = useCallback((): void => {
    setCenterIndex(current => getNextCenterIndex(current, items.length, 'backward'));
  }, [items.length]);

  // Get style for specific item
  const getItemStyle = useCallback((index: number): CoverflowItemStyle => {
    return calculateCoverflowStyle(index, { ...config, centerIndex });
  }, [centerIndex, screenWidth, items.length]);

  return {
    centerIndex,
    getItemStyle,
    isPlaying,
    pause,
    resume,
    goToNext,
    goToPrevious,
    config
  };
};