import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllDishes, createDish, updateDish, deleteDish } from '../services/api';

const DishContext = createContext(null);

export function DishProvider({ children }) {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const refresh = useCallback(async (category = null) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllDishes(category);
            setDishes(data);
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách món ăn');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh(selectedCategory);
    }, [refresh, selectedCategory]);

    const addDish = useCallback(async (data) => {
        const newDish = await createDish(data);
        setDishes(prev => [...prev, newDish].sort((a, b) => b.priority - a.priority));
        return newDish;
    }, []);

    const editDish = useCallback(async (id, data) => {
        const updated = await updateDish(id, data);
        setDishes(prev => prev.map(d => d.id === id ? updated : d).sort((a, b) => b.priority - a.priority));
        return updated;
    }, []);

    const removeDish = useCallback(async (id) => {
        await deleteDish(id);
        setDishes(prev => prev.filter(d => d.id !== id));
    }, []);

    return (
        <DishContext.Provider value={{ dishes, loading, error, refresh, addDish, editDish, removeDish, selectedCategory, setSelectedCategory }}>
            {children}
        </DishContext.Provider>
    );
}

export function useDishes() {
    const context = useContext(DishContext);
    if (!context) {
        throw new Error('useDishes must be used within a DishProvider');
    }
    return context;
}
