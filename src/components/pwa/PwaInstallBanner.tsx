import { useState, useEffect } from 'react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export default function PwaInstallBanner() {
  const { isStandalone, isIos, showIosGuide, setShowIosGuide, promptInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 24시간 동안 배너 닫기 기억
    const dismissedUntil = localStorage.getItem('rq_pwa_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
    }
  }, []);

  function handleDismiss() {
    setIsDismissed(true);
    localStorage.setItem('rq_pwa_dismissed_until', String(Date.now() + 24 * 60 * 60 * 1000));
  }

  async function handleInstallClick() {
    await promptInstall();
  }

  // 이미 앱으로 접속했거나 배너를 닫았으면 숨김
  if (isStandalone || isDismissed) {
    return (
      <>
        {/* iOS 가이드 모달 */}
        {showIosGuide && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm mx-auto flex items-center justify-center shadow-md mb-2">
                  RQ
                </div>
                <h3 className="text-lg font-black text-slate-900">iPhone / iPad 홈 화면에 추가</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Safari 브라우저에서 아래 2단계를 진행하면 앱으로 설치됩니다.
                </p>
              </div>

              <div className="space-y-2.5 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">1</span>
                  <span>Safari 하단의 <strong>[공유 버튼 (사각형+화살표)]</strong>을 누릅니다.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">2</span>
                  <span>메뉴에서 <strong>[홈 화면에 추가 (Add to Home Screen)]</strong>를 누릅니다.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-full py-3 rounded-xl bg-violet-600 font-bold text-white text-xs shadow-md"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* 상단/하단 모던 플로팅 PWA 설치 배너 */}
      <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto">
        <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
              RQ
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">RunQuest PH 앱 다운로드</p>
              <p className="text-[10px] text-slate-400 truncate">홈 화면에 설치하고 전체 화면으로 즐겨보세요</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs shadow-md active:scale-95 transition-all"
            >
              📲 앱 설치
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* iOS 가이드 모달 */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm mx-auto flex items-center justify-center shadow-md mb-2">
                RQ
              </div>
              <h3 className="text-lg font-black text-slate-900">iPhone / iPad 홈 화면에 추가</h3>
              <p className="text-xs text-slate-500 mt-1">
                Safari 브라우저에서 아래 2단계를 진행하면 앱으로 설치됩니다.
              </p>
            </div>

            <div className="space-y-2.5 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">1</span>
                <span>Safari 하단의 <strong>[공유 버튼 (사각형+화살표)]</strong>을 누릅니다.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">2</span>
                <span>메뉴에서 <strong>[홈 화면에 추가 (Add to Home Screen)]</strong>를 누릅니다.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 rounded-xl bg-violet-600 font-bold text-white text-xs shadow-md"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
