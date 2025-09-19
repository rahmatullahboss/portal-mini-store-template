import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Globe, CreditCard, Truck, Bell, Shield, Palette, Mail } from 'lucide-react'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your store's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    placeholder="Enter store name"
                    defaultValue="My E-commerce Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Store Email</Label>
                  <Input
                    id="store-email"
                    type="email"
                    placeholder="Enter store email"
                    defaultValue="info@store.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-description">Store Description</Label>
                <Textarea
                  id="store-description"
                  placeholder="Enter store description"
                  defaultValue="Welcome to our online store. We offer the best products at competitive prices."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone Number</Label>
                  <Input
                    id="store-phone"
                    placeholder="Enter phone number"
                    defaultValue="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-address">Store Address</Label>
                  <Input
                    id="store-address"
                    placeholder="Enter store address"
                    defaultValue="123 Main Street, City, Country"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable your store for maintenance
                  </p>
                </div>
                <Switch />
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateways</CardTitle>
              <CardDescription>Configure payment methods for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CreditCard className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Credit Card Payments</h3>
                      <p className="text-sm text-muted-foreground">Accept all major credit cards</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">BK</span>
                    </div>
                    <div>
                      <h3 className="font-medium">bKash</h3>
                      <p className="text-sm text-muted-foreground">
                        Mobile financial service in Bangladesh
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">N</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Nagad</h3>
                      <p className="text-sm text-muted-foreground">
                        Mobile financial service in Bangladesh
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">COD</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Cash on Delivery</h3>
                      <p className="text-sm text-muted-foreground">Pay with cash upon delivery</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Options</CardTitle>
              <CardDescription>Configure delivery methods and charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Truck className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Standard Delivery</h3>
                      <p className="text-sm text-muted-foreground">3-5 business days</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input className="w-24" defaultValue="৳50" />
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Truck className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-medium">Express Delivery</h3>
                      <p className="text-sm text-muted-foreground">1-2 business days</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input className="w-24" defaultValue="৳100" />
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Truck className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="font-medium">Same Day Delivery</h3>
                      <p className="text-sm text-muted-foreground">Within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input className="w-24" defaultValue="৳150" />
                    <Switch />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-zones">Delivery Zones</Label>
                <Textarea
                  id="delivery-zones"
                  placeholder="Enter delivery zones and restrictions"
                  defaultValue="Zone 1: Downtown - Free delivery&#10;Zone 2: Suburbs - ৳50 delivery charge&#10;Zone 3: Outskirts - ৳100 delivery charge"
                  className="min-h-[120px]"
                />
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Delivery Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive SMS notifications for critical alerts
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Order Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me when new orders are placed
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Inventory Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me when products are low in stock
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-email">Notification Email</Label>
                <Input
                  id="notification-email"
                  type="email"
                  placeholder="Enter notification email"
                  defaultValue="notifications@store.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-phone">Notification Phone</Label>
                <Input
                  id="notification-phone"
                  placeholder="Enter notification phone"
                  defaultValue="+1 (555) 123-4567"
                />
              </div>
              <Button>
                <Bell className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your store's security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me when someone logs into my account
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after inactivity
                    </p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="Enter current password" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                </div>
              </div>
              <Button>
                <Shield className="mr-2 h-4 w-4" />
                Update Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable dark theme for the admin panel
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer border-2 border-white ring-2 ring-blue-500"></div>
                    <div className="w-8 h-8 rounded-full bg-green-500 cursor-pointer border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-purple-500 cursor-pointer border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-red-500 cursor-pointer border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-yellow-500 cursor-pointer border-2 border-white"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center space-x-4">
                    <div className="border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Button variant="outline">Upload Logo</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex items-center space-x-4">
                    <div className="border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button variant="outline">Upload Favicon</Button>
                  </div>
                </div>
              </div>
              <Button>
                <Palette className="mr-2 h-4 w-4" />
                Save Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
