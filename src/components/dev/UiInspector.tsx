import { useState, useEffect } from 'react';

export default function UiInspector() {
  const [isActive, setIsActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<{
    tagName: string;
    className: string;
    width: number;
    height: number;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null);
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('#ui-inspector-overlay') || target.closest('#ui-inspector-toggle-btn')) {
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

    window.addEventListener('mouseover', handleMouseOver);
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, [isActive]);

  return (
    <>
      {/* 플로팅 UI Inspector 토글 버튼 */}
      <div id="ui-inspector-toggle-btn" className="fixed bottom-20 right-4 z-50">
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`px-3.5 py-2 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer ${
            isActive
              ? 'bg-rose-600 text-white ring-4 ring-rose-400/40 animate-pulse'
              : 'bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-400/40 hover:bg-slate-800'
          }`}
          title="UI Inspector 실시간 검사기"
        >
          <span>🔍</span>
          <span>{isActive ? 'Inspector ON' : 'UI Inspector'}</span>
        </button>
      </div>

      {/* 실시간 UI 박스 하이라이트 & 툴팁 오버레이 */}
      {isActive && hoveredElement && (
        <div id="ui-inspector-overlay" className="pointer-events-none fixed inset-0 z-50">
          {/* 요소 영역 하이라이트 박스 */}
          <div
            style={{
              position: 'absolute',
              top: `${hoveredElement.top}px`,
              left: `${hoveredElement.left}px`,
              width: `${hoveredElement.width}px`,
              height: `${hoveredElement.height}px`,
              border: '2px solid #ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '6px',
              transition: 'all 0.05s ease-out'
            }}
          >
            {/* 정보 툴팁 배지 */}
            <div
              style={{
                position: 'absolute',
                top: hoveredElement.top > 40 ? '-32px' : '4px',
                left: '0px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '8px',
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
    </>
  );
}
