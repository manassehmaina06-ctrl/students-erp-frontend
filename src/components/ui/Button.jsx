// Reusable Button with variants + sizes + optional icon.
//   <Button>Save</Button>
//   <Button variant="secondary" size="sm">Cancel</Button>
//   <Button loading>Saving…</Button>
//   <Button as="a" href="/x">Link styled as button</Button>

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  as: As = 'button',
  ...rest
}) {
  const variants = {
    primary:
      'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md ' +
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500',
    secondary:
      'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 ' +
      'border border-slate-200 dark:border-slate-700 ' +
      'hover:bg-slate-50 dark:hover:bg-slate-700',
    ghost:
      'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md',
    outline:
      'border-2 border-brand-600 text-brand-600 hover:bg-brand-50 ' +
      'dark:text-brand-400 dark:hover:bg-brand-950',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium ' +
    'transition-all duration-150 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'active:scale-[0.98] ' +
    'whitespace-nowrap';

  const classes = base + ' ' + variants[variant] + ' ' + sizes[size] + ' ' + className;

  const content = loading ? (
    <>
      <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      {children}
    </>
  ) : (
    children
  );

  return (
    <As className={classes} disabled={loading || disabled} {...rest}>
      {content}
    </As>
  );
}
