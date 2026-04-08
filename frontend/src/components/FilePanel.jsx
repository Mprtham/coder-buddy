import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileCode, FileText, FolderOpen, Download, Trash2,
  ChevronRight, RefreshCw, FileJson, Globe, Package,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CodeBlock, inferLang } from './CodeBlock'
import { downloadProject, clearFiles } from '../services/api'

const ICON_MAP = {
  py: FileCode, js: FileCode, jsx: FileCode, ts: FileCode, tsx: FileCode,
  html: Globe, css: FileText, scss: FileText,
  json: FileJson, md: FileText, txt: FileText,
  toml: Package, yaml: Package, yml: Package,
}

function fileIcon(path) {
  const ext = path?.split('.').pop()?.toLowerCase()
  return ICON_MAP[ext] || FileCode
}

function FileTreeItem({ file, isActive, onClick }) {
  const Icon = fileIcon(file.path)
  const parts = file.path.split('/')
  const name = parts[parts.length - 1]
  const dir = parts.slice(0, -1).join('/')

  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group ${
        isActive
          ? 'bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#e8e8f5]'
          : 'hover:bg-[#1a1a28] text-[#8888a8] hover:text-[#e8e8f5] border border-transparent'
      }`}
    >
      <Icon size={13} className={isActive ? 'text-[#6366f1]' : 'text-[#55556b] group-hover:text-[#8888a8]'} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium font-mono truncate">{name}</p>
        {dir && <p className="text-[10px] text-[#3a3a55] truncate">{dir}/</p>}
      </div>
      {isActive && <ChevronRight size={11} className="text-[#6366f1] flex-shrink-0" />}
    </motion.button>
  )
}

function EmptyFiles() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
      <div className="w-10 h-10 rounded-xl bg-[#1e1e2e] border border-[#2a2a40] flex items-center justify-center mb-3">
        <FolderOpen size={18} className="text-[#3a3a55]" />
      </div>
      <p className="text-xs text-[#55556b]">No files yet</p>
      <p className="text-[10px] text-[#3a3a55] mt-1">Generate a project to see files here</p>
    </div>
  )
}

export function FilePanel({ files, onFilesCleared }) {
  const [activeFile, setActiveFile] = useState(null)

  const handleDownload = async () => {
    try {
      await downloadProject()
      toast.success('Project downloaded!')
    } catch (err) {
      toast.error('Nothing to download yet')
    }
  }

  const handleClear = async () => {
    try {
      await clearFiles()
      setActiveFile(null)
      onFilesCleared?.()
      toast.success('Files cleared')
    } catch {
      toast.error('Failed to clear files')
    }
  }

  const active = files.find(f => f.path === activeFile) || files[0] || null

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-[#111118] border-l border-[#1e1e2e] h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-[#6366f1]" />
          <span className="text-sm font-semibold text-[#e8e8f5]">Output</span>
          {files.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6366f1]/20 text-[#6366f1] font-medium">
              {files.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {files.length > 0 && (
            <>
              <button
                onClick={handleDownload}
                title="Download ZIP"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8888a8] hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
              >
                <Download size={13} />
              </button>
              <button
                onClick={handleClear}
                title="Clear files"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8888a8] hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* File list */}
      <div className="flex flex-col overflow-hidden" style={{ height: '40%' }}>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {files.length === 0 ? (
            <EmptyFiles />
          ) : (
            <AnimatePresence>
              {files.map(f => (
                <FileTreeItem
                  key={f.path}
                  file={f}
                  isActive={f.path === (activeFile || files[0]?.path)}
                  onClick={() => setActiveFile(f.path)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#1e1e2e]" />

      {/* Code preview */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1e1e2e] bg-[#13131e]">
              <FileCode size={12} className="text-[#6366f1]" />
              <span className="text-xs font-mono text-[#8888a8] truncate flex-1">{active.path}</span>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeBlock
                code={active.content || ''}
                filepath={active.path}
                maxHeight="100%"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <FileCode size={24} className="text-[#2a2a40] mb-2" />
            <p className="text-xs text-[#3a3a55]">Select a file to preview</p>
          </div>
        )}
      </div>

      {/* Download banner when files exist */}
      {files.length > 0 && (
        <div className="border-t border-[#1e1e2e] p-3">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] hover:bg-[#6366f1]/20 text-xs font-medium transition-all"
          >
            <Download size={13} />
            Download Project ZIP
          </button>
        </div>
      )}
    </div>
  )
}
