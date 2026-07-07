import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { useDishes } from '../context/DishContext';

export default function RejectionPanel({ rejections, onClearRejection, onClearAll, getRemainingMinutes }) {
    const { dishes } = useDishes();
    const rejectedIds = Object.keys(rejections.rejections || rejections).map(Number);

    if (rejectedIds.length === 0) return null;

    const getDishName = (id) => {
        const dish = dishes.find(d => d.id === id);
        return dish ? `${dish.district} - ${dish.address}` : `Món #${id}`;
    };

    return (
        <Panel
            header={
                <div className="flex items-center gap-2">
                    <i className="pi pi-ban text-red-500"></i>
                    <span className="font-semibold text-slate-700">
                        Đã chê ({rejectedIds.length} món)
                    </span>
                </div>
            }
            toggleable
            className="mt-6 shadow-lg rounded-2xl overflow-hidden"
        >
            <div className="flex flex-col gap-3">
                {rejectedIds.map(id => (
                    <div
                        key={id}
                        className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3 border border-red-100"
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">
                                {getDishName(id)}
                            </span>
                            <span className="text-xs text-red-400">
                                Còn {getRemainingMinutes(id)} phút
                            </span>
                        </div>
                        <Button
                            icon="pi pi-times"
                            rounded
                            text
                            severity="danger"
                            size="small"
                            onClick={() => onClearRejection(id)}
                            tooltip="Bỏ chê"
                            tooltipOptions={{ position: 'left' }}
                        />
                    </div>
                ))}

                <Button
                    label="Xóa tất cả"
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    size="small"
                    className="mt-2 w-full"
                    onClick={onClearAll}
                />
            </div>
        </Panel>
    );
}
