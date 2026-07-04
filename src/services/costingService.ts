import APIBase from './httpBase'

export interface IngredientData {
  _id?: string
  name: string
  unitOfMeasure: 'kg' | 'l' | 'unidad'
  costPrice: number
  wastePercentage?: number
}

export interface RecipeIngredientData {
  ingredientId: string
  quantity: number
}

export interface PriceSuggestion {
  cost: number
  suggestedMinPrice: number
  suggestedMaxPrice: number
  monthlyFixedCosts: number
  fixedCostShare: number
  monthlyUnitsTarget: number | null
  validityDays: number
  priceValidUntil: string
}

export interface RecipeData {
  _id?: string
  name: string
  /** Manual PVP, only if the dish is already sold. Optional — the app can suggest a price instead. */
  sellingPrice?: number
  /** Simple total production cost (the "simple costing" flow) — mutually exclusive with ingredients. */
  productionCost?: number
  ingredients?: RecipeIngredientData[]
  wastePercentage?: number
  isActive?: boolean
  validityDays?: number
}

export interface RecipeWithSuggestion extends RecipeData {
  cost: number
  suggestion: PriceSuggestion
  priceValidUntil?: string
}

class CostingService extends APIBase {
  // Ingredients
  async listIngredients() {
    return this.get('costing/ingredients')
  }

  async createIngredient(data: IngredientData) {
    return this.post('costing/ingredients', data)
  }

  async deleteIngredient(id: string) {
    return this.delete(`costing/ingredients/${id}`)
  }

  // Recipes
  async listRecipes() {
    return this.get('costing/recipes')
  }

  async createRecipe(data: RecipeData) {
    return this.post('costing/recipes', data)
  }

  async deleteRecipe(id: string) {
    return this.delete(`costing/recipes/${id}`)
  }

  // Price suggestion preview (no persistence)
  async estimatePrice(productionCost: number, validityDays?: number) {
    return this.post<PriceSuggestion>('costing/estimate', { productionCost, validityDays })
  }
}

export const costingService = new CostingService()
