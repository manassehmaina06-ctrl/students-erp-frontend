import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireRole from './components/RequireRole';
import StudentsManagement from './pages/StudentsManagement';
import PortalClearance from './portal/PortalClearance';
import ClearanceCertificate from './portal/ClearanceCertificate';
import ClearanceQueue from './pages/ClearanceQueue';
import ClearanceRequestDetail from './pages/ClearanceRequestDetail';
import UnitsManagement from './pages/UnitsManagement';
import SemestersManagement from './pages/SemestersManagement';
import LecturerPanel from './pages/LecturerPanel';
import PortalRegistration from './portal/PortalRegistration';

import LecturerUnitDetail from './pages/LecturerUnitDetail';
import Register from './pages/Register';
import Apply from './pages/Apply';
import Landing from './pages/Landing';
import PortalHome from './portal/PortalHome';
import StudentLogin from './pages/StudentLogin';
import TrackingDashboard from './pages/TrackingDashboard';

import LmsLogin from './pages/LmsLogin';
import LmsLayout from './lms/LmsLayout';
import LmsDashboard from './lms/LmsDashboard';
import LmsCourses from './lms/LmsCourses';
import LmsCourseDetail from './lms/LmsCourseDetail';
import LmsPlaceholder from './lms/LmsPlaceholder';
import LmsMaterials from './lms/LmsMaterials';
import LmsResults from './lms/LmsResults';
import LmsAttendance from './lms/LmsAttendance';
import UnitDetail from './pages/UnitDetail';
import LmsTimetable from './lms/LmsTimetable';
// Shared
import Login from './pages/Login';

// Staff
import FinanceDashboard from './pages/FinanceDashboard';
import AdmissionsDashboard from './pages/AdmissionsDashboard';
import AcademicDashboard from './pages/AcademicDashboard';
import ApplicationDetail from './pages/ApplicationDetail';
import FinancePendingPayments from './pages/FinancePendingPayments';
// import ApplicationDetail from './pages/ApplicationDetail';import ApplicationDetail from './pages/ApplicationDetail';

// Student portal
  import PortalFees from './portal/PortalFees';
 

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!user) return <Landing />;                    // public landing page
if (user.role === 'student')    return <Navigate to="/portal" replace />;
  if (user.role === 'lecturer')   return <Navigate to="/erp/lecturer" replace />;
  if (user.role === 'finance')    return <Navigate to="/erp/finance" replace />;
  if (user.role === 'admissions') return <Navigate to="/erp/admissions" replace />;
  if (user.role === 'academic')   return <Navigate to="/erp/academic" replace />;
  return <Navigate to="/login" replace />;
}

function RequireEnrolled({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/student-login" replace />;
  if (user.role !== 'student' || !user.enrolled) {
    return <Navigate to="/tracking" replace />;
  }
  return children;
}
function RequireLmsAccess({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/lms-login" replace />;
  if (user.role !== 'student' || !user.enrolled) {
    return <Navigate to="/lms-login" replace />;
  }
  return children;
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
         <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route
  path="/tracking"
  element={<RequireRole roles={['student']}><TrackingDashboard /></RequireRole>}
/>
          <Route path="/register" element={<Register />} />
          <Route path="/apply"    element={<Apply />} />

          <Route
            path="/erp/finance"
            element={<RequireRole roles={['finance']}><FinanceDashboard /></RequireRole>}
          />
          <Route
  path="/erp/finance/pending"
  element={<RequireRole roles={['finance']}><FinancePendingPayments /></RequireRole>}
/>
<Route
  path="/erp/clearance"
  element={<RequireRole roles={['academic', 'finance']}><ClearanceQueue /></RequireRole>}
/>
<Route
  path="/erp/clearance/:id"
  element={<RequireRole roles={['academic', 'finance']}><ClearanceRequestDetail /></RequireRole>}
/>
<Route
  path="/erp/units"
  element={<RequireRole roles={['academic']}><UnitsManagement /></RequireRole>}
/>
<Route
  path="/erp/units/:unitId"
  element={<RequireRole roles={['academic']}><UnitDetail /></RequireRole>}
/>
<Route
  path="/erp/semesters"
  element={<RequireRole roles={['academic']}><SemestersManagement /></RequireRole>}
/>
<Route
  path="/erp/lecturer"
  element={<RequireRole roles={['lecturer']}><LecturerPanel /></RequireRole>}
/>
<Route
  path="/erp/lecturer/units/:unitId"
  element={<RequireRole roles={['lecturer']}><LecturerUnitDetail /></RequireRole>}
/>

          <Route
            path="/erp/admissions"
            element={<RequireRole roles={['admissions','academic']}><AdmissionsDashboard /></RequireRole>}
          />
          <Route
            path="/erp/academic"
            element={<RequireRole roles={['academic']}><AcademicDashboard /></RequireRole>}
          />
          <Route
  path="/erp/students"
  element={
    <RequireRole roles={['admissions', 'academic', 'finance']}>
      <StudentsManagement />
    </RequireRole>
  }
/>
          <Route
  path="/application/:id"
  element={
    <RequireRole roles={['admissions', 'academic', 'finance']}>
      <ApplicationDetail />
    </RequireRole>
  }
/>
<Route
  path="/portal"
  element={<RequireEnrolled><PortalHome /></RequireEnrolled>}
/>
<Route
  path="/portal/fees"
  element={<RequireEnrolled><PortalFees /></RequireEnrolled>}
/>
<Route
  path="/portal/registration"
  element={<RequireEnrolled><PortalRegistration /></RequireEnrolled>}
/>



<Route
  path="/portal/clearance"
  element={<RequireEnrolled><PortalClearance /></RequireEnrolled>}
/>
<Route
  path="/portal/clearance/certificate"
  element={<RequireEnrolled><ClearanceCertificate /></RequireEnrolled>}
/>
{/* ===== LMS ===== */}
<Route path="/lms-login" element={<LmsLogin />} />

<Route path="/lms" element={
  <RequireLmsAccess>
    <LmsLayout><LmsDashboard /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/courses" element={
  <RequireLmsAccess>
    <LmsLayout><LmsCourses /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/courses/:unitId" element={
  <RequireLmsAccess>
    <LmsLayout><LmsCourseDetail /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/timetable" element={
  <RequireLmsAccess>
    <LmsLayout><LmsTimetable /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/assignments" element={
  <RequireLmsAccess>
    <LmsLayout><LmsPlaceholder icon="📝" title="Assignments" phase="Phase I" /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/materials" element={
  <RequireLmsAccess>
    <LmsLayout><LmsMaterials /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/quizzes" element={
  <RequireLmsAccess>
    <LmsLayout><LmsPlaceholder icon="🧪" title="Quizzes & Exams" phase="Phase K" /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/results" element={
  <RequireLmsAccess>
    <LmsLayout><LmsResults /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/attendance" element={
  <RequireLmsAccess>
    <LmsLayout><LmsAttendance /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/announcements" element={
  <RequireLmsAccess>
    <LmsLayout><LmsPlaceholder icon="🔔" title="Announcements" phase="Phase J" /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/messages" element={
  <RequireLmsAccess>
    <LmsLayout><LmsPlaceholder icon="💬" title="Messages" phase="Phase J" /></LmsLayout>
  </RequireLmsAccess>
} />

<Route path="/lms/profile" element={
  <RequireLmsAccess>
    <LmsLayout><LmsPlaceholder icon="👤" title="My Profile" phase="Phase M" /></LmsLayout>
  </RequireLmsAccess>
} />
<Route
  path="/erp/units/:unitId/assignments/:assignmentId"
  element={<RequireRole roles={['academic']}><div className="p-8">Grading page — coming in I.3</div></RequireRole>}
/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
  
}
