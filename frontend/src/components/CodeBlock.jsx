import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'

const EXT_LANG = {
  py: 'python', js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  html: 'html', css: 'css', scss: 'scss', json: 'json', md: 'markdown',
  sh: 'bash', bash: 'bash', zsh: 'bash', yaml: 'yaml', yml: 'yaml',
  xml: 'xml', sql: 'sql', toml: 'toml', txt: 'text', rs: 'rust',
  go: 'go', java: 'java', cpp: 'cpp', c: 'c', rb: 'ruby',
}

export function inferLang(filepath = '') {
  const ext = filepath.split('.').pop()?.toLowerCase()
  return EXT_LANG[ext] || 'text'
}

export function CodeBlock({ code = '', language, filepath, maxHeight = '400px' }) {
  const [copied, setCopied] = useState(false)
  const lang = language || inferLang(filepath)
  const lineCount = code.split('\n').length

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#2a2a40] my-2 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a28] border-b border-[#2a2a40]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-xs font-mono text-[#6b6b88] select-none">
            {filepath || lang}
          </span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#8888a8] hover:text-[#e8e8f5] hover:bg-[#2a2a40] transition-all"
        >
          {copied ? (
            <><Check size={12} className="text-emerald-400" /> Copied</>
          ) : (
            <><Copy size={12} /> Copy</>
          )}
        </button>
      </div>

      {/* Code */}
      <div style={{ maxHeight, overflowY: 'auto' }}>
        <SyntaxHighlighter
          language={lang}
          style={vscDarkPlus}
          showLineNumbers={lineCount > 4}
          lineNumberStyle={{ color: '#3a3a55', fontSize: '11px', userSelect: 'none', minWidth: '2.5em' }}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: '#0d0d14',
            fontSize: '12.5px',
            lineHeight: '1.6',
          }}
          codeTagProps={{ style: { fontFamily: "'JetBrains Mono', monospace" } }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
