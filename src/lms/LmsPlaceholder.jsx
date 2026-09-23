export default function LmsPlaceholder({ icon, title, phase }) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-sm text-slate-500">
          Coming in {phase}.
        </p>
      </div>
    </div>
  );
}