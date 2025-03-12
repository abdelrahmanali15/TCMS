import React, { useState } from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../../supabase/auth";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({
    fullName: "John Doe",
    email: user?.email || "",
    jobTitle: "Test Engineer",
    department: "Quality Assurance",
    bio: "Experienced test engineer with a focus on automation and efficiency.",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    testRunCompleted: true,
    bugAssigned: true,
    testCaseUpdated: false,
    weeklyReports: true,
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [apiKeyForm, setApiKeyForm] = useState({
    apiKey: "sk_test_51HG7....",
    description: "Integration with Jenkins",
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Password Updated",
      description: "Your password has been successfully updated.",
    });
    setSecurityForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleGenerateApiKey = () => {
    setApiKeyForm({
      ...apiKeyForm,
      apiKey: `sk_test_${Math.random().toString(36).substring(2, 15)}`,
    });
    toast({
      title: "API Key Generated",
      description: "A new API key has been generated.",
    });
  };

  return (
    <TCMSLayout>
      <TCMSHeader title="Settings" />
      <div className="p-6">
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-gray-900">
              User Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="profile"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="api">API Access</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileForm.fullName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={profileForm.jobTitle}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            jobTitle: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={profileForm.department}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            department: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            bio: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-gray-500">
                        Receive email notifications for important events
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-base font-medium mb-4">
                      Notification Preferences
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="testRunCompleted"
                          className="cursor-pointer"
                        >
                          Test Run Completed
                        </Label>
                        <Switch
                          id="testRunCompleted"
                          checked={notificationSettings.testRunCompleted}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              testRunCompleted: checked,
                            })
                          }
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bugAssigned" className="cursor-pointer">
                          Bug Assigned to You
                        </Label>
                        <Switch
                          id="bugAssigned"
                          checked={notificationSettings.bugAssigned}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              bugAssigned: checked,
                            })
                          }
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="testCaseUpdated"
                          className="cursor-pointer"
                        >
                          Test Case Updated
                        </Label>
                        <Switch
                          id="testCaseUpdated"
                          checked={notificationSettings.testCaseUpdated}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              testCaseUpdated: checked,
                            })
                          }
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="weeklyReports"
                          className="cursor-pointer"
                        >
                          Weekly Reports
                        </Label>
                        <Switch
                          id="weeklyReports"
                          checked={notificationSettings.weeklyReports}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              weeklyReports: checked,
                            })
                          }
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() =>
                        toast({
                          title: "Notification Settings Saved",
                          description:
                            "Your notification preferences have been updated.",
                        })
                      }
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={securityForm.currentPassword}
                        onChange={(e) =>
                          setSecurityForm({
                            ...securityForm,
                            currentPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={securityForm.newPassword}
                        onChange={(e) =>
                          setSecurityForm({
                            ...securityForm,
                            newPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={securityForm.confirmPassword}
                        onChange={(e) =>
                          setSecurityForm({
                            ...securityForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button type="submit">Change Password</Button>
                  </div>
                </form>

                <div className="border-t border-gray-100 pt-6 mt-6">
                  <h3 className="text-base font-medium mb-4">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add an extra layer of security to your account by enabling
                    two-factor authentication.
                  </p>
                  <Button variant="outline">
                    Enable Two-Factor Authentication
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="api" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium mb-2">API Key</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Use this API key to authenticate API requests from your
                      CI/CD pipelines or automation scripts.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={apiKeyForm.apiKey}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(apiKeyForm.apiKey);
                          toast({
                            title: "Copied",
                            description: "API key copied to clipboard",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keyDescription">Key Description</Label>
                    <Input
                      id="keyDescription"
                      value={apiKeyForm.description}
                      onChange={(e) =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast({
                          title: "API Key Revoked",
                          description: "Your API key has been revoked.",
                          variant: "destructive",
                        })
                      }
                    >
                      Revoke Key
                    </Button>
                    <Button onClick={handleGenerateApiKey}>
                      Generate New Key
                    </Button>
                  </div>

                  <div className="border-t border-gray-100 pt-6 mt-6">
                    <h3 className="text-base font-medium mb-2">
                      API Documentation
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      View the API documentation to learn how to integrate with
                      our system.
                    </p>
                    <Button variant="outline">View API Documentation</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TCMSLayout>
  );
};

export default SettingsPage;
