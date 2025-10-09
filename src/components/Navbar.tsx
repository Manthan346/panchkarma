import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { LogOut, Menu, Bell, Settings, User } from 'lucide-react';
import { User as UserType } from '../App';

interface NavbarProps {
  user: UserType;
  onLogout: () => void;
  title?: string;
  showNotifications?: boolean;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

export function Navbar({ 
  user, 
  onLogout, 
  title = "Panchakarma Management System",
  showNotifications = false,
  unreadCount = 0,
  onNotificationClick
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'doctor':
        return 'default';
      case 'patient':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'doctor':
        return '🩺';
      case 'patient':
        return '🧘';
      default:
        return '👤';
    }
  };

  const NavContent = () => (
    <>
      <div className="flex items-center space-x-3">
        <User className="w-5 h-5 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
          {getRoleIcon(user.role)} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        {showNotifications && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNotificationClick}
            className="relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}
        
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="text-xl text-green-600">🌿</div>
          <h1 className="text-lg font-semibold text-green-700 hidden sm:block">
            {title}
          </h1>
          <h1 className="text-sm font-semibold text-green-700 sm:hidden">
            Panchakarma
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <NavContent />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold text-green-700">
                  🌿 Panchakarma Management
                </SheetTitle>
                <SheetDescription>
                  Navigation menu and user information
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex flex-col space-y-6">
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <NavContent />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">System Information:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Traditional Ayurveda meets modern technology</li>
                      <li>• Comprehensive therapy management</li>
                      <li>• Real-time progress tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}