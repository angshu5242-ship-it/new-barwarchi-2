import { useEffect, useState } from 'react';

export default function FoodImage({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  fallback = '🍽️',
  loading = 'lazy',
  ...props
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ${className}`}
        aria-label={alt || 'Food placeholder'}
        role="img"
      >
        <span className="text-4xl" aria-hidden="true">{fallback}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
