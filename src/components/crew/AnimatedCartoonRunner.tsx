import type { CrewMotionType } from '../../services/crewPlazaService';

export interface CartoonRunnerAppearance {
  hairColor?: string;
  hairStyle?: 'wavy' | 'ponytail' | 'spiky' | 'bob';
  skinColor?: string;
  hasGlasses?: boolean;
}

interface AnimatedCartoonRunnerProps {
  motion: CrewMotionType;
  facing: 'left' | 'right';
  level: number;
  tierNumber: 1 | 2 | 3 | 4;
  isReady?: boolean;
  isMe?: boolean;
  appearance?: CartoonRunnerAppearance;
}

export default function AnimatedCartoonRunner({
  motion,
  facing,
  level,
  tierNumber,
  isReady = false,
  isMe = false,
  appearance,
}: AnimatedCartoonRunnerProps) {
  const hairColor = appearance?.hairColor ?? '#1e293b';
  const hairStyle = appearance?.hairStyle ?? 'wavy';
  const skinColor = appearance?.skinColor ?? '#fde4cf';
  const hasGlasses = appearance?.hasGlasses ?? isMe;

  const hasNeonShoes = level >= 2 || tierNumber >= 2;
  const hasScarf = level >= 3 || tierNumber >= 2;
  const hasGoggles = level >= 4 || tierNumber >= 2;
  const hasBackpack = (level >= 5 && level < 8) || tierNumber === 3;
  const hasCloak = level >= 8 || tierNumber === 4;
  const hasVisor = level >= 9 || tierNumber === 4;
  const hasSprintAura = level >= 7 || tierNumber >= 3 || isReady;

  // 티어별 상의 색상
  const torsoMainColor =
    tierNumber === 4
      ? '#fef3c7'
      : tierNumber === 3
        ? '#0d9488'
        : tierNumber === 2
          ? '#10b981'
          : '#ffffff';
  const torsoAccentColor =
    tierNumber === 4
      ? '#f59e0b'
      : tierNumber === 3
        ? '#fbbf24'
        : tierNumber === 2
          ? '#047857'
          : '#34d399';
  const shoeColor =
    tierNumber === 4 ? '#f59e0b' : hasNeonShoes ? '#10b981' : '#3b82f6';

  const happyEyes = motion === 'highfive' || motion === 'stretch';

  return (
    <div
      className={`relative w-[58px] h-[72px] select-none pointer-events-none cartoon-rig-${motion}`}
      style={{
        transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
      }}
    >
      <svg
        viewBox="0 0 120 150"
        className="w-full h-full overflow-visible drop-shadow-[0_6px_8px_rgba(15,23,42,0.45)]"
      >
        {/* 1. 바닥 그림자 */}
        <ellipse
          cx="60"
          cy="138"
          rx="24"
          ry="6"
          fill="rgba(15, 23, 42, 0.38)"
          className="rig-shadow"
        />

        {/* 2. 발밑 질주 오라 (Lv.7+ 또는 READY 상태) */}
        {hasSprintAura && (
          <g className="rig-aura">
            <ellipse
              cx="60"
              cy="135"
              rx="31"
              ry="9"
              fill="none"
              stroke={tierNumber === 4 ? '#fbbf24' : '#34d399'}
              strokeWidth="2.5"
              strokeDasharray="8 6"
              opacity="0.85"
            />
            <path
              d="M26 128 Q20 112 32 102"
              fill="none"
              stroke="#6ee7b7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M94 128 Q100 112 88 102"
              fill="none"
              stroke="#fde047"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 전체 바디 그룹 (점프/바운스/스트레칭 시 상하 움직임) */}
        <g className="rig-whole-body">
          {/* 3. 등 뒤 망토(Lv.8+) 또는 탐험 배낭(Lv.5~7) */}
          {hasCloak && (
            <g className="rig-cloak" style={{ transformOrigin: '54px 62px' }}>
              <path
                d="M48 60 Q20 88 16 124 Q38 130 56 118 Z"
                fill="#047857"
                stroke="#1e293b"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M46 64 Q25 90 22 120"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          )}

          {hasBackpack && (
            <g className="rig-backpack" style={{ transformOrigin: '52px 72px' }}>
              <rect
                x="30"
                y="62"
                width="20"
                height="28"
                rx="6"
                fill="#0f766e"
                stroke="#1e293b"
                strokeWidth="3"
              />
              <rect
                x="33"
                y="56"
                width="14"
                height="8"
                rx="4"
                fill="#f59e0b"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* 4. 뒤쪽 팔 (Left Arm) - 어깨 관절 (48, 66) */}
          <g className="rig-arm-back" style={{ transformOrigin: '48px 66px' }}>
            <path
              d="M48 66 Q38 80 36 92"
              fill="none"
              stroke="#1e293b"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M48 66 Q38 80 36 92"
              fill="none"
              stroke={skinColor}
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* 소매 */}
            <path
              d="M48 66 Q43 73 41 78"
              fill="none"
              stroke={torsoMainColor}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle
              cx="36"
              cy="94"
              r="5.5"
              fill={skinColor}
              stroke="#1e293b"
              strokeWidth="2.8"
            />
          </g>

          {/* 5. 뒤쪽 다리 (Left Leg) - 고관절 (52, 96) */}
          <g className="rig-leg-back" style={{ transformOrigin: '52px 96px' }}>
            {/* 허벅지 & 종아리 */}
            <path
              d="M52 96 L46 126"
              stroke="#1e293b"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M52 96 L46 126"
              stroke={skinColor}
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* 러닝 쇼츠 */}
            <path
              d="M52 96 L49 110"
              stroke="#1e293b"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <path
              d="M52 96 L49 110"
              stroke="#334155"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* 러닝화 */}
            <path
              d="M39 125 H56 Q61 125 61 131 H38 Q36 128 39 125 Z"
              fill={shoeColor}
              stroke="#1e293b"
              strokeWidth="2.8"
            />
            <line
              x1="38"
              y1="131"
              x2="60"
              y2="131"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
          </g>

          {/* 6. 몸통 & 레벨별 의상 (Torso) - 허리 중심 (60, 92) */}
          <g className="rig-torso" style={{ transformOrigin: '60px 92px' }}>
            {/* 기본 상의 몸통 */}
            <rect
              x="44"
              y="60"
              width="32"
              height="38"
              rx="12"
              fill={torsoMainColor}
              stroke="#1e293b"
              strokeWidth="3.2"
            />
            {/* 의상 디테일: Tier 1 민트 스트라이프 / Tier 2 하이드레이션 조끼 / Tier 3 윈드브레이커 / Tier 4 마스터 아머 */}
            <path
              d="M46 76 H74"
              stroke={torsoAccentColor}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {tierNumber >= 2 && (
              <>
                {/* 트레일 베스트 / 재킷 조끼 라인 */}
                <path
                  d="M48 61 V95 M72 61 V95"
                  stroke={torsoAccentColor}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                {/* 미니 수통 포켓 */}
                <rect
                  x="48"
                  y="72"
                  width="6"
                  height="11"
                  rx="2"
                  fill="#38bdf8"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
                <rect
                  x="66"
                  y="72"
                  width="6"
                  height="11"
                  rx="2"
                  fill="#fbbf24"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
              </>
            )}
          </g>

          {/* 7. 앞쪽 다리 (Right Leg) - 고관절 (68, 96) */}
          <g className="rig-leg-front" style={{ transformOrigin: '68px 96px' }}>
            <path
              d="M68 96 L74 126"
              stroke="#1e293b"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M68 96 L74 126"
              stroke={skinColor}
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* 러닝 쇼츠 */}
            <path
              d="M68 96 L71 110"
              stroke="#1e293b"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <path
              d="M68 96 L71 110"
              stroke="#1e293b"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* 앞쪽 러닝화 */}
            <path
              d="M66 125 H83 Q88 125 88 131 H65 Q63 128 66 125 Z"
              fill={shoeColor}
              stroke="#1e293b"
              strokeWidth="2.8"
            />
            <line
              x1="65"
              y1="131"
              x2="87"
              y2="131"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
          </g>

          {/* 8. 바람에 날리는 에메랄드 스카프 (Lv.3+) */}
          {hasScarf && (
            <g className="rig-scarf" style={{ transformOrigin: '56px 60px' }}>
              <path
                d="M44 58 Q60 65 76 58 Q74 66 58 67 Q44 66 44 58 Z"
                fill="#10b981"
                stroke="#1e293b"
                strokeWidth="2.8"
              />
              {/* 휘날리는 스카프 꼬리 */}
              <path
                d="M46 62 Q26 66 18 78 Q28 84 44 70 Z"
                fill="#059669"
                stroke="#1e293b"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* 9. 머리 & 디즈니/애니풍 표정 (Head) - 목 관절 (60, 56) */}
          <g className="rig-head" style={{ transformOrigin: '60px 56px' }}>
            {/* 뒷머리 (포니테일/단발인 경우) */}
            {hairStyle === 'ponytail' && (
              <path
                d="M40 32 Q22 36 20 52 Q30 54 40 42 Z"
                fill={hairColor}
                stroke="#1e293b"
                strokeWidth="3"
              />
            )}

            {/* 얼굴 윤곽 */}
            <circle
              cx="60"
              cy="38"
              r="21"
              fill={skinColor}
              stroke="#1e293b"
              strokeWidth="3.2"
            />

            {/* 귀 */}
            <circle
              cx="39"
              cy="40"
              r="4.5"
              fill={skinColor}
              stroke="#1e293b"
              strokeWidth="2.8"
            />

            {/* 볼터치 */}
            <ellipse cx="49" cy="43" rx="3.8" ry="2.2" fill="#fda4af" opacity="0.75" />
            <ellipse cx="75" cy="43" rx="3.8" ry="2.2" fill="#fda4af" opacity="0.75" />

            {/* 눈 (행복 표정 vs 기본 깜빡임 눈) */}
            {happyEyes ? (
              <g stroke="#1e293b" strokeWidth="2.8" fill="none" strokeLinecap="round">
                <path d="M50 37 Q54 32 58 37" />
                <path d="M68 37 Q72 32 76 37" />
              </g>
            ) : (
              <g className="rig-eyes" style={{ transformOrigin: '63px 36px' }}>
                <ellipse cx="54" cy="36" rx="3.3" ry="4.2" fill="#1e293b" />
                <circle cx="55.2" cy="34.5" r="1.3" fill="#ffffff" />
                <ellipse cx="72" cy="36" rx="3.3" ry="4.2" fill="#1e293b" />
                <circle cx="73.2" cy="34.5" r="1.3" fill="#ffffff" />
              </g>
            )}

            {/* 입 (생동감 있는 만화 표정) */}
            {motion === 'highfive' || motion === 'ready' ? (
              <path
                d="M57 45 Q63 52 69 45 Z"
                fill="#f43f5e"
                stroke="#1e293b"
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
            ) : motion === 'stretch' ? (
              <circle
                cx="63"
                cy="46"
                r="2.8"
                fill="#f43f5e"
                stroke="#1e293b"
                strokeWidth="2.2"
              />
            ) : (
              <path
                d="M58 45 Q63 49 68 45"
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            )}

            {/* 동그란 안경 (착용 캐릭터) */}
            {hasGlasses && !hasVisor && (
              <g stroke="#1e293b" strokeWidth="2.2" fill="rgba(255,255,255,0.25)">
                <circle cx="54" cy="36" r="6.5" />
                <circle cx="72" cy="36" r="6.5" />
                <line x1="60.5" y1="36" x2="65.5" y2="36" />
              </g>
            )}

            {/* 홀로그램 AR 바이저 (Lv.9+) */}
            {hasVisor && (
              <rect
                x="45"
                y="30"
                width="36"
                height="11"
                rx="5"
                fill="rgba(16, 185, 129, 0.55)"
                stroke="#fbbf24"
                strokeWidth="2.4"
              />
            )}

            {/* 앞머리 & 헤어스타일 */}
            {hairStyle === 'spiky' ? (
              <path
                d="M38 34 Q40 14 54 16 L58 10 L68 16 L78 12 Q84 22 81 34 Q72 24 60 26 Q48 24 38 34 Z"
                fill={hairColor}
                stroke="#1e293b"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            ) : hairStyle === 'bob' ? (
              <path
                d="M38 42 Q36 15 60 15 Q84 15 82 40 Q76 26 62 25 Q46 25 38 42 Z"
                fill={hairColor}
                stroke="#1e293b"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M38 34 Q40 14 60 14 Q82 14 82 33 Q74 23 64 26 Q54 21 46 28 Q41 28 38 34 Z"
                fill={hairColor}
                stroke="#1e293b"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            )}

            {/* 이마 위 탐험가 고글 (Lv.4+) */}
            {hasGoggles && (
              <g>
                <path
                  d="M40 25 Q60 20 80 25"
                  fill="none"
                  stroke="#78350f"
                  strokeWidth="4"
                />
                <rect
                  x="45"
                  y="18"
                  width="13"
                  height="9"
                  rx="4"
                  fill="#34d399"
                  stroke="#1e293b"
                  strokeWidth="2.4"
                />
                <rect
                  x="62"
                  y="18"
                  width="13"
                  height="9"
                  rx="4"
                  fill="#34d399"
                  stroke="#1e293b"
                  strokeWidth="2.4"
                />
              </g>
            )}
          </g>

          {/* 10. 앞쪽 팔 (Right Arm) + 손목 밴드/GPS 워치 - 어깨 관절 (72, 66) */}
          <g className="rig-arm-front" style={{ transformOrigin: '72px 66px' }}>
            <path
              d="M72 66 Q82 80 84 92"
              fill="none"
              stroke="#1e293b"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M72 66 Q82 80 84 92"
              fill="none"
              stroke={skinColor}
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* 소매 */}
            <path
              d="M72 66 Q77 73 79 78"
              fill="none"
              stroke={torsoMainColor}
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* 손목 스포츠 밴드 / GPS 워치 */}
            <rect
              x="79"
              y="84"
              width="9"
              height="5"
              rx="2"
              transform="rotate(-12 83 86)"
              fill={level >= 5 ? '#38bdf8' : '#10b981'}
              stroke="#1e293b"
              strokeWidth="2"
            />
            <circle
              cx="84"
              cy="94"
              r="5.5"
              fill={skinColor}
              stroke="#1e293b"
              strokeWidth="2.8"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
