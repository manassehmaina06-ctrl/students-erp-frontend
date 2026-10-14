import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import AiAssistant from '../components/AiAssistant';
import { LANDING_FAQ } from '../data/landingFaq';

const SHOWCASE = [
  { emoji: '🎓', title: 'Graduation Day',   caption: 'Celebrating our 2026 cohort' },
  { emoji: '🏛️', title: 'Main Campus',      caption: 'Our historic Nairobi CBD campus' },
  { emoji: '📚', title: 'Modern Library',   caption: 'Study spaces open 24/7' },
  { emoji: '🔬', title: 'Research Labs',    caption: 'State-of-the-art equipment' },
  { emoji: '⚽', title: 'Sports Complex',   caption: 'Football, basketball, athletics' },
  { emoji: '🎭', title: 'Arts & Culture',   caption: 'Theatre, music, and dance' },
  { emoji: '💻', title: 'Tech Hub',         caption: 'Coding, innovation, startups' },
  { emoji: '🌍', title: 'Global Network',   caption: 'Alumni in 40+ countries' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <PublicNavbar />

      <main className="relative flex-1 flex flex-col items-center px-4 pt-16 pb-16">
        {/* Announcement pill */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          Admissions open for 2027
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-center max-w-4xl leading-[1.05] tracking-tight mb-6 animate-fade-in-up">
          Your university journey
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-emerald-300 bg-clip-text text-transparent">
            {' '}starts with one click
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-400 text-center max-w-2xl mb-12 animate-fade-in-up">
          Apply online, track your progress in real time, and access your
          courses, fees, and results — all from one place.
        </p>

        {/* Two big entry cards */}
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            to="/student-login"
            className="group relative bg-slate-900/70 backdrop-blur border border-slate-800 hover:border-brand-500/60 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
                🎓
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg font-bold text-white">Student Login</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Access the LMS for courses, quizzes, and grades. Or open the Portal for fees, clearance, and registration.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 mt-3 group-hover:gap-2 transition-all">
                  Sign in <span>→</span>
                </span>
              </div>
            </div>
          </Link>

          <Link
            to="/login?role=staff"
            className="group relative bg-slate-900/70 backdrop-blur border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
                🔒
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg font-bold text-white">Staff Login</h3>
                <p className="text-sm text-slate-400 mt-1">
                  For lecturers, academic, finance, and admissions staff.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-400 mt-3 group-hover:gap-2 transition-all">
                  Sign in <span>→</span>
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Tertiary actions */}
        <div className="flex flex-col sm:flex-row items-center gap-x-8 gap-y-3 text-sm mb-16">
          <Link to="/tracking" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            📄 Track your application
          </Link>
          <span className="hidden sm:inline text-slate-700">·</span>
          <Link to="/register" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            ✍️ New applicant? Apply now
          </Link>
        </div>

        {/* Feature grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-20">
          <Feature
            icon="⚡"
            title="Apply in minutes"
            text="No queues, no paper forms. Submit your application online."
          />
          <Feature
            icon="📍"
            title="Track in real time"
            text="See exactly where your application is — submitted, pending, or approved."
          />
          <Feature
            icon="🎯"
            title="Everything in one place"
            text="Courses, assignments, quizzes, fees, and results."
          />
        </div>

        {/* ===== Showcase Marquee ===== */}
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              Life at Strathmore
            </h2>
            <p className="text-sm text-slate-400">
              A glimpse into our campus, community, and student experience.
            </p>
          </div>

          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex gap-4 marquee">
              {[...SHOWCASE, ...SHOWCASE].map((item, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-64 h-44 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center p-6 hover:border-brand-500/50 transition-colors"
                >
                  <div className="text-5xl mb-3">{item.emoji}</div>
                  <h3 className="font-display font-semibold text-white text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{item.caption}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="relative border-t border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Schools</h4>
            <ul className="space-y-2 text-slate-400">
              <li>School of Business</li>
              <li>School of Technology</li>
              <li>School of Education, Arts & Social Sciences</li>
              <li>Board of Postgraduate Studies</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Campuses</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Town Campus — Nairobi CBD</li>
              <li>Western Campus — Kisumu</li>
              <li>Kitengela Campus — Kitengela</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/register"  className="hover:text-white transition">Online Application</Link></li>
              <li><Link to="/tracking"  className="hover:text-white transition">Track Application</Link></li>
              <li><Link to="/lms-login" className="hover:text-white transition">LMS</Link></li>
              <li><Link to="/student-login" className="hover:text-white transition">Student Portal</Link></li>
              <li><Link to="/login?role=staff" className="hover:text-white transition">Staff Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-slate-400">
              <li>📞 +254 700 000 000</li>
              <li>✉️ info@strathmore.ac.ke</li>
              <li>🏢 Ole Sangale Rd, Nairobi</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-5 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Strathmore University Portal. All rights reserved.
          </p>
        </div>
      </footer>

      <AiAssistant theme="landing" faqs={LANDING_FAQ} />
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5 transition-all hover:border-slate-700 hover:-translate-y-0.5">
      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-lg mb-3">
        {icon}
      </div>
      <h4 className="font-display font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
    </div>
  );
}
