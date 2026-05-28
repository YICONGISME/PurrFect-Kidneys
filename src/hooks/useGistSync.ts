/**
 * GitHub Gist 数据同步
 *
 * 使用方式：
 *   1. 在 GitHub → Settings → Developer settings → Personal access tokens (classic)
 *      创建一个 token，权限只勾选 "gist"
 *   2. 在档案页填入 token，首次点「上传」会自动创建 Gist 并返回 Gist ID
 *   3. 之后填入 Gist ID，即可在多设备之间「上传」/「下载」同步数据
 */

const GIST_FILENAME = 'purrfect-kidneys-backup.json'

export type SyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface GistConfig {
  pat: string    // Personal Access Token
  gistId: string // Gist ID（首次上传后自动填入）
}

/** 读取全部 localStorage 数据打包成一个对象 */
function exportAllData(): Record<string, unknown> {
  return {
    'pk:profile': JSON.parse(localStorage.getItem('pk:profile') ?? 'null'),
    'pk:log':     JSON.parse(localStorage.getItem('pk:log')     ?? '[]'),
    'pk:foods':   JSON.parse(localStorage.getItem('pk:foods')   ?? '[]'),
    exportedAt: new Date().toISOString(),
  }
}

/** 把 Gist 数据写回 localStorage */
function importAllData(data: Record<string, unknown>) {
  if (data['pk:profile']) localStorage.setItem('pk:profile', JSON.stringify(data['pk:profile']))
  if (data['pk:log'])     localStorage.setItem('pk:log',     JSON.stringify(data['pk:log']))
  if (data['pk:foods'])   localStorage.setItem('pk:foods',   JSON.stringify(data['pk:foods']))
}

/** 上传数据到 Gist（没有 gistId 时自动创建） */
export async function uploadToGist(config: GistConfig): Promise<string> {
  const body = exportAllData()
  const headers = {
    'Authorization': `token ${config.pat}`,
    'Content-Type': 'application/json',
  }
  const payload = {
    description: 'PurrFect Kidneys 猫咪健康记录备份',
    public: false,
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(body, null, 2) },
    },
  }

  let res: Response
  if (config.gistId) {
    // 更新已有 Gist
    res = await fetch(`https://api.github.com/gists/${config.gistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    })
  } else {
    // 创建新 Gist
    res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }

  const json = await res.json() as { id: string }
  return json.id
}

/** 从 Gist 下载数据并写入 localStorage，返回备份时间 */
export async function downloadFromGist(config: GistConfig): Promise<string> {
  if (!config.gistId) throw new Error('请先填写 Gist ID')

  const res = await fetch(`https://api.github.com/gists/${config.gistId}`, {
    headers: { 'Authorization': `token ${config.pat}` },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }

  const json = await res.json() as {
    files: Record<string, { content: string }>
  }

  const file = json.files[GIST_FILENAME]
  if (!file) throw new Error('Gist 中未找到备份文件')

  const data = JSON.parse(file.content) as Record<string, unknown>
  importAllData(data)

  return typeof data.exportedAt === 'string' ? data.exportedAt : '未知时间'
}
