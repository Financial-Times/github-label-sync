export interface BasicLabel {
  name: string
  color: string
}

export interface LabelInfo extends BasicLabel {
  aliases?: string[]
  description?: string
}

export interface Options {
  accessToken: string
  allowAddedLabels?: boolean
  dryRun?: boolean
  endpoint?: string
  format?: Partial<Record<'diff' | 'success' | 'warning', (str: string) => string>>
  labels: LabelInfo[]
  log?: Partial<Record<'info' | 'warn', (str: string) => void>>
  repo: string
}

export interface DefaultOptions extends Options {
  accessToken: null
  endpoint: null
  repo: null
}

export interface LabelDiff {
  name: string
  type: string
  actual?: BasicLabel
  expected?: BasicLabel
}

export const defaults: Required<DefaultOptions>

export default function githubLabelSync(options: Options): Promise<LabelDiff[]>
