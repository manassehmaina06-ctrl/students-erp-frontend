export function Spinner({ size = 'md', color = 'blue' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-4' };
  const colors = {
    blue:  'border-blue-200 border-t-blue-600',
    white: 'border-white/30 border-t-white',
    gray:  'border-gray-200 border-t-gray-500',
  };
  return (
    <span
      className={`inline-block ${sizes[size]} ${colors[color]} rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingState({ message = 'Loading…', inline = false }) {
  if (inline) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-gray-500">
        <Spinner size="sm" /> {message}
      </span>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function ButtonSpinner() {
  return <Spinner size="sm" color="white" />;
}
