import { redirect } from 'next/navigation'

// Redirect the root path to the products page
export default function HomePage() {
  redirect('/products')
}
