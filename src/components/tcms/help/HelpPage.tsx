import React from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  Video,
  MessageSquare,
  Book,
  ExternalLink,
} from "lucide-react";

const HelpPage = () => {
  return (
    <TCMSLayout>
      <TCMSHeader title="Help & Support" />
      <div className="p-6">
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-gray-900">
              Help Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help articles..."
                className="pl-10 h-12 text-base bg-gray-50 border-gray-200"
              />
            </div>

            <Tabs defaultValue="documentation" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="contact">Contact Support</TabsTrigger>
              </TabsList>

              <TabsContent value="documentation" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Getting Started Guide
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Learn the basics of the Test Case Management System.
                      </p>
                      <Button variant="outline" className="w-full" size="sm">
                        Read Guide
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <Book className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">User Manual</h3>
                      <p className="text-gray-500 mb-4">
                        Comprehensive documentation for all features and
                        functions.
                      </p>
                      <Button variant="outline" className="w-full" size="sm">
                        View Manual
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        API Documentation
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Learn how to integrate with our API for automation.
                      </p>
                      <Button variant="outline" className="w-full" size="sm">
                        View API Docs
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Popular Articles</h3>
                  <ul className="space-y-3">
                    <li className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <a
                        href="#"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        How to create and manage test cases
                      </a>
                    </li>
                    <li className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <a
                        href="#"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Setting up automated test execution
                      </a>
                    </li>
                    <li className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <a
                        href="#"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Understanding test reports and metrics
                      </a>
                    </li>
                    <li className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <a
                        href="#"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Managing user roles and permissions
                      </a>
                    </li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="tutorials" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Getting Started Tutorial
                      </h3>
                      <p className="text-gray-500 mb-4">
                        A complete walkthrough of the basic features.
                      </p>
                      <Button variant="outline" className="w-full" size="sm">
                        Watch Video
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Advanced Test Case Management
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Learn advanced techniques for organizing test cases.
                      </p>
                      <Button variant="outline" className="w-full" size="sm">
                        Watch Video
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Reporting and Analytics
                      </h3>
                      <p className="text-gray-500 mb-4">
                        How to use the reporting features effectively.
                      </p>
                      <Button variant="outline" className="w-full" size="sm">
                        Watch Video
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Integration with CI/CD
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Setting up integrations with your CI/CD pipeline.
                      </p>
                      <Button variant="outline" className="w-full" size="sm">
                        Watch Video
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="faq" className="space-y-6">
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <h3 className="text-lg font-medium mb-2">
                      How do I create a new test case?
                    </h3>
                    <p className="text-gray-600">
                      To create a new test case, navigate to the Test Cases
                      section from the sidebar, then click the "New Test Case"
                      button. Fill in the required fields and click "Create Test
                      Case".
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <h3 className="text-lg font-medium mb-2">
                      Can I import test cases from other systems?
                    </h3>
                    <p className="text-gray-600">
                      Yes, you can import test cases from CSV, Excel, or XML
                      formats. Go to the Test Cases section, click the dropdown
                      next to "New Test Case" and select "Import". Follow the
                      instructions to map fields and complete the import.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <h3 className="text-lg font-medium mb-2">
                      How do I run automated tests?
                    </h3>
                    <p className="text-gray-600">
                      Automated tests can be run from the Test Execution
                      section. Select the "Automated Tests" tab, choose the
                      tests you want to run, and click the "Run" button. You can
                      also schedule automated test runs or trigger them via the
                      API.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <h3 className="text-lg font-medium mb-2">
                      How do I manage user permissions?
                    </h3>
                    <p className="text-gray-600">
                      User permissions are managed by administrators. Go to the
                      Settings section, select the "Users" tab, and you can
                      assign roles to users. Each role has predefined
                      permissions that control what users can view and edit.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <h3 className="text-lg font-medium mb-2">
                      Can I export test results and reports?
                    </h3>
                    <p className="text-gray-600">
                      Yes, all reports can be exported in various formats
                      including PDF, Excel, and CSV. From the Reports section,
                      generate the report you need and click the "Export" button
                      to choose your preferred format.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white border border-gray-100">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Live Chat Support
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Chat with our support team in real-time.
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Available Monday-Friday, 9am-5pm EST
                      </p>
                      <Button className="w-full">Start Chat</Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-100">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Email Support
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Send us an email and we'll respond within 24 hours.
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        support@tcms-example.com
                      </p>
                      <Button variant="outline" className="w-full">
                        Send Email
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white border border-gray-100 mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">
                      Submit a Support Ticket
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <Input placeholder="Your name" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <Input type="email" placeholder="Your email" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <Input placeholder="Brief description of your issue" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Please provide as much detail as possible"
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select className="w-full h-10 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                          <option>Critical</option>
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <Button>Submit Ticket</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TCMSLayout>
  );
};

export default HelpPage;
