import type { DishItem } from '@/data/dishes.json'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type ScopeType = 'all' | 'category' | 'subCategory'

export interface DecisionScope {
  type: ScopeType
  id?: string
}

export interface DecisionRecord {
  id: string
  userId: string
  mealType: MealType
  scopeType: ScopeType
  scopeId?: string
  resultDishId: string
  resultDishName: string
  createdAt: number
}

export const useDecisionStore = defineStore(
  'decision',
  () => {
    const history = ref<DecisionRecord[]>([])
    const lastResult = ref<DishItem | null>(null)
    const scope = ref<DecisionScope>({ type: 'all' })
    const mealType = ref<MealType>('lunch')

    function setScope(newScope: DecisionScope) {
      scope.value = newScope
    }

    function setMealType(type: MealType) {
      mealType.value = type
    }

    function setResult(dish: DishItem) {
      lastResult.value = dish
    }

    function addToHistory(dish: DishItem) {
      const record: DecisionRecord = {
        id: `decision-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: '',
        mealType: mealType.value,
        scopeType: scope.value.type,
        scopeId: scope.value.id,
        resultDishId: dish.id,
        resultDishName: dish.name,
        createdAt: Date.now(),
      }
      history.value.unshift(record)
      // 最多保留 50 条
      if (history.value.length > 50) {
        history.value = history.value.slice(0, 50)
      }
    }

    function clearHistory() {
      history.value = []
    }

    return {
      history,
      lastResult,
      scope,
      mealType,
      setScope,
      setMealType,
      setResult,
      addToHistory,
      clearHistory,
    }
  },
  {
    persist: {
      storage: {
        getItem: (key: string) => uni.getStorageSync(key),
        setItem: (key: string, value: any) => uni.setStorageSync(key, value),
      },
    },
  },
)
