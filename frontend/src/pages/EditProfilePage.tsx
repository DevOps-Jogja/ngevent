import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../lib/axios'
import { uploadToCloudinary } from '../lib/cloudinary'
import { useAuth } from '../contexts/AuthContext'
import CachedAvatar from '../components/CachedAvatar'

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  institution: string | null
  position: string | null
  city: string | null
  avatar_url: string | null
  auth_provider: 'email' | 'google'
}

type ActiveTab = 'profile' | 'security'

type ProfileFormState = {
  full_name: string
  phone: string
  institution: string
  position: string
  city: string
}

function validateNewPassword(password: string) {
  const lenOK = password.length >= 8
  const numOK = /\d/.test(password)
  return { lenOK, numOK, ok: lenOK && numOK }
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, refreshUser } = useAuth()

  const [loading, setLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [isGoogleUser, setIsGoogleUser] = useState(false)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarDragging, setAvatarDragging] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ProfileFormState>({
    full_name: '',
    phone: '',
    institution: '',
    position: '',
    city: '',
  })

  useEffect(() => {
    document.title = 'Edit Profil - NgEvent'
  }, [])

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
  })

  const securityStrength = useMemo(() => validateNewPassword(security.newPassword), [security.newPassword])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/login')
      return
    }

    const load = async () => {
      try {
        const res = await apiClient.get<Profile>('/api/profile/me')
        const profile = res.data

        setForm({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          institution: profile.institution || '',
          position: profile.position || '',
          city: profile.city || '',
        })

        setCurrentAvatarUrl(profile.avatar_url || '')
        setAvatarPreview(profile.avatar_url || '')
        setIsGoogleUser(profile.auth_provider === 'google')
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Gagal memuat profile')
      } finally {
        setAuthChecked(true)
      }
    }

    load()
  }, [authLoading, navigate, user])

  const handleFileChange = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(String(reader.result || ''))
      setAvatarFile(file)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview('')
    setAvatarFile(null)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const uploadAvatarIfNeeded = async () => {
    if (!avatarFile) return currentAvatarUrl

    try {
      const result = await uploadToCloudinary(avatarFile, 'avatar-images')
      return result.secure_url
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload avatar')
    }
  }

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.full_name.trim()) {
      alert('Nama lengkap wajib diisi')
      return
    }

    try {
      setLoading(true)

      const avatarUrl = await uploadAvatarIfNeeded()

      await apiClient.put('/api/profile/me', {
        full_name: form.full_name,
        phone: form.phone,
        institution: form.institution,
        position: form.position,
        city: form.city,
        avatar_url: avatarUrl,
      })

      await refreshUser()
      alert('Profile berhasil diupdate!')
      navigate('/dashboard')
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Gagal update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSecurity = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!security.currentPassword) {
      alert('Password saat ini wajib diisi')
      return
    }
    if (!securityStrength.ok) {
      alert('Password baru minimal 8 karakter dan harus mengandung angka')
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      alert('Konfirmasi password tidak sama')
      return
    }

    try {
      setLoading(true)
      await apiClient.post('/api/auth/change-password', {
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      })
      alert('Password berhasil diubah')
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '', showPassword: false })
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Gagal mengubah password')
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary py-12 pt-24">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-[28rem] bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary py-12 pt-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Perbarui informasi profil dan keamanan akun Anda</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 -mb-px border-b-2 font-medium transition-all ${activeTab === 'profile'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
          >
            Profil
          </button>
          {!isGoogleUser && (
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-4 py-3 -mb-px border-b-2 font-medium transition-all ${activeTab === 'security'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              Keamanan
            </button>
          )}
        </div>

        <div className="max-w-4xl">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              {/* Info for Google Users */}
              {isGoogleUser && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Login dengan Google
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Anda login menggunakan akun Google. Password dikelola oleh Google, sehingga Anda tidak perlu mengubah password di sini.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Avatar Upload */}
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Foto Profile</h2>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <div
                      className={`w-32 h-32 rounded-full overflow-hidden flex items-center justify-center ring-4 transition-all duration-300 ${avatarDragging ? 'ring-primary-500 scale-105' : 'ring-gray-100 dark:ring-gray-700'
                        } ${!avatarPreview ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white'}`}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>

                    {avatarPreview && !loading && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg z-10"
                        title="Hapus foto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div
                    className={`flex-1 w-full border-2 border-dashed rounded-xl p-6 transition-colors text-center ${avatarDragging
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500'
                      }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (!loading) setAvatarDragging(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      setAvatarDragging(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setAvatarDragging(false)
                      if (loading) return
                      const file = e.dataTransfer.files?.[0]
                      if (file) handleFileChange(file)
                    }}
                  >
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      className="hidden"
                      id="avatar-upload"
                      disabled={loading}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={`cursor-pointer flex flex-col items-center gap-2 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Klik untuk upload atau drag & drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG atau WEBP (Maks. 2MB)</p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmitProfile} className="space-y-6">
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Pribadi</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500/20 outline-none border-gray-300 dark:border-gray-700 focus:border-primary-500"
                        placeholder="Masukkan nama lengkap"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomor HP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        placeholder="08xxxxxxxxxx"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Domisili <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        placeholder="Kota tempat tinggal"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instansi/Perusahaan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.institution}
                        onChange={(e) => setForm((s) => ({ ...s, institution: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        placeholder="Nama instansi"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Jabatan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.position}
                        onChange={(e) => setForm((s) => ({ ...s, position: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        placeholder="Posisi/jabatan"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-600 dark:bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 dark:hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Menyimpan...
                      </span>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                  <Link
                    to="/dashboard"
                    className="flex-1 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center"
                  >
                    Batal
                  </Link>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && !isGoogleUser && (
            <form onSubmit={handleSubmitSecurity} className="space-y-6">
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ubah Password</h2>
                  <button
                    type="button"
                    onClick={() => setSecurity((s) => ({ ...s, showPassword: !s.showPassword }))}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    {security.showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password Saat Ini</label>
                    <input
                      type={security.showPassword ? 'text' : 'password'}
                      value={security.currentPassword}
                      onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500/20 outline-none border-gray-300 dark:border-gray-700 focus:border-primary-500"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password Baru</label>
                    <input
                      type={security.showPassword ? 'text' : 'password'}
                      value={security.newPassword}
                      onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500/20 outline-none border-gray-300 dark:border-gray-700 focus:border-primary-500"
                      placeholder="Minimal 8 karakter & ada angka"
                      disabled={loading}
                    />

                    <div className="mt-3 flex gap-4 text-xs">
                      <div
                        className={`flex items-center gap-1.5 transition-colors ${securityStrength.lenOK ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {securityStrength.lenOK ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          )}
                        </svg>
                        Minimal 8 karakter
                      </div>
                      <div
                        className={`flex items-center gap-1.5 transition-colors ${securityStrength.numOK ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {securityStrength.numOK ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          )}
                        </svg>
                        Mengandung angka
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Password Baru</label>
                    <input
                      type={security.showPassword ? 'text' : 'password'}
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500/20 outline-none border-gray-300 dark:border-gray-700 focus:border-primary-500"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 dark:bg-primary-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 dark:hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Menyimpan...
                    </span>
                  ) : (
                    'Simpan Password'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
