import { CheckCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export function VerifiedBadge({ size = 16, className = '' }: VerifiedBadgeProps) {
  return (
    <CheckCircle
      size={size}
      strokeWidth={3}
      className={`text-blue-500 fill-blue-500 ${className}`}
      style={{ filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))' }}
    />
  );
}
