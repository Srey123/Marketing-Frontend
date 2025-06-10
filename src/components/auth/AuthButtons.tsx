// src/components/auth/AuthButtons.tsx
"use client";

// import React from 'react'; // This line has been removed as it's no longer necessary in modern React versions
import { useAuth } from './auth_model'; // Path to your AuthContext hook
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react'; // Import icons for user and logout


const AuthButtons: React.FC = () => {
  const { isLoggedIn, userName, openLoginModal, logout } = useAuth();

  return (
    <>
      {!isLoggedIn ? (
        // Render Login button if not logged in
        <Button
          onClick={openLoginModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Login
        </Button>
      ) : (
        // Render DropdownMenu if logged in
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost" // Use ghost variant for a subtle look
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <User className="h-5 w-5 text-muted-foreground" /> {/* User icon */}
              <span className="font-medium text-foreground whitespace-nowrap">
                {userName || "User"} {/* Display username or generic "User" */}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-semibold px-4 py-2">
              Welcome, {userName || "User"}!
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer flex items-center gap-2 text-destructive hover:text-destructive focus:bg-destructive-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};

export default AuthButtons;