// Reusable Card with optional hover lift + accent border.
//   <Card>content</Card>
//   <Card accent="brand" hoverable>content</Card>
//   <Card as="section" className="p-8">

export default function Card({
  children,
  className = '',
  hoverable = false,
  accent, // 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | undefined
  as: As = 'div',
  ...rest
}) {
  const accents = {
    brand:   'border-l-4 border-brand-500',
    emerald: 'border-l-4 border-emerald-500',
    amber:   'border-l-4 border-amber-400',
    rose:    'border-l-4 border-rose-500',
    violet:  'border-l-4 border-violet-500',
  };

  const base =
    'bg-white dark:bg-slate-900 ' +
    'border border-slate-100 dark:border-slate-800 ' +
    'rounded-xl shadow-card';

  const hover = hoverable
    ? 'transition-all duration-200 hover:shadow-hover hover:-translate-y-0.5 cursor-pointer'
    : '';

  const accentClass = accent ? accents[accent] : '';

  return (
    <As className={[base, hover, accentClass, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </As>
  );
}
