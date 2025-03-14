import React, { useState, useEffect } from "react";
import TCMSSidebar from "./TCMSSidebar";
import { useAuth } from "../../../../supabase/auth";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { useLocation, useNavigate } from "react-router-dom";

interface TCMSLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const TCMSLayout = ({ children, title = "Dashboard" }: TCMSLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("Dashboard");
  // New state for controlling sidebar compact mode
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);

  // Update activeItem based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/projects")) {
      setActiveItem("Projects");
    } else if (path.includes("/test-cases")) {
      setActiveItem("Test Cases");
    } else if (path.includes("/test-execution")) {
      setActiveItem("Test Execution");
    } else if (path.includes("/bugs")) {
      setActiveItem("Bugs");
    } else if (path.includes("/reports")) {
      setActiveItem("Reports");
    } else if (path.includes("/settings")) {
      setActiveItem("Settings");
    } else {
      setActiveItem("Dashboard");
    }
  }, [location.pathname]);

  const handleItemClick = (label: string) => {
    setActiveItem(label);
    // Navigate based on sidebar item
    switch (label) {
      case "Dashboard":
        navigate("/tcms");
        break;
      case "Projects":
        navigate("/tcms/projects");
        break;
      case "Test Cases":
        navigate("/tcms/test-cases");
        break;
      case "Test Execution":
        navigate("/tcms/test-execution");
        break;
      case "Bugs":
        navigate("/tcms/bugs");
        break;
      case "Reports":
        navigate("/tcms/reports");
        break;
      case "Settings":
        navigate("/tcms/settings");
        break;
      default:
        navigate("/tcms");
    }
  };

  if (loading) {
    return <LoadingScreen text="Loading TCMS..." />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      <TCMSSidebar
        activeItem={activeItem}
        onItemClick={handleItemClick}
        isCompact={isSidebarCompact}
        setIsCompact={setIsSidebarCompact}
      />
      <div className={`flex-1 overflow-auto pt-16 ${isSidebarCompact ? "ml-20" : "ml-[280px]"}`}>
        {children}
      </div>
    </div>
  );
};

export default TCMSLayout;
