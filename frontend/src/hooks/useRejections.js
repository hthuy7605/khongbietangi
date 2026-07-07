import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'khongbietangi_rejections';
const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

function loadRejections() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        const now = Date.now();
        // Filter out expired entries
        const valid = {};
        for (const [id, expiry] of Object.entries(parsed)) {
            if (expiry > now) {
                valid[id] = expiry;
            }
        }
        return valid;
    } catch {
        return {};
    }
}

function saveRejections(rejections) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rejections));
}

export function useRejections() {
    const [rejections, setRejections] = useState(loadRejections);

    // Sync to localStorage whenever rejections change
    useEffect(() => {
        saveRejections(rejections);
    }, [rejections]);

    // Get array of currently rejected dish IDs (as numbers)
    const rejectedIds = Object.keys(rejections).map(Number);

    const rejectDish = useCallback((id) => {
        setRejections(prev => ({
            ...prev,
            [id]: Date.now() + ONE_HOUR
        }));
    }, []);

    const clearRejection = useCallback((id) => {
        setRejections(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const clearAllRejections = useCallback(() => {
        setRejections({});
    }, []);

    const isRejected = useCallback((id) => {
        return rejections[id] !== undefined && rejections[id] > Date.now();
    }, [rejections]);

    // Get remaining time for a rejected dish in minutes
    const getRemainingMinutes = useCallback((id) => {
        const expiry = rejections[id];
        if (!expiry) return 0;
        const remaining = expiry - Date.now();
        return Math.max(0, Math.ceil(remaining / 60000));
    }, [rejections]);

    return {
        rejectedIds,
        rejectDish,
        clearRejection,
        clearAllRejections,
        isRejected,
        getRemainingMinutes,
        rejections
    };
}
