'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    setAuth: (token: string, user?: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setTokenState] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedToken = Cookies.get('token');
        if (storedToken) {
            setTokenState(storedToken);
            try {
                const decoded: any = jwtDecode(storedToken);
                setUser({ id: decoded.sub, email: decoded.email, name: decoded.name || 'User', role: decoded.role });
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        } else {
            if (pathname !== '/login') {
                router.push('/login');
            }
        }
        setIsLoading(false);
    }, [pathname, router]);

    const setAuth = (newToken: string) => {
        setTokenState(newToken);
        try {
            const decoded: any = jwtDecode(newToken);
            setUser({ id: decoded.sub, email: decoded.email, name: decoded.name || 'User', role: decoded.role });
        } catch (e) {
            console.error("Failed to decode new token", e);
        }
        Cookies.set('token', newToken, { expires: 1 });
    };

    const logout = () => {
        setTokenState(null);
        setUser(null);
        Cookies.remove('token');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            setAuth,
            logout,
            isAuthenticated: !!token,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
