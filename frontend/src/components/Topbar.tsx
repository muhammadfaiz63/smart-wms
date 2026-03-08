'use client';

import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from "next-themes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Topbar() {
    const { logout } = useAuth();
    const { setTheme } = useTheme();

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header className="h-16 border-b bg-background flex items-center justify-between px-6 z-10 sticky top-0">
            <div className="text-muted-foreground">
                <h2 className="text-sm font-medium text-foreground">Overview</h2>
            </div>

            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="h-9 w-9" />}>
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            System
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Info */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50 h-9">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon size={12} />
                    </div>
                    <span className="text-xs font-medium text-foreground">Admin</span>
                </div>

                {/* Logout */}
                <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9">
                    <LogOut size={16} />
                </Button>
            </div>
        </header>
    );
}
