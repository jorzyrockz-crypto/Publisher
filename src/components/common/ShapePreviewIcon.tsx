import React from 'react';
import { ShapeType } from '../../types/publisher';
import { getShapeSvgPath } from '../../utils/shapePaths';

interface ShapePreviewIconProps {
  shapeType: ShapeType;
  size?: number;
  fill?: string;
  stroke?: string;
}

export const ShapePreviewIcon: React.FC<ShapePreviewIconProps> = ({
  shapeType,
  size = 24,
  fill = '#d1fae5',
  stroke = '#047857',
}) => {
  const d = getShapeSvgPath({
    shapeType,
    width: size,
    height: size,
    strokeWidth: 1.8,
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <path d={d} fill={fill} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
};
