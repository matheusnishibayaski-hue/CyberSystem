import { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '@/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      console.log('🔐 Iniciando login...', { email })
      const response = await apiClient.post('/api/auth/login', { email, password })
      
      console.log('✅ Resposta do servidor:', response.data)
      
      // Verificar se a resposta tem os dados esperados
      if (!response.data) {
        throw new Error('Resposta inválida do servidor')
      }
      
      const { token, user: userData } = response.data
      
      // Verificar se token e user existem
      if (!token || !userData) {
        console.error('❌ Token ou userData ausente:', { token: !!token, userData: !!userData })
        throw new Error('Token ou dados do usuário não recebidos')
      }
      
      console.log('💾 Salvando no localStorage...', { userData })
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      
      console.log('👤 Atualizando estado do usuário...')
      setUser(userData)
      
      // Forçar atualização imediata do estado
      console.log('✅ Login concluído com sucesso!')
      return { success: true, user: userData }
    } catch (error) {
      console.error('❌ Login error:', error)
      console.error('❌ Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      })
      
      // Tratamento de erros mais específico
      let errorMessage = 'Erro ao fazer login'
      
      if (error.response) {
        // Erro de resposta do servidor
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Erro ${error.response.status}: ${error.response.statusText}`
      } else if (error.request) {
        // Erro de rede (servidor não respondeu)
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
      } else if (error.message) {
        // Outro erro
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const register = async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/register', { email, password })
      
      // O registro não retorna token, então fazemos login automaticamente
      if (response.data && response.data.user) {
        // Após registro bem-sucedido, fazer login automaticamente
        const loginResult = await login(email, password)
        return loginResult
      }
      
      return { success: false, error: 'Erro ao processar registro' }
    } catch (error) {
      console.error('Register error:', error)
      
      let errorMessage = 'Erro ao registrar'
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Erro ${error.response.status}: ${error.response.statusText}`
      } else if (error.request) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
    // A navegação será feita pelo componente que chama logout
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
