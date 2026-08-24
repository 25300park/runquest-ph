import { NavLink, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  // 특정 풀스크린 화면이나 관리자/랜딩 화면에서는 하단바 숨김
  const isExcludedRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/course-builder' ||
    location.pathname.startsWith('/course-builder/') ||
    location.pathname === '/run' ||
    location.pathname.startsWith('/activity/');

  if (isExcludedRoute) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* 1. Home 탭 */}
        <NavLink
          to="/character-dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-violet-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`
          }
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] mt-0.5">Home</span>
        </NavLink>

        {/* 2. Map 탭 */}
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-violet-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`
          }
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-[10px] mt-0.5">Map</span>
        </NavLink>

        {/* 3. Run (중앙 대형 플로팅 탭: 코스 상세에선 퀘스트 시작, 일반 화면에선 코스 제작) */}
        <div className="flex-1 flex justify-center -mt-6">
          {location.pathname.startsWith('/courses/') ? (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('runquest:start-current-course'));
              }}
              className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/40 border-4 border-white flex items-center justify-center text-2xl active:scale-95 hover:scale-105 transition-all"
              title="현재 코스 퀘스트 시작"
            >
              <span className="relative z-10">⚔️</span>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
            </button>
          ) : (
            <NavLink
              to="/course-builder"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/40 border-4 border-white flex items-center justify-center text-2xl active:scale-95 hover:scale-105 transition-all"
              title="새 코스 만들기 & 기록 (Create Route)"
            >
              🏃
            </NavLink>
          )}
        </div>

        {/* 4. Crew 탭 */}
        <NavLink
          to="/community"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-violet-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`
          }
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-[10px] mt-0.5">Crew</span>
        </NavLink>

        {/* 5. Profile 탭 */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-violet-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`
          }
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] mt-0.5">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
