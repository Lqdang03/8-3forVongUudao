'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, UserCheck, ShieldQuestion } from 'lucide-react'

const THEMES = [
  { id: '#ec4899', name: 'Hồng Kẹo' },
  { id: '#3b82f6', name: 'Xanh Biển' },
  { id: '#8b5cf6', name: 'Tím Mộng' },
  { id: '#f59e0b', name: 'Cam Nắng' },
  { id: '#10b981', name: 'Lá Xanh' },
]

export default function WriteMode() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [styleId, setStyleId] = useState(THEMES[0].id)
  const [loading, setLoading] = useState(false)
  
  // State quản lý màn hình khóa
  const [isVerified, setIsVerified] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !message) return alert("Vui lòng nhập đủ tên và lời chúc!")

    setLoading(true)
    const { error } = await supabase
      .from('wishes')
      .insert([{ name, message, style_id: styleId }])

    if (error) {
      alert("Lỗi rồi: " + error.message)
    } else {
      alert("Gửi lời chúc thành công! Xem trên Wall nhé.")
      setMessage('')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col md:flex-row items-center justify-center gap-12 p-6 overflow-hidden">
      
      {/* MÀN HÌNH KHÓA XÁC NHẬN */}
      <AnimatePresence>
        {!isVerified && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -1000 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl bg-slate-950/80 p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-sm w-full bg-white/10 border border-white/20 p-8 rounded-[2.5rem] shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldQuestion size={40} className="text-indigo-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Xác thực người dùng</h2>
              <p className="text-white/60 mb-8">Nội dung này dành cho phái mạnh gửi gắm yêu thương. Bạn xác nhận mình là Nam chứ?</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setIsVerified(true)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <UserCheck size={20} /> Đúng, là tôi
                </button>
                
                <button 
                  onClick={() => alert("Chế độ này chỉ dành cho người gửi lời chúc!")}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 rounded-2xl text-sm transition-all"
                >
                  Không, tôi là nữ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NỘI DUNG CHÍNH (Sẽ hiện sau khi verified) */}
      {/* FORM */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-white mb-6">
          Gửi lời chúc ✨
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Tên của bạn
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-white/40 outline-none transition"
              placeholder="Nhập tên..."
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">
              Lời chúc
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-white/40 outline-none transition"
              placeholder="Viết lời chúc ý nghĩa..."
            />
          </div>

          {/* Theme selector */}
          <div>
            <label className="block text-sm text-white/70 mb-3">
              Chọn màu thẻ
            </label>
            <div className="flex gap-4">
              {THEMES.map((t) => (
                <motion.button
                  key={t.id}
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStyleId(t.id)}
                  style={{ backgroundColor: t.id }}
                  className={`w-10 h-10 rounded-full border-2 ${
                    styleId === t.id
                      ? 'border-white shadow-lg'
                      : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition disabled:bg-white/50"
          >
            {loading ? 'Đang gửi...' : <><Send size={18}/> Gửi ngay</>}
          </motion.button>

        </form>
      </motion.div>

      {/* PREVIEW */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        className="flex flex-col items-center"
      >
        <p className="text-white/60 text-sm uppercase tracking-widest mb-4">
          Xem trước
        </p>

        <motion.div
          animate={{ backgroundColor: styleId }}
          transition={{ duration: 0.4 }}
          className="w-80 h-[420px] rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(255,255,255,0.2)] flex flex-col justify-between text-white relative overflow-hidden"
        >
          {/* Glow overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

          <div className="relative space-y-6">
            <div className="h-2 w-14 bg-white/40 rounded-full" />

            <motion.p 
              layout
              className="text-2xl font-bold break-words"
            >
              {name || "Tên của bạn"}
            </motion.p>

            <motion.p 
              layout
              className="italic text-white/90 leading-relaxed break-words"
            >
              "{message || "Lời chúc của bạn sẽ xuất hiện tại đây..."}"
            </motion.p>
          </div>

          <div className="relative text-xs text-white/50 text-right">
            #guestwall
          </div>
        </motion.div>
      </motion.div>

    </main>
  )
}