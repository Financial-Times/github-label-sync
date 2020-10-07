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

export interface LabelDiff {
  name: string
  type: string
  actual?: BasicLabel
  expected?: BasicLabel
}

export const deafults: Required<Options>

export default function githubLabelSync(options: Options): Promise<LabelDiff[]>
