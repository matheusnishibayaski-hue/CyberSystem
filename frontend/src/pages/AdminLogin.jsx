import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Lock, UserPlus, Mail, Key, Edit, Trash2, Ban, CheckCircle } from "lucide-react";
import TerminalBackground from "@/components/hacker/TerminalBackground";
import SkullAnimation from "@/components/hacker/SkullAnimation";
import apiClient from "@/api/client";
import toast from "react-hot-toast";

const MASTER_KEY = "yUf0XORGZ%G7ml%Pl7&q";

export default function AdminLogin({ onBack }) {
  const navigate = useNavigate();
  const [masterKey, setMasterKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  useEffect(() => {
    if (!showIntro) {
      setTimeout(() => setShowLogin(true), 500);
    }
  }, [showIntro]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
      const response = await apiClient.get('/api/auth/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      if (masterKey === MASTER_KEY) {
        localStorage.setItem("admin_auth", "true");
        setIsAuthenticated(true);
        toast.success("Chave mestra validada!");
      } else {
        setError("CHAVE MESTRA INVÁLIDA");
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");

    if (!newUserEmail || !newUserPassword) {
      setError("Email e senha são obrigatórios");
      return;
    }

    setIsCreatingUser(true);

    try {
      const response = await apiClient.post('/api/auth/admin/create-user', {
        email: newUserEmail,
        password: newUserPassword
      });

      toast.success("Usuário criado com sucesso!");
      setNewUserEmail("");
      setNewUserPassword("");
      setShowCreateForm(false);
      loadUsers();
      setIsCreatingUser(false);
    } catch (error) {
      setError(error.response?.data?.message || "Erro ao criar usuário");
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user.id);
    setEditEmail(user.email);
    setEditPassword("");
    setError("");
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError("");

    if (!editEmail) {
      setError("Email é obrigatório");
      return;
    }

    setIsCreatingUser(true);

    try {
      const updateData = { email: editEmail };
      if (editPassword) {
        updateData.password = editPassword;
      }

      await apiClient.put(`/api/auth/admin/users/${editingUser}`, updateData);

      toast.success("Usuário atualizado com sucesso!");
      setEditingUser(null);
      setEditEmail("");
      setEditPassword("");
      loadUsers();
      setIsCreatingUser(false);
    } catch (error) {
      setError(error.response?.data?.message || "Erro ao atualizar usuário");
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) {
      return;
    }

    try {
      await apiClient.delete(`/api/auth/admin/users/${userId}`);
      toast.success("Usuário excluído com sucesso!");
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao excluir usuário");
    }
  };

  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      await apiClient.patch(`/api/auth/admin/users/${userId}/toggle-status`);
      toast.success(currentStatus ? "Usuário bloqueado!" : "Usuário desbloqueado!");
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao alterar status do usuário");
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
      <AnimatePresence>
        {showIntro && <SkullAnimation onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>
      
      <TerminalBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <AnimatePresence>
          {showLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl"
            >
              {/* Main Container */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(255, 0, 0, 0.3)',
                    '0 0 50px rgba(255, 0, 0, 0.6)',
                    '0 0 30px rgba(255, 0, 0, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative bg-black/95 border-2 border-red-500 p-10 backdrop-blur-md"
              >
                {/* Animated corners */}
                <div className="absolute top-0 left-0 w-10 h-10">
                  <motion.div
                    className="absolute top-0 left-0 border-t-4 border-l-4 border-red-500 w-full h-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="absolute top-0 right-0 w-10 h-10">
                  <motion.div
                    className="absolute top-0 right-0 border-t-4 border-r-4 border-red-500 w-full h-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 w-10 h-10">
                  <motion.div
                    className="absolute bottom-0 left-0 border-b-4 border-l-4 border-red-500 w-full h-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-10 h-10">
                  <motion.div
                    className="absolute bottom-0 right-0 border-b-4 border-r-4 border-red-500 w-full h-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  />
                </div>

                {/* Header */}
                <div className="text-center mb-10">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <motion.div
                      className="w-1 h-10 bg-red-500"
                      animate={{ scaleY: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <motion.svg
                      width="70"
                      height="70"
                      viewBox="0 0 24 24"
                      fill="none"
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <rect x="5" y="11" width="14" height="10" stroke="#ff0000" strokeWidth="2.5" fill="none" rx="1" />
                      <path d="M7 11V7a5 5 0 0110 0v4" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="12" cy="16" r="2" fill="#ff0000">
                        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <line x1="12" y1="18" x2="12" y2="19.5" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" />
                    </motion.svg>
                    <motion.div
                      className="w-1 h-10 bg-red-500"
                      animate={{ scaleY: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                    />
                  </div>

                  <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-red-500 mb-3 tracking-wider"
                  >
                    ⚠ ÁREA RESTRITA ⚠
                  </motion.h1>
                  <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-4" />
                  <p className="text-sm text-green-400 tracking-wide">
                    [ ACESSO EXCLUSIVO PARA ADMINISTRADORES DO SISTEMA ]
                  </p>
                </div>

                {/* Terminal Header */}
                <div className="mb-6 border-b border-green-900 pb-3">
                  <div className="flex items-center gap-2 text-xs text-green-500">
                    <Terminal className="w-4 h-4" />
                    <span>root@cybersystem-admin:~#</span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!isAuthenticated ? (
                    <motion.div
                      key="master-key-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className="flex items-center gap-2 text-sm text-green-400 mb-3">
                            <Lock className="w-4 h-4" />
                            <span>CHAVE_MESTRA_ADMINISTRATIVA:</span>
                          </label>
                          <motion.input
                            type="password"
                            value={masterKey}
                            onChange={(e) => setMasterKey(e.target.value)}
                            whileFocus={{ scale: 1.02 }}
                            className="w-full bg-black border-2 border-green-500 text-green-400 px-5 py-4 font-mono text-base focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all"
                            placeholder="████████████████████"
                            disabled={isLoading}
                            autoFocus
                          />
                          <div className="mt-2 text-xs text-green-700">
                            → Digite a chave mestra para prosseguir
                          </div>
                        </div>

                        {error && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm flex items-start gap-3"
                          >
                            <div className="text-2xl">⚠</div>
                            <div>
                              <div className="font-bold mb-1">ACESSO NEGADO</div>
                              <div>{error}</div>
                            </div>
                          </motion.div>
                        )}

                        <div className="h-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => onBack ? onBack() : navigate("/login")}
                            className="border-2 border-green-600 text-green-500 hover:bg-green-500/10 hover:border-green-400 py-3 px-4 text-sm font-bold transition-all"
                          >
                            ← VOLTAR
                          </button>
                          
                          <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                            className="bg-red-500 hover:bg-red-600 text-black font-bold py-3 px-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
                          >
                            {isLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                                />
                                VERIFICANDO...
                              </span>
                            ) : (
                              "ACESSAR SISTEMA →"
                            )}
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="user-management"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Header */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-green-400 mb-2">GERENCIAMENTO DE USUÁRIOS</h2>
                        <div className="h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent" />
                      </div>

                      {/* Botão Criar Usuário */}
                      {!showCreateForm && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setShowCreateForm(true)}
                          className="w-full border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-3 px-4 font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-5 h-5" />
                          CRIAR NOVO ACESSO
                        </motion.button>
                      )}

                      {/* Formulário de Criação */}
                      {showCreateForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-2 border-green-500/30 p-6 bg-black/50"
                        >
                          <h3 className="text-green-400 mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            CRIAR NOVO USUÁRIO
                          </h3>
                          <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                              <label className="flex items-center gap-2 text-sm text-green-400 mb-2">
                                <Mail className="w-4 h-4" />
                                <span>E-MAIL:</span>
                              </label>
                              <input
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                disabled={isCreatingUser}
                                placeholder="usuario@exemplo.com"
                                className="w-full bg-black border border-green-500/30 px-4 py-2 outline-none text-green-400 placeholder:text-green-900 focus:border-green-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm text-green-400 mb-2">
                                <Key className="w-4 h-4" />
                                <span>SENHA:</span>
                              </label>
                              <input
                                type="password"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                disabled={isCreatingUser}
                                placeholder="Digite a senha..."
                                className="w-full bg-black border border-green-500/30 px-4 py-2 outline-none text-green-400 placeholder:text-green-900 focus:border-green-500"
                                required
                              />
                              <div className="mt-1 text-xs text-green-700">
                                → Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo
                              </div>
                            </div>
                            {error && (
                              <div className="text-red-400 text-sm">! {error}</div>
                            )}
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCreateForm(false);
                                  setNewUserEmail("");
                                  setNewUserPassword("");
                                  setError("");
                                }}
                                className="flex-1 border border-green-600 text-green-500 hover:bg-green-500/10 py-2 px-4 text-sm font-bold transition-all"
                              >
                                CANCELAR
                              </button>
                              <button
                                type="submit"
                                disabled={isCreatingUser}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 transition-all disabled:opacity-50"
                              >
                                {isCreatingUser ? "CRIANDO..." : "CRIAR USUÁRIO"}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}

                      {/* Lista de Usuários */}
                      <div className="border-2 border-green-500/30 p-6 bg-black/50">
                        <h3 className="text-green-400 mb-4 text-lg">USUÁRIOS CADASTRADOS</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {users.length === 0 ? (
                            <p className="text-green-600 text-sm text-center py-4">
                              Nenhum usuário cadastrado
                            </p>
                          ) : (
                            users.map((user) => (
                              <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 bg-green-500/5 border-2 rounded ${
                                  user.is_active ? 'border-green-500/20' : 'border-red-500/50'
                                }`}
                              >
                                {editingUser === user.id ? (
                                  <form onSubmit={handleUpdateUser} className="space-y-3">
                                    <div>
                                      <label className="text-xs text-green-400 mb-1 block">E-MAIL:</label>
                                      <input
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        disabled={isCreatingUser}
                                        className="w-full bg-black border border-green-500/30 px-3 py-2 outline-none text-green-400 placeholder:text-green-900 focus:border-green-500 text-sm"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-green-400 mb-1 block">NOVA SENHA (deixe em branco para manter):</label>
                                      <input
                                        type="password"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        disabled={isCreatingUser}
                                        placeholder="Deixe em branco para manter a senha atual"
                                        className="w-full bg-black border border-green-500/30 px-3 py-2 outline-none text-green-400 placeholder:text-green-900 focus:border-green-500 text-sm"
                                      />
                                    </div>
                                    {error && editingUser === user.id && (
                                      <div className="text-red-400 text-xs">! {error}</div>
                                    )}
                                    <div className="flex gap-2">
                                      <button
                                        type="submit"
                                        disabled={isCreatingUser}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-3 text-xs transition-all disabled:opacity-50"
                                      >
                                        SALVAR
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingUser(null);
                                          setEditEmail("");
                                          setEditPassword("");
                                          setError("");
                                        }}
                                        className="flex-1 border border-green-600 text-green-500 hover:bg-green-500/10 py-2 px-3 text-xs font-bold transition-all"
                                      >
                                        CANCELAR
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-green-400" />
                                        <span className="text-green-400 font-mono text-sm">{user.email}</span>
                                        {!user.is_active && (
                                          <span className="text-red-400 text-xs font-bold">[BLOQUEADO]</span>
                                        )}
                                      </div>
                                      <span className="text-green-600 text-xs">
                                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t border-green-500/10">
                                      <button
                                        onClick={() => handleEditUser(user)}
                                        className="flex-1 border border-green-500/30 hover:bg-green-500/10 text-green-400 py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1"
                                      >
                                        <Edit className="w-3 h-3" />
                                        EDITAR
                                      </button>
                                      <button
                                        onClick={() => handleToggleBlock(user.id, user.is_active)}
                                        className={`flex-1 border py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                          user.is_active
                                            ? 'border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-400'
                                            : 'border-green-500/30 hover:bg-green-500/10 text-green-400'
                                        }`}
                                      >
                                        {user.is_active ? (
                                          <>
                                            <Ban className="w-3 h-3" />
                                            BLOQUEAR
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="w-3 h-3" />
                                            DESBLOQUEAR
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="flex-1 border border-red-500/30 hover:bg-red-500/10 text-red-400 py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        EXCLUIR
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Botão Voltar */}
                      <button
                        onClick={() => onBack ? onBack() : navigate("/login")}
                        className="w-full border-2 border-green-600 text-green-500 hover:bg-green-500/10 hover:border-green-400 py-3 px-4 text-sm font-bold transition-all"
                      >
                        ← VOLTAR PARA LOGIN
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-8 mb-6" />

                {/* Footer warning */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-center"
                >
                  <div className="text-red-400 text-xs tracking-widest mb-2">
                    ⚠ ACESSO MONITORADO E REGISTRADO ⚠
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
