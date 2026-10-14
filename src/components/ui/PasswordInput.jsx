import { useState } from 'react';

// Password input with show/hide eye toggle.
// Usage: <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder="…" />

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete = 'current-password',
  name,
  id,
  className = '',
  ...rest
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        name={name}
        id={id}
        {...rest}
        className={
          'w-full border border-slate-300 dark:border-slate-700 ' +
          'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ' +
          'rounded-lg px-3 py-2 pr-10 ' +
          'focus:outline-none focus:ring-2 focus:ring-brand-500 ' +
          className
        }
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide' : 'Show'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
        tabIndex={-1}
      >
        {show ? (
          // Eye with slash (hidden)
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19 19 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19 19 0 0 1-3.06 4.06" />
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          </svg>
        ) : (
          // Eye (visible)
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
