import React from 'react';
import { ServiceIconProps } from '../../types/ui';

const Svg: React.FC<ServiceIconProps> = ({
  size = 24,
  viewBox = '0 0 24 24',
  className = 'fill-neutral-400 dark:fill-neutral-500',
  children,
  ...props
}) => {
  return (
    <svg
      className={className}
      style={{ width: size, height: size }}
      viewBox={viewBox}
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      {children}
    </svg>
  );
};

export default Svg;
