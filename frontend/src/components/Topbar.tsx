'use client';

import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Moon, Sun, Settings, Loader2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { axiosClient } from '../lib/axiosClient';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Topbar() {
    const { logout, user } = useAuth();
    const { setTheme } = useTheme();
    const router = useRouter();

    const [openEditProfile, setOpenEditProfile] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Global Data Search State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleOpenEditProfile = () => {
        if (user) {
            setEmail(user.email);
            setName(user.name || '');
        }
        setPassword('');
        setOpenEditProfile(true);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        try {
            const payload: any = { email, name };
            if (password.trim() !== '') {
                payload.password = password;
            }
            await axiosClient.patch(`/master/users/${user.id}`, payload);

            alert('Profile successfully updated! Please log in again.');
            setOpenEditProfile(false);
            logout();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchSearchResults = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const response = await axiosClient.get(`/search?q=${searchQuery}`);
                if (isMounted) setSearchResults(response.data);
            } catch (error) {
                console.error("Failed to fetch search results", error);
                if (isMounted) setSearchResults([]);
            } finally {
                if (isMounted) setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(fetchSearchResults, 300);
        return () => {
            isMounted = false;
            clearTimeout(debounceTimer);
        };
    }, [searchQuery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchNavigate = (href: string) => {
        router.push(href);
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchResults.length > 0) {
            handleSearchNavigate(searchResults[0].url);
        } else if (e.key === 'Escape') {
            setIsSearchOpen(false);
            inputRef.current?.blur();
        }
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header className="h-16 border-b bg-background flex items-center justify-between px-6 z-10 sticky top-0">
            <div className="flex-1 max-w-md relative" ref={searchRef}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border text-muted-foreground focus-within:text-foreground focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all">
                    <Search size={16} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search globally..."
                        className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(true);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>

                {isSearchOpen && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border text-popover-foreground rounded-md shadow-md overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                        {isSearching ? (
                            <div className="flex justify-center items-center py-4 text-muted-foreground text-sm">
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                Searching...
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="py-1">
                                {searchResults.map((item, index) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSearchNavigate(item.url)}
                                        className={`flex flex-col w-full text-left px-4 py-2 hover:bg-muted focus:bg-muted focus:outline-none ${index === 0 ? 'bg-muted/50' : ''}`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-sm font-medium">{item.title}</span>
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.type}</span>
                                        </div>
                                        {item.subtitle && <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.subtitle}</span>}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                No matching records found.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
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

                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <div className="flex items-center gap-2 h-9 px-3 bg-muted/50 hover:bg-muted cursor-pointer rounded-md border text-sm">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm font-semibold">
                                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={12} />}
                            </div>
                            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{user?.name || 'Admin'}</span>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleOpenEditProfile} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Edit Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>

            <Dialog open={openEditProfile} onOpenChange={setOpenEditProfile}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your profile information. Leave password blank if you do not wish to change it.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input type="text" required value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password (Optional)</Label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password to change..." />
                        </div>
                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpenEditProfile(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </header>
    );
}
