import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <PublicNavbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
        {/* Top pill */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium px-4 py-2 rounded-full mb-10">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Admissions open for 2027
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center max-w-3xl leading-tight mb-6">
          Your university journey starts with one application
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 text-center max-w-2xl mb-12">
          Apply online in a few minutes — no queues, no paper forms.
          Track your status from anywhere you are.
        </p>

        {/* Primary CTA */}
        <Link
          to="/register"
          className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-lg px-12 py-4 rounded-lg transition shadow-lg hover:shadow-xl"
        >
          Apply now
        </Link>

        {/* Secondary links */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-6 text-sm">
          <Link
            to="/login?role=staff"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <span>🔒</span>
            <span>Staff &amp; admin login</span>
          </Link>
          <Link
            to="/login?role=student"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <span>🎓</span>
            <span>Student portal login</span>
          </Link>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-xs text-slate-600">
          Strathmore University Portal · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}