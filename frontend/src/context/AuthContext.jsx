import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as loginApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = useCallback(async (username, password) => {
        try {
            const result = await loginApi(username, password);
            if (result.success) {
                setIsAuthenticated(true);
                localStorage.setItem('isAuthenticated', 'true');
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }, []);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
    }, []);

    // Check authentication on mount
    useEffect(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
