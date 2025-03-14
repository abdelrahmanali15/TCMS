import { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Apple-style navigation */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[980px] mx-auto flex h-12 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl flex items-center">
              <img
                src="/public/Master-Micro-Egypt-65268-1624361200.png"
                alt="MasterMicro Logo"
                className="h-8 mr-2"
              />
              <span className="text-blue-700 font-semibold">MasterMicro</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-7 text-sm font-light">
            {/* Navigation items can go here */}
          </nav>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center pt-12">
        <div className="max-w-md w-full px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex flex-col items-center">
                <img
                  src="public/Master-Micro-Egypt-65268-1624361200.png"
                  alt="MasterMicro Logo"
                  className="h-16 mb-2"
                />
              </div>
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-blue-800">TCMS-ADT</h2>
            <p className="text-xl font-medium text-gray-500 mt-2">
              Analog Designer's Toolbox - Test Case Management System
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
