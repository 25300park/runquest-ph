import { useEffect, useRef, useState } from 'react';

interface VideoAdInterstitialProps {
  onClose: () => void;
  videoSrc?: string;
  sponsorName?: string;
  sponsorUrl?: string;
  skipDelaySeconds?: number;
}

export default function VideoAdInterstitial({
  onClose,
  videoSrc = '/videos/ads/ad.mp4',
  sponsorName = 'BGC Urban Sports & Nike Manila',
  sponsorUrl = 'https://runquest-ph.vercel.app',
  skipDelaySeconds = 5
}: VideoAdInterstitialProps) {
  const [timeLeft, setTimeLeft] = useState(skipDelaySeconds);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. 카운트다운 타이머
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanSkip(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // 2. 비디오 자동 재생 보장
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay fallback
      });
    }
  }, []);

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans select-none">
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        
        {/* 상단 헤더 바: 광고 뱃지, 사운드 토글, 스킵 버튼 */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
          {/* Ad Sponsor 뱃지 */}
          <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/40 shadow-md flex items-center gap-1">
            <span>📢</span> Sponsored Ad
          </span>

          <div className="flex items-center gap-2">
            {/* 음소거 토글 버튼 */}
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              title={isMuted ? '소리 켜기' : '음소거'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {/* 스킵 버튼 / 카운트다운 */}
            {canSkip ? (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/25 active:scale-95 transition-all flex items-center gap-1 animate-pulse cursor-pointer"
              >
                <span>건너뛰기</span>
                <span>⏩</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 text-[11px] font-black border border-white/20">
                {timeLeft}초 후 스킵 가능
              </span>
            )}
          </div>
        </div>

        {/* 메인 동영상 플레이어 뷰포트 */}
        <div className="relative w-full aspect-[9/14] max-h-[480px] bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain"
            onError={(e) => {
              // 폴백: 만약 지정된 ad.mp4가 없을 경우 8.mp4로 대체
              (e.target as HTMLVideoElement).src = '/images/avatars/8.mp4';
            }}
          />

          {/* 비디오 하단 그라디언트 쉐도우 */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
        </div>

        {/* 하단 스폰서 배너 및 방문 CTA 바 */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-3 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-md font-black text-slate-950">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-black text-white">{sponsorName}</h4>
                <p className="text-[10px] text-slate-400 font-medium">BGC & Makati Runner Special Event</p>
              </div>
            </div>

            <a
              href={sponsorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black shadow-md shadow-violet-600/30 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>자세히 보기</span>
              <span>🔗</span>
            </a>
          </div>

          <p className="text-[9px] text-slate-400 text-center">
            광고 수익은 RunQuest PH 서버 운영 및 마닐라 러닝 크루 리워드로 사용됩니다.
          </p>
        </div>

      </div>
    </div>
  );
}
