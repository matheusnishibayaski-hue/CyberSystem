import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Aguardar o loading inicial terminar
    if (isLoading) {
      return
    }

    // Verificar autenticação: token no localStorage OU user no estado
    const token = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    // Se não há token E não há user, redirecionar para login
    if (!token && !user) {
      console.log('❌ ProtectedRoute - Sem autenticação, redirecionando para /login')
      navigate('/login', { replace: true })
      return
    }

    // Se há token mas não há user ainda, validar o token
    if (token && storedUser && !user) {
      try {
        JSON.parse(storedUser) // Validar JSON
        // Token válido, aguardar o estado ser atualizado
        console.log('✅ ProtectedRoute - Token encontrado, aguardando atualização do estado...')
      } catch (e) {
        // JSON inválido, limpar e redirecionar
        console.error('❌ ProtectedRoute - JSON inválido no localStorage')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        navigate('/login', { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  // Mostrar loading enquanto verifica autenticação inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    )
  }

  // Verificar autenticação antes de renderizar
  const token = localStorage.getItem('auth_token')
  const storedUser = localStorage.getItem('auth_user')
  const hasAuth = (token && storedUser) || user

  // Se não tem autenticação, não renderizar (será redirecionado pelo useEffect)
  if (!hasAuth) {
    return null
  }

  // Renderizar conteúdo protegido
  return children
}
