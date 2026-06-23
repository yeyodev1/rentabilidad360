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

export interface RecipeData {
  _id?: string
  name: string
  sellingPrice: number
  ingredients: RecipeIngredientData[]
  wastePercentage?: number
  isActive?: boolean
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
}

export const costingService = new CostingService()
