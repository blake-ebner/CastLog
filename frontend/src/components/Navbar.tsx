import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

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
