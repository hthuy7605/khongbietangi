import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, toApiError } from '@/lib/api';

export default function SettingsTab() {
  const [dishWeightEnabled, setDishWeightEnabled] = useState<boolean | null>(null);
  const [placeWeightEnabled, setPlaceWeightEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await api.admin.settings();
      setDishWeightEnabled(settings.dishWeightEnabled);
      setPlaceWeightEnabled(settings.placeWeightEnabled);
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const toggleSetting = useCallback(
    async (key: 'dish_weight_enabled' | 'place_weight_enabled') => {
      setLoading(true);
      try {
        const response = await api.admin.toggleSetting(key);
        const newValue = response[key] as boolean | undefined;
        if (newValue !== undefined) {
          if (key === 'dish_weight_enabled') setDishWeightEnabled(newValue);
          else setPlaceWeightEnabled(newValue);
          toast.success('Cập nhật thành công');
        }
      } catch (e) {
        toast.error(toApiError(e).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  if (dishWeightEnabled === null) {
    return (
      <section aria-labelledby="settings-title" className="grid gap-4">
        <h2 id="settings-title" className="text-xl font-extrabold">Cài đặt</h2>
        <p className="text-muted-foreground">Đang tải…</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="settings-title" className="grid gap-6">
      <div>
        <h2 id="settings-title" className="text-xl font-extrabold">Cài đặt</h2>
        <p className="text-sm text-muted-foreground">Tạm thời bật/tắt các chức năng</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">Độ yêu thích món ăn</h3>
            <p className="text-sm text-muted-foreground">Sử dụng trọng số (1-5 sao) khi chọn món</p>
          </div>
          <Button
            variant={dishWeightEnabled ? 'default' : 'outline'}
            onClick={() => void toggleSetting('dish_weight_enabled')}
            disabled={loading}
            className="h-11 w-24"
          >
            {dishWeightEnabled ? 'Bật' : 'Tắt'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">Độ yêu thích quán ăn</h3>
            <p className="text-sm text-muted-foreground">Sử dụng trọng số (1-5 sao) khi chọn quán</p>
          </div>
          <Button
            variant={placeWeightEnabled ? 'default' : 'outline'}
            onClick={() => void toggleSetting('place_weight_enabled')}
            disabled={loading}
            className="h-11 w-24"
          >
            {placeWeightEnabled ? 'Bật' : 'Tắt'}
          </Button>
        </div>
      </div>
    </section>
  );
}
