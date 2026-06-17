import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetList from './pages/AssetList';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetFormPage from './pages/AssetFormPage';
import SoftwareList from './pages/SoftwareList';
import SoftwareFormPage from './pages/SoftwareFormPage';
import SoftwareDetailPage from './pages/SoftwareDetailPage';
import ScannedSoftwarePage from './pages/ScannedSoftwarePage';
import SoftwareSummaryPage from './pages/SoftwareSummaryPage';
import LicenseAgreementsPage from './pages/LicenseAgreementsPage';
import LicenseAgreementFormPage from './pages/LicenseAgreementFormPage';
import SoftwareLicensesPage from './pages/SoftwareLicensesPage';
import SoftwareLicenseFormPage from './pages/SoftwareLicenseFormPage';
import ServicePacksPage from './pages/ServicePacksPage';
import AddLicensePopupPage from './pages/AddLicensePopupPage';
import AssociateLicensesPopupPage from './pages/AssociateLicensesPopupPage';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Popup windows — no Layout chrome */}
        <Route path="/software/popup/add-license"        element={<AddLicensePopupPage />} />
        <Route path="/software/popup/associate-licenses" element={<AssociateLicensesPopupPage />} />

        <Route element={<Layout darkMode={darkMode} setDarkMode={setDarkMode} />}>
          <Route path="/"                element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/assets"          element={<Assets />} />
          <Route path="/assets/list"     element={<AssetList />} />
          <Route path="/assets/create"   element={<AssetFormPage />} />
          <Route path="/assets/edit/:id" element={<AssetFormPage />} />
          <Route path="/assets/detail"   element={<AssetDetailPage />} />

          {/* Software sub-routes */}
          <Route path="/software"                           element={<Navigate to="/software/scanned" replace />} />
          <Route path="/software/scanned"                   element={<ScannedSoftwarePage />} />
          <Route path="/software/list"                      element={<Navigate to="/software/scanned" replace />} />
          <Route path="/software/summary"                   element={<SoftwareSummaryPage />} />
          <Route path="/software/license-agreements"        element={<LicenseAgreementsPage />} />
          <Route path="/software/license-agreements/create" element={<LicenseAgreementFormPage />} />
          <Route path="/software/license-agreements/edit/:id" element={<LicenseAgreementFormPage />} />
          <Route path="/software/licenses"                  element={<SoftwareLicensesPage />} />
          <Route path="/software/licenses/create"           element={<SoftwareLicenseFormPage />} />
          <Route path="/software/licenses/edit/:id"         element={<SoftwareLicenseFormPage />} />
          <Route path="/software/service-packs"             element={<ServicePacksPage />} />

          {/* Software CRUD (detail, create, edit) */}
          <Route path="/software/create"        element={<SoftwareFormPage />} />
          <Route path="/software/edit/:id"      element={<SoftwareFormPage />} />
          <Route path="/software/detail/:id"    element={<SoftwareDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
