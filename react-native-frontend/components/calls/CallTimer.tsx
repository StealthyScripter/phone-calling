import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { formatDuration } from '../../lib/utils/formatters';

interface CallTimerProps {
  startTime?: Date;
  isActive?: boolean;
  className?: string;
  textColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
}

export const CallTimer: React.FC<CallTimerProps> = ({
  startTime,
  isActive = true,
  className,
  textColor = 'text-white',
  fontSize = 'medium',
}) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setDuration(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  const fontSizeStyles = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl',
  };

  return (
    <Text
      className={twMerge(
        'font-mono font-medium',
        textColor,
        fontSizeStyles[fontSize],
        className
      )}
    >
      {formatDuration(duration)}
    </Text>
  );
};
