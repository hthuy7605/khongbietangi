import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dices, RefreshCw, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { FilterBar } from '@/components/FilterBar';
import { PlaceCard } from '@/components/PlaceCard';
import { RejectedPanel } from '@/components/RejectedPanel';
import { useCatalog } from '@/hooks/useCatalog';
import { useNearby } from '@/hooks/useNearby';
import { useRejected } from '@/hooks/useRejected';
import { useSlot } from '@/hooks/useSlot';
import { eligibleDishes, noFilters, placesForDish, type FilterContext, type Filters, type PlaceView } from '@/lib/filters';
import { currentMeal, MEAL_EMOJI, MEAL_LABEL } from '@/lib/labels';
import { pickWeighted } from '@/lib/pick';
import { dishKey, placeKey } from '@/lib/rejections';
import type { Dish } from '@/lib/types';

async function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');
  void confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 }, colors: ['#ea580c', '#f59e0b', '#dc2626', '#fde68a'] });
}

const SKIP_KEY = 'skipRollAnimation';

function loadSkip() {
  try {
    return localStorage.getItem(SKIP_KEY) === '1';
  } catch {
    return false;
  }
}

function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-input bg-card/60 px-6 py-10 text-center">
      <p aria-hidden className="text-5xl">{emoji}</p>
      <h2 className="mt-3 text-lg font-extrabold">{title}</h2>
      <div className="mt-4 flex flex-col items-center gap-2">{children}</div>
    </div>
  );
}

export default function HomePage() {
  const { catalog, error, loading, reload } = useCatalog();
  const { rejected, now, reject, unreject, clear } = useRejected();
  const nearby = useNearby();
  const slot = useSlot<Dish>();

  const [filters, setFilters] = useState<Filters>(() => ({ ...noFilters, meal: currentMeal() }));
  const [dish, setDish] = useState<Dish | null>(null);
  const [pickedPlace, setPickedPlace] = useState<PlaceView | null>(null);
  const [announce, setAnnounce] = useState('');
  const [skipAnim, setSkipAnim] = useState(loadSkip);
  const spinId = useRef(0);

  const dishes = useMemo(() => new Map((catalog?.dishes ?? []).map((d) => [d.id, d])), [catalog]);
  const places = useMemo(() => new Map((catalog?.places ?? []).map((p) => [p.id, p])), [catalog]);
  const districts = useMemo(
    () => [...new Set((catalog?.places ?? []).map((p) => p.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [catalog],
  );

  const ctx: FilterContext = useMemo(
    () => ({ places, coords: nearby.coords, rejected, now: new Date(now) }),
    [places, nearby.coords, rejected, now],
  );
  const eligible = useMemo(() => eligibleDishes(catalog?.dishes ?? [], filters, ctx), [catalog, filters, ctx]);
  const placeViews = useMemo(() => (dish ? placesForDish(dish, filters, ctx) : []), [dish, filters, ctx]);

  const spin = useCallback(
    async (pool: Dish[]) => {
      const weightedPool = catalog?.dishWeightEnabled ? pool : pool.map((d) => ({ ...d, weight: 1 }));
      const target = pickWeighted(weightedPool);
      if (!target) return;
      const id = ++spinId.current;
      setPickedPlace(null);
      setDish(null);
      if (!skipAnim) await slot.run(pool, target);
      if (id !== spinId.current) return;
      setDish(target);
      setAnnounce(`Hôm nay ăn ${target.name}`);
      if (!skipAnim) void celebrate();
    },
    [slot, catalog?.dishWeightEnabled, skipAnim],
  );

  const onChangeFilters = (f: Filters) => {
    setFilters(f);
    spinId.current++;
    slot.reset();
    setDish(null);
    setPickedPlace(null);
  };

  async function toggleNearby(on: boolean) {
    if (!on) return onChangeFilters({ ...filters, nearby: false });
    const c = await nearby.request();
    if (c) onChangeFilters({ ...filters, nearby: true });
    else toast.error('Không lấy được vị trí. Hãy cho phép truy cập vị trí trong trình duyệt nhé.');
  }

  function onSkipChange(on: boolean) {
    setSkipAnim(on);
    try {
      localStorage.setItem(SKIP_KEY, on ? '1' : '0');
    } catch {
      // trình duyệt chặn lưu: vẫn áp dụng trong phiên hiện tại
    }
  }

  function rejectDish() {
    if (!dish) return;
    reject(dishKey(dish.id));
    const rest = eligible.filter((d) => d.id !== dish.id);
    if (rest.length === 0) {
      slot.reset();
      setDish(null);
      setPickedPlace(null);
      toast('Hết món để quay rồi, bỏ bớt bộ lọc hoặc bỏ chê nhé');
    } else void spin(rest);
  }

  function spinPlace() {
    const weighted = placeViews.map((v) => ({ ...v, weight: catalog?.placeWeightEnabled ? v.place.weight : 1 }));
    const view = pickWeighted(weighted);
    if (view) {
      setPickedPlace(view);
      setAnnounce(`Quán được chọn: ${view.place.name}`);
      void celebrate();
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-14 rounded-full" />
      </div>
    );
  }
  if (error || !catalog) {
    return (
      <EmptyState emoji="🔌" title="Không tải được thực đơn">
        <p className="text-sm text-muted-foreground">{error || 'Có lỗi xảy ra'}</p>
        <Button onClick={() => void reload()}>
          <RefreshCw /> Thử lại
        </Button>
      </EmptyState>
    );
  }
  if (catalog.dishes.length === 0) {
    return (
      <EmptyState emoji="🍽️" title="Thực đơn đang trống">
        <p className="text-sm text-muted-foreground">Hãy là người đầu tiên đề xuất một món nhé.</p>
        <Button asChild>
          <Link to="/de-xuat">Đề xuất món</Link>
        </Button>
      </EmptyState>
    );
  }

  const hasRejected = Object.keys(rejected).length > 0;
  const spinning = slot.spinning;
  const shown = spinning ? slot.shown : dish;
  const visiblePlaces = pickedPlace ? [pickedPlace] : placeViews;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Hôm nay ăn gì nhỉ?</h1>
        <p className="text-sm text-muted-foreground">Chọn bộ lọc rồi bấm quay, để tui quyết định cho!</p>
      </div>

      <FilterBar
        filters={filters}
        onChange={onChangeFilters}
        groups={catalog.groups}
        districts={districts}
        nearbyAsking={nearby.status === 'asking'}
        onToggleNearby={(on) => void toggleNearby(on)}
      />

      <section aria-label="Kết quả quay món" className="grid gap-3">
        <div
          className={`relative grid min-h-56 place-items-center overflow-hidden rounded-3xl border bg-card p-6 text-center shadow-sm ${
            dish && !spinning ? 'animate-pop-in border-primary/50' : 'border-border'
          }`}
        >
          {shown ? (
            <div className="grid gap-2">
              <p aria-hidden className={`text-7xl leading-none ${spinning ? 'blur-[1px]' : ''}`}>{shown.emoji}</p>
              <p className="text-2xl font-extrabold break-words">{shown.name}</p>
              {!spinning && shown.description && <p className="text-sm text-muted-foreground">{shown.description}</p>}
              {!spinning && (
                <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                  {shown.meals.map((m) => (
                    <Badge key={m} variant="secondary">
                      {MEAL_EMOJI[m]} {MEAL_LABEL[m]}
                    </Badge>
                  ))}
                  {catalog.groups
                    .filter((g) => shown.groupIds.includes(g.id))
                    .map((g) => (
                      <Badge key={g.id} variant="outline">
                        {g.emoji} {g.name}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-2 text-muted-foreground">
              <p aria-hidden className="text-6xl">🎲</p>
              <p className="font-bold">
                {eligible.length > 0 ? `Có ${eligible.length} món đang chờ được chọn` : 'Chưa có món nào hợp bộ lọc'}
              </p>
            </div>
          )}
        </div>
        <p role="status" aria-live="polite" className="sr-only">{announce}</p>

        {eligible.length === 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => onChangeFilters(noFilters)}>
              Xóa bộ lọc
            </Button>
            {hasRejected && (
              <Button variant="outline" onClick={clear}>
                Bỏ hết món đã chê
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="lg" className="h-14 flex-1 rounded-full text-lg font-extrabold shadow-md" disabled={spinning} onClick={() => void spin(eligible)}>
              <Dices className={spinning ? 'animate-spin' : ''} />
              {dish ? 'Quay lại' : 'Quay món'}
            </Button>
            {dish && !spinning && (
              <Button size="lg" variant="outline" className="h-14 rounded-full px-5 font-bold" onClick={rejectDish}>
                <ThumbsDown /> Chê
              </Button>
            )}
          </div>
        )}
        <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Switch size="sm" checked={skipAnim} onCheckedChange={onSkipChange} />
          Bỏ qua hiệu ứng, ra kết quả luôn
        </label>
      </section>

      {dish && !spinning && (
        <section aria-label={`Quán bán ${dish.name}`} className="grid gap-3">
          <div className="flex items-center gap-2">
            <h2 className="mr-auto text-lg font-extrabold">Ăn {dish.name} ở đâu?</h2>
            {placeViews.length > 1 && (
              <Button size="sm" variant="secondary" onClick={spinPlace}>
                <Dices /> Quay quán
              </Button>
            )}
            {pickedPlace && (
              <Button size="sm" variant="ghost" onClick={() => setPickedPlace(null)}>
                Xem tất cả
              </Button>
            )}
          </div>
          {visiblePlaces.length > 0 ? (
            <ul className="grid gap-3">
              {visiblePlaces.map((v) => (
                <PlaceCard
                  key={v.place.id}
                  view={v}
                  highlighted={pickedPlace?.place.id === v.place.id}
                  onReject={() => {
                    reject(placeKey(v.place.id));
                    setPickedPlace(null);
                  }}
                />
              ))}
            </ul>
          ) : (
            <EmptyState emoji="🧭" title="Chưa có quán phù hợp">
              <p className="text-sm text-muted-foreground">
                {dish.placeIds.length === 0 ? 'Món này chưa có quán nào.' : 'Bộ lọc quán đang loại hết quán của món này.'}
              </p>
              <Button asChild variant="secondary">
                <Link to="/de-xuat">Đề xuất thêm quán</Link>
              </Button>
            </EmptyState>
          )}
        </section>
      )}

      <RejectedPanel rejected={rejected} now={now} dishes={dishes} places={places} onUndo={unreject} onClear={clear} />
    </div>
  );
}
