import { useState, useEffect } from 'react'
import { useFoodRecords, useCatProfile } from '../store'
import type { FoodRecord } from '../types'

// ─── Calculation logic (ported from HTML) ────────────────────────────────────

interface NutritionInput {
  name: string
  protein: number; fat: number; ash: number; fiber: number
  moisture: number; phosphorus: number; calcium: number; canWeight: number
}

interface CalcResult {
  nfe: number
  meProtein: number; meFat: number; meCarb: number
  meTotal: number       // kcal/100g
  mePerCan: number      // kcal/can
  dm: number
  dmProtein: number; dmFat: number; dmAsh: number; dmFiber: number; dmNFE: number
  dmP: number; dmCa: number
  caPRatio: number
  pPer1000kcal: number
}

function calcNutrition(f: NutritionInput): CalcResult {
  const nfe = Math.max(0, 100 - f.protein - f.fat - f.ash - f.fiber - f.moisture)
  const meProtein = f.protein * 3.5
  const meFat = f.fat * 8.5
  const meCarb = nfe * 3.5
  const meTotal = meProtein + meFat + meCarb
  const mePerCan = f.canWeight > 0 ? meTotal * f.canWeight / 100 : 0
  const dm = 100 - f.moisture
  const toDM = (v: number) => dm > 0 ? (v / dm * 100) : 0
  const dmP = toDM(f.phosphorus)
  const pMgPer100g = f.phosphorus * 1000
  const pPer1000kcal = meTotal > 0 ? pMgPer100g / meTotal * 1000 : 0
  const caPRatio = f.phosphorus > 0 ? f.calcium / f.phosphorus : 0
  return {
    nfe, meProtein, meFat, meCarb, meTotal, mePerCan, dm,
    dmProtein: toDM(f.protein), dmFat: toDM(f.fat),
    dmAsh: toDM(f.ash), dmFiber: toDM(f.fiber), dmNFE: toDM(nfe),
    dmP, dmCa: toDM(f.calcium), caPRatio, pPer1000kcal,
  }
}

// ─── Parse ingredient string ──────────────────────────────────────────────────

const PARSE_MAP: { field: keyof NutritionInput; re: RegExp }[] = [
  { field: 'protein',    re: /粗蛋白[质]?\s*[：:≥≤><=]?\s*([\d.]+)\s*%/ },
  { field: 'fat',        re: /粗脂肪[质]?\s*[：:≥≤><=]?\s*([\d.]+)\s*%/ },
  { field: 'ash',        re: /粗灰分[质]?\s*[：:≥≤><=]?\s*([\d.]+)\s*%/ },
  { field: 'fiber',      re: /粗纤维[质]?\s*[：:≥≤><=]?\s*([\d.]+)\s*%/ },
  { field: 'moisture',   re: /水分\s*[：:≥≤><=]?\s*([\d.]+)\s*%/ },
  { field: 'phosphorus', re: /磷\s*[：:≥≤><=]?\s*([\d.]+)\s*%/ },
  { field: 'calcium',    re: /钙\s*[：:≥≤><=]?\s*([\d.]+)\s*%/ },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`result-item${highlight ? ' highlight' : ''}`}>
      <div className="result-label">{label}</div>
      <div className="result-value">{value}</div>
    </div>
  )
}

function Badge({ pass }: { pass: boolean }) {
  return <span className={`badge ${pass ? 'badge-pass' : 'badge-fail'}`}>{pass ? '达标 ✓' : '超标 ✗'}</span>
}

// ─── DM rating badges (三大供能判定表) ────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function NutritionPage() {
  const { addRecord } = useFoodRecords()
  const { profile } = useCatProfile()

  const [parseStr, setParseStr] = useState('')
  const [form, setForm] = useState({
    name: '', protein: '', fat: '', ash: '', fiber: '',
    moisture: '', phosphorus: '', calcium: '', canWeight: '200',
  })
  const [catWeightStr, setCatWeightStr] = useState(String(profile.weightKg || 4.2))
  useEffect(() => { setCatWeightStr(String(profile.weightKg)) }, [profile.weightKg])
  const [factor, setFactor] = useState('1.2')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [dailyResult, setDailyResult] = useState<{
    rer: number; der: number; dailyFoodG: number; dailyCans: number
    totalWater: number; foodWater: number; suppWater: number
  } | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  function setField(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setResult(null)
    setDailyResult(null)
  }

  function getNum(k: keyof typeof form) { return parseFloat(form[k]) || 0 }

  function handleParse() {
    if (!parseStr.trim()) { showToast('请先输入成分字符串'); return }
    let filled = 0
    const updates: Partial<typeof form> = {}
    for (const { field, re } of PARSE_MAP) {
      const m = parseStr.match(re)
      if (m) { updates[field as keyof typeof form] = m[1]; filled++ }
    }
    const nameM = parseStr.match(/^([\s\S]*?)(?=粗蛋白|粗脂肪|粗灰分|粗纤维|水分|[,，]\s*磷|[,，]\s*钙)/)
    if (nameM) {
      const n = nameM[1].trim().replace(/[,，\s]+$/, '')
      if (n && !form.name) updates.name = n
    }
    setForm(f => ({ ...f, ...updates }))
    setResult(null)
    showToast(filled > 0 ? `成功解析 ${filled} 项` : '未识别到成分，请检查格式')
  }

  function handleCalc() {
    const f: NutritionInput = {
      name: form.name,
      protein: getNum('protein'), fat: getNum('fat'), ash: getNum('ash'),
      fiber: getNum('fiber'), moisture: getNum('moisture'),
      phosphorus: getNum('phosphorus'), calcium: getNum('calcium'),
      canWeight: getNum('canWeight'),
    }
    if (!f.protein && !f.fat && !f.moisture) { showToast('请先输入营养成分'); return }
    setResult(calcNutrition(f))
    showToast('计算完成')
  }

  function handleCalcDaily() {
    if (!result) { showToast('请先点击「计算分析」'); return }
    const catWeight = parseFloat(catWeightStr) || 0
    if (!catWeight) { showToast('请输入猫咪体重'); return }
    const f = parseFloat(factor) || 1.2
    const rer = 30 * catWeight + 70
    const der = rer * f
    const dailyFoodG = result.meTotal > 0 ? der / result.meTotal * 100 : 0
    const canW = getNum('canWeight')
    const dailyCans = canW > 0 && dailyFoodG > 0 ? dailyFoodG / canW : 0
    const totalWater = catWeight * 45
    const foodWater = getNum('moisture') / 100 * dailyFoodG
    const suppWater = Math.max(0, totalWater - foodWater)
    setDailyResult({ rer, der, dailyFoodG, dailyCans, totalWater, foodWater, suppWater })
    showToast('喂养计划计算完成')
  }

  function handleSave() {
    if (!result) { showToast('请先计算分析'); return }
    const catWeight = parseFloat(catWeightStr) || 4.2
    const rer = 30 * catWeight + 70
    const dailyFoodG = result.meTotal > 0 ? rer / result.meTotal * 100 : 0
    const canW = getNum('canWeight')
    const dailyCans = canW > 0 && dailyFoodG > 0 ? dailyFoodG / canW : 0
    const foodWater = getNum('moisture') / 100 * dailyFoodG
    const suppWater = Math.max(0, catWeight * 45 - foodWater)
    const p = getNum('phosphorus')
    const ckdPass = p > 0 ? (result.dmP <= 1.0 && result.pPer1000kcal <= 2000) : null

    const record: FoodRecord = {
      id: Date.now(),
      name: form.name || '未命名',
      protein: getNum('protein'), fat: getNum('fat'), ash: getNum('ash'),
      fiber: getNum('fiber'), moisture: getNum('moisture'),
      phosphorus: p, calcium: getNum('calcium'), canWeight: canW,
      catWeightKg: catWeight,
      meTotal: result.meTotal, mePerCan: result.mePerCan, dm: result.dm,
      dmProtein: result.dmProtein, dmFat: result.dmFat, dmP: result.dmP,
      pPer1000kcal: result.pPer1000kcal, caPRatio: result.caPRatio,
      rer, dailyFoodG, dailyCans, suppWaterMl: suppWater,
      ckdPass, date: new Date().toLocaleString('zh-CN'),
    }
    addRecord(record)
    showToast(`已保存：${record.name}`)
  }

  function handleClear() {
    setForm({ name: '', protein: '', fat: '', ash: '', fiber: '', moisture: '', phosphorus: '', calcium: '', canWeight: '200' })
    setResult(null); setDailyResult(null)
    setParseStr('')
    showToast('已清空')
  }

  const p = getNum('phosphorus')
  const ckdOk = result && p > 0 ? result.dmP <= 1.0 && result.pPer1000kcal <= 2000 : null

  return (
    <div className="page nutrition-page">
      <h2 className="page-title">🧪 营养分析</h2>

      {/* Parse */}
      <section className="card">
        <h3 className="card-title">🔍 快速解析成分字符串</h3>
        <div className="parse-row">
          <textarea
            className="parse-input"
            value={parseStr}
            onChange={e => setParseStr(e.target.value)}
            placeholder="粘贴成分信息，例如：catz 3号 粗蛋白8.2%，粗脂肪3.2%，粗灰分3.6%，粗纤维1.2%，水分86.4%，磷0.15%，钙0.2%"
          />
          <button className="btn-parse" onClick={handleParse}>解析填充</button>
        </div>
      </section>

      {/* Input */}
      <section className="card">
        <h3 className="card-title">📋 营养成分（实物基础 as-fed）</h3>
        <label className="form-label">
          产品名称
          <input className="form-input" type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="例如：catz 3号" />
        </label>
        <div className="input-grid-4">
          {([
            ['protein', '粗蛋白 %', '0.01'],
            ['fat', '粗脂肪 %', '0.01'],
            ['ash', '粗灰分 %', '0.01'],
            ['fiber', '粗纤维 %', '0.01'],
            ['moisture', '水分 %', '0.01'],
            ['phosphorus', '磷 %', '0.001'],
            ['calcium', '钙 %', '0.001'],
            ['canWeight', '罐重 g', '1'],
          ] as [string, string, string][]).map(([k, label, step]) => (
            <label key={k} className="form-label">
              {label}
              <input
                className={`form-input${form[k as keyof typeof form] ? ' filled' : ''}`}
                type="number" step={step} min="0"
                value={form[k as keyof typeof form]}
                onChange={e => setField(k, e.target.value)}
                placeholder="0"
              />
            </label>
          ))}
        </div>
        <div className="btn-row">
          <button className="btn-calc" onClick={handleCalc}>计算分析</button>
          <button className="btn-clear" onClick={handleClear}>清空</button>
          {result && <button className="btn-save" onClick={handleSave}>💾 保存</button>}
        </div>
      </section>

      {/* Results */}
      {result && (
        <section className="card">
          <h3 className="card-title">⚡ 热量（AAFCO 改良 Atwater）</h3>
          <div className="formula-box">
            <div className="formula-line">
              <span className="formula-label">NFE</span>
              <span className="formula-expr">= 100 − 蛋白 − 脂肪 − 灰分 − 纤维 − 水分</span>
            </div>
            <div className="formula-line">
              <span className="formula-label">ME</span>
              <span className="formula-expr">= 蛋白 × <strong>3.5</strong> + 脂肪 × <strong>8.5</strong> + NFE × <strong>3.5</strong> <span className="formula-unit">(kcal/100g)</span></span>
            </div>
          </div>
          <div className="results-grid">
            <ResultItem label="NFE 碳水" value={`${result.nfe.toFixed(2)}%`} />
            <ResultItem label="蛋白热量" value={`${result.meProtein.toFixed(1)} kcal`} />
            <ResultItem label="脂肪热量" value={`${result.meFat.toFixed(1)} kcal`} />
            <ResultItem label="碳水热量" value={`${result.meCarb.toFixed(1)} kcal`} />
            <ResultItem label="代谢能 ME" value={`${result.meTotal.toFixed(1)} kcal/100g`} highlight />
            {result.mePerCan > 0 && (
              <ResultItem label={`ME（每罐 ${form.canWeight}g）`} value={`${result.mePerCan.toFixed(1)} kcal`} highlight />
            )}
          </div>

          <div className="section-divider" />
          <h3 className="card-title">🔬 干物质基础（DM%）</h3>
          <div className="results-grid">
            <ResultItem label="干物质 DM" value={`${result.dm.toFixed(1)}%`} />
            {p > 0 && <ResultItem label="磷 DM%" value={`${result.dmP.toFixed(3)}%`} />}
            {getNum('calcium') > 0 && <ResultItem label="钙 DM%" value={`${result.dmCa.toFixed(3)}%`} />}
            <ResultItem label="粗灰分 DM" value={`${result.dmAsh.toFixed(1)}%`} />
            <ResultItem label="粗纤维 DM" value={`${result.dmFiber.toFixed(1)}%`} />
          </div>
          <div className="dm-rating-list">
            <div className="dm-rating-row">
              <span className="dm-rating-label">蛋白质 DM</span>
              <span className="dm-rating-val">{result.dmProtein.toFixed(1)}%</span>
              <DmBadge type="protein" val={result.dmProtein} />
            </div>
            <div className="dm-rating-row">
              <span className="dm-rating-label">脂肪 DM</span>
              <span className="dm-rating-val">{result.dmFat.toFixed(1)}%</span>
              <DmBadge type="fat" val={result.dmFat} />
            </div>
            <div className="dm-rating-row">
              <span className="dm-rating-label">碳水 NFE DM</span>
              <span className="dm-rating-val">{result.dmNFE.toFixed(1)}%</span>
              <DmBadge type="nfe" val={result.dmNFE} />
            </div>
          </div>
        </section>
      )}

      {/* Ca-P analysis */}
      {result && p > 0 && (
        <section className="card">
          <h3 className="card-title">⚖️ 钙磷分析</h3>
          <div className="results-grid">
            {getNum('calcium') > 0 && <ResultItem label="钙 (实物)" value={`${getNum('calcium').toFixed(3)}%`} />}
            <ResultItem label="磷 (实物)" value={`${p.toFixed(3)}%`} />
            {getNum('calcium') > 0 && <ResultItem label="钙磷比" value={`${result.caPRatio.toFixed(2)}:1`} highlight />}
            <ResultItem label="磷 DM%" value={`${result.dmP.toFixed(3)}%`} />
            <ResultItem label="磷/代谢能" value={`${result.pPer1000kcal.toFixed(0)} mg/1000kcal`} highlight />
          </div>

          <div className="section-divider" />
          <h3 className="card-title" style={{ marginBottom: 4 }}>🏥 CKD 2期磷评估</h3>
          <p className="hint">标准：磷DM ≤1.0% · 磷代谢能 ≤2000 mg/1000kcal</p>
          <div className={`assess-box ${ckdOk ? 'pass' : 'fail'}`}>
            <div className="assess-row">
              <span>磷 DM% <small>（≤1.0%）</small></span>
              <span><strong>{result.dmP.toFixed(3)}%</strong> <Badge pass={result.dmP <= 1.0} /></span>
            </div>
            <div className="assess-row">
              <span>磷/代谢能 <small>（≤2000 mg/1000kcal）</small></span>
              <span><strong>{result.pPer1000kcal.toFixed(0)}</strong> <Badge pass={result.pPer1000kcal <= 2000} /></span>
            </div>
            <p className="assess-summary">
              {ckdOk ? '✅ 磷摄入符合 CKD 2期低磷标准' : '⚠️ 存在超标项，不建议作为肾猫主食，请咨询兽医'}
            </p>
          </div>
        </section>
      )}

      {/* Daily plan */}
      <section className="card">
        <h3 className="card-title">🥩 每日喂养计划</h3>
        <p className="hint">请先完成「计算分析」再计算每日需求</p>
        <div className="input-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label className="form-label">
            体重 (kg)
            <input className="form-input" type="number" step="0.01" min="0.1" value={catWeightStr}
              onChange={e => setCatWeightStr(e.target.value)} />
          </label>
          <label className="form-label">
            能量系数
            <select className="form-input" value={factor} onChange={e => setFactor(e.target.value)}>
              <option value="1.0">×1.0 RER（静息）</option>
              <option value="1.2">×1.2 绝育成猫</option>
              <option value="1.4">×1.4 未绝育</option>
              <option value="1.6">×1.6 轻度活跃</option>
            </select>
          </label>
        </div>
        <button className="btn-calc" onClick={handleCalcDaily}>计算每日需求</button>

        {dailyResult && (
          <div style={{ marginTop: 14 }}>
            <div className="results-grid">
              <ResultItem label="RER 静息能量" value={`${dailyResult.rer.toFixed(0)} kcal/天`} />
              <ResultItem label={`DER (×${factor})`} value={`${dailyResult.der.toFixed(0)} kcal/天`} highlight />
              <ResultItem label="每日食物总量" value={`${dailyResult.dailyFoodG.toFixed(1)} g/天`} />
              {dailyResult.dailyCans > 0 && (
                <ResultItem label={`每日罐数 (${form.canWeight}g/罐)`} value={`${dailyResult.dailyCans.toFixed(2)} 罐/天`} highlight />
              )}
            </div>
            <div className={`assess-box ${dailyResult.suppWater <= 20 ? 'pass' : 'warn'}`} style={{ marginTop: 12 }}>
              <div className="assess-row">
                <span>每日总需水 <small>({catWeightStr}kg × 45)</small></span>
                <span><strong>{dailyResult.totalWater.toFixed(0)} ml</strong></span>
              </div>
              <div className="assess-row">
                <span>食物中水分</span>
                <span><strong>{dailyResult.foodWater.toFixed(0)} ml</strong></span>
              </div>
              <div className="assess-row">
                <span>需额外补水</span>
                <span>
                  <strong style={{ color: dailyResult.suppWater > 20 ? 'var(--red)' : 'var(--green)' }}>
                    {dailyResult.suppWater.toFixed(0)} ml
                  </strong>
                  {' '}<span className={`badge ${dailyResult.suppWater <= 20 ? 'badge-pass' : 'badge-warn'}`}>
                    {dailyResult.suppWater <= 20 ? '食物水分充足 ✓' : '需饮水补充 ⚠️'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
