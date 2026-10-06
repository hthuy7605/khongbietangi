import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/PublicLayout';
import HomePage from '@/pages/HomePage';
import NotFound from '@/pages/NotFound';
import SuggestPage from '@/pages/SuggestPage';

const AdminApp = lazy(() => import('@/pages/admin/AdminApp'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="de-xuat" element={<SuggestPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<p className="p-8 text-center text-muted-foreground">Đang tải…</p>}>
            <AdminApp />
          </Suspense>
        }
      />
    </Routes>
  );
}
