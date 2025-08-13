"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Heart, Search, Plus, Edit, Trash2, ChefHat, Clock, Users, Star, Filter, Moon, Sun } from "lucide-react"

interface Recipe {
  id: number
  name: string
  ingredients: string[]
  instructions: string[]
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  difficulty: string
  cuisine: string
  caloriesPerServing: number
  tags: string[]
  userId: number
  image: string
  rating: number
  reviewCount: number
  mealType: string[]
}

interface RecipeForm {
  name: string
  ingredients: string
  instructions: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  difficulty: string
  cuisine: string
  caloriesPerServing: number
  tags: string
  mealType: string
  image: string
}

const ITEMS_PER_PAGE = 12

const FormFields = ({
  formData,
  updateFormField,
  isEdit = false,
}: {
  formData: RecipeForm
  updateFormField: (field: keyof RecipeForm, value: string | number) => void
  isEdit?: boolean
}) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="name">Recipe Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormField("name", e.target.value)}
          placeholder="Enter recipe name"
        />
      </div>
      <div>
        <Label htmlFor="cuisine">Cuisine</Label>
        <Input
          id="cuisine"
          value={formData.cuisine}
          onChange={(e) => updateFormField("cuisine", e.target.value)}
          placeholder="e.g., Italian, Mexican"
        />
      </div>
    </div>

    <div>
      <Label htmlFor="ingredients">Ingredients (comma-separated) *</Label>
      <Textarea
        id="ingredients"
        value={formData.ingredients}
        onChange={(e) => updateFormField("ingredients", e.target.value)}
        placeholder="Salt, Pepper, Chicken breast..."
        rows={3}
      />
    </div>

    <div>
      <Label htmlFor="instructions">Instructions (one per line) *</Label>
      <Textarea
        id="instructions"
        value={formData.instructions}
        onChange={(e) => updateFormField("instructions", e.target.value)}
        placeholder="Preheat oven to 350°F\nSeason the chicken..."
        rows={4}
      />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div>
        <Label htmlFor="prepTime">Prep Time (min)</Label>
        <Input
          id="prepTime"
          type="number"
          min="0"
          value={formData.prepTimeMinutes || ""}
          onChange={(e) => updateFormField("prepTimeMinutes", Number.parseInt(e.target.value) || 0)}
        />
      </div>
      <div>
        <Label htmlFor="cookTime">Cook Time (min)</Label>
        <Input
          id="cookTime"
          type="number"
          min="0"
          value={formData.cookTimeMinutes || ""}
          onChange={(e) => updateFormField("cookTimeMinutes", Number.parseInt(e.target.value) || 0)}
        />
      </div>
      <div>
        <Label htmlFor="servings">Servings</Label>
        <Input
          id="servings"
          type="number"
          min="1"
          value={formData.servings || ""}
          onChange={(e) => updateFormField("servings", Number.parseInt(e.target.value) || 1)}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="calories">Calories per Serving</Label>
        <Input
          id="calories"
          type="number"
          min="0"
          value={formData.caloriesPerServing || ""}
          onChange={(e) => updateFormField("caloriesPerServing", Number.parseInt(e.target.value) || 0)}
        />
      </div>
      <div>
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select value={formData.difficulty} onValueChange={(value) => updateFormField("difficulty", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div>
      <Label htmlFor="tags">Tags (comma-separated)</Label>
      <Input
        id="tags"
        value={formData.tags}
        onChange={(e) => updateFormField("tags", e.target.value)}
        placeholder="healthy, quick, vegetarian..."
      />
    </div>

    <div>
      <Label htmlFor="mealType">Meal Types (comma-separated)</Label>
      <Input
        id="mealType"
        value={formData.mealType}
        onChange={(e) => updateFormField("mealType", e.target.value)}
        placeholder="breakfast, lunch, dinner..."
      />
    </div>

    <div>
      <Label htmlFor="image">Image URL</Label>
      <Input
        id="image"
        value={formData.image}
        onChange={(e) => updateFormField("image", e.target.value)}
        placeholder="https://example.com/image.jpg"
      />
    </div>
  </div>
)

export default function Recipe() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [selectedMeal, setSelectedMeal] = useState("")
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState<number[]>([])
  const [sortBy, setSortBy] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { toast } = useToast()

  const initialForm: RecipeForm = {
    name: "",
    ingredients: "",
    instructions: "",
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    servings: 1,
    difficulty: "Easy",
    cuisine: "",
    caloriesPerServing: 0,
    tags: "",
    mealType: "",
    image: "",
  }
  const [formData, setFormData] = useState<RecipeForm>(initialForm)

  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedRecipes")
    if (saved) setBookmarkedRecipes(JSON.parse(saved))

    const savedTheme = localStorage.getItem("darkMode")
    if (savedTheme) {
      setIsDarkMode(JSON.parse(savedTheme))
      document.documentElement.classList.toggle("dark", JSON.parse(savedTheme))
    }
  }, [])

  const toggleBookmark = (recipeId: number) => {
    const newBookmarks = bookmarkedRecipes.includes(recipeId)
      ? bookmarkedRecipes.filter((id) => id !== recipeId)
      : [...bookmarkedRecipes, recipeId]
    setBookmarkedRecipes(newBookmarks)
    localStorage.setItem("bookmarkedRecipes", JSON.stringify(newBookmarks))
    toast({
      title: bookmarkedRecipes.includes(recipeId) ? "Removed from bookmarks" : "Added to bookmarks",
      duration: 2000,
    })
  }

  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    try {
      let url = "https://dummyjson.com/recipes"
      const params = new URLSearchParams()

      if (searchQuery.trim()) {
        url = "https://dummyjson.com/recipes/search"
        params.append("q", searchQuery.trim())
      } else if (selectedTag && selectedTag !== "all") {
        url = `https://dummyjson.com/recipes/tag/${encodeURIComponent(selectedTag)}`
      } else if (selectedMeal && selectedMeal !== "all") {
        url = `https://dummyjson.com/recipes/meal-type/${encodeURIComponent(selectedMeal)}`
      }

      if (!selectedTag && !selectedMeal) {
        params.append("limit", ITEMS_PER_PAGE.toString())
        params.append("skip", (currentPage * ITEMS_PER_PAGE).toString())
      }

      if (sortBy && sortBy !== "default") {
        params.append("sortBy", sortBy)
        params.append("order", "asc")
      }

      const response = await fetch(params.toString() ? `${url}?${params}` : url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      const fetchedRecipes = Array.isArray(data) ? data : data.recipes || []
      const total = Array.isArray(data) ? data.length : data.total || fetchedRecipes.length

      setRecipes(fetchedRecipes)
      setTotalRecipes(total)
    } catch (error) {
      console.error("Error fetching recipes:", error)
      toast({ title: "Error fetching recipes", description: "Please try again later", variant: "destructive" })
      setRecipes([])
      setTotalRecipes(0)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedTag, selectedMeal, currentPage, sortBy, toast])

  const fetchTags = async () => {
    try {
      const response = await fetch("https://dummyjson.com/recipes/tags")
      if (response.ok) {
        const tags = await response.json()
        setAvailableTags(Array.isArray(tags) ? tags : [])
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0)
      fetchRecipes()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedTag, selectedMeal, sortBy])

  useEffect(() => {
    fetchRecipes()
  }, [currentPage])
  useEffect(() => {
    fetchTags()
  }, [])

  const fetchRecipeDetails = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`https://dummyjson.com/recipes/${id}`)
      if (!response.ok) throw new Error(`Recipe not found: ${response.status}`)
      const recipe = await response.json()
      setSelectedRecipe(recipe)
      setIsDetailOpen(true)
    } catch (error) {
      console.error("Error fetching recipe details:", error)
      toast({
        title: "Error fetching recipe details",
        description: "Recipe could not be loaded",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processFormData = (data: RecipeForm) => ({
    ...data,
    ingredients: data.ingredients
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean),
    instructions: data.instructions
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean),
    tags: data.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    mealType: data.mealType
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  })

  const addRecipe = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Recipe name is required", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("https://dummyjson.com/recipes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processFormData(formData)),
      })

      if (response.ok) {
        const newRecipe = await response.json()
        toast({ title: "Recipe added successfully!", description: `${newRecipe.name} has been created.` })
        setIsAddOpen(false)
        setFormData(initialForm)
        setRecipes((prev) => [newRecipe, ...prev])
      } else {
        throw new Error("Failed to add recipe")
      }
    } catch (error) {
      console.error("Error adding recipe:", error)
      toast({ title: "Error adding recipe", description: "Please try again later", variant: "destructive" })
    }
  }

  const updateRecipe = async () => {
    if (!selectedRecipe) return

    try {
      const response = await fetch(`https://dummyjson.com/recipes/${selectedRecipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processFormData(formData)),
      })

      if (response.ok) {
        const updatedRecipe = await response.json()
        toast({ title: "Recipe updated successfully!", description: `${updatedRecipe.name} has been updated.` })
        setIsEditOpen(false)
        setIsDetailOpen(false)
        setFormData(initialForm)
        setRecipes((prev) => prev.map((r) => (r.id === selectedRecipe.id ? updatedRecipe : r)))
      } else {
        throw new Error("Failed to update recipe")
      }
    } catch (error) {
      console.error("Error updating recipe:", error)
      toast({ title: "Error updating recipe", description: "Please try again later", variant: "destructive" })
    }
  }

  const deleteRecipe = async (id: number) => {
    try {
      const response = await fetch(`https://dummyjson.com/recipes/${id}`, { method: "DELETE" })

      if (response.ok) {
        toast({ title: "Recipe deleted successfully!", description: "The recipe has been removed." })
        setIsDetailOpen(false)
        setRecipes((prev) => prev.filter((r) => r.id !== id))
        setTotalRecipes((prev) => prev - 1)
      } else {
        throw new Error("Failed to delete recipe")
      }
    } catch (error) {
      console.error("Error deleting recipe:", error)
      toast({ title: "Error deleting recipe", description: "Please try again later", variant: "destructive" })
    }
  }

  const openEditDialog = (recipe: Recipe) => {
    setFormData({
      name: recipe.name,
      ingredients: recipe.ingredients.join(", "),
      instructions: recipe.instructions.join("\n"),
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      caloriesPerServing: recipe.caloriesPerServing,
      tags: recipe.tags.join(", "),
      mealType: recipe.mealType?.join(", ") || "",
      image: recipe.image,
    })
    setIsDetailOpen(false)
    setIsEditOpen(true)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTag("")
    setSelectedMeal("")
    setSortBy("")
    setCurrentPage(0)
  }

  const updateFormField = useCallback((field: keyof RecipeForm, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const getCalorieColor = (calories: number) => {
    if (calories <= 300) return "text-green-600 bg-green-50 border-green-200"
    if (calories <= 600) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode))
    document.documentElement.classList.toggle("dark", newDarkMode)
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${isDarkMode ? "dark" : ""}`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Recipe Manager
              </h1>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDarkMode}
                className="ml-4 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Discover, create, and manage your favorite recipes
          </p>
          {/* <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-3 py-1 mb-1">
                {totalRecipes}
              </Badge>
              <span className="block text-sm text-gray-600 dark:text-gray-400">Total Recipes</span>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-3 py-1 mb-1">
                {availableTags.length}
              </Badge>
              <span className="block text-sm text-gray-600 dark:text-gray-400">Available Tags</span>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-3 py-1 mb-1">
                {bookmarkedRecipes.length}
              </Badge>
              <span className="block text-sm text-gray-600 dark:text-gray-400">Bookmarked</span>
            </div>
          </div> */}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search recipes by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by meal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All meals</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="caloriesPerServing">Calories</SelectItem>
                  <SelectItem value="prepTimeMinutes">Prep Time</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>

              {searchQuery || selectedTag || selectedMeal || sortBy ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              ) : null}

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    onClick={() => {
                      setFormData({ ...initialForm })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipe
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Recipe</DialogTitle>
                    <DialogDescription>Create a new recipe to share with others</DialogDescription>
                  </DialogHeader>
                  <FormFields formData={formData} updateFormField={updateFormField} />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addRecipe} disabled={!formData.name.trim()}>
                      Add Recipe
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {searchQuery || selectedTag || selectedMeal || sortBy ? (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {searchQuery && <Badge variant="secondary">Search: {searchQuery}</Badge>}
              {selectedTag && selectedTag !== "all" && <Badge variant="secondary">Tag: {selectedTag}</Badge>}
              {selectedMeal && selectedMeal !== "all" && <Badge variant="secondary">Meal: {selectedMeal}</Badge>}
              {sortBy && sortBy !== "default" && <Badge variant="secondary">Sort: {sortBy}</Badge>}
            </div>
          ) : null}
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No recipes found</h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              {searchQuery || selectedTag || selectedMeal || sortBy
                ? "Try adjusting your filters"
                : "No recipes available"}
            </p>
            {searchQuery || selectedTag || selectedMeal || sortBy ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="relative">
                  <img
                    src={recipe.image || "/placeholder.svg?height=200&width=300&query=delicious food"}
                    alt={recipe.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onClick={() => fetchRecipeDetails(recipe.id)}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBookmark(recipe.id)
                    }}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        bookmarkedRecipes.includes(recipe.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                      }`}
                    />
                  </Button>
                  <div
                    className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-medium border ${getCalorieColor(recipe.caloriesPerServing)}`}
                  >
                    {recipe.caloriesPerServing} cal
                  </div>
                </div>

                <CardHeader className="pb-2" onClick={() => fetchRecipeDetails(recipe.id)}>
                  <CardTitle className="text-lg line-clamp-1">{recipe.name}</CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>
                      {recipe.cuisine} • {recipe.difficulty}
                    </span>
                    {recipe.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {recipe.rating.toFixed(1)}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0" onClick={() => fetchRecipeDetails(recipe.id)}>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {recipe.prepTimeMinutes + recipe.cookTimeMinutes}m
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recipe.servings}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{recipe.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(totalRecipes / ITEMS_PER_PAGE) > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalRecipes / ITEMS_PER_PAGE)) }, (_, i) => {
                  const pageNum = currentPage < 3 ? i : currentPage - 2 + i
                  if (pageNum >= Math.ceil(totalRecipes / ITEMS_PER_PAGE)) return null
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum + 1}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalRecipes / ITEMS_PER_PAGE) - 1, currentPage + 1))}
                disabled={currentPage === Math.ceil(totalRecipes / ITEMS_PER_PAGE) - 1}
              >
                Next
              </Button>
            </div>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalRecipes)} of{" "}
              {totalRecipes} recipes
            </span>
          </div>
        )}

        {/* Recipe Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedRecipe && (
              <>
                <DialogHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <DialogTitle className="text-2xl">{selectedRecipe.name}</DialogTitle>
                      <DialogDescription className="flex items-center gap-4">
                        <span>
                          {selectedRecipe.cuisine} • {selectedRecipe.difficulty}
                        </span>
                        {selectedRecipe.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {selectedRecipe.rating.toFixed(1)} ({selectedRecipe.reviewCount} reviews)
                          </span>
                        )}
                      </DialogDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(selectedRecipe)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => deleteRecipe(selectedRecipe.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <img
                      src={selectedRecipe.image || "/placeholder.svg?height=300&width=400&query=delicious recipe"}
                      alt={selectedRecipe.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Prep Time</div>
                          <div className="font-semibold">{selectedRecipe.prepTimeMinutes}m</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Clock className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Cook Time</div>
                          <div className="font-semibold">{selectedRecipe.cookTimeMinutes}m</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Users className="h-5 w-5 text-purple-500" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Servings</div>
                          <div className="font-semibold">{selectedRecipe.servings}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <ChefHat className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                          <div
                            className={`px-2 py-1 rounded text-sm font-medium ${getCalorieColor(selectedRecipe.caloriesPerServing)}`}
                          >
                            {selectedRecipe.caloriesPerServing}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipe.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedRecipe.mealType && selectedRecipe.mealType.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Meal Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecipe.mealType.map((meal) => (
                            <Badge key={meal} variant="outline">
                              {meal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Ingredients</h4>
                      <ul className="space-y-2">
                        {selectedRecipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Instructions</h4>
                      <ol className="space-y-3">
                        {selectedRecipe.instructions.map((instruction, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="pt-0.5">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Recipe Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Recipe</DialogTitle>
              <DialogDescription>Update the recipe details</DialogDescription>
            </DialogHeader>
            <FormFields formData={formData} updateFormField={updateFormField} isEdit={true} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateRecipe} disabled={!formData.name.trim()}>
                Update Recipe
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
