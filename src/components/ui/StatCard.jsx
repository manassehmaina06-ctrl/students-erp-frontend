// Colored stat card for dashboards.
//   <StatCard icon="📚" label="My Courses" value={7} accent="brand" />
//   <StatCard icon="⏰" label="Deadlines" value={0} accent="amber" action={<a>View →</a>} />

export default function StatCard({
  icon,
  label,
  value,
  hint,
  accent = 'brand', // brand | emerald | amber | rose | violet | sky
  action,
  className = '',
}) {
  const accents = {
    brand:   'from-brand-500 to-brand-700 text-white',
    emerald: 'from-emerald-500 to-emerald-700 text-white',
    amber:   'from-amber-400 to-amber-600 text-white',
    rose:    'from-rose-500 to-rose-700 text-white',
    violet:  'from-violet-500 to-violet-700 text-white',
    sky:     'from-sky-500 to-sky-700 text-white',
  };

  return (
    <div
      className={
        'relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ' +
        'rounded-xl shadow-card overflow-hidden ' +
        'transition-all duration-200 hover:shadow-hover hover:-translate-y-0.5 ' +
        className
      }
    >
      <div className={'absolute inset-x-0 top-0 h-1 bg-gradient-to-r ' + (accents[accent] || accents.brand)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {value}
            </p>
            {hint && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>
            )}
          </div>
          {icon && (
            <div className={'w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shadow-md shrink-0 ' + (accents[accent] || accents.brand)}>
              {icon}
            </div>
          )}
        </div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
