import React, { useState } from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import ProjectsList from "./ProjectsList";
import { Project } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const ProjectsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });

  const { toast } = useToast();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    // Navigate to project details or expand project
    console.log("Selected project:", project);
  };

  const handleCreateProject = () => {
    setProjectForm({ name: "", description: "" });
    setIsCreateDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    // Validate form
    if (!projectForm.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    // Create project logic here
    console.log("Creating project:", projectForm);

    toast({
      title: "Success",
      description: "Project created successfully",
    });

    setIsCreateDialogOpen(false);
  };

  const handleEditSubmit = async () => {
    // Validate form
    if (!projectForm.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    // Update project logic here
    console.log("Updating project:", {
      id: selectedProject?.id,
      ...projectForm,
    });

    toast({
      title: "Success",
      description: "Project updated successfully",
    });

    setIsEditDialogOpen(false);
  };

  const handleDeleteSubmit = async () => {
    // Delete project logic here
    console.log("Deleting project:", selectedProject?.id);

    toast({
      title: "Success",
      description: "Project deleted successfully",
    });

    setIsDeleteDialogOpen(false);
  };

  return (
    <TCMSLayout>
      <TCMSHeader title="Projects" onSearch={handleSearch} />
      <div className="p-6">
        <ProjectsList
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
        />
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your test cases and test runs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                placeholder="Enter project description"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                placeholder="Enter project description"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Update Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-gray-900">
              {selectedProject?.name}
            </p>
            <p className="text-sm text-gray-500">
              {selectedProject?.description}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TCMSLayout>
  );
};

export default ProjectsPage;
