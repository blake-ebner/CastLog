import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-blue-800 text-white shadow-md">
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
                className="bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-md font-medium transition-colors"
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
                className="bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-md font-medium transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
