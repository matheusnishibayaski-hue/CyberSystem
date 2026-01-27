import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, User, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/AuthContext"
import toast from "react-hot-toast"

export default function Login() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  // Navegar para o dashboard quando o usuário for definido após login bem-sucedido
  useEffect(() => {
    console.log('🔍 useEffect - Verificando navegação:', { loginSuccess, user, hasUser: !!user })
    if (loginSuccess) {
      // Verificar se há token no localStorage (confirmação de login bem-sucedido)
      const token = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      
      if (token && storedUser) {
        console.log('🚀 Token encontrado no localStorage, navegando para /dashboard...')
        // Pequeno delay para garantir que tudo está sincronizado
        setTimeout(() => {
          navigate("/dashboard", { replace: true })
        }, 50)
      } else if (user) {
        console.log('🚀 Usuário no estado, navegando para /dashboard...')
        navigate("/dashboard", { replace: true })
      }
    }
  }, [user, loginSuccess, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log('📝 Submetendo formulário de login...')
      const result = await login(formData.email, formData.password)
      console.log('📊 Resultado do login:', result)

      if (result.success) {
        console.log('✅ Login bem-sucedido!')
        toast.success("Login realizado com sucesso!")
        setIsLoading(false)
        setLoginSuccess(true)
        
        // Se o resultado já tem o user, usar diretamente
        if (result.user) {
          console.log('👤 Usuário recebido no resultado, navegando imediatamente...')
          setTimeout(() => {
            navigate("/dashboard", { replace: true })
          }, 100)
        }
        // Caso contrário, o useEffect cuidará da navegação quando o user for atualizado
      } else {
        console.error('❌ Login falhou:', result.error)
        setError(result.error || "Credenciais inválidas")
        setIsLoading(false)
        setLoginSuccess(false)
      }
    } catch (error) {
      console.error('❌ Erro no handleSubmit:', error)
      setError("Erro inesperado ao fazer login")
      setIsLoading(false)
      setLoginSuccess(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-xl shadow-blue-500/25 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            CyberSystem
          </h1>
          <p className="text-gray-500 mt-2">Faça login para continuar</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Email</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="email"
                  placeholder="Digite seu email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-12 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-12 pr-12 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 text-sm mt-6"
        >
          © 2024 CyberSystem. Todos os direitos reservados.
        </motion.p>
      </motion.div>
    </div>
  )
}
