import { Link } from 'react-router-dom'
import { Mic, BookOpen } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function StudentHub() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">
            Xush kelibsiz, <span className="text-brand">{user?.username}</span>!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Qaysi bo'limni ochmoqchisiz?</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Speaking Part 2/3 */}
          <Link
            to="/tests/speaking"
            className="group flex flex-col items-center justify-center gap-4 p-10 rounded-2xl
              bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800
              hover:border-brand hover:shadow-xl hover:shadow-brand/10
              transition-all duration-200 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center
              group-hover:bg-brand/20 transition-colors">
              <Mic size={32} className="text-brand" />
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                SPEAKING
              </p>
              <p className="text-xl font-black text-brand tracking-tight">
                PART 2 / 3
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-normal">
                Dossierlar va namunalar
              </p>
            </div>
          </Link>

          {/* Topic Based Vocabulary */}
          <Link
            to="/vocabulary"
            className="group flex flex-col items-center justify-center gap-4 p-10 rounded-2xl
              bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800
              hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10
              transition-all duration-200 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center
              group-hover:bg-emerald-500/20 transition-colors">
              <BookOpen size={32} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Topic Based
              </p>
              <p className="text-xl font-black text-emerald-500 tracking-tight">
                Vocabulary
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-normal">
                Mavzuga oid so'z boyligi
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
