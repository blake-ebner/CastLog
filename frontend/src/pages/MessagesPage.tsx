import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  apiGetConversations,
  apiGetConversation,
  apiSendMessage,
  apiDeleteMessage,
} from '../api/client'
import type { ConversationSummary, MessageOut } from '../types'
import { useAuth } from '../context/AuthContext'

export default function MessagesPage() {
  const { userId } = useParams<{ userId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const activeFriendId = userId ? parseInt(userId, 10) : null

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [convError, setConvError] = useState('')

  const [messages, setMessages] = useState<MessageOut[]>([])
  const [msgError, setMsgError] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConversations = () => {
    apiGetConversations()
      .then(setConversations)
      .catch((e: Error) => setConvError(e.message))
  }

  useEffect(() => { loadConversations() }, [])

  useEffect(() => {
    if (!activeFriendId) {
      setMessages([])
      return
    }
    setMsgLoading(true)
    setMsgError('')
    apiGetConversation(activeFriendId)
      .then(setMessages)
      .catch((e: Error) => setMsgError(e.message))
      .finally(() => setMsgLoading(false))
  }, [activeFriendId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeFriend = conversations.find((c) => c.friend.id === activeFriendId)?.friend

  const handleSend = async () => {
    if (!activeFriendId || !input.trim()) return
    setSending(true)
    setSendError('')
    try {
      const msg = await apiSendMessage(activeFriendId, input.trim())
      setMessages((prev) => [...prev, msg])
      setInput('')
      loadConversations()
    } catch (e) {
      setSendError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (msgId: number) => {
    try {
      await apiDeleteMessage(msgId)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      loadConversations()
    } catch (e) {
      setSendError((e as Error).message)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Messages</h1>

      <div className="flex gap-4 h-[calc(100vh-14rem)] min-h-[400px]">

        {/* ── Conversation list ── */}
        <aside className="w-64 shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Conversations
          </div>
          {convError && (
            <p className="text-red-500 text-xs px-4 py-2">{convError}</p>
          )}
          {conversations.length === 0 && !convError ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm px-4 text-center">
              No conversations yet. Message a friend!
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
              {conversations.map((conv) => (
                <li key={conv.friend.id}>
                  <button
                    onClick={() => navigate(`/messages/${conv.friend.id}`)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      activeFriendId === conv.friend.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-600'
                        : ''
                    }`}
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                      @{conv.friend.username}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {conv.last_message.sender_id === user?.id ? 'You: ' : ''}
                      {conv.last_message.body}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ── Message thread ── */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          {!activeFriendId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm gap-2">
              <p className="text-3xl">💬</p>
              <p>Select a conversation, or go to a friend's profile to start one.</p>
              <Link
                to="/friends"
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs mt-1"
              >
                View Friends
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                {activeFriend ? (
                  <Link
                    to={`/users/${activeFriend.id}`}
                    className="font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                  >
                    @{activeFriend.username}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Chat</span>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {msgLoading && (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3" />
                    ))}
                  </div>
                )}
                {msgError && (
                  <p className="text-red-500 text-sm">{msgError}</p>
                )}
                {!msgLoading && messages.length === 0 && !msgError && (
                  <p className="text-center text-slate-400 dark:text-slate-500 text-sm">
                    No messages yet. Say hello!
                  </p>
                )}
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user?.id
                  const canDelete = isMine && (Date.now() - new Date(msg.created_at).getTime()) < 10 * 60 * 1000
                  const next = messages[i + 1]
                  const sameMinuteAsNext =
                    next &&
                    next.sender_id === msg.sender_id &&
                    new Date(next.created_at).toISOString().slice(0, 16) === new Date(msg.created_at).toISOString().slice(0, 16)
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}>
                      <div className={`relative max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                      }`}>
                        {msg.body}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="absolute -top-2 -left-2 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs leading-none"
                            title="Delete"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {!sameMinuteAsNext && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 px-1">
                          {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {sendError && (
                <p className="text-red-500 text-xs px-4 pb-1">{sendError}</p>
              )}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message…"
                  disabled={sending}
                  className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
