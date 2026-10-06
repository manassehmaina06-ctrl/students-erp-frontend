export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  size = 'md',
}) {
  const paddings = { sm: 'py-8 px-6', md: 'py-12 px-8', lg: 'py-16 px-8' };
  const iconSizes = { sm: 'text-4xl', md: 'text-5xl', lg: 'text-6xl' };
  const titleSizes = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' };

  return (
    <div className={`bg-white rounded-xl shadow p-6 text-center ${paddings[size]}`}>
      <div className={`${iconSizes[size]} mb-3`} role="img" aria-hidden="true">
        {icon}
      </div>
      {title && (
        <h3 className={`${titleSizes[size]} font-semibold text-gray-800 mb-1`}>
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
}
