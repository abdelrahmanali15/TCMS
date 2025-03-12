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
import {
  ChevronRight,
  Settings,
  User,
  CheckCircle,
  BarChart2,
  Bug,
  Beaker,
  ClipboardCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";

export default function LandingPage() {
  const { user, signOut } = useAuth();

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[1200px] mx-auto flex h-12 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl">
              TCMS
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-7 text-sm font-light">
            <Link to="/" className="hover:text-gray-500">
              Features
            </Link>
            <Link to="/" className="hover:text-gray-500">
              Documentation
            </Link>
            <Link to="/" className="hover:text-gray-500">
              Pricing
            </Link>
            <Link to="/" className="hover:text-gray-500">
              Support
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/tcms">
                  <Button
                    variant="ghost"
                    className="text-sm font-light hover:text-gray-500"
                  >
                    TCMS Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 hover:cursor-pointer">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.email || ""}
                      />
                      <AvatarFallback>
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-xl border-none shadow-lg"
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => signOut()}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-light hover:text-gray-500"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm px-4">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-12">
        {/* Hero section */}
        <section className="py-20 text-center">
          <h2 className="text-5xl font-semibold tracking-tight mb-1">
            Test Case Management System
          </h2>
          <h3 className="text-2xl font-medium text-gray-500 mb-6">
            Comprehensive test management for electronic design automation
            workflows
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Streamline your testing process with our powerful platform that
            supports both manual and automated testing, bug tracking, and
            detailed reporting capabilities.
          </p>
          <div className="flex justify-center space-x-6">
            <Link to="/signup">
              <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700 px-8 py-6 text-lg font-medium">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/">
              <Button
                variant="outline"
                className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-6 text-lg font-medium"
              >
                Schedule Demo
              </Button>
            </Link>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-[#f5f5f7] text-center">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-4xl font-semibold tracking-tight mb-2">
              Key Features
            </h2>
            <h3 className="text-xl font-medium text-gray-500 mb-12">
              Everything you need for effective test case management
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm text-left hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart2 className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-medium mb-2">Dashboard Overview</h4>
                <p className="text-gray-600">
                  Comprehensive dashboard with test summaries, recent test runs,
                  and execution trends with visual graphs.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm text-left hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <ClipboardCheck className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="text-xl font-medium mb-2">
                  Test Case Repository
                </h4>
                <p className="text-gray-600">
                  Hierarchical organization with robust filtering by status,
                  type, tags, and features.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm text-left hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Beaker className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="text-xl font-medium mb-2">Test Execution</h4>
                <p className="text-gray-600">
                  Support for both manual testing with step-by-step execution
                  and integration with automation scripts.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm text-left hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Bug className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="text-xl font-medium mb-2">Bug Reporting</h4>
                <p className="text-gray-600">
                  Seamless creation of bug reports from failed tests with
                  pre-filled details and evidence attachment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow section */}
        <section className="py-20 text-center">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-4xl font-semibold tracking-tight mb-2">
              Streamlined Workflow
            </h2>
            <h3 className="text-xl font-medium text-gray-500 mb-12">
              Designed for electronic design automation teams
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 z-10 relative">
                    <span className="text-blue-600 font-bold text-xl">1</span>
                  </div>
                  <div
                    className="absolute top-8 left-full h-0.5 w-full bg-blue-200 hidden md:block"
                    style={{ width: "calc(100% - 4rem)" }}
                  ></div>
                </div>
                <h4 className="text-xl font-medium mb-2">Create Test Cases</h4>
                <p className="text-gray-600">
                  Organize test cases in a hierarchical structure with detailed
                  steps and expected results.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 z-10 relative">
                    <span className="text-blue-600 font-bold text-xl">2</span>
                  </div>
                  <div
                    className="absolute top-8 left-full h-0.5 w-full bg-blue-200 hidden md:block"
                    style={{ width: "calc(100% - 4rem)" }}
                  ></div>
                </div>
                <h4 className="text-xl font-medium mb-2">Execute Tests</h4>
                <p className="text-gray-600">
                  Run manual tests with step-by-step guidance or trigger
                  automated test scripts with a single click.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold text-xl">3</span>
                </div>
                <h4 className="text-xl font-medium mb-2">Track & Report</h4>
                <p className="text-gray-600">
                  Generate detailed reports, track bugs, and analyze test
                  coverage and execution trends.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Role-based access section */}
        <section className="py-20 bg-[#f5f5f7]">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h2 className="text-4xl font-semibold tracking-tight mb-4">
                  Role-Based Access Control
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Our platform supports different user roles with appropriate
                  permissions:
                </p>

                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Admin:</span> Complete
                      system configuration and user management
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Tester:</span> Create and
                      execute test cases, report bugs
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Automation Engineer:</span>{" "}
                      Create and manage automated test scripts
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Developer:</span> View test
                      results and fix reported bugs
                    </div>
                  </li>
                </ul>

                <div className="mt-8">
                  <Link to="/signup">
                    <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700 px-6 py-2">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-md">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="text-xl font-medium mb-4 text-gray-800">
                    User Permissions Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-gray-500">
                            Feature
                          </th>
                          <th className="text-center py-2 font-medium text-gray-500">
                            Admin
                          </th>
                          <th className="text-center py-2 font-medium text-gray-500">
                            Tester
                          </th>
                          <th className="text-center py-2 font-medium text-gray-500">
                            Automation
                          </th>
                          <th className="text-center py-2 font-medium text-gray-500">
                            Developer
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 text-gray-700">
                            Create Test Cases
                          </td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">-</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 text-gray-700">Execute Tests</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">-</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 text-gray-700">Manage Users</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">-</td>
                          <td className="py-2 text-center">-</td>
                          <td className="py-2 text-center">-</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 text-gray-700">View Reports</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">✓</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-700">Manage Scripts</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">-</td>
                          <td className="py-2 text-center">✓</td>
                          <td className="py-2 text-center">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 bg-blue-600 text-white text-center">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-4xl font-semibold tracking-tight mb-4">
              Ready to streamline your testing process?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of EDA teams who have improved their testing
              efficiency with our platform.
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/signup">
                <Button className="rounded-full bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg font-medium">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/">
                <Button
                  variant="outline"
                  className="rounded-full border-white text-white hover:bg-blue-700 px-8 py-6 text-lg font-medium"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-12 text-sm text-gray-500">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="border-b border-gray-300 pb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-medium text-base text-gray-900 mb-4">TCMS</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Case Studies
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-base text-gray-900 mb-4">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-base text-gray-900 mb-4">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-base text-gray-900 mb-4">
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Security
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="py-4 flex flex-col md:flex-row justify-between items-center">
            <p>© 2024 Test Case Management System. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="/" className="hover:text-gray-700">
                Twitter
              </Link>
              <Link to="/" className="hover:text-gray-700">
                LinkedIn
              </Link>
              <Link to="/" className="hover:text-gray-700">
                GitHub
              </Link>
              <Link to="/" className="hover:text-gray-700">
                YouTube
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
