import { $ } from 'bun'
import { join } from 'path'

const REPO_ROOT = join(import.meta.dir, '../../../..')

export interface GitCommit {
  hash: string
  shortHash: string
  message: string
  date: string
}

export interface RecordChange {
  type: 'added' | 'removed' | 'modified'
  id: string
  oldRecord?: Record<string, unknown>
  newRecord?: Record<string, unknown>
  changedFields?: Set<string>
}

export interface KvChange {
  type: 'added' | 'removed' | 'modified'
  key: string
  oldValue?: unknown
  newValue?: unknown
}

const historyCache = new Map<string, { commits: GitCommit[]; timestamp: number }>()
const fileCache = new Map<string, { content: string; timestamp: number }>()
const HISTORY_TTL = 30_000
const FILE_TTL = 300_000

export async function getFileHistory(filename: string, limit = 50): Promise<GitCommit[]> {
  const cached = historyCache.get(filename)
  if (cached && Date.now() - cached.timestamp < HISTORY_TTL) {
    return cached.commits
  }

  const filepath = `data/${filename}`
  const format = '%H|%h|%s|%ai'
  const result = await $`git -C ${REPO_ROOT} log --format=${format} -n ${limit} -- ${filepath}`.text()

  const commits = result
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, shortHash, message, date] = line.split('|')
      return { hash, shortHash, message, date }
    })

  historyCache.set(filename, { commits, timestamp: Date.now() })
  return commits
}

export async function getFileAtCommit(filename: string, commitHash: string): Promise<string> {
  const cacheKey = `${filename}:${commitHash}`
  const cached = fileCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < FILE_TTL) {
    return cached.content
  }

  const filepath = `data/${filename}`
  const content = await $`git -C ${REPO_ROOT} show ${commitHash}:${filepath}`.text()

  fileCache.set(cacheKey, { content, timestamp: Date.now() })
  return content
}

type DataRecord = Record<string, unknown> & { id?: string }

export function computeRecordDiff(oldJson: string, newJson: string): RecordChange[] {
  const oldData = JSON.parse(oldJson) as DataRecord[]
  const newData = JSON.parse(newJson) as DataRecord[]

  if (!Array.isArray(oldData) || !Array.isArray(newData)) {
    return []
  }

  const oldMap = new Map(oldData.map((r) => [r.id, r]))
  const newMap = new Map(newData.map((r) => [r.id, r]))
  const result: RecordChange[] = []

  for (const [id, newRecord] of newMap) {
    if (!id) continue
    const oldRecord = oldMap.get(id)
    if (!oldRecord) {
      result.push({ type: 'added', id, newRecord })
    } else {
      const changedFields = new Set<string>()
      const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)])
      for (const key of allKeys) {
        if (key === 'id') continue
        if (JSON.stringify(oldRecord[key]) !== JSON.stringify(newRecord[key])) {
          changedFields.add(key)
        }
      }
      if (changedFields.size > 0) {
        result.push({ type: 'modified', id, oldRecord, newRecord, changedFields })
      }
    }
  }

  for (const [id, oldRecord] of oldMap) {
    if (!id) continue
    if (!newMap.has(id)) {
      result.push({ type: 'removed', id, oldRecord })
    }
  }

  return result
}

export function computeKvDiff(oldJson: string, newJson: string): KvChange[] {
  const oldData = JSON.parse(oldJson) as Record<string, unknown>
  const newData = JSON.parse(newJson) as Record<string, unknown>

  if (Array.isArray(oldData) || Array.isArray(newData)) {
    return []
  }

  const result: KvChange[] = []
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])

  for (const key of allKeys) {
    const oldVal = oldData[key]
    const newVal = newData[key]

    if (!(key in oldData)) {
      result.push({ type: 'added', key, newValue: newVal })
    } else if (!(key in newData)) {
      result.push({ type: 'removed', key, oldValue: oldVal })
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      result.push({ type: 'modified', key, oldValue: oldVal, newValue: newVal })
    }
  }

  return result
}
