'use client'

import React, { useState, useEffect, useRef } from 'react'
import { hybridStore } from '@/lib/supabase/hybridStore'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  X,
  FileCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export default function ClassroomResourcesModal({
  code,
  role = 'student',
  isOpen,
  onClose,
}) {
  const [resources, setResources] = useState([])
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const fileInputRef = useRef(null)

  const loadResources = async () => {
    if (!code) return
    const list = await hybridStore.getResources(code)
    setResources(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    if (!isOpen) return
    loadResources()

    const unsubscribe = hybridStore.subscribe(code, (msg) => {
      if (msg.type === 'NEW_RESOURCE' || msg.type === 'RESOURCES_UPDATED') {
        loadResources()
      }
    })
    return () => unsubscribe()
  }, [code, isOpen])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadTitle.trim()) return

    const user = hybridStore.getCurrentUser()
    const fileName = selectedFile ? selectedFile.name : `${uploadTitle}.pdf`
    const fileSize = selectedFile
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      : '1.8 MB'

    let fileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    if (selectedFile) {
      fileUrl = URL.createObjectURL(selectedFile)
    }

    await hybridStore.uploadResource(code, {
      title: uploadTitle.trim(),
      fileName,
      fileType: fileName.endsWith('.pdf') ? 'pdf' : 'doc',
      fileSize,
      description: uploadDesc.trim() || 'Shared classroom study material.',
      url: fileUrl,
      uploaded_by: user?.name || 'Instructor',
    })

    setToastMsg(`Resource "${uploadTitle}" shared with students!`)
    setTimeout(() => setToastMsg(''), 3000)

    setUploadTitle('')
    setUploadDesc('')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await loadResources()
  }

  const handleDelete = async (id) => {
    await hybridStore.deleteResource(code, id)
    await loadResources()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Classroom Resources & PDFs</h3>
              <p className="text-xs text-slate-500">
                Downloadable lecture notes, slides, and reference files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toastMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* PDF Preview Modal if opened */}
        {previewPdfUrl && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl max-w-3xl w-full h-[80vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <span className="font-bold text-sm text-slate-900">Document Preview</span>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-100">
                <FileText className="w-16 h-16 text-brand-500 mb-3" />
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Accessible Lecture Resource
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Standard PDF reader view. You can download or view this document directly in a new tab.
                </p>
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Open Full Document
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Available Documents ({resources.length})
          </p>

          {resources.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No resources shared yet</p>
            </div>
          ) : (
            resources.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-200 bg-white hover:bg-slate-50/50 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {res.fileType || 'PDF'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{res.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{res.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>{res.fileSize}</span>
                      <span>•</span>
                      <span>By {res.uploaded_by}</span>
                      <span>•</span>
                      <span>{res.uploaded_at}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewPdfUrl(res.url)}
                    className="p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <a
                    href={res.url}
                    download={res.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  {role === 'teacher' && (
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove Resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* TEACHER: Upload PDF form */}
        {role === 'teacher' && (
          <div className="pt-4 border-t border-slate-100 shrink-0">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-brand-500" />
              Upload New PDF / Resource for Students
            </p>

            <form onSubmit={handleUpload} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Document Title (e.g. Chapter 4 Slides)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <input
                  type="text"
                  placeholder="Brief note for students..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png"
                  onChange={handleFileChange}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition shadow-xs shrink-0"
                >
                  Share PDF
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
