interface SpinnerProps {
  size?: number | string;
  className?: string;
}

function parseSize(size: number | string): number {
  if (typeof size === 'number') return size;
  if (size === 'lg') return 40;
  if (size === 'md') return 24;
  if (size === 'sm') return 16;
  return 24;
}

export default function Spinner({ size = 24, className = '' }: SpinnerProps) {
  const px = parseSize(size);
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-gray-200"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-brand-600"
        />
      </svg>
    </div>
  );
}
