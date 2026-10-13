// Consistent page header with title + subtitle + action slot.
//   <PageHeader title="My Courses" subtitle="Semester 2026-S1" />
//   <PageHeader title="Quizzes" subtitle="..." actions={<Button>+ New</Button>} />

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className = '',
}) {
  return (
    <div className={'flex items-start justify-between gap-4 flex-wrap mb-6 ' + className}>
      <div className="min-w-0 flex items-start gap-3">
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-xl shadow-md shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
