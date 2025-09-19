import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Edit,
  Trash2,
  Eye,
  Star,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ReviewStars } from '@/components/review-stars'

// Mock data for reviews
const reviews = [
  {
    id: 1,
    product: 'Wireless Headphones',
    customer: 'John Doe',
    rating: 5,
    comment: 'Excellent sound quality and comfortable to wear for long periods.',
    date: '2023-06-15',
    status: 'Approved',
  },
  {
    id: 2,
    product: 'Running Shoes',
    customer: 'Jane Smith',
    rating: 4,
    comment: 'Good shoes but the sizing runs a bit small.',
    date: '2023-06-14',
    status: 'Pending',
  },
  {
    id: 3,
    product: 'Smart Watch',
    customer: 'Robert Johnson',
    rating: 3,
    comment: 'Decent features but battery life could be better.',
    date: '2023-06-14',
    status: 'Approved',
  },
  {
    id: 4,
    product: 'Backpack',
    customer: 'Emily Davis',
    rating: 5,
    comment: 'Perfect size and very durable material. Highly recommend!',
    date: '2023-06-13',
    status: 'Approved',
  },
  {
    id: 5,
    product: 'Water Bottle',
    customer: 'Michael Wilson',
    rating: 2,
    comment: 'Leaked after a week of use. Disappointed with the quality.',
    date: '2023-06-12',
    status: 'Rejected',
  },
]

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Management</h1>
          <p className="text-muted-foreground">Manage all product reviews in your store</p>
        </div>
        <Button className="mt-4 md:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          Add New Review
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">987</div>
            <p className="text-xs text-muted-foreground">Visible to customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Reviews</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search reviews..." className="pl-8 md:w-[300px]" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Filter by Status <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>All Statuses</DropdownMenuItem>
                  <DropdownMenuItem>Approved</DropdownMenuItem>
                  <DropdownMenuItem>Pending</DropdownMenuItem>
                  <DropdownMenuItem>Rejected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription>Manage and moderate all product reviews in your store</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.product}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {review.customer}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ReviewStars value={review.rating} />
                      <span className="ml-2">{review.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                  <TableCell>{review.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        review.status === 'Approved'
                          ? 'default'
                          : review.status === 'Pending'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Review
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
