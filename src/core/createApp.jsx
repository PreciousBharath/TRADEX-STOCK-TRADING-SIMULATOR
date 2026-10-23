import { Fragment } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context.jsx';
import AuthPage from './AuthPage.jsx';
import Layout from './Layout.jsx';
import SettingsPage from './SettingsPage.jsx';
import { Toasts } from './ui.jsx';
import './theme.css';

function Gate() {
  const { user, config } = useApp();
  if (!user) return <AuthPage />;
  const routes = config.nav.flatMap((s) => s.items);
  const P = config.Provider || Fragment;
  return (
    <P><Layout>
      <Routes>
        {routes.map((r) => <Route key={r.to} path={r.to} element={<r.page />} />)}
        {config.extraRoutes?.map((r) => <Route key={r.path} path={r.path} element={<r.page />} />)}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={routes[0].to} replace />} />
      </Routes>
    </Layout></P>
  );
}

export default function createApp(config) {
  return function App() {
    return (
      <AppProvider config={config}>
        <HashRouter><Gate /></HashRouter>
        <Toasts />
      </AppProvider>
    );
  };
}
