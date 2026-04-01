export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  meal: string;
  difficulty?: string;
  time: string;
  timeNum?: number;
  servings?: number;
  desc: string;
  diet: string[];
  source?: string;
  sourceType?: string;
  macros?: Macros;
  matchingIngredients?: string[];
  ingredients: string[];
  steps: string[];
  matchCount?: number;
  matchRatio?: number;
  cookedDate?: string;
}

export interface Drink {
  id: string;
  title: string;
  type: string;
  time: string;
  timeNum?: number;
  desc: string;
  goals: string[];
  matchingIngredients?: string[];
  ingredients: string[];
  steps: string[];
  matchCount?: number;
  matchRatio?: number;
}

export interface Filters {
  region?: string;
  country?: string;
  countries?: string[];
  meal?: string;
  cookTime?: string;
  diets: string[];
  ingCount?: string;
  servings?: number;
  difficulty?: string;
}

export interface DrinkFilters {
  type?: string;
  goals: string[];
  ingCount?: string;
}

export type SubscriptionStatus = 'active' | 'inactive' | 'loading';
