import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p aria-hidden className="text-6xl">🤷</p>
      <h1 className="mt-4 text-2xl font-extrabold">Trang này không có trong thực đơn</h1>
      <p className="mt-2 text-muted-foreground">Quay về trang chủ để chọn món nhé.</p>
      <Button asChild className="mt-6">
        <Link to="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
