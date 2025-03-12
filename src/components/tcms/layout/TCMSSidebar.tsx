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
}

const defaultNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { icon: <FolderKanban size={20} />, label: "Projects" },
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
}: SidebarProps) => {
  return (
    <div className="w-[280px] h-screen bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">TCMS</h2>
        <p className="text-sm text-gray-500">Test Case Management System</p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5">
          {items.map((item) => (
            <Button
              key={item.label}
              variant={"ghost"}
              className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${item.label === activeItem ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "text-gray-700 hover:bg-gray-100"}`}
              onClick={() => onItemClick(item.label)}
            >
              <span
                className={`${item.label === activeItem ? "text-blue-600" : "text-gray-500"}`}
              >
                {item.icon}
              </span>
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-4 bg-gray-100" />

        <div className="space-y-3">
          <h3 className="text-xs font-medium px-4 py-1 text-gray-500 uppercase tracking-wider">
            Filters
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Passed
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            Failed
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            Blocked
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
            Not Executed
          </Button>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t border-gray-200">
        {defaultBottomItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 mb-1.5"
            onClick={() => onItemClick(item.label)}
          >
            <span className="text-gray-500">{item.icon}</span>
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TCMSSidebar;
