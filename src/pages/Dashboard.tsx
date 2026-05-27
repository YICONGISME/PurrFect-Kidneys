import { useWaterIntake, useMedications, useLabResults } from '../store/useAppStore'
import type { Cat } from '../types'

const CKD_STAGE_LABELS: Record<string, string> = {
  stage1: '第一期',
  stage2: '第二期',
  stage3: '第三期',
  stage4: '第四期',
  unknown: '待确认',
}

const CKD_STAGE_COLORS: Record<string, string> = {
  stage1: '#22c55e',
  stage2: '#eab308',
  stage3: '#f97316',
  stage4: '#ef4444',
  unknown: '#94a3b8',
}

interface Props {
  cat: Cat
}

export function Dashboard({ cat }: Props) {
  const { todayTotal } = useWaterIntake(cat.id)
  const { meds, todayLogs } = useMedications(cat.id)
  const { latest } = useLabResults(cat.id)

  const activeMeds = meds.filter(m => m.active)
  const givenToday = todayLogs.filter(l => l.given).length

  const age = cat.birthDate
    ? Math.floor((Date.now() - new Date(cat.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null

  return (
    <div className="page dashboard-page">
      <div className="cat-profile-card">
        <div className="cat-avatar">{cat.avatar || '🐱'}</div>
        <div className="cat-info">
          <h2 className="cat-name">{cat.name}</h2>
          <p className="cat-meta">
            {cat.breed}{age !== null ? ` · ${age} 岁` : ''} · {cat.weight} kg
          </p>
          <span
            className="ckd-badge"
            style={{ backgroundColor: CKD_STAGE_COLORS[cat.ckdStage] }}
          >
            CKD {CKD_STAGE_LABELS[cat.ckdStage]}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card water">
          <div className="stat-icon">💧</div>
          <div className="stat-value">{todayTotal} ml</div>
          <div className="stat-label">今日饮水</div>
        </div>
        <div className="stat-card meds">
          <div className="stat-icon">💊</div>
          <div className="stat-value">{givenToday}/{activeMeds.length}</div>
          <div className="stat-label">今日用药</div>
        </div>
        <div className="stat-card labs">
          <div className="stat-icon">🔬</div>
          <div className="stat-value">
            {latest ? new Date(latest.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '暂无'}
          </div>
          <div className="stat-label">最近检验</div>
        </div>
      </div>

      {latest && (
        <div className="section">
          <h3 className="section-title">最新血检指标</h3>
          <div className="lab-grid">
            {latest.creatinine !== undefined && (
              <LabIndicator label="肌酐 (Cre)" value={latest.creatinine} unit="mg/dL" high={1.6} />
            )}
            {latest.bun !== undefined && (
              <LabIndicator label="尿素氮 (BUN)" value={latest.bun} unit="mg/dL" high={30} />
            )}
            {latest.phosphorus !== undefined && (
              <LabIndicator label="磷 (P)" value={latest.phosphorus} unit="mg/dL" high={5} />
            )}
            {latest.sdma !== undefined && (
              <LabIndicator label="SDMA" value={latest.sdma} unit="µg/dL" high={14} />
            )}
            {latest.hematocrit !== undefined && (
              <LabIndicator label="红细胞压积 (HCT)" value={latest.hematocrit} unit="%" low={30} />
            )}
            {latest.potassium !== undefined && (
              <LabIndicator label="血钾 (K)" value={latest.potassium} unit="mEq/L" low={3.5} high={5.5} />
            )}
          </div>
          <p className="lab-date">检验日期：{new Date(latest.date).toLocaleDateString('zh-CN')}</p>
        </div>
      )}

      {activeMeds.length > 0 && (
        <div className="section">
          <h3 className="section-title">今日用药</h3>
          <div className="med-list">
            {activeMeds.map(med => {
              const given = todayLogs.some(l => l.medicationId === med.id && l.given)
              return (
                <div key={med.id} className={`med-item ${given ? 'given' : ''}`}>
                  <span className="med-check">{given ? '✅' : '⬜'}</span>
                  <div className="med-info">
                    <span className="med-name">{med.name}</span>
                    <span className="med-dose">{med.dosage} {med.unit} · {med.frequency}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function LabIndicator({
  label, value, unit, low, high,
}: {
  label: string
  value: number
  unit: string
  low?: number
  high?: number
}) {
  const isHigh = high !== undefined && value > high
  const isLow = low !== undefined && value < low
  const status = isHigh ? 'high' : isLow ? 'low' : 'normal'
  const statusLabel = isHigh ? '↑' : isLow ? '↓' : ''

  return (
    <div className={`lab-indicator ${status}`}>
      <div className="lab-ind-label">{label}</div>
      <div className="lab-ind-value">
        {value} <span className="lab-ind-unit">{unit}</span>
        {statusLabel && <span className="lab-ind-flag">{statusLabel}</span>}
      </div>
    </div>
  )
}
