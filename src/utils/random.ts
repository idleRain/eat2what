/**
 * 随机算法工具
 */

/**
 * 从数组中随机抽取 N 个不重复元素
 */
export function pickRandom<T>(arr: T[], count: number): T[] {
  if (count >= arr.length) return [...arr]
  const pool = [...arr]
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

/**
 * 生成轮盘旋转总角度
 * @param lastAngle 上一次停止的角度（避免连续相同扇区）
 * @returns 总旋转角度（度）
 */
export function generateSpinAngle(lastAngle = -1): number {
  // 基础圈数：5-8 圈
  const fullSpins = 5 + Math.floor(Math.random() * 4)
  // 随机偏移 0-360
  let offset = Math.random() * 360

  // 避免停在上一次同一扇区附近（30° 容差）
  if (lastAngle >= 0) {
    const lastNormalized = ((lastAngle % 360) + 360) % 360
    let attempts = 0
    while (Math.abs(offset - lastNormalized) < 30 && attempts < 10) {
      offset = Math.random() * 360
      attempts++
    }
  }

  return fullSpins * 360 + offset
}

/**
 * 根据旋转停止角度计算扇区索引
 * @param angle 停止角度（度）
 * @param sectorCount 扇区数量（默认 6）
 * @returns 扇区索引 0..sectorCount-1
 */
export function getSectorIndex(angle: number, sectorCount = 6): number {
  const normalized = ((angle % 360) + 360) % 360
  const sectorAngle = 360 / sectorCount
  // 指针在顶部（12 点方向 = 0°/360°）
  // 扇区 0 中心在 30°，指针在 0°，需要根据旋转角度计算
  // 如果轮盘旋转了 angle 度，则指针指向的是 -angle 方向
  const pointerAngle = ((360 - normalized) % 360 + 360) % 360
  return Math.floor(pointerAngle / sectorAngle) % sectorCount
}
