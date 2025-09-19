import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  Image as ImageIcon,
  File as FileIcon,
  Video,
  Music,
  Archive,
  Filter,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Mock data for media items
const mediaItems = [
  {
    id: 1,
    name: 'product-image-1.jpg',
    type: 'image',
    size: '2.4 MB',
    dimensions: '1920x1080',
    date: '2023-06-15',
  },
  {
    id: 2,
    name: 'product-video.mp4',
    type: 'video',
    size: '15.7 MB',
    dimensions: '1920x1080',
    date: '2023-06-14',
  },
  {
    id: 3,
    name: 'banner-image.png',
    type: 'image',
    size: '1.8 MB',
    dimensions: '1200x400',
    date: '2023-06-12',
  },
  {
    id: 4,
    name: 'document.pdf',
    type: 'document',
    size: '3.2 MB',
    dimensions: '-',
    date: '2023-06-10',
  },
  {
    id: 5,
    name: 'audio-track.mp3',
    type: 'audio',
    size: '4.1 MB',
    dimensions: '-',
    date: '2023-06-08',
  },
  {
    id: 6,
    name: 'archive.zip',
    type: 'archive',
    size: '8.5 MB',
    dimensions: '-',
    date: '2023-06-05',
  },
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <ImageIcon className="h-8 w-8 text-blue-500" />
    case 'video':
      return <Video className="h-8 w-8 text-red-500" />
    case 'audio':
      return <Music className="h-8 w-8 text-green-500" />
    case 'archive':
      return <Archive className="h-8 w-8 text-yellow-500" />
    default:
      return <FileIcon className="h-8 w-8 text-gray-500" />
  }
}

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage all media files in your store</p>
        </div>
        <Button className="mt-4 md:mt-0">
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">876</div>
            <p className="text-xs text-muted-foreground">JPG, PNG, GIF files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">MP4, AVI, MOV files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 GB</div>
            <p className="text-xs text-muted-foreground">Of 5 GB allocated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Media Files</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search media..." className="pl-8 md:w-[300px]" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>All Types</DropdownMenuItem>
                  <DropdownMenuItem>Images</DropdownMenuItem>
                  <DropdownMenuItem>Videos</DropdownMenuItem>
                  <DropdownMenuItem>Documents</DropdownMenuItem>
                  <DropdownMenuItem>Audio</DropdownMenuItem>
                  <DropdownMenuItem>Archives</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription>Browse and manage all media files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4 bg-muted flex items-center justify-center">
                  {getTypeIcon(item.type)}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.type}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.size}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
