import { useState, useEffect } from 'react';

interface AnnotationPin {
  id: number;
  tagName: string;
  className: string;
  textContent: string;
  width: number;
  height: number;
  top: number;
  left: number;
  note: string;
  timestamp: string;
}

export default function UiInspector() {
  const [isActive, setIsActive] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<{
    tagName: string;
    className: string;
    width: number;
    height: number;
    top: number;
    left: number;
  } | null>(null);

  const [pins, setPins] = useState<AnnotationPin[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rq_ui_inspector_pins');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [activeEditingPin, setActiveEditingPin] = useState<{
    tagName: string;
    className: string;
    textContent: string;
    width: number;
    height: number;
    top: number;
    left: number;
  } | null>(null);

  const [inputNote, setInputNote] = useState('');
  const [copyToast, setCopyToast] = useState(false);

  // 로컬스토리지 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rq_ui_inspector_pins', JSON.stringify(pins));
    }
  }, [pins]);

  // 마우스 호버 및 클릭 이벤트 핸들러
  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null);
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.closest('#ui-inspector-root') ||
        target.closest('.ui-inspector-ignore')
      ) {
        return;
      }

      const rect = target.getBoundingClientRect();
      setHoveredElement({
        tagName: target.tagName.toLowerCase(),
        className: target.className && typeof target.className === 'string' ? target.className : '',
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX
      });
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.closest('#ui-inspector-root') ||
        target.closest('.ui-inspector-ignore')
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = target.getBoundingClientRect();
      const text = target.innerText ? target.innerText.slice(0, 40).replace(/\n/g, ' ') : '';

      setActiveEditingPin({
        tagName: target.tagName.toLowerCase(),
        className: target.className && typeof target.className === 'string' ? target.className : '',
        textContent: text,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX
      });
      setInputNote('');
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('click', handleClick, true);
    };
  }, [isActive]);

  function handleSavePin() {
    if (!activeEditingPin) return;

    const newPin: AnnotationPin = {
      id: pins.length > 0 ? Math.max(...pins.map((p) => p.id)) + 1 : 1,
      tagName: activeEditingPin.tagName,
      className: activeEditingPin.className,
      textContent: activeEditingPin.textContent,
      width: activeEditingPin.width,
      height: activeEditingPin.height,
      top: activeEditingPin.top,
      left: activeEditingPin.left,
      note: inputNote.trim() || '수정 요청 내용 없음',
      timestamp: new Date().toLocaleTimeString()
    };

    setPins((prev) => [...prev, newPin]);
    setActiveEditingPin(null);
    setInputNote('');
    setShowPanel(true);
  }

  function handleDeletePin(id: number) {
    setPins((prev) => prev.filter((p) => p.id !== id));
  }

  function handleClearAllPins() {
    if (window.confirm('모든 핀과 수정 요청 메모를 삭제하시겠습니까?')) {
      setPins([]);
    }
  }

  // 마크다운 형식으로 클립보드 복사
  function handleCopyMarkdown() {
    if (pins.length === 0) return;

    const markdown = [
      `# 📋 RunQuest PH UI 수정 요청 리스트 (${pins.length}건)`,
      `**작성 일시:** ${new Date().toLocaleString()}`,
      `**페이지 URL:** ${window.location.href}`,
      '',
      ...pins.map((pin) => {
        return [
          `### 📍 Pin #${pin.id} [${pin.tagName.toUpperCase()}]`,
          `- **요소 텍스트:** \`${pin.textContent || '(텍스트 없음)'}\``,
          `- **크기:** \`${pin.width}px × ${pin.height}px\``,
          `- **Tailwind 클래스:** \`${pin.className || '없음'}\``,
          `- **수정 요청 사항:** 👉 **${pin.note}**`,
          ''
        ].join('\n');
      }),
      '---',
      '위 수정 요청 사항을 검토하고 코드에 정확하게 반영해줘.'
    ].join('\n');

    navigator.clipboard.writeText(markdown).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    });
  }

  return (
    <div id="ui-inspector-root">
      {/* 1. 화면 우측 하단 플로팅 컨트롤 바 */}
      <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 ui-inspector-ignore select-none">
        {/* 수정 리스트 열기 버튼 */}
        {pins.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPanel(!showPanel)}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-2xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-white/20"
          >
            <span>📋</span>
            <span>수정 리스트 ({pins.length})</span>
          </button>
        )}

        {/* Inspector 활성화 토글 버튼 */}
        <button
          type="button"
          onClick={() => {
            setIsActive(!isActive);
            setActiveEditingPin(null);
          }}
          className={`px-4 py-2 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer border ${
            isActive
              ? 'bg-rose-600 text-white ring-4 ring-rose-400/40 animate-pulse border-rose-300'
              : 'bg-slate-900/95 backdrop-blur-md text-amber-300 border-amber-400/40 hover:bg-slate-800'
          }`}
          title="UI Inspector 실시간 검사기"
        >
          <span>🔍</span>
          <span>{isActive ? 'Inspector 켜짐 (요소 클릭하여 핀 꽂기)' : 'UI Inspector'}</span>
        </button>
      </div>

      {/* 2. 호버 시 요소 하이라이트 오버레이 */}
      {isActive && hoveredElement && !activeEditingPin && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div
            style={{
              position: 'absolute',
              top: `${hoveredElement.top}px`,
              left: `${hoveredElement.left}px`,
              width: `${hoveredElement.width}px`,
              height: `${hoveredElement.height}px`,
              border: '2px dashed #ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '6px',
              transition: 'all 0.05s ease-out'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: hoveredElement.top > 35 ? '-30px' : '4px',
                left: '0px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: '1px solid #334155',
                whiteSpace: 'nowrap',
                display: 'flex',
                gap: '6px',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#38bdf8' }}>&lt;{hoveredElement.tagName}&gt;</span>
              <span style={{ color: '#fbbf24' }}>{hoveredElement.width} × {hoveredElement.height}px</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. 화면 위에 고정된 번호 핀(Pins) 렌더링 */}
      {pins.map((pin) => (
        <div
          key={pin.id}
          style={{
            position: 'absolute',
            top: `${pin.top - 14}px`,
            left: `${pin.left - 14}px`,
            zIndex: 45
          }}
          className="ui-inspector-ignore group cursor-pointer"
          onClick={() => setShowPanel(true)}
          title={`Pin #${pin.id}: ${pin.note}`}
        >
          <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-2xl border-2 border-white ring-2 ring-rose-400 animate-bounce">
            #{pin.id}
          </div>
          {/* 호버 시 메모 툴팁 */}
          <div className="hidden group-hover:block absolute left-10 top-0 bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap z-50">
            <span className="font-black text-amber-300">#{pin.id} 수정 메모:</span>
            <p className="mt-0.5 text-slate-200">{pin.note}</p>
          </div>
        </div>
      ))}

      {/* 4. [모달] 클릭한 요소에 수정 메모 입력하기 */}
      {activeEditingPin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 ui-inspector-ignore font-sans">
          <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-700 space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                  #{pins.length + 1}
                </span>
                <h3 className="font-black text-sm text-white">UI 수정 요청 라벨 작성</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveEditingPin(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* 선택된 요소 정보 요약 */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-bold">&lt;{activeEditingPin.tagName}&gt;</span>
                <span className="text-amber-300">{activeEditingPin.width} × {activeEditingPin.height}px</span>
              </div>
              {activeEditingPin.textContent && (
                <p className="text-slate-400 truncate">텍스트: "{activeEditingPin.textContent}"</p>
              )}
            </div>

            {/* 수정 내용 입력란 */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                수정 요청 내용 (Memo):
              </label>
              <textarea
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                placeholder="예: 이 버튼의 배경색을 보라색으로 바꾸고 글자 크기를 키워주세요."
                rows={3}
                autoFocus
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveEditingPin(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSavePin}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-xs font-black text-white shadow-md shadow-violet-600/30"
              >
                핀 라벨 저장 📍
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. [사이드 패널] 전체 수정 요청 목록 및 클립보드 복사 */}
      {showPanel && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-900 text-white shadow-2xl border-l border-slate-800 flex flex-col ui-inspector-ignore font-sans animate-in slide-in-from-right duration-300">
          {/* 패널 상단 헤더 */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <h3 className="font-black text-sm text-white">UI 수정 요청 목록 ({pins.length})</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPanel(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* 목록 바디 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pins.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                <span className="text-3xl block">📍</span>
                <p className="font-bold">등록된 수정 요청 핀이 없습니다.</p>
                <p className="text-[11px]">화면에서 요소를 클릭하여 핀을 꽂아보세요!</p>
              </div>
            ) : (
              pins.map((pin) => (
                <div
                  key={pin.id}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                        #{pin.id}
                      </span>
                      <span className="text-xs font-mono text-sky-400 font-bold">&lt;{pin.tagName}&gt;</span>
                      <span className="text-[10px] text-slate-400">({pin.width}×{pin.height}px)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePin(pin.id)}
                      className="text-slate-400 hover:text-rose-400 text-xs p-1 cursor-pointer"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>

                  <p className="text-xs font-bold text-amber-200 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    👉 {pin.note}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/50 font-mono">
                    <span className="truncate max-w-[180px]">텍스트: {pin.textContent || '(없음)'}</span>
                    <span>{pin.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 패널 하단 액션 버튼 */}
          {pins.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>📋</span>
                <span>수정사항 전체 복사 (AI 전달용)</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllPins}
                className="w-full py-2 text-center text-[11px] font-bold text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                전체 핀 초기화
              </button>
            </div>
          )}
        </div>
      )}

      {/* 복사 완료 토스트 알림 */}
      {copyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-2xl animate-in fade-in slide-in-from-bottom duration-200 flex items-center gap-2">
          <span>✅</span>
          <span>마크다운 형식으로 클립보드에 복사되었습니다! 채팅창에 붙여넣기(Ctrl+V)하세요.</span>
        </div>
      )}
    </div>
  );
}
