import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { supabase } from "../../../../supabase/supabase";
import { Loader2, Plus, Trash, Mail, User, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAllProfiles, createProfile, deleteProfile, Profile } from "../api";

// Available owner roles
const OWNER_ROLES = [
  "QA Analog",
  "QA Software",
  "SW",
  "R&D",
  "PM",
  "Intern",
  "Other"
];

interface OwnerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOwnersChange: () => void;
}

const OwnerForm = ({ isOpen, onClose, onOwnersChange }: OwnerFormProps) => {
  const { toast } = useToast();
  const [owners, setOwners] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newOwner, setNewOwner] = useState({
    full_name: "",
    email: "",
    role: "",
  });

  // Fetch owners from the database
  useEffect(() => {
    if (isOpen) {
      loadOwners();
    }
  }, [isOpen]);

  const loadOwners = async () => {
    setIsLoading(true);
    try {
      // Get all profiles from the profiles table
      const profiles = await getAllProfiles();
      setOwners(profiles);

      if (profiles.length === 0) {
        // If no profiles found, check if there's legacy data in features table
        const { data, error } = await supabase
          .from("features")
          .select("owner, owner_email, owner_role")
          .not("owner", "is", null)
          .not("owner_email", "is", null);

        if (error) throw error;

        // Convert legacy data to profiles
        const ownersMap = new Map();
        data.forEach((item) => {
          if (item.owner && item.owner_email) {
            ownersMap.set(item.owner_email, {
              id: item.owner_email, // Using email as ID
              email: item.owner_email,
              full_name: item.owner,
              role: item.owner_role,
            });
          }
        });

        // If we found legacy data, create profiles for them
        const legacyOwners = Array.from(ownersMap.values());
        if (legacyOwners.length > 0) {
          for (const owner of legacyOwners) {
            await createProfile({
              email: owner.email,
              full_name: owner.full_name,
              role: owner.role
            });
          }

          // Reload profiles after migration
          const updatedProfiles = await getAllProfiles();
          setOwners(updatedProfiles);
        }
      }
    } catch (error) {
      console.error("Error loading owners:", error);
      toast({
        title: "Error",
        description: "Failed to load owners",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewOwner((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: string) => {
    setNewOwner((prev) => ({ ...prev, role }));
  };

  const addOwner = async () => {
    // Validate form
    if (!newOwner.full_name.trim() || !newOwner.email.trim()) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(newOwner.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if owner already exists
      const existingOwner = owners.find(o => o.email === newOwner.email);
      if (existingOwner) {
        toast({
          title: "Error",
          description: "An owner with this email already exists",
          variant: "destructive",
        });
        return;
      }

      // Add owner to profiles table
      await createProfile({
        email: newOwner.email,
        full_name: newOwner.full_name,
        role: newOwner.role || undefined
      });

      toast({
        title: "Success",
        description: "Owner added successfully",
      });

      // Reset form and reload owners
      setNewOwner({ full_name: "", email: "", role: "" });
      await loadOwners();
      onOwnersChange();
    } catch (error) {
      console.error("Error adding owner:", error);
      toast({
        title: "Error",
        description: "Failed to add owner",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOwner = async (id: string) => {
    try {
      // Check if owner is associated with any features before deleting
      const { data: featureOwners, error: checkError } = await supabase
        .from('feature_owners')
        .select('feature_id')
        .eq('profile_id', id);

      if (checkError) throw checkError;

      if (featureOwners && featureOwners.length > 0) {
        toast({
          title: "Warning",
          description: `This owner is associated with ${featureOwners.length} feature(s). Remove these associations first.`,
          variant: "destructive",
        });
        return;
      }

      // Delete the profile
      await deleteProfile(id);

      toast({
        title: "Success",
        description: "Owner removed successfully",
      });

      // Reload owners
      await loadOwners();
      onOwnersChange();
    } catch (error) {
      console.error("Error deleting owner:", error);
      toast({
        title: "Error",
        description: "Failed to delete owner",
        variant: "destructive",
      });
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Owners</DialogTitle>
          <DialogDescription>
            Add, edit or remove owners for your features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Owner Form */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Add New Owner</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={newOwner.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter owner name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newOwner.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newOwner.role || "none"}
                  onValueChange={(value) =>
                    setNewOwner((prev) => ({
                      ...prev,
                      role: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {OWNER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button onClick={addOwner} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Owner
                </Button>
              </div>
            </div>
          </div>

          {/* Owners List */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Existing Owners</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : owners.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {owners.map((owner) => (
                      <TableRow key={owner.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            {owner.full_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            {owner.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {owner.role ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {owner.role}
                            </Badge>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteOwner(owner.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No owners found. Add one above.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OwnerForm;
