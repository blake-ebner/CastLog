import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { apiGetFriends, apiGetConversations } from '../api/client'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (!user) { setPendingCount(0); setUnreadMessages(0); return }
    apiGetFriends().then((d) => setPendingCount(d.incoming_requests.length)).catch(() => {})
    const lastViewed = localStorage.getItem('messages_last_viewed')
    apiGetConversations().then((convs) => {
      const count = convs.filter((c) =>
        c.last_message.sender_id !== user.id &&
        (!lastViewed || new Date(c.last_message.created_at) > new Date(lastViewed))
      ).length
      setUnreadMessages(count)
    }).catch(() => {})
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-blue-800 dark:bg-slate-900 text-white shadow-md border-b border-transparent dark:border-slate-700 transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight hover:text-blue-200 transition-colors">
          CastLog
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-blue-200 transition-colors">
            Feed
          </Link>

          {user ? (
            <>
              <Link
                to="/log"
                className="bg-blue-500 hover:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600 px-3 py-1.5 rounded-md font-medium transition-colors"
              >
                + Log Catch
              </Link>
              <Link
                to="/messages"
                className="relative hover:text-blue-200 transition-colors"
                onClick={() => { setUnreadMessages(0); localStorage.setItem('messages_last_viewed', new Date().toISOString()) }}
              >
                Messages
                {unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    !
                  </span>
                )}
              </Link>
              <Link
                to="/friends"
                className="relative hover:text-blue-200 transition-colors"
                onClick={() => setPendingCount(0)}
              >
                Friends
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    !
                  </span>
                )}
              </Link>
              <Link
                to={`/users/${user.id}`}
                className="hover:text-blue-200 transition-colors"
              >
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-blue-200 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200 transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-500 hover:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600 px-3 py-1.5 rounded-md font-medium transition-colors"
              >
                Sign up
              </Link>
            </>
          )}

          <button
            onClick={toggle}
            className="text-sm px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors font-medium"
          >
            {dark ? 'Light Mode' : 'Night Mode'}
          </button>
        </div>
      </div>
    </nav>
  )
}
