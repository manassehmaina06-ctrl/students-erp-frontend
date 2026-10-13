import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { LoadingState } from '../components/LoadingState';
import { PageHeader, StatCard, Button, Card } from '../components/ui';

export default function LmsDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lms/me/dashboard')
      .then((r) => setData(r.data))
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const s = data?.student || {};
  const semester = s.semester || '2026-S1';
  const programme = s.programme?.name || s.programme?.code || '';
  const firstName = (s.name || 'Student').split(' ')[0];

  const subtitle = [s.studentNumber, programme, 'Semester ' + semester]
    .filter(Boolean).join(' · ');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <PageHeader
        icon="👋"
        title={'Welcome back, ' + firstName}
        subtitle={subtitle}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📚"
          label="My Courses"
          value={data?.coursesCount || 0}
          accent="brand"
          action={
            <button
              onClick={() => navigate('/lms/courses')}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              View courses →
            </button>
          }
        />
        <StatCard
          icon="⏰"
          label="Upcoming Deadlines"
          value={(data?.upcomingDeadlines || []).length}
          accent="amber"
          action={
            <button
              onClick={() => navigate('/lms/assignments')}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
            >
              View deadlines →
            </button>
          }
        />
        <StatCard
          icon="📅"
          label="Today's Classes"
          value={(data?.todayClasses || []).length}
          accent="violet"
          action={
            <button
              onClick={() => navigate('/lms/timetable')}
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              View timetable →
            </button>
          }
        />
        <StatCard
          icon="🔔"
          label="Announcements"
          value={(data?.recentAnnouncements || []).length}
          accent="emerald"
          action={
            <button
              onClick={() => navigate('/lms/announcements')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View all →
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6" hoverable>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg shrink-0">
              📖
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100">
                Continue Learning
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Open a course to access materials, assignments, and grades.
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/lms/courses')}>
            Go to My Courses →
          </Button>
        </Card>

        <Card className="p-6" hoverable>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center text-lg shrink-0">
              🗓️
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100">
                This Week
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Your timetable and class venues will appear here.
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/lms/timetable')}>
            View Timetable →
          </Button>
        </Card>
      </div>
    </div>
  );
}
