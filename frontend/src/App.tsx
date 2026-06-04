import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetList from './pages/AssetList';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetFormPage from './pages/AssetFormPage';

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
        <Route element={<Layout darkMode={darkMode} setDarkMode={setDarkMode} />}>
          <Route path="/"                element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/assets"          element={<Assets />} />
          <Route path="/assets/list"     element={<AssetList />} />
          <Route path="/assets/create"   element={<AssetFormPage />} />
          <Route path="/assets/edit/:id" element={<AssetFormPage />} />
          <Route path="/assets/detail"   element={<AssetDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
