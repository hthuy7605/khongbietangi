import { Clock, Navigation, ThumbsDown } from 'lucide-react';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistance } from '@/lib/distance';
import { mapsLink, type PlaceView } from '@/lib/filters';
import { PRICE_LABEL } from '@/lib/labels';

interface Props {
  view: PlaceView;
  highlighted?: boolean;
  onReject?: () => void;
}

export function PlaceCard({ view, highlighted = false, onReject }: Props) {
  const { place, km, open } = view;
  return (
    <li
      className={cn(
        'animate-pop-in flex gap-3 rounded-2xl border bg-card p-3.5 shadow-sm',
        highlighted ? 'border-primary ring-2 ring-primary/30' : 'border-border',
        open === false && 'opacity-70',
      )}
    >
      {place.imageUrl && (
        <img
          src={place.imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-16 shrink-0 rounded-xl object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-base leading-snug font-extrabold break-words">{place.name}</h3>
          {onReject && (
            <Button variant="ghost" size="icon" className="-mt-1 -mr-1 size-9 shrink-0" onClick={onReject} aria-label={`Chê quán ${place.name}`}>
              <ThumbsDown />
            </Button>
          )}
        </div>
        {(place.address || place.district) && (
          <p className="mt-0.5 text-sm text-muted-foreground">{[place.address, place.district].filter(Boolean).join(', ')}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {open === true && <Badge className="bg-success/15 text-success hover:bg-success/15">Đang mở</Badge>}
          {open === false && <Badge variant="secondary">Đang đóng cửa</Badge>}
          {place.openTime && place.closeTime && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden /> {place.openTime}–{place.closeTime}
            </span>
          )}
          {place.priceLevel && <Badge variant="outline">{PRICE_LABEL[place.priceLevel]}</Badge>}
          {km !== null && <Badge variant="outline">{formatDistance(km)}</Badge>}
        </div>
        {place.note && <p className="mt-2 text-sm">{place.note}</p>}
        <Button asChild size="sm" className="mt-3">
          <a href={mapsLink(place)} target="_blank" rel="noopener noreferrer">
            <Navigation /> Chỉ đường
          </a>
        </Button>
      </div>
    </li>
  );
}
