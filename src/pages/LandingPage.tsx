import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { mockAreas } from '../data/mockAreas';
import {
  clearCustomLandingVideo,
  loadCustomCharacterVideoUrl,
  loadCustomLandingVideoUrl,
  saveCustomLandingVideo,
} from '../utils/customMediaStorage';

export default function LandingPage() {
  const landingVideoInputRef = useRef<HTMLInputElement | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [landingVideoUrl, setLandingVideoUrl] = useState<string | null>(null);
  const [videoNotice, setVideoNotice] = useState('');

  // 저장된 커스텀 랜딩/캐릭터 달리는 영상 로드 (로그인 여부와 무관하게 랜딩 페이지에서 내 달리는 영상 감상 가능)
  useEffect(() => {
    let isMounted = true;

    async function initLandingMedia() {
      try {
        if (isSupabaseConfigured) {
          await supabase.auth.getSession();
        }
      } catch {
        // ignore
      }

      const customLanding = await loadCustomLandingVideoUrl();
      if (customLanding && isMounted) {
        setLandingVideoUrl(customLanding);
        setIsCheckingAuth(false);
        return;
      }
      const customCharVideo = await loadCustomCharacterVideoUrl();
      if (customCharVideo && isMounted) {
        setLandingVideoUrl(customCharVideo);
      }
      if (isMounted) {
        setIsCheckingAuth(false);
      }
    }

    void initLandingMedia();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLandingVideoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setVideoNotice('⚠️ 동영상 파일(MP4, WebM, MOV 등)을 선택해 주세요.');
      return;
    }

    try {
      const url = await saveCustomLandingVideo(file);
      setLandingVideoUrl(url);
      setVideoNotice(`🎬 랜딩 페이지 배경 영상(${file.name})이 적용되었습니다!`);
      setTimeout(() => setVideoNotice(''), 4000);
    } catch {
      setVideoNotice('⚠️ 영상 업로드 중 오류가 발생했습니다.');
    } finally {
      e.target.value = '';
    }
  }

  async function handleResetLandingVideo() {
    await clearCustomLandingVideo();
    setLandingVideoUrl(null);
    setVideoNotice('기본 랜딩 배경으로 복구되었습니다.');
    setTimeout(() => setVideoNotice(''), 3000);
  }

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-[#0f1412] flex items-center justify-center text-stone-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-300/40 border-t-amber-300 rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-amber-200">
            RunQuest Checking Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-screen w-full bg-[#0f1412] text-stone-50 font-sans overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. 풀스크린 달리기 비디오 배경 레이어                      */}
      {/* ========================================================= */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <video
          key={landingVideoUrl || 'default-landing-video'}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-65"
          poster="/images/explorer-tiers/tier-1-novice.jpg"
        >
          {landingVideoUrl ? (
            <source src={landingVideoUrl} />
          ) : (
            <>
              <source src="/videos/landing.mp4" type="video/mp4" />
              <source src="/videos/runner-cinematic.mp4" type="video/mp4" />
              <source src="/images/avatars/8.mp4" type="video/mp4" />
            </>
          )}
        </video>

        {/* 비디오 가독성 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#facc1522,transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1412]/70 via-[#0f1412]/45 to-[#0f1412]/95" />
      </div>

      {/* ========================================================= */}
      {/* 2. 전면 콘텐츠 레이어 (z-10)                             */}
      {/* ========================================================= */}
      <div className="relative z-10 max-w-md mx-auto px-4 pb-12 pt-6 min-h-screen flex flex-col justify-between">
        {/* 상단 헤더 뱃지 & 랜딩 영상 직접 업로드 버튼 */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-stone-950/60 px-3.5 py-1 text-xs font-black uppercase text-amber-100 backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Metro Manila Quest Running
            </div>

            <div className="flex items-center gap-1.5">
              <input
                ref={landingVideoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={handleLandingVideoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => landingVideoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 text-[11px] font-black shadow-lg backdrop-blur-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                title="랜딩 페이지 배경 영상 업로드"
              >
                <span>🎬</span>
                <span>랜딩 영상 올리기</span>
              </button>
              {landingVideoUrl && (
                <button
                  type="button"
                  onClick={() => void handleResetLandingVideo()}
                  className="px-2.5 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-[10px] font-bold border border-stone-700 cursor-pointer"
                  title="기본 배경으로 초기화"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {videoNotice && (
            <div className="mt-3 rounded-2xl bg-emerald-950/90 border border-emerald-400/50 px-3.5 py-2 text-xs font-black text-emerald-200 backdrop-blur-md shadow-lg">
              {videoNotice}
            </div>
          )}

          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-widest text-teal-400">
              Walk. Jog. Run. Level Up.
            </p>
            <h1 className="mt-2 text-5xl font-black leading-tight tracking-tight text-white drop-shadow-md">
              RunQuest <span className="text-amber-300">PH</span>
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-200 drop-shadow">
              내 얼굴로 만든 탐험가 캐릭터와 함께 현실의 거리를 탐험하세요. 달리는 모든 발걸음이 실제 레벨업과 보상으로 이어집니다.
            </p>
          </div>
        </div>

        {/* 하단 메인 액션 버튼 그룹 */}
        <div className="my-8 flex flex-col gap-3">
          {/* 🗺️ 탐험 지도 (World Map) 바로 진입 버튼 */}
          <Link
            to="/map"
            className="group relative flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-4 text-center text-base font-black text-slate-950 shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all"
          >
            <span className="text-xl">🗺️</span>
            <span className="tracking-wide">Explore Map (탐험 지도 둘러보기)</span>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400" />
            </span>
          </Link>

          {/* 🏠 메인 캐릭터 대시보드 진입 버튼 */}
          <Link
            to="/character-dashboard"
            className="block rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 px-5 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-violet-600/30 active:scale-[0.98] transition-all border border-white/20"
          >
            🏠 Enter Dashboard (캐릭터 대시보드)
          </Link>

          {/* 📸 내 얼굴로 AI 캐릭터 & 모션 영상 만들기 바로가기 */}
          <Link
            to="/character/create"
            className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/50 bg-emerald-950/75 backdrop-blur-md px-5 py-3 text-center text-xs font-black text-emerald-200 hover:bg-emerald-900/80 active:scale-[0.98] transition-all"
          >
            <span>📸</span>
            <span>내 얼굴 사진 · 캐릭터 영상 스튜디오</span>
          </Link>

          {/* 🏃 자유 러닝 및 당일 운동 기록 (코스 제작 지원) */}
          <Link
            to="/course-builder"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 backdrop-blur-md px-5 py-3 text-center text-xs font-black text-amber-200 hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            <span>🏃</span>
            <span>자유 운동 기록 / 코스 제작 (Free Run)</span>
          </Link>

          {/* ⚔️ 로그인 / 계정 관리 버튼 */}
          <Link
            to="/login"
            className="block rounded-2xl border border-amber-200/60 bg-amber-300/90 px-5 py-2.5 text-center text-xs font-black text-stone-950 shadow-sm transition active:translate-y-0.5"
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
