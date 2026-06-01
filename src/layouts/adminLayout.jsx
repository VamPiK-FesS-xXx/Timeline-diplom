import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminPage from '../pages/AdminPage'

function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    if (user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  if (!user || user.role !== 'admin') return null

  return (
    <div className='layout'>
      <AdminPage />
    </div>
  )
}

export default AdminLayout
