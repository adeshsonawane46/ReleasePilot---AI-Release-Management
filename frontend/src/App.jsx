import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ReleaseBriefs from './pages/ReleaseBriefs.jsx';
import AIAnalysis from './pages/AIAnalysis.jsx';
import CompareReleases from './pages/CompareReleases.jsx';
import CreateRelease from './pages/CreateRelease.jsx';
import ReleaseVersions from './pages/ReleaseVersions.jsx';
import FinalBrief from './pages/FinalBrief.jsx';
import ReviewBrief from './pages/ReviewBrief.jsx';
import AuditLogPage from './pages/AuditLog.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/briefs" element={<ReleaseBriefs />} />
        <Route path="/analysis" element={<AIAnalysis />} />
        <Route path="/compare" element={<CompareReleases />} />
        <Route path="/create" element={<CreateRelease />} />
        <Route path="/versions" element={<ReleaseVersions />} />
        <Route path="/final-brief" element={<FinalBrief />} />
        <Route path="/review" element={<ReviewBrief />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
