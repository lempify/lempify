export default function Dot({
    status,
    size = 2,
  }: {
    status: 'running' | 'stopped' | 'pending';
    size?: number;
  }) {
    let sizeClass =
      size === 2
        ? 'size-2'
        : size === 4
          ? 'size-4'
          : size === 1.5
            ? 'size-1.5'
            : size === 1
              ? 'size-1'
              : 'size-2';
    return (
      <span
        className={`${sizeClass} rounded-full ${status === 'pending' ? 'bg-yellow-500 animate-pulse' : status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}
      />
    );
  }