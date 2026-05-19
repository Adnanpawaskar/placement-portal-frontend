import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import JobListings from './pages/student/JobListings';
import InternshipListings from './pages/student/InternshipListings';
import InternshipDetail from './pages/student/InternshipDetail';
import JobDetail from './pages/student/JobDetail';
import MyApplications from './pages/student/MyApplications';
import StudentNotifications from './pages/student/StudentNotifications';
import AIResumeBuilder from './pages/student/AIResumeBuilder';
import InterviewPrep from './pages/student/InterviewPrep';
import CompanyTracker from './pages/student/CompanyTracker';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import StudentDetail from './pages/admin/StudentDetail';
import ManageInternships from './pages/admin/ManageInternships';
import ManageJobs from './pages/admin/ManageJobs';
import JobApplicants from './pages/admin/JobApplicants';
import InternshipApplicants from './pages/admin/InternshipApplicants';
import ManageNotifications from './pages/admin/ManageNotifications';
import Reports from './pages/admin/Reports';
import AllApplications from './pages/admin/AllApplications';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--neon-blue)' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-glow)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.9rem'
          }
        }} />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student routes */}
          <Route path="/student" element={<PrivateRoute role="student"><StudentLayout /></PrivateRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="jobs" element={<JobListings />} />
            <Route path="internships" element={<InternshipListings />} />
            <Route path="internships/:id" element={<InternshipDetail />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="ai-resume" element={<AIResumeBuilder />} />
            <Route path="resume-builder" element={<AIResumeBuilder />} />
            <Route path="interview-prep" element={<InterviewPrep />} />
            <Route path="companies" element={<CompanyTracker />} />
            <Route path="company-tracker" element={<CompanyTracker />} />
            <Route path="notifications" element={<StudentNotifications />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="internships" element={<ManageInternships />} />
            <Route path="jobs" element={<ManageJobs />} />
            <Route path="jobs/:id/applicants" element={<JobApplicants />} />
            <Route path="internships/:id/applicants" element={<InternshipApplicants />} />
            <Route path="applications" element={<AllApplications />} />
            <Route path="notifications" element={<ManageNotifications />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
