// Reusable Badge / pill for statuses and labels.
//   <Badge>default</Badge>
//   <Badge tone="success">Passed</Badge>
//   <Badge tone="danger">Failed</Badge>

export default function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    brand:   'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300',
    success: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
    danger:  'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
    info:    'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300',
    violet:  'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300',
  };

  return (
    <span
      className={
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide ' +
        (tones[tone] || tones.neutral) +
        ' ' + className
      }
    >
      {children}
    </span>
  );
}
