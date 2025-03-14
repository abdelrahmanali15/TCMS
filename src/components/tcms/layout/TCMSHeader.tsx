import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search, Settings, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";

interface TCMSHeaderProps {
  title?: string;
  onSearch?: (query: string) => void;
}

const TCMSHeader = ({ title = "Dashboard", onSearch }: TCMSHeaderProps) => {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full h-16 border-b border-gray-200 bg-white fixed top-0 left-0 right-0 z-40 shadow-sm">
      <div className="container mx-auto h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="relative w-64 ml-8">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-9 h-10 rounded-full bg-gray-100 border-0 text-sm focus:ring-2 focus:ring-gray-200 focus-visible:ring-gray-200 focus-visible:ring-offset-0"
              onChange={(e) => onSearch && onSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="relative" style={{ zIndex: 50 }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-2 border-gray-200 p-0 w-10 h-10 overflow-hidden"
              >
                {user?.email ? (
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-medium text-sm">U</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={5}
              className="w-56 z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200"
            >
              <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                {user?.email || "User"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer focus:bg-gray-100">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-gray-100">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer focus:bg-gray-100 text-red-600"
                onSelect={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TCMSHeader;
