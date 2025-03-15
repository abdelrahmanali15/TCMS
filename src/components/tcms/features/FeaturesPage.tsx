import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Feature } from "../types";
import {
  getFeatures,
  deleteFeature,
  getFeaturesByOwner
} from "../api";
import FeatureForm from "./FeatureForm";
import OwnerForm from "./OwnerForm"; // Add this import
import {
  Plus,
  Search,
  Briefcase,
  Users,
  User,
  Loader2,
  UserPlus // Add this icon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FeaturesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State variables
  const [features, setFeatures] = useState<Feature[]>([]);
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [uniqueOwners, setUniqueOwners] = useState<string[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [isOwnerFormOpen, setIsOwnerFormOpen] = useState(false); // Add new state for owner form

  // Load features
  const loadFeatures = useCallback(async () => {
    setIsLoading(true);
    try {
      const featuresData = await getFeatures();
      setFeatures(featuresData);
      setFilteredFeatures(featuresData);

      // Extract unique owners
      const owners = featuresData
        .map(feature => feature.owner_email)
        .filter((email): email is string =>
          email !== undefined && email !== null && email !== ""
        )
        .filter((email, index, self) =>
          self.indexOf(email) === index
        );

      setUniqueOwners(owners);
    } catch (error) {
      console.error("Error loading features:", error);
      toast({
        title: "Error",
        description: "Failed to load features",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  // Handle search input change
  useEffect(() => {
    if (activeTab === "all") {
      if (!searchQuery) {
        setFilteredFeatures(features);
      } else {
        const filtered = features.filter(
          (feature) =>
            feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (feature.description &&
              feature.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (feature.owner &&
              feature.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (feature.owner_email &&
              feature.owner_email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredFeatures(filtered);
      }
    }
    // Owner filter is handled in the tab change effect
  }, [searchQuery, features, activeTab]);

  // Handle tab changes
  useEffect(() => {
    if (activeTab === "all") {
      if (!searchQuery) {
        setFilteredFeatures(features);
      } else {
        const filtered = features.filter(
          (feature) =>
            feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (feature.description &&
              feature.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (feature.owner &&
              feature.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (feature.owner_email &&
              feature.owner_email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredFeatures(filtered);
      }
    } else if (activeTab === "owners" && selectedOwner) {
      const filtered = features.filter(
        (feature) => feature.owner_email === selectedOwner
      );
      setFilteredFeatures(filtered);
    }
  }, [activeTab, features, searchQuery, selectedOwner]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      setSelectedOwner(null);
    }
  };

  const handleOwnerSelect = (ownerEmail: string) => {
    setSelectedOwner(ownerEmail);
    setActiveTab("owners");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreateFeature = () => {
    setSelectedFeature(undefined);
    setIsFormOpen(true);
  };

  const handleEditFeature = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsFormOpen(true);
  };

  const handleFeatureFormSubmit = async (feature: Feature & { deleted?: boolean }) => {
    if (feature.deleted && feature.id) {
      try {
        await deleteFeature(feature.id);
        toast({
          title: "Feature Deleted",
          description: "Feature has been successfully deleted",
        });
        await loadFeatures();
      } catch (error) {
        console.error("Error deleting feature:", error);
        toast({
          title: "Error",
          description: "Failed to delete feature",
          variant: "destructive",
        });
      }
      return;
    }

    await loadFeatures();
  };

  return (
    <TCMSLayout>
      <TCMSHeader title="Features" onSearch={handleSearch} />
      <div className="container pt-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Features</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOwnerFormOpen(true)}
              className="flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" /> Manage Owners
            </Button>
            <Button onClick={handleCreateFeature}>
              <Plus className="mr-2 h-4 w-4" /> Add Feature
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger value="owners">By Owner</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Feature List</CardTitle>
                  <CardDescription>
                    Manage your features and assign owners
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFeatures.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              No features found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredFeatures.map((feature) => (
                            <TableRow key={feature.id}>
                              <TableCell className="font-medium">
                                {feature.name}
                              </TableCell>
                              <TableCell>
                                {feature.description?.length > 100
                                  ? `${feature.description.substring(0, 100)}...`
                                  : feature.description || "No description"}
                              </TableCell>
                              <TableCell>
                                {feature.owner ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex gap-1 items-center">
                                      <User size={12} />
                                      {feature.owner}
                                      {feature.owner_role && (
                                        <span className="bg-blue-100 text-blue-800 text-xs px-1 rounded ml-1">
                                          {feature.owner_role}
                                        </span>
                                      )}
                                      {feature.owner_email && (
                                        <span className="text-gray-500 text-xs ml-1">
                                          ({feature.owner_email})
                                        </span>
                                      )}
                                    </Badge>
                                  </div>
                                ) : (
                                  "Unassigned"
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditFeature(feature)}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="owners" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Features by Owner</CardTitle>
                  <div className="w-[250px]">
                    <Select
                      value={selectedOwner || ""}
                      onValueChange={(value) => setSelectedOwner(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueOwners.length === 0 ? (
                          <SelectItem value="" disabled>No owners found</SelectItem>
                        ) : (
                          uniqueOwners.map((owner) => (
                            <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardDescription>
                  View features grouped by their owners
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedOwner ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Owner Name</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFeatures.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              No features found for this owner
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredFeatures.map((feature) => (
                            <TableRow key={feature.id}>
                              <TableCell className="font-medium">
                                {feature.name}
                              </TableCell>
                              <TableCell>
                                {feature.description?.length > 100
                                  ? `${feature.description.substring(0, 100)}...`
                                  : feature.description || "No description"}
                              </TableCell>
                              <TableCell>{feature.owner || "Unassigned"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditFeature(feature)}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">
                      Select an owner to view their features
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Feature Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{features.length}</div>
              <p className="text-sm text-gray-500">Total features</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueOwners.length}</div>
              <p className="text-sm text-gray-500">Feature owners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Unassigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {features.filter(f => !f.owner && !f.owner_email).length}
              </div>
              <p className="text-sm text-gray-500">Features without owners</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Form Modal */}
      <FeatureForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFeatureFormSubmit}
        feature={selectedFeature}
        isEditing={!!selectedFeature}
      />

      {/* Owner Form Modal */}
      <OwnerForm
        isOpen={isOwnerFormOpen}
        onClose={() => setIsOwnerFormOpen(false)}
        onOwnersChange={loadFeatures}
      />
    </TCMSLayout>
  );
};

export default FeaturesPage;
