import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { mockAreas } from '../data/mockAreas';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Step 1: 로그인 세션 감지 시 즉시 캐릭터 대시보드로 리다이렉트
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      if (!isSupabaseConfigured) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          navigate('/character-dashboard', { replace: true });
          return;
        }
      } catch {
        // 세션 체크 오류 시 랜딩 유지
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    checkAuthSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-[#0f1412] flex items-center justify-center text-stone-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-300/40 border-t-amber-300 rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-amber-200">RunQuest Checking Session...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-screen w-full bg-[#0f1412] text-stone-50 font-sans overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. 풀스크린 달리기 비디오 배경 Placeholder (Step 2)      */}
      {/* ========================================================= */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        {/* 실제 비디오 삽입 시 src에 영상 경로 지정 */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-35"
          poster="/images/landing-poster.jpg"
        >
          {/* <source src="/videos/runner-cinematic.mp4" type="video/mp4" /> */}
        </video>

        {/* 비디오 Placeholder 그래픽 & 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#facc1522,transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1412]/85 via-[#0f1412]/70 to-[#0f1412]" />
      </div>

      {/* ========================================================= */}
      {/* 2. 전면 콘텐츠 레이어 (z-10)                             */}
      {/* ========================================================= */}
      <div className="relative z-10 max-w-md mx-auto px-4 pb-12 pt-6 min-h-screen flex flex-col justify-between">
        {/* 상단 헤더 뱃지 & 브랜드 타이틀 */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-stone-950/60 px-3.5 py-1 text-xs font-black uppercase text-amber-100 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Metro Manila Quest Running
          </div>

          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-widest text-teal-400">
              Walk. Jog. Run. Level Up.
            </p>
            <h1 className="mt-2 text-5xl font-black leading-tight tracking-tight text-white drop-shadow-md">
              RunQuest <span className="text-amber-300">PH</span>
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-300 drop-shadow">
              캐릭터를 선택하고 현실의 거리를 탐험하세요. 달리는 모든 발걸음이 실제 레벨업과 보상으로 이어집니다.
            </p>
          </div>
        </div>

        {/* 하단 메인 액션 버튼 그룹 */}
        <div className="my-8 flex flex-col gap-3">
          {/* 🏠 메인 캐릭터 대시보드 바로 진입 버튼 */}
          <Link
            to="/character-dashboard"
            className="block rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 px-5 py-4 text-center text-base font-black text-white shadow-xl shadow-violet-600/30 active:scale-[0.98] transition-all border border-white/20"
          >
            🏠 Enter Dashboard (홈 대시보드 바로가기)
          </Link>

          {/* 📍 필드 테스트용 코스 빌더 즉시 진입 버튼 */}
          <Link
            to="/course-builder"
            className="group relative flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-3.5 text-center text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
          >
            <span className="text-lg">📍</span>
            <span className="tracking-wide">새로운 코스 기록하기 (테스트용)</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
          </Link>

          {/* ⚔️ 시작 / 로그인 버튼 */}
          <Link
            to="/login"
            className="block rounded-2xl border border-amber-200 bg-amber-300 px-5 py-3 text-center text-sm font-black text-stone-950 shadow-[0_4px_0_rgba(120,53,15,0.5)] transition active:translate-y-0.5"
          >
            ⚔️ Login / Account (로그인)
          </Link>
        </div>

        {/* 월드 존 프리뷰 섹션 */}
        <div className="space-y-3 pt-4 border-t border-stone-800/80">
          <div className="flex items-center justify-between text-xs font-black text-stone-400">
            <span>EXPLORATION ZONES</span>
            <span className="text-amber-300">{mockAreas.length} Active Zones</span>
          </div>

          <div className="grid gap-2">
            {mockAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-950/70 backdrop-blur-sm p-3"
              >
                <div>
                  <p className="text-[10px] font-black uppercase text-teal-400">{area.worldZone}</p>
                  <h3 className="text-sm font-black text-stone-100">{area.name}</h3>
                </div>
                <span className="rounded-lg bg-stone-900 border border-stone-700 px-2 py-1 text-[11px] font-bold text-amber-200">
                  {area.courseCount} 코스
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
