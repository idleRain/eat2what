/**
 * 拼音首字母提取工具
 * 基于 pinyin-pro 库，不维护手写映射表
 */
import { pinyin } from 'pinyin-pro'

/**
 * 获取中文文本的拼音首字母（大写）
 * 非中文字符原样保留（大写），无法识别返回 '#'
 * @example getPinyinInitial('宫保鸡丁') → 'G'
 * @example getPinyinInitial('ABC') → 'A'
 * @example getPinyinInitial('水煮鱼') → 'S'
 */
export function getPinyinInitial(text: string): string {
  if (!text) return '#'
  // 英文/数字直接返回大写（跳过库处理）
  const firstChar = text.charAt(0)
  if (/[a-z0-9]/i.test(firstChar)) return firstChar.toUpperCase()

  // 只取第一个字的拼音首字母
  const result = pinyin(firstChar, { pattern: 'first' })
  // result 如 'g'、's'
  if (result && /[a-z]/.test(result)) return result.toUpperCase()
  return '#'
}

/**
 * 生成菜品分组索引 Map
 * @param dishes 菜品列表
 * @returns { [首字母]: 菜品数组 } 排序后的分组
 */
export function groupByPinyin<T extends { name: string }>(
  dishes: T[],
): { letter: string, items: T[] }[] {
  const groups = new Map<string, T[]>()

  dishes.forEach((dish) => {
    const letter = getPinyinInitial(dish.name)
    if (!groups.has(letter)) {
      groups.set(letter, [])
    }
    groups.get(letter)!.push(dish)
  })

  // 按字母排序，特殊字符放最后
  const sorted = [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === '#') return 1
      if (b === '#') return -1
      return a.localeCompare(b)
    })

  return sorted.map(([letter, items]) => ({ letter, items }))
}

/** A-Z 所有字母（含 #） */
export const ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '#',
]

/**
 * 判断给定 dishes 中存在哪些首字母
 */
export function getAvailableLetters<T extends { name: string }>(
  dishes: T[],
): Set<string> {
  const set = new Set<string>()
  dishes.forEach(d => set.add(getPinyinInitial(d.name)))
  return set
}
