'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, UserCheck, ShieldQuestion, Heart } from 'lucide-react'

const THEMES = [
  { id: '#ec4899', name: 'Hồng Kẹo' },
  { id: '#3b82f6', name: 'Xanh Biển' },
  { id: '#8b5cf6', name: 'Tím Mộng' },
  { id: '#f59e0b', name: 'Cam Nắng' },
  { id: '#10b981', name: 'Lá Xanh' },
]

// Danh sách các icon quà tặng vui nhộn
const GIFT_ICONS = ['🎁', '☔', '🌹', '💋', '🍬', '❤️']

export default function WriteMode() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [styleId, setStyleId] = useState(THEMES[0].id)
  
  // State quản lý gửi đích danh & icon
  const [isSpecific, setIsSpecific] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [giftIcon, setGiftIcon] = useState(GIFT_ICONS[0]) // Mặc định chọn hộp quà
  
  // State hệ thống
  const [loading, setLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !message) return alert("Vui lòng nhập đủ tên và lời chúc!")
    if (isSpecific && !recipientName.trim()) return alert("Vui lòng nhập tên người nhận cụ thể!")

    setLoading(true)
    
    // Đóng gói data gửi lên Supabase
    const payload = { 
        name, 
        message, 
        style_id: styleId,
        recipient_name: isSpecific ? recipientName.trim() : null,
        gift_icon: isSpecific ? giftIcon : null // Gửi kèm icon quà
    }

    const { error } = await supabase.from('wishes').insert([payload])

    if (error) {
      alert("Lỗi rồi: " + error.message)
    } else {
      alert("Gửi lời chúc thành công! Hãy nhìn lên màn hình lớn nhé 🌸")
      // Reset form sau khi gửi
      setMessage('')
      setRecipientName('')
      setIsSpecific(false)
      setGiftIcon(GIFT_ICONS[0])
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col md:flex-row items-center justify-center gap-12 p-6 overflow-x-hidden overflow-y-auto pt-20 pb-20">
      
      {/* =====================================
          1. MÀN HÌNH KHÓA (BẢO MẬT)
      ====================================== */}
      <AnimatePresence>
        {!isVerified && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl bg-slate-950/80 p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
              className="max-w-sm w-full bg-white/10 border border-white/20 p-8 rounded-[2.5rem] shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldQuestion size={40} className="text-indigo-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Xác thực người dùng</h2>
              <p className="text-white/60 mb-8 text-sm leading-relaxed">Nội dung này dành cho phái mạnh gửi gắm yêu thương. Bạn xác nhận mình là Nam chứ?</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setIsVerified(true)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
                >
                  <UserCheck size={20} /> Đúng, là tôi
                </button>
                
                <button 
                  onClick={() => alert("Trang này chỉ dành cho người gửi lời chúc (Nam giới) thôi nhé! 🌸")}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 rounded-2xl text-sm transition-all"
                >
                  Không, tôi là nữ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================
          2. FORM NHẬP LIỆU CHÍNH
      ====================================== */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl z-10"
      >
        <h1 className="text-3xl font-bold text-white mb-6">Gửi lời chúc ✨</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* TÊN NGƯỜI GỬI */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Tên của bạn (Người gửi)</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-white/40 outline-none transition"
              placeholder="VD: Tuấn Anh..."
            />
          </div>

          {/* CHECKBOX GỬI ĐÍCH DANH */}
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => { setIsSpecific(!isSpecific); if(isSpecific) setRecipientName(''); }}>
              <input 
                  type="checkbox" 
                  checked={isSpecific} 
                  onChange={() => {}} // Đã xử lý ở thẻ div cha
                  className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500 bg-white/20 border-white/20 pointer-events-none"
              />
              <label className="text-sm font-medium text-white select-none flex-1 pointer-events-none">
                  Gửi cho một người cụ thể 💖
              </label>
          </div>

          {/* KHỐI NHẬP TÊN VÀ CHỌN ICON (Mở ra khi check) */}
          <AnimatePresence>
              {isSpecific && (
                  <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-4"
                  >
                      {/* Ô nhập tên người nhận */}
                      <div>
                          <label className="block text-sm text-pink-300 font-bold mb-2 flex items-center gap-2 pt-1">
                              <Heart size={14} className="fill-pink-400 text-pink-400" /> Tên người nhận
                          </label>
                          <input
                              required={isSpecific}
                              type="text"
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              className="w-full p-3 rounded-xl bg-pink-500/10 border border-pink-400/30 text-white placeholder-white/30 focus:ring-2 focus:ring-pink-400 outline-none transition"
                              placeholder="VD: Cô Mai, Vợ yêu..."
                          />
                      </div>

                      {/* Nơi chọn icon quà tặng */}
                      <div>
                          <label className="block text-sm text-pink-300 font-bold mb-2">Đính kèm một món quà:</label>
                          <div className="flex gap-2 justify-between bg-white/5 p-2 rounded-xl border border-white/10">
                              {GIFT_ICONS.map(icon => (
                                  <button 
                                      key={icon} type="button"
                                      onClick={() => setGiftIcon(icon)}
                                      className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                                          giftIcon === icon 
                                          ? 'bg-pink-500/40 scale-110 shadow-lg border border-pink-400/50' 
                                          : 'hover:bg-white/10 opacity-50 hover:opacity-100 grayscale hover:grayscale-0'
                                      }`}
                                  >
                                      {icon}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* LỜI CHÚC */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Lời chúc</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-white/40 outline-none transition resize-none"
              placeholder="Viết lời chúc ý nghĩa..."
            />
          </div>

          {/* CHỌN MÀU THEME */}
          <div>
            <label className="block text-sm text-white/70 mb-3">Chọn màu thẻ</label>
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
                    styleId === t.id ? 'border-white shadow-lg scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* NÚT SUBMIT */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full py-3 mt-4 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition disabled:bg-white/50"
          >
            {loading ? 'Đang gửi...' : <><Send size={18}/> Gửi ngay</>}
          </motion.button>

        </form>
      </motion.div>

      {/* =====================================
          3. LIVE PREVIEW THẺ CHÚC
      ====================================== */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        className="flex flex-col items-center z-10"
      >
        <p className="text-white/60 text-sm uppercase tracking-widest mb-4">Xem trước hiển thị</p>

        <motion.div
          animate={{ backgroundColor: styleId }}
          transition={{ duration: 0.4 }}
          className={`w-80 h-[420px] rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between text-white relative overflow-hidden transition-all duration-300 ${
            isSpecific 
                ? 'border-4 border-white/60 shadow-[0_0_40px_rgba(255,255,255,0.4)] scale-105' 
                : 'border border-white/10'
          }`}
        >
          {/* Blur Overlay nền thẻ */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

          <div className="relative space-y-4">
            <div className="h-2 w-14 bg-white/40 rounded-full mb-6" />
            
            {/* Tag To: [Tên] [Icon] */}
            <AnimatePresence>
                {isSpecific && recipientName && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white/20 px-4 py-2 rounded-xl inline-flex items-center gap-2 border border-white/30"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">To:</span>
                        <span className="font-bold text-lg">{recipientName}</span>
                        <span className="text-xl ml-1">{giftIcon}</span> {/* Hiển thị icon được chọn */}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.p layout className="italic text-white/90 leading-relaxed text-lg pt-2 break-words font-serif">
              "{message || "Lời chúc của bạn sẽ xuất hiện tại đây..."}"
            </motion.p>
          </div>

          {/* Tag From: ... */}
          <div className="relative flex justify-between items-end border-t border-white/20 pt-4 mt-4">
            <span className="text-xs font-medium uppercase opacity-70">From:</span>
            <motion.p layout className="text-xl font-bold break-words max-w-[70%] text-right">
              {name || "Tên của bạn"}
            </motion.p>
          </div>
          
        </motion.div>
      </motion.div>

    </main>
  )
}