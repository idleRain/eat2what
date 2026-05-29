import type { DishItem } from '@/data/dishes.json'
/**
 * 菜品相关接口
 * 一期使用本地 JSON 数据 mock
 */
import categoriesData from '@/data/categories.json'
import dishesData from '@/data/dishes.json'
import subcategoriesData from '@/data/subcategories.json'

export interface Category {
  id: string
  name: string
  icon: string
  sort: number
  pinyin: string
  color: string
}

export interface SubCategory {
  id: string
  name: string
  categoryId: string
  sort: number
  pinyin: string
  dishCount: number
}

/** 获取大类列表 */
export async function getCategories(): Promise<Category[]> {
  return categoriesData as Category[]
}

/** 获取某大类下的小类列表 */
export async function getSubCategories(categoryId: string): Promise<SubCategory[]> {
  return (subcategoriesData as SubCategory[]).filter(
    item => item.categoryId === categoryId,
  )
}

/** 获取某小类下的菜品列表 */
export async function getDishes(subCategoryId: string): Promise<DishItem[]> {
  return (dishesData as DishItem[]).filter(
    item => item.subCategoryId === subCategoryId,
  )
}

/** 获取菜品详情 */
export async function getDishDetail(dishId: string): Promise<DishItem | null> {
  return (dishesData as DishItem[]).find(item => item.id === dishId) || null
}

/** 搜索菜品（按名称、拼音、描述模糊匹配） */
export async function searchDishes(keyword: string): Promise<DishItem[]> {
  const kw = keyword.toLowerCase().trim()
  if (!kw) return []
  return (dishesData as DishItem[]).filter(
    item =>
      item.name.includes(kw)
      || item.pinyin.toLowerCase().includes(kw)
      || item.description.toLowerCase().includes(kw),
  )
}

/** 获取热门推荐菜品（随机 N 个） */
export async function getHotDishes(count = 6): Promise<DishItem[]> {
  const all = dishesData as DishItem[]
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/** 获取所有菜品（供轮盘随机池使用） */
export async function getAllDishes(): Promise<DishItem[]> {
  return dishesData as DishItem[]
}

/** 根据大类 ID 获取该大类下所有菜品 */
export async function getDishesByCategory(categoryId: string): Promise<DishItem[]> {
  const subIds = (subcategoriesData as SubCategory[])
    .filter(s => s.categoryId === categoryId)
    .map(s => s.id)
  return (dishesData as DishItem[]).filter(d => subIds.includes(d.subCategoryId))
}
