import { Suspense } from "react";
import { Navigate, Route, Routes, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import Dashboard from "./components/pages/dashboard";
import Success from "./components/pages/success";
import Home from "./components/pages/home";
import { AuthProvider, useAuth } from "../supabase/auth";
import { Toaster } from "./components/ui/toaster";
import { LoadingScreen } from "./components/ui/loading-spinner";

// TCMS Components
import TCMSPage from "./components/tcms/TCMSPage";
import ProjectsPage from "./components/tcms/projects/ProjectsPage";
import TestCasesPage from "./components/tcms/test-cases/TestCasesPage";
import TestExecutionPage from "./components/tcms/test-execution/TestExecutionPage";
import BugsPage from "./components/tcms/bugs/BugsPage";
import ReportsPage from "./components/tcms/reports/ReportsPage";
import SettingsPage from "./components/tcms/settings/SettingsPage";
import HelpPage from "./components/tcms/help/HelpPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<TCMSPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/success" element={<Success />} />

        {/* TCMS Routes */}
        <Route
          path="/tcms"
          element={
            <PrivateRoute>
              <TCMSPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/tcms/projects"
          element={
            <PrivateRoute>
              <ProjectsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tcms/test-cases"
          element={
            <PrivateRoute>
              <TestCasesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tcms/test-execution"
          element={
            <PrivateRoute>
              <TestExecutionPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tcms/bugs"
          element={
            <PrivateRoute>
              <BugsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tcms/reports"
          element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tcms/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tcms/help"
          element={
            <PrivateRoute>
              <HelpPage />
            </PrivateRoute>
          }
        />
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingScreen text="Loading application..." />}>
        <AppRoutes />
      </Suspense>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
