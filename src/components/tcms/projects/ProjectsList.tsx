import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FolderOpen, Edit, Trash2 } from "lucide-react";
import { Project } from "../types";
import { getProjects } from "../api";

interface ProjectsListProps {
  onSelectProject?: (project: Project) => void;
  onCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
}

const ProjectsList = ({
  onSelectProject = () => {},
  onCreateProject = () => {},
  onEditProject = () => {},
  onDeleteProject = () => {},
}: ProjectsListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for initial development
  const mockProjects: Project[] = [
    {
      id: "1",
      name: "CPU Design Verification",
      description: "Verification suite for the new CPU architecture",
      created_at: "2024-06-15T10:30:00Z",
      updated_at: "2024-07-10T14:45:00Z",
      created_by: "user1",
    },
    {
      id: "2",
      name: "Memory Controller",
      description: "Test cases for DDR5 memory controller",
      created_at: "2024-05-20T09:15:00Z",
      updated_at: "2024-07-12T11:30:00Z",
      created_by: "user2",
    },
    {
      id: "3",
      name: "PCIe Interface",
      description: "Verification of PCIe Gen5 interface",
      created_at: "2024-06-01T08:45:00Z",
      updated_at: "2024-07-08T16:20:00Z",
      created_by: "user1",
    },
    {
      id: "4",
      name: "Power Management Unit",
      description: "Tests for low power modes and power transitions",
      created_at: "2024-06-10T13:20:00Z",
      updated_at: "2024-07-05T10:15:00Z",
      created_by: "user3",
    },
  ];

  // Load projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        // Uncomment when API is ready
        // const data = await getProjects();
        // setProjects(data);

        // Using mock data for now
        setTimeout(() => {
          setProjects(mockProjects);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error loading projects:", error);
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Filter projects based on search query
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-gray-900">
            Projects
          </CardTitle>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              className="pl-9 h-10 bg-gray-50 border-gray-200"
            />
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="p-4 border border-gray-100 rounded-lg animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-medium text-gray-900">
          Projects
        </CardTitle>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors"
          onClick={onCreateProject}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            className="pl-9 h-10 bg-gray-50 border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No projects found. Create a new project to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => onSelectProject(project)}
              >
                <h3 className="font-medium text-gray-900 mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {project.description}
                </p>
                <div className="flex justify-between items-center">
                  <Badge
                    variant="outline"
                    className="text-xs font-normal text-gray-500"
                  >
                    Updated {new Date(project.updated_at).toLocaleDateString()}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProject(project);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsList;
