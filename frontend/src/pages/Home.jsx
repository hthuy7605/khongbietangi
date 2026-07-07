import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useDishes } from '../context/DishContext';
import { useRejections } from '../hooks/useRejections';
import DishCard from '../components/DishCard';
import RejectionPanel from '../components/RejectionPanel';

export default function Home() {
    const { dishes, loading, error, selectedCategory, setSelectedCategory } = useDishes();
    const {
        rejectedIds,
        rejectDish,
        clearRejection,
        clearAllRejections,
        getRemainingMinutes
    } = useRejections();

    const [currentDish, setCurrentDish] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [allCategories, setAllCategories] = useState([]);

    // Get unique categories for dropdown (from all dishes, not filtered)
    const categoryOptions = useMemo(() => {
        return [
            { label: 'Tất cả', value: null },
            ...allCategories.sort().map(cat => ({ label: cat, value: cat }))
        ];
    }, [allCategories]);

    // Update all categories when dishes change (only on initial load)
    useEffect(() => {
        if (Array.isArray(dishes) && dishes.length > 0 && allCategories.length === 0) {
            const uniqueCategories = [...new Set(dishes.map(d => d.category).filter(Boolean))];
            setAllCategories(uniqueCategories);
        }
    }, [dishes, allCategories.length]);

    // Available dishes = all dishes minus rejected ones
    const availableDishes = useMemo(() => {
        if (!Array.isArray(dishes)) return [];
        return dishes.filter(d => !rejectedIds.includes(d.id));
    }, [dishes, rejectedIds]);

    const allRejected = dishes.length > 0 && availableDishes.length === 0;

    const pickRandom = useCallback(() => {
        if (availableDishes.length === 0) return;

        setIsAnimating(true);
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * availableDishes.length);
            setCurrentDish(availableDishes[randomIndex]);
            setIsAnimating(false);
        }, 300);
    }, [availableDishes]);

    const handleRandom = () => {
        setHasStarted(true);
        pickRandom();
    };

    const handleReject = () => {
        if (!currentDish) return;
        rejectDish(currentDish.id);
        // Pick next available dish
        const nextAvailable = availableDishes.filter(d => d.id !== currentDish.id);
        if (nextAvailable.length > 0) {
            setIsAnimating(true);
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * nextAvailable.length);
                setCurrentDish(nextAvailable[randomIndex]);
                setIsAnimating(false);
            }, 300);
        } else {
            setCurrentDish(null);
        }
    };

    const handleClearAllRejections = () => {
        clearAllRejections();
        setCurrentDish(null);
        setHasStarted(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-amber-100">
                <div className="flex flex-col items-center gap-4">
                    <ProgressSpinner />
                    <p className="text-slate-500">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-amber-100">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
                    <i className="pi pi-exclamation-triangle text-5xl text-red-400 mb-4 block"></i>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Lỗi kết nối</h2>
                    <p className="text-slate-500 mb-4">{error}</p>
                    <Link to="/login">
                        <Button label="Đến trang quản lý" icon="pi pi-cog" />
                    </Link>
                </div>
            </div>
        );
    }

    if (dishes.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-amber-100">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
                    <i className="pi pi-inbox text-5xl text-slate-300 mb-4 block"></i>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Chưa có món ăn nào</h2>
                    <p className="text-slate-500 mb-4">Hãy thêm món ăn trong trang quản lý</p>
                    <Link to="/login">
                        <Button label="Thêm món ăn" icon="pi pi-plus" severity="success" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col">
            <div className="container mx-auto px-4 py-8 max-w-2xl flex-1">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
                        🍜 Không biết ăn gì?
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Để tui quyết định choa!
                    </p>
                </div>

                {/* Category Filter */}
                {categoryOptions.length > 1 && (
                    <div className="mb-6 flex justify-center">
                        <Dropdown
                            value={selectedCategory}
                            options={categoryOptions}
                            onChange={(e) => setSelectedCategory(e.value)}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Chọn danh mục"
                            className="w-full max-w-xs"
                        />
                    </div>
                )}

                {/* Main Card Area */}
                <div className="mb-6">
                    {hasStarted && currentDish && !allRejected ? (
                        <DishCard dish={currentDish} isAnimating={isAnimating} />
                    ) : hasStarted && allRejected ? (
                        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                            <div className="text-6xl mb-4">😭</div>
                            <h2 className="text-2xl font-bold text-slate-700 mb-2">
                                Bạn đã chê hết tất cả món ăn
                            </h2>
                            <p className="text-slate-500 mb-6">
                                Xóa lịch sử chê để quay lại nhé!
                            </p>
                            <Button
                                label="Xóa lịch sử chê"
                                icon="pi pi-refresh"
                                severity="warning"
                                size="large"
                                onClick={handleClearAllRejections}
                                className="w-full"
                            />
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-amber-200">
                            <div className="text-7xl mb-4 animate-bounce">🎲</div>
                            <h2 className="text-2xl font-bold text-slate-700 mb-2">
                                Sẵn sàng chưa?
                            </h2>
                            <p className="text-slate-500">
                                Nhấn nút bên dưới để bắt đầu!
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mb-6">
                    <Button
                        label="🎲 Quay số!"
                        className="flex-1 h-14 text-lg font-bold bg-linear-to-r from-amber-500 to-orange-500 border-0 shadow-lg hover:shadow-xl transition-all active:scale-95"
                        onClick={handleRandom}
                        disabled={allRejected || availableDishes.length === 0}
                    />
                    {hasStarted && currentDish && !allRejected && (
                        <Button
                            label="❌ Chê!"
                            severity="danger"
                            className="flex-1 h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                            onClick={handleReject}
                        />
                    )}
                </div>

                {/* Rejection Panel */}
                <RejectionPanel
                    rejections={{ rejectedIds, rejections: Object.fromEntries(rejectedIds.map(id => [id, Date.now()])) }}
                    onClearRejection={clearRejection}
                    onClearAll={handleClearAllRejections}
                    getRemainingMinutes={getRemainingMinutes}
                />

                {/* Admin Link */}
                <div className="text-center mt-8">
                    <Link
                        to="/login"
                        className="text-slate-400 hover:text-slate-600 text-sm transition-colors inline-flex items-center gap-1"
                    >
                        <i className="pi pi-cog"></i>
                        Quản lý món ăn
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-6 text-slate-400 text-sm">
                Được làm ra bởi h.thuy7605@gmail.com
            </div>
        </div>
    );
}
