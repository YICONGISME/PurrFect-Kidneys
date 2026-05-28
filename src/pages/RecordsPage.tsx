import { useFoodRecords } from '../store'

// ─── Rating helpers ────────────────────────────────────────────────────────────

type DmRating = 'fail' | 'marginal' | 'pass' | 'excellent' | 'high'

function getDmRating(type: 'protein' | 'fat' | 'nfe', val: number): DmRating {
  if (type === 'nfe') {
    if (val > 15) return 'fail'
    if (val > 10) return 'marginal'
    if (val > 5)  return 'pass'
    return 'excellent'
  }
  if (type === 'protein') {
    if (val > 60) return 'high'
    if (val >= 45) return 'excellent'
    if (val >= 40) return 'pass'
    if (val >= 35) return 'marginal'
    return 'fail'
  }
  // fat
  if (val > 45) return 'high'
  if (val > 40) return 'high'
  if (val >= 28) return 'excellent'
  if (val >= 25) return 'pass'
  if (val >= 18) return 'marginal'
  return 'fail'
}

const DM_RATING_CONFIG: Record<DmRating, { label: string; cls: string }> = {
  fail:      { label: '不合格 ✗', cls: 'dm-fail' },
  marginal:  { label: '勉强合格 △', cls: 'dm-marginal' },
  pass:      { label: '合格 ✓', cls: 'dm-pass' },
  excellent: { label: '优秀 ☆', cls: 'dm-excellent' },
  high:      { label: '过高/慎 ●', cls: 'dm-high' },
}

function DmBadge({ type, val }: { type: 'protein' | 'fat' | 'nfe'; val: number }) {
  const rating = getDmRating(type, val)
  const { label, cls } = DM_RATING_CONFIG[rating]
  return <span className={`dm-badge ${cls}`}>{label}</span>
}

function getPhosphorusDMRating(val: number): { label: string; cls: string } {
  if (val > 1.0)  return { label: '超标 ✗',  cls: 'dm-fail' }
  if (val > 0.8)  return { label: '合格 ✓',  cls: 'dm-pass' }
  return                  { label: '优秀 ☆', cls: 'dm-excellent' }
}

function getCaPRatioRating(val: number): { label: string; cls: string } {
  if (val > 1.4)  return { label: '偏高 △',  cls: 'dm-marginal' }
  if (val >= 1.0) return { label: '合格 ✓',  cls: 'dm-pass' }
  return                  { label: '偏低 △',  cls: 'dm-marginal' }
}

function getPPer1000Rating(val: number): { label: string; cls: string } {
  if (val > 2000) return { label: '超标 ✗',  cls: 'dm-fail' }
  if (val > 1500) return { label: '偏高 △',  cls: 'dm-marginal' }
  return                 { label: '合格 ✓',  cls: 'dm-pass' }
}

// ─── Main component ────────────────────────────────────────────────────────────

export function RecordsPage() {
  const { records, deleteRecord } = useFoodRecords()

  return (
    <div className="page records-page">
      <h2 className="page-title">🥫 德罐记录</h2>

      {records.length === 0 ? (
        <p className="hint" style={{ textAlign: 'center', padding: '24px 0' }}>
          暂无记录，请在营养分析页计算并保存食品数据
        </p>
      ) : (
        <div className="records-list">
            {records.map(r => (
              <div key={r.id} className="record-row">
                <div className="record-row-info">
                  <div className="record-row-main">
                    <span className="record-name">{r.name}</span>

                    {/* 5项重点指标（卡片样式） */}
                    <div className="record-tags-primary">
                      {r.phosphorus > 0 && (() => {
                        const { label, cls } = getPPer1000Rating(r.pPer1000kcal)
                        return (
                          <div className="record-dm-item">
                            <span className="record-dm-label">磷/代谢能</span>
                            <strong className="record-dm-value">{r.pPer1000kcal.toFixed(0)} mg/1000kcal</strong>
                            <span className={`dm-badge ${cls}`}>{label}</span>
                          </div>
                        )
                      })()}
                      {r.phosphorus > 0 && (() => {
                        const { label, cls } = getPhosphorusDMRating(r.dmP)
                        return (
                          <div className="record-dm-item">
                            <span className="record-dm-label">磷 DM</span>
                            <strong className="record-dm-value">{r.dmP.toFixed(3)}%</strong>
                            <span className={`dm-badge ${cls}`}>{label}</span>
                          </div>
                        )
                      })()}
                      {r.caPRatio > 0 && (() => {
                        const { label, cls } = getCaPRatioRating(r.caPRatio)
                        return (
                          <div className="record-dm-item">
                            <span className="record-dm-label">钙磷比</span>
                            <strong className="record-dm-value">{r.caPRatio.toFixed(2)}</strong>
                            <span className={`dm-badge ${cls}`}>{label}</span>
                          </div>
                        )
                      })()}
                      {r.dmProtein > 0 && (
                        <div className="record-dm-item">
                          <span className="record-dm-label">蛋白质 DM</span>
                          <strong className="record-dm-value">{r.dmProtein.toFixed(1)}%</strong>
                          <DmBadge type="protein" val={r.dmProtein} />
                        </div>
                      )}
                      {r.dmFat > 0 && (
                        <div className="record-dm-item">
                          <span className="record-dm-label">脂肪 DM</span>
                          <strong className="record-dm-value">{r.dmFat.toFixed(1)}%</strong>
                          <DmBadge type="fat" val={r.dmFat} />
                        </div>
                      )}
                    </div>

                    {/* 原始成分 */}
                    {(() => {
                      const parts: string[] = []
                      if (r.protein > 0)    parts.push(`粗蛋白${r.protein}%`)
                      if (r.fat > 0)        parts.push(`粗脂肪${r.fat}%`)
                      if (r.ash > 0)        parts.push(`粗灰分${r.ash}%`)
                      if (r.fiber > 0)      parts.push(`粗纤维${r.fiber}%`)
                      if (r.moisture > 0)   parts.push(`水分${r.moisture}%`)
                      if (r.phosphorus > 0) parts.push(`磷${r.phosphorus}%`)
                      if (r.calcium > 0)    parts.push(`钙${r.calcium}%`)
                      if (parts.length === 0) return null
                      const text = parts.join('，')
                      return (
                        <div className="record-ingredients-row">
                          <span className="record-ingredients-text">{text}</span>
                          <button
                            className="btn-copy-ingredients"
                            title="复制成分"
                            onClick={() => { navigator.clipboard.writeText(text).catch(() => {}) }}
                          >复制</button>
                        </div>
                      )
                    })()}

                    {/* 其他指标 */}
                    <div className="record-tags">
                      {r.mePerCan ? <span>{r.mePerCan.toFixed(0)} kcal/罐</span> : <span>{r.meTotal.toFixed(1)} kcal/100g</span>}
                      <span>DM {r.dm.toFixed(1)}%</span>
                      {r.rer > 0 && r.dailyFoodG > 0 && <span>每日 {r.dailyFoodG.toFixed(1)} g</span>}
                      {r.rer > 0 && r.dailyCans > 0 && <span>{r.dailyCans.toFixed(2)} 罐/天</span>}
                      {r.rer > 0 && r.suppWaterMl > 0 && <span>补水 {r.suppWaterMl.toFixed(0)} ml</span>}
                      {r.ckdPass === true && (
                        <span className="tag-pass">✅ 肾猫达标</span>
                      )}
                    </div>
                  </div>
                  <span className="record-date">{r.date}</span>
                </div>
                <div className="record-row-actions">
                  <button className="btn-icon btn-del" onClick={() => deleteRecord(r.id)} title="删除">🗑️</button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
