import React, { useState, useEffect } from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Bug, Link as LinkIcon } from "lucide-react";
import { Bug as BugType, BugSeverity, BugStatus } from "../types";
import { createBug, getBugs } from "../api";
import BugForm from "./BugForm";
import { useToast } from "@/components/ui/use-toast";

const BugsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bugs, setBugs] = useState<BugType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: "all",
    status: "all",
    assignee: "all",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugType | null>(null);
  const { toast } = useToast();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Mock bugs data
  const mockBugs: BugType[] = [
    {
      id: "1",
      title: "CPU frequency doesn't scale under high load",
      description:
        "When running high workload tests, the CPU frequency remains at base clock instead of boosting.",
      severity: "high",
      status: "open",
      reported_by: "user1",
      assigned_to: "user2",
      created_at: "2024-07-15T10:30:00Z",
      updated_at: "2024-07-15T10:30:00Z",
    },
    {
      id: "2",
      title: "Memory controller bandwidth drops after 10 minutes of operation",
      description:
        "Bandwidth tests show a 30% drop in throughput after 10 minutes of continuous operation.",
      severity: "critical",
      status: "in_progress",
      reported_by: "user3",
      assigned_to: "user4",
      created_at: "2024-07-14T14:45:00Z",
      updated_at: "2024-07-16T09:20:00Z",
    },
    {
      id: "3",
      title: "PCIe link training fails at Gen5 speeds",
      description:
        "Link training consistently fails at Gen5 speeds, but works at Gen4.",
      severity: "high",
      status: "fixed",
      reported_by: "user2",
      assigned_to: "user5",
      created_at: "2024-07-13T11:15:00Z",
      updated_at: "2024-07-16T15:30:00Z",
    },
    {
      id: "4",
      title: "Power state transition causes system hang",
      description:
        "Transitioning from S3 to S0 state occasionally causes a system hang requiring hard reset.",
      severity: "critical",
      status: "verified",
      reported_by: "user1",
      assigned_to: "user4",
      created_at: "2024-07-12T09:30:00Z",
      updated_at: "2024-07-17T10:45:00Z",
    },
    {
      id: "5",
      title: "Thermal throttling activates at incorrect temperature threshold",
      description:
        "Thermal throttling activates at 75°C instead of the specified 85°C threshold.",
      severity: "medium",
      status: "reopened",
      reported_by: "user3",
      assigned_to: "user2",
      created_at: "2024-07-10T16:20:00Z",
      updated_at: "2024-07-16T13:10:00Z",
    },
  ];

  // Load bugs on component mount
  useEffect(() => {
    const loadBugs = async () => {
      try {
        setLoading(true);
        const data = await getBugs();
        setBugs(data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading bugs:", error);
        setLoading(false);
        // Fallback to mock data if API fails
        setBugs(mockBugs);
      }
    };

    loadBugs();
  }, []);

  // Filter bugs based on search query and filters
  const filteredBugs = bugs.filter((bug) => {
    // Search filter
    const matchesSearch =
      bug.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Severity filter
    const matchesSeverity =
      filters.severity === "all" || bug.severity === filters.severity;

    // Status filter
    const matchesStatus =
      filters.status === "all" || bug.status === filters.status;

    // Assignee filter
    const matchesAssignee =
      filters.assignee === "all" || bug.assigned_to === filters.assignee;

    return matchesSearch && matchesSeverity && matchesStatus && matchesAssignee;
  });

  const getSeverityBadge = (severity: BugSeverity) => {
    switch (severity) {
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            Critical
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: BugStatus) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            In Progress
          </Badge>
        );
      case "fixed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Fixed
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">
            Verified
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            Closed
          </Badge>
        );
      case "reopened":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            Reopened
          </Badge>
        );
      default:
        return null;
    }
  };

  // Mock user data for assignees
  const users = [
    {
      id: "user1",
      name: "Alice Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    },
    {
      id: "user2",
      name: "Bob Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    },
    {
      id: "user3",
      name: "Carol Williams",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    },
    {
      id: "user4",
      name: "David Miller",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
    {
      id: "user5",
      name: "Eve Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve",
    },
  ];

  const getUserById = (userId: string) => {
    return (
      users.find((user) => user.id === userId) || {
        id: userId,
        name: "Unknown User",
        avatar: "",
      }
    );
  };

  if (loading) {
    return (
      <TCMSLayout>
        <TCMSHeader title="Bugs" onSearch={handleSearch} />
        <div className="p-6">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-900">
                Bugs
              </CardTitle>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors">
                <Plus className="mr-2 h-4 w-4" />
                Report Bug
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search bugs..."
                    className="pl-9 h-10 bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="flex gap-2">
                  <Select disabled>
                    <SelectTrigger className="w-[130px] h-10">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select disabled>
                    <SelectTrigger className="w-[130px] h-10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select disabled>
                    <SelectTrigger className="w-[130px] h-10">
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-100 rounded-lg animate-pulse"
                  >
                    <div className="flex justify-between mb-2">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TCMSLayout>
    );
  }

  return (
    <TCMSLayout>
      <TCMSHeader title="Bugs" onSearch={handleSearch} />
      <div className="p-6">
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium text-gray-900">
              Bugs
            </CardTitle>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Report Bug
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bugs..."
                  className="pl-9 h-10 bg-gray-50 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.severity}
                  onValueChange={(value) =>
                    setFilters({ ...filters, severity: value })
                  }
                >
                  <SelectTrigger className="w-[130px] h-10">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger className="w-[130px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="reopened">Reopened</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.assignee}
                  onValueChange={(value) =>
                    setFilters({ ...filters, assignee: value })
                  }
                >
                  <SelectTrigger className="w-[130px] h-10">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredBugs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No bugs found. Adjust your filters or report a new bug.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBugs.map((bug) => {
                  const assignee = getUserById(bug.assigned_to || "");
                  return (
                    <div
                      key={bug.id}
                      className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedBug(bug);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bug className="h-5 w-5 text-gray-400" />
                          <h3 className="font-medium text-gray-900">
                            {bug.title}
                          </h3>
                        </div>
                        <div className="flex space-x-2">
                          {getSeverityBadge(bug.severity)}
                          {getStatusBadge(bug.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {bug.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs font-normal text-gray-500"
                          >
                            Reported{" "}
                            {new Date(bug.created_at).toLocaleDateString()}
                          </Badge>
                          {bug.test_execution_id && (
                            <div className="flex items-center text-xs text-blue-600">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              Linked to test case
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Assigned to:
                          </span>
                          <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                            <AvatarImage
                              src={assignee.avatar}
                              alt={assignee.name}
                            />
                            <AvatarFallback className="bg-blue-100 text-blue-800 font-medium text-xs">
                              {assignee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Bug Dialog */}
      <BugForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={async (newBug) => {
          try {
            await createBug(newBug);
            toast({
              title: "Success",
              description: "Bug reported successfully",
            });
            setIsCreateDialogOpen(false);

            // Refresh the bugs list
            const updatedBugs = await getBugs();
            setBugs(updatedBugs);
          } catch (error) {
            console.error("Error creating bug:", error);
            toast({
              title: "Error",
              description: "Failed to report bug",
              variant: "destructive",
            });
          }
        }}
      />

      {/* View/Edit Bug Dialog */}
      {selectedBug && (
        <BugForm
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          onSubmit={(updatedBug) => {
            console.log("Updating bug:", { ...selectedBug, ...updatedBug });
            toast({
              title: "Success",
              description: "Bug updated successfully",
            });
            setIsViewDialogOpen(false);
          }}
          bug={selectedBug}
          isEditing={true}
        />
      )}
    </TCMSLayout>
  );
};

export default BugsPage;
