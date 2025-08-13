import Recipe from "@/components/Recipe"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Recipe />
      <Toaster />
    </main>
  )
}
