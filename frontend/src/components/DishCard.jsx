import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';

const categoryColors = {
    'Street Food': 'warning',
    'Cafe': 'info',
    'Restaurant': 'success',
    'Fast Food': 'danger',
    'Dessert': 'help',
    'default': 'secondary'
};

function getCategorySeverity(category) {
    return categoryColors[category] || categoryColors.default;
}

export default function DishCard({ dish, isAnimating }) {
    if (!dish) return null;

    return (
        <div className={`transition-all duration-500 ease-out ${isAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'}`}>
            <Card
                className="shadow-2xl rounded-2xl border-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fff 0%, #fef3c7 100%)' }}
            >
                <div className="flex flex-col gap-4 p-2">
                    {/* Category Tag */}
                    <div className="flex justify-between items-center">
                        <Tag
                            value={dish.category || 'Không phân loại'}
                            severity={getCategorySeverity(dish.category)}
                            className="text-sm font-medium"
                        />
                        <div className="flex items-center gap-1 text-amber-500">
                            <i className="pi pi-star-fill text-sm"></i>
                            <span className="text-sm font-semibold text-gray-600">{dish.priority || 0}</span>
                        </div>
                    </div>

                    {/* District */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-800 mb-1">
                            📍 {dish.district}
                        </h2>
                    </div>

                    {/* Address */}
                    <div className="text-center bg-white/60 rounded-xl p-4">
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {dish.address}
                        </p>
                    </div>

                    {/* Decorative element */}
                    <div className="text-center text-4xl pt-2">
                        🍜
                    </div>
                </div>
            </Card>
        </div>
    );
}
