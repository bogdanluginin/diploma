
import { useState, useEffect, useRef } from 'react'
import { Send, User, Bot, Activity, Thermometer, AlertTriangle, Menu, X, Trash2, Copy, Check, Stethoscope, FileText, ChevronRight, LayoutGrid, Settings, Search, Pill, HeartPulse, Edit2, Sun, Moon } from 'lucide-react'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [chats, setChats] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [responseFormat, setResponseFormat] = useState('text') // 'text' or 'table'
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [theme, setTheme] = useState('dark')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchChats()
  }, [])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleApiError = (e, context) => {
    console.error(`Error in ${context}: `, e)
    setError(`Failed to ${context}. Please try again.`)
  }

  const fetchChats = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chats')
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status} `)
      const data = await res.json()
      setChats(data)
    } catch (e) {
      handleApiError(e, "fetch chats")
    }
  }

  const createNewChat = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chats/new', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status} `)
      const data = await res.json()
      setSessionId(data.session_id)
      setMessages([])
      fetchChats()
    } catch (e) {
      handleApiError(e, "create new chat")
    }
  }

  const loadChat = async (id) => {
    try {
      setSessionId(id)
      const res = await fetch(`http://127.0.0.1:8000/api/chats/${id}/messages`)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      setMessages(data)
    } catch (e) {
      handleApiError(e, "load chat")
    }
  }

  const deleteChat = async (id, e) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this chat?")) return

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/chats/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      if (sessionId === id) {
        setSessionId(null)
        setMessages([])
      }
      fetchChats()
    } catch (e) {
      handleApiError(e, "delete chat")
    }
  }

  const startEditing = (chat, e) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    // Only edit the name part, keep the ID hidden from edit but append it later
    setEditTitle(chat.title.split('|')[0].trim())
  }

  const saveTitle = async (id, e) => {
    e.stopPropagation()
    if (!editTitle.trim()) {
      setEditingChatId(null)
      return
    }

    try {
      // Re-append the ID
      const chat = chats.find(c => c.id === id)
      const idPart = chat.title.split('|')[1] || chat.id.slice(0, 8)
      const newFullTitle = `${editTitle.trim()} | ${idPart.trim()}`

      const res = await fetch(`http://127.0.0.1:8000/api/chats/${id}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newFullTitle })
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      setEditingChatId(null)
      fetchChats()
    } catch (e) {
      handleApiError(e, "rename chat")
    }
  }

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      saveTitle(id, e)
    } else if (e.key === 'Escape') {
      setEditingChatId(null)
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !sessionId) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMsg.content,
          response_format: responseFormat
        })
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, logs: data.logs }])
      fetchChats() // Update titles
    } catch (e) {
      console.error("Failed to send message", e)
      setError("Failed to send message. Check your connection.")
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not connect to server. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#F5F5F7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-teal-500/30 transition-colors duration-300">
      {/* Apple-style Mesh Gradient - Very subtle and diffused */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30 dark:opacity-100 transition-opacity duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/20 dark:bg-teal-900/20 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-400/20 dark:bg-cyan-900/20 blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full bg-transparent dark:bg-slate-800/20 blur-[120px]"></div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[70] bg-rose-950/90 backdrop-blur-2xl border border-rose-500/30 text-rose-100 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in-down">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
            <AlertTriangle size={18} className="text-rose-400" />
          </div>
          <span className="font-medium text-sm tracking-wide">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:bg-white/10 rounded-full p-1 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sidebar - Clinical Dark/Light Mode */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-80 bg-white/70 dark:bg-[#0f172a]/90 backdrop-blur-2xl border-r border-black/10 dark:border-slate-800/50 transform transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) md:relative md:translate-x-0 flex flex-col shadow-2xl shadow-black/5",
        !isSidebarOpen && "-translate-x-full md:hidden"
      )}>
        <div className="p-6 pt-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/30">
              <HeartPulse size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-xl text-slate-900 dark:text-white tracking-tight">MedCouncil</h1>
              <p className="text-xs text-teal-700 dark:text-teal-400 font-medium tracking-wide">CLINICAL AI</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-4 mb-2">
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-black/5 dark:bg-slate-900/50 border-none dark:border dark:border-slate-700/50 rounded-lg py-2 pl-9 pr-4 text-[13px] text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-gray-500 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full py-2 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] duration-200 text-sm"
          >
            <span className="text-xl leading-none font-light">+</span> New Consultation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide">
          <div className="px-3 text-[10px] font-bold text-gray-700 dark:text-slate-500 uppercase tracking-widest mb-2 mt-4">Recent Cases</div>

          {chats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
            <div
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={clsx(
                "group w-full text-left py-3 px-3 rounded-xl text-[13px] transition-all cursor-pointer flex items-center justify-between border",
                sessionId === chat.id
                  ? "bg-black/5 dark:bg-teal-900/20 dark:border dark:border-teal-500/30 text-black dark:text-teal-100 font-medium"
                  : "text-gray-700 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden w-full">
                <div className={clsx("w-2 h-2 rounded-full flex-shrink-0", sessionId === chat.id ? "bg-teal-500 dark:bg-teal-400" : "bg-gray-300 dark:bg-slate-700")}></div>
                <div className="flex flex-col overflow-hidden w-full">
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, chat.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      onBlur={(e) => saveTitle(chat.id, e)}
                      className="bg-slate-900/80 border border-teal-500/50 rounded px-2 py-1 text-xs text-white focus:outline-none w-full"
                    />
                  ) : (
                    <>
                      <div className="flex justify-between items-baseline w-full">
                        <span className="truncate font-medium text-[13px]">{chat.title.split('|')[0]}</span>
                      </div>
                      <span className="text-[10px] font-mono tracking-wider text-teal-700 dark:text-teal-500/80">
                        ID: {chat.title.split('|')[1] || chat.id.slice(0, 8)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => startEditing(chat, e)}
                  className="p-1.5 hover:bg-teal-100 dark:hover:bg-teal-500/20 hover:text-teal-700 dark:hover:text-teal-400 rounded-lg transition-all mr-1"
                  title="Rename Chat"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg transition-all"
                  title="Delete Chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-black/10 dark:border-slate-800/50 text-xs text-gray-600 dark:text-slate-400 flex justify-between items-center bg-transparent">
          <button onClick={toggleTheme} className="flex items-center gap-2 hover:text-teal-700 dark:hover:text-teal-400 transition-colors font-semibold">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> System Online</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-transparent">
        {/* Header - Glassmorphic Navbar */}
        <header className="h-14 border-b border-black/10 dark:border-slate-800/50 bg-white/70 dark:bg-[#0f172a]/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            {sessionId ? (
              <div className="flex items-center gap-4 animate-fade-in">
                <div className="flex items-center gap-2 bg-black/5 dark:bg-teal-900/20 py-1 px-3 rounded-md dark:border dark:border-teal-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400"></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-teal-200">Patient</span>
                  <span className="font-mono text-xs text-gray-500 dark:text-teal-100">{sessionId.slice(0, 8)}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-800 dark:text-slate-400 text-sm font-medium">No Active Session</div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/5 dark:bg-slate-900/50 p-0.5 rounded-lg flex dark:border dark:border-slate-700/50">
              <button
                onClick={() => setResponseFormat('text')}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                  responseFormat === 'text' ? "bg-white dark:bg-teal-600 text-black dark:text-white shadow-sm" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300"
                )}
              >
                <FileText size={12} /> Text
              </button>
              <button
                onClick={() => setResponseFormat('table')}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                  responseFormat === 'table' ? "bg-white dark:bg-teal-600 text-black dark:text-white shadow-sm" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300"
                )}
              >
                <LayoutGrid size={12} /> Table
              </button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          {!sessionId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in-up">
              <div className="w-20 h-20 bg-white dark:bg-[#1e293b] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl shadow-black/5 dark:shadow-black/20 dark:border dark:border-slate-700/50">
                <Stethoscope size={48} className="text-teal-600 dark:text-teal-500 drop-shadow-lg" />
              </div>
              <h2 className="text-4xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">MedCouncil AI</h2>
              <p className="text-slate-700 dark:text-slate-400 max-w-md text-lg leading-relaxed font-light">
                Advanced clinical decision support system. <br />Select a patient case or start a new consultation.
              </p>
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto pb-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={clsx("flex gap-5 animate-fade-in-up", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-900/30 mt-1">
                      <Bot size={18} className="text-white" />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[75%]">
                    {msg.logs && msg.logs.length > 0 && (
                      <div className="bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-md border border-black/5 dark:border-slate-700/50 rounded-xl p-4 text-xs space-y-2 mb-2">
                        <div className="font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 text-[10px]">
                          <Activity size={12} className="text-teal-600 dark:text-teal-400" /> Clinical Reasoning
                        </div>
                        {msg.logs.map((log, i) => (
                          <div key={i} className="text-gray-900 dark:text-slate-400 pl-3 border-l-2 border-teal-500/30 leading-relaxed font-mono text-[11px]">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={clsx(
                      "p-5 rounded-[1.25rem] shadow-sm border relative group/msg text-[15px] leading-relaxed backdrop-blur-sm transition-all duration-300",
                      msg.role === 'user'
                        ? "bg-teal-600 text-white border-teal-500/50 rounded-tr-sm shadow-teal-900/20"
                        : "bg-white dark:bg-[#1e293b]/80 text-black dark:text-slate-100 border-black/5 dark:border-slate-700/50 rounded-2xl rounded-tl-sm shadow-sm"
                    )}>
                      <div className="prose prose-invert prose-sm max-w-none [&>*]:text-black dark:[&>*]:text-slate-100">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ node, ...props }) => (
                              <div className="my-4 relative group/table">
                                <div className="overflow-x-auto rounded-lg border border-black/5 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/30">
                                  <table className="w-full text-left text-sm" {...props} />
                                </div>
                                <button
                                  onClick={() => {
                                    const tableText = node.position ? msg.content.slice(node.position.start.offset, node.position.end.offset) : "";
                                    copyToClipboard(tableText, `table-${idx}`)
                                  }}
                                  className="absolute top-3 right-3 p-2 bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg opacity-0 group-hover/table:opacity-100 transition-all backdrop-blur-md"
                                  title="Copy Table"
                                >
                                  {copiedId === `table-${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                              </div>
                            ),
                            thead: ({ node, ...props }) => <thead className="bg-black/5 dark:bg-slate-800/50 text-gray-900 dark:text-slate-200 uppercase text-xs font-semibold tracking-wider" {...props} />,
                            th: ({ node, ...props }) => <th className="px-4 py-2 border-b border-black/5 dark:border-slate-700/50" {...props} />,
                            td: ({ node, ...props }) => <td className="px-4 py-2 border-b border-black/5 dark:border-slate-700/50 text-black dark:text-slate-200" {...props} />,
                            tr: ({ node, ...props }) => <tr className="hover:bg-black/5 dark:hover:bg-slate-700/20 transition-colors" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-3 last:mb-0 text-black dark:text-slate-100" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-3 space-y-1 marker:text-teal-500" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-3 space-y-1 marker:text-teal-500" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-1 text-black dark:text-slate-100" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-teal-800 dark:text-teal-100" {...props} />,
                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 text-slate-900 dark:text-white" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 text-teal-900 dark:text-teal-100 mt-4" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 text-teal-800 dark:text-teal-100 mt-3" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      <button
                        onClick={() => copyToClipboard(msg.content, idx)}
                        className={clsx(
                          "absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover/msg:opacity-100 transition-all backdrop-blur-md",
                          msg.role === 'user' ? "bg-teal-500 hover:bg-teal-600 text-white" : "bg-black/5 dark:bg-slate-700/50 hover:bg-black/10 dark:hover:bg-slate-600/50 text-gray-700 dark:text-slate-200"
                        )}
                        title="Copy Message"
                      >
                        {copiedId === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={16} className="text-gray-500 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-5 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg mt-1">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="bg-white dark:bg-[#1e293b]/80 border border-black/5 dark:border-slate-700/50 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Area - Floating Glass Bar */}
        {sessionId && (
          <div className="p-6 bg-transparent sticky bottom-0 z-30">
            <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative group">
              <div className="relative flex items-center bg-white/80 dark:bg-[#1e293b]/90 backdrop-blur-xl border border-black/10 dark:border-slate-700/50 rounded-full shadow-lg shadow-black/5 dark:shadow-black/50 transition-all focus-within:ring-2 focus-within:ring-teal-500/50">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter clinical data..."
                  className="w-full bg-transparent text-gray-900 dark:text-slate-200 py-3 pl-6 pr-14 focus:outline-none placeholder:text-gray-500 dark:placeholder:text-slate-400 text-[15px]"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-900/30 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="text-center mt-3 text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                AI-generated medical advice. Always verify with clinical protocols.
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
