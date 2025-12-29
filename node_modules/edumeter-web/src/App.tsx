import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminHome } from './pages/admin/AdminHome';
import { RequirementsStub } from './pages/admin/RequirementsStub';
import { ItemBankStub } from './pages/admin/ItemBankStub';
import { GenerationStub } from './pages/admin/GenerationStub';
import { AnalyticsDashboard } from './pages/admin/AnalyticsDashboard';
import { NotFound } from './pages/NotFound';
import { Header } from './components/layout/Header';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen w-full bg-background flex flex-col font-sans text-text-primary">
        <Header />
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Navigate to="/diagnostic" replace />} />
            <Route path="/diagnostic" element={<DiagnosticPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="requirements" element={<RequirementsStub />} />
              <Route path="item-bank" element={<ItemBankStub />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="generation" element={<GenerationStub />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
