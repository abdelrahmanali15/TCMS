import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  ClipboardList,
  PlayCircle,
  Bug,
  BarChart2,
  Settings,
  HelpCircle,
  FolderKanban,
  FileCode,
  Users,
  Menu,
  Layers
} from "lucide-react";
import { Link } from "react-router-dom";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
  isCompact?: boolean; // new prop
  setIsCompact?: (compact: boolean) => void; // new prop
}

const defaultNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { icon: <FolderKanban size={20} />, label: "Projects" },
  { icon: <Layers size={20} />, label: "Features" },
  { icon: <ClipboardList size={20} />, label: "Test Cases" },
  { icon: <PlayCircle size={20} />, label: "Test Execution" },
  { icon: <Bug size={20} />, label: "Bugs" },
  { icon: <BarChart2 size={20} />, label: "Reports" },
];

const defaultBottomItems: NavItem[] = [
  { icon: <Settings size={20} />, label: "Settings", href: "/tcms/settings" },
  { icon: <HelpCircle size={20} />, label: "Help", href: "/tcms/help" },
];

const TCMSSidebar = ({
  items = defaultNavItems,
  activeItem = "Dashboard",
  onItemClick = () => {},
  isCompact = false,
  setIsCompact = () => {},
}: SidebarProps) => {
  return (
    <div className={`h-screen bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ${isCompact ? "w-20" : "w-[280px]"}`}>
      <div className="relative w-full p-6 flex flex-col items-center">
        {!isCompact ? (
          <>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">TCMS</h2>
          </>
        ) : (
          <FolderKanban size={24} className="text-gray-900" />
        )}
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5">
          {items.map((item) => (
            <Button
              key={item.label}
              variant={"ghost"}
              className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${
                item.label === activeItem
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => onItemClick(item.label)}
            >
              <span className={`${item.label === activeItem ? "text-blue-600" : "text-gray-500"}`}>
                {item.icon}
              </span>
              {!isCompact && item.label}
            </Button>
          ))}
        </div>

      </ScrollArea>

      <div className="p-4 mt-auto border-t border-gray-200 flex flex-col items-center">
        {/* New toggle button placed above bottom items */}
        <Button
          variant="ghost"
          className="w-full justify-center p-1 mb-2"
          onClick={() => setIsCompact(!isCompact)}
        >
          <Menu size={20} />
          {!isCompact && ""}
        </Button>
        {defaultBottomItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 mb-1.5 flex items-center"
            onClick={() => onItemClick(item.label)}
          >
            <span className="text-gray-500">{item.icon}</span>
            {!isCompact && item.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TCMSSidebar;
