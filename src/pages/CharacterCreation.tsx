import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockCharacters } from '../data/mockCharacters';
import { createCharacter } from '../services/characterService';
import {
  acquireAndEquipLevelGear,
  CHARACTER_GENERATION_RULES,
  EXPLORER_OUTFIT_TIERS,
  generateAnimeExplorerCharacter,
  getConfiguredGeminiApiKey,
  getEquippedLevelGears,
  getExplorerOutfitTier,
  getExplorerOutfitTierByNumber,
  getModularGearState,
  getSavedFaceProfile,
  LEVEL_EQUIPMENT_PROGRESSION,
  normalizeUploadedFacePhoto,
  setConfiguredGeminiApiKey,
  toggleEquipLevelGear,
  UNIFIED_CHARACTER_VIDEO_PIPELINE,
} from '../services/aiCharacterService';
import {
  clearCustomCharacterVideo,
  getPreferredCharacterDisplayMode,
  loadCustomCharacterVideoUrl,
  saveCustomCharacterVideo,
  setPreferredCharacterDisplayMode,
} from '../utils/customMediaStorage';
import {
  getGameProgress,
  getRankTitleForLevel,
  getRunnerName,
  getSelectedCharacterId,
  setCharacterLevelForGrowth,
  setRunnerName,
  setSelectedCharacterId,
} from '../utils/gameProgress';
import { calculateLevelFromXp } from '../utils/xp';

export default function CharacterCreation() {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const [currentLevel, setCurrentLevel] = useState(() => {
    const p = getGameProgress();
    return calculateLevelFromXp(p.totalXp);
  });
  const currentLevelTier = getExplorerOutfitTier(currentLevel);
  const rankTitle = getRankTitleForLevel(currentLevel);

  const [modularGearState, setModularGearState] = useState(() =>
    getModularGearState(currentLevel)
  );
  const equippedGears = getEquippedLevelGears(currentLevel);

  const [name, setName] = useState(() => getRunnerName());
  const [selectedClassId, setSelectedClassIdState] = useState(() => getSelectedCharacterId());

  const [selectedTierNumber, setSelectedTierNumber] = useState<1 | 2 | 3 | 4>(() => {
    const savedAvatar =
      typeof window !== 'undefined' ? window.localStorage.getItem('runquest-selected-avatar') : null;
    if (savedAvatar?.includes('tier-2')) return 2;
    if (savedAvatar?.includes('tier-3')) return 3;
    if (savedAvatar?.includes('tier-4')) return 4;
    if (savedAvatar?.includes('tier-1')) return 1;
    return 1;
  });

  const activeTier = getExplorerOutfitTierByNumber(selectedTierNumber);
  const activeClassObj =
    mockCharacters.find((c) => c.id === selectedClassId) ?? mockCharacters[0];

  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    const saved =
      typeof window !== 'undefined' ? window.localStorage.getItem('runquest-selected-avatar') : null;
    if (
      saved &&
      (saved.startsWith('data:image/') || saved.startsWith('/images/explorer-tiers/'))
    ) {
      return saved;
    }
    return EXPLORER_OUTFIT_TIERS[0].fallbackImage;
  });

  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'video' | 'image'>(() =>
    getPreferredCharacterDisplayMode()
  );

  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(null);
  const [uploadedPhotoData, setUploadedPhotoData] = useState<{
    base64Data: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [traitNotes, setTraitNotes] = useState(() => {
    const savedProfile = getSavedFaceProfile();
    return savedProfile?.detectedTraitsSummary ?? '';
  });

  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getConfiguredGeminiApiKey());

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void loadCustomCharacterVideoUrl().then((url) => {
      if (url) {
        setCustomVideoUrl(url);
        setDisplayMode(getPreferredCharacterDisplayMode());
      }
    });
  }, []);

  function handleStepLevelUp(nextLevel: number) {
    const clamped = Math.max(1, Math.min(10, nextLevel));
    setCharacterLevelForGrowth(clamped);
    setCurrentLevel(clamped);
    const res = acquireAndEquipLevelGear(clamped, 'quest', clamped);
    setModularGearState(res.state);
    setSelectedTierNumber(res.appliedTier.tierNumber);
    setSelectedAvatar(res.appliedTier.fallbackImage);
    setStatus(`🎉 Lv.${clamped} 달성! ${res.message}`);
  }

  function handleAcquireGear(targetLevel: number, method: 'quest' | 'gold') {
    const res = acquireAndEquipLevelGear(targetLevel, method, currentLevel);
    setModularGearState(res.state);
    if (res.success) {
      setSelectedTierNumber(res.appliedTier.tierNumber);
      setSelectedAvatar(res.appliedTier.fallbackImage);
    }
    setStatus(res.message);
  }

  function handleToggleEquipGear(targetLevel: number) {
    const res = toggleEquipLevelGear(targetLevel, currentLevel);
    setModularGearState(res.state);
    setSelectedTierNumber(res.appliedTier.tierNumber);
    setSelectedAvatar(res.appliedTier.fallbackImage);
    const gearObj = LEVEL_EQUIPMENT_PROGRESSION.find((g) => g.level === targetLevel);
    setStatus(
      res.isEquipped
        ? `✨ [Lv.${targetLevel} ${gearObj?.itemName}] 장비를 캐릭터에 장착했습니다!`
        : `👕 [Lv.${targetLevel} ${gearObj?.itemName}] 장비를 해제했습니다.`
    );
  }

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('📸 얼굴 사진 특징을 분석하고 있습니다...');
    try {
      const normalized = await normalizeUploadedFacePhoto(file);
      setFacePreviewUrl(normalized.previewDataUrl);
      setUploadedPhotoData({
        base64Data: normalized.base64Data,
        mimeType: normalized.mimeType,
        fileName: file.name,
      });

      await triggerAiGeneration({
        base64Data: normalized.base64Data,
        mimeType: normalized.mimeType,
        fileName: file.name,
        tierNumber: selectedTierNumber,
      });
    } catch (err) {
      setStatus(
        err instanceof Error ? `⚠️ ${err.message}` : '⚠️ 사진 처리 중 오류가 발생했습니다.'
      );
    } finally {
      e.target.value = '';
    }
  }

  async function handleVideoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setStatus('⚠️ 동영상 파일(MP4, WebM, MOV 등)을 선택해 주세요.');
      return;
    }

    setStatus('🎬 나만의 캐릭터 모션 영상을 적용하고 있습니다...');
    try {
      const videoUrl = await saveCustomCharacterVideo(file);
      setCustomVideoUrl(videoUrl);
      setDisplayMode('video');
      setStatus(`🎬 캐릭터 모션 영상(${file.name})이 성공적으로 적용되었습니다!`);
    } catch (err) {
      setStatus(
        err instanceof Error ? `⚠️ ${err.message}` : '⚠️ 영상 저장 중 오류가 발생했습니다.'
      );
    } finally {
      e.target.value = '';
    }
  }

  async function handleRemoveCustomVideo() {
    await clearCustomCharacterVideo();
    setCustomVideoUrl(null);
    setDisplayMode('image');
    setStatus('🖼️ 모션 영상이 해제되어 캐릭터 일러스트 모드로 전환되었습니다.');
  }

  function handleDownloadCharacterImage() {
    const a = document.createElement('a');
    a.href = selectedAvatar;
    a.download = `${(name.trim() || 'runquest-explorer').replace(/\s+/g, '-')}-tier-${selectedTierNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatus('📥 캐릭터 일러스트 이미지를 저장했습니다! 이 이미지로 모션 영상을 제작해 업로드해 보세요.');
  }

  async function triggerAiGeneration(params: {
    base64Data: string;
    mimeType: string;
    fileName: string;
    tierNumber: 1 | 2 | 3 | 4;
  }) {
    setIsGenerating(true);
    const targetTier = getExplorerOutfitTierByNumber(params.tierNumber);
    setStatus(
      `🎨 애니메이션 RPG 탐험가 화풍 + [${targetTier.outfitName}] 복장으로 캐릭터화 중...`
    );

    try {
      if (apiKeyInput.trim() !== getConfiguredGeminiApiKey()) {
        setConfiguredGeminiApiKey(apiKeyInput);
      }

      const result = await generateAnimeExplorerCharacter({
        base64Data: params.base64Data,
        mimeType: params.mimeType,
        fileName: params.fileName,
        level: targetTier.minLevel,
        traitNotes,
      });

      setSelectedAvatar(result.avatarUrl);
      setDisplayMode('image');
      setPreferredCharacterDisplayMode('image');
      setStatus(
        result.mode === 'gemini-ai'
          ? `✨ Gemini AI 변환 완료! (${result.tier.titleKo} • ${result.tier.outfitName})`
          : `✨ 애니메이션 RPG 탐험가 캐릭터 변환 완료! (${result.tier.titleKo} • ${result.tier.outfitName})`
      );
    } catch {
      setSelectedAvatar(targetTier.fallbackImage);
      setStatus(`✨ 애니메이션 RPG 탐험가 캐릭터가 준비되었습니다!`);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSelectTier(tierNumber: 1 | 2 | 3 | 4) {
    setSelectedTierNumber(tierNumber);
    const tier = getExplorerOutfitTierByNumber(tierNumber);
    const savedProfile = getSavedFaceProfile();
    const cachedTierAvatar = savedProfile?.generatedTierImages?.[tierNumber];
    setSelectedAvatar(cachedTierAvatar || tier.fallbackImage);
    setStatus(
      `👕 [Tier ${tierNumber} • ${tier.outfitName}] 의상이 적용되었습니다.`
    );
  }

  async function handleSaveCharacter() {
    if (!selectedAvatar || !name.trim()) return;

    setIsSaving(true);
    setStatus('저장 중입니다...');

    try {
      const cleanName = name.trim();
      const cleanAvatar = selectedAvatar;

      setRunnerName(cleanName);
      setSelectedCharacterId(selectedClassId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('runquest-selected-avatar', cleanAvatar);
        window.localStorage.setItem(
          'runquest-selected-outfit-tier',
          String(selectedTierNumber)
        );
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(
          new CustomEvent('runquest-avatar-updated', {
            detail: {
              avatarUrl: cleanAvatar,
              name: cleanName,
              classId: selectedClassId,
              outfitTier: selectedTierNumber,
            },
          })
        );
      }

      try {
        await createCharacter({
          name: cleanName,
          avatarBaseUrl: cleanAvatar,
        });
      } catch {
        // 비로그인/오프라인 상태에서도 로컬 저장소 기반으로 동작 보장
      }

      setStatus('✅ 캐릭터와 탐험가 의상이 저장되었습니다! 대시보드로 이동합니다...');
      setTimeout(() => {
        navigate('/character-dashboard');
      }, 300);
    } catch {
      navigate('/character-dashboard');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-4 text-slate-900 font-sans pb-32 select-none flex justify-center">
      <div className="max-w-md w-full space-y-4">
        {/* 상단 네비게이션 & 저장 바 */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center text-sm shadow-sm active:scale-95 transition-all"
          >
            ✕
          </button>
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
            AI Anime RPG Explorer Studio
          </span>
          <button
            type="button"
            onClick={handleSaveCharacter}
            disabled={!selectedAvatar || !name.trim() || isSaving || isGenerating}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <span>💾</span>
            <span>{isSaving ? '저장 중' : '저장'}</span>
          </button>
        </div>

        {/* 상단 타이틀 헤더 */}
        <header className="text-center pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-2">
            <span>🌿</span>
            <span>5-Step Unified Character & Video Pipeline</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            내 얼굴 캐릭터 · 달리는 영상 · 레벨업 복장 진화
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            얼굴 촬영 → <strong className="text-emerald-700">Lv.1 러닝복 캐릭터 생성</strong> → 달리는 영상 제작 → <strong className="text-violet-700">랜딩페이지 영상 반영</strong> → 레벨업 아이템 장착 및 복장 업데이트
          </p>
        </header>

        {/* 0.5 5단계 원스톱 성장 파이프라인 상태 트래커 */}
        <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-3.5 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
              🔄 5단계 원스톱 캐릭터 & 러닝 영상 흐름
            </span>
            <Link
              to="/"
              className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black hover:bg-amber-400/30 transition-all"
            >
              🎬 랜딩페이지 영상 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center">
            {UNIFIED_CHARACTER_VIDEO_PIPELINE.map((item) => {
              const isStepDone =
                item.step === 1
                  ? Boolean(facePreviewUrl || getSavedFaceProfile()?.hasCustomPhoto)
                  : item.step === 2
                    ? Boolean(selectedAvatar)
                    : item.step === 3 || item.step === 4
                      ? Boolean(customVideoUrl)
                      : currentLevel > 1 || equippedGears.length > 1;
              return (
                <div
                  key={item.id}
                  className={`rounded-xl p-1.5 border flex flex-col items-center justify-center transition-all ${
                    isStepDone
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-800/70 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-[9px] font-black mt-0.5 leading-tight">
                    {item.step}. {item.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1. 메인 캐릭터 일러스트/영상 쇼룸 & 현재 착용 의상 티어 카드 */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl space-y-3 relative overflow-hidden">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-400 shadow-inner border border-emerald-200">
            {customVideoUrl && displayMode === 'video' ? (
              <video
                key={customVideoUrl}
                src={customVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <img
                src={selectedAvatar}
                alt="AI Anime RPG Explorer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = activeTier.fallbackImage;
                }}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isGenerating ? 'scale-105 blur-sm opacity-80' : 'scale-100 opacity-100'
                }`}
              />
            )}

            {/* 상단 화풍 통일 뱃지 & 의상 티어 뱃지 */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md text-white text-[10px] font-black border border-white/20">
                {customVideoUrl && displayMode === 'video'
                  ? '🎬 커스텀 모션 영상 재생 중'
                  : '🎨 Anime RPG 일러스트 통일'}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full bg-gradient-to-r ${activeTier.badgeColor} text-white text-[10px] font-black shadow-md`}
              >
                Tier {activeTier.tierNumber} • Lv.{activeTier.minLevel}
                {activeTier.maxLevel < 99 ? `~${activeTier.maxLevel}` : '+'}
              </span>
            </div>

            {/* 업로드된 본인 얼굴 원본 미니 썸네일 비교 오버레이 */}
            {facePreviewUrl && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md p-1.5 pr-3 rounded-2xl border border-white/25 shadow-lg">
                <img
                  src={facePreviewUrl}
                  alt="Uploaded Face"
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-400"
                />
                <div className="text-left">
                  <p className="text-[9px] font-black text-emerald-300 uppercase">
                    원본 얼굴 특징 반영됨
                  </p>
                  <p className="text-[10px] font-bold text-white truncate max-w-[130px]">
                    {traitNotes || '헤어·인상·분위기 매칭'}
                  </p>
                </div>
              </div>
            )}

            {/* 우측 하단: 생성된 캐릭터 이미지 저장 버튼 (영상 제작용) */}
            <button
              type="button"
              onClick={handleDownloadCharacterImage}
              className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md text-white text-[10px] font-black border border-white/25 shadow-lg active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              title="생성된 캐릭터 이미지를 기기에 저장하여 영상 제작에 활용"
            >
              <span>📥</span>
              <span>이미지 저장</span>
            </button>

            {/* 로딩 오버레이 */}
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="w-10 h-10 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin mb-3" />
                <p className="text-sm font-black">AI 탐험가 캐릭터 생성 중...</p>
                <p className="text-xs text-emerald-200 mt-1">
                  얼굴 특징 분석 + [{activeTier.outfitName}] 의상 입히는 중
                </p>
              </div>
            )}
          </div>

          {/* 영상/이미지 전환 스위치 (영상이 업로드된 경우 노출) */}
          {customVideoUrl && (
            <div className="flex items-center justify-between gap-2 bg-violet-50 border border-violet-200 rounded-2xl p-2">
              <div className="flex gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode('video');
                    setPreferredCharacterDisplayMode('video');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                    displayMode === 'video'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white text-slate-600'
                  }`}
                >
                  🎬 모션 영상 보기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode('image');
                    setPreferredCharacterDisplayMode('image');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                    displayMode === 'image'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600'
                  }`}
                >
                  🖼️ 캐릭터 이미지 보기
                </button>
              </div>
              <button
                type="button"
                onClick={() => void handleRemoveCustomVideo()}
                className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-black cursor-pointer shrink-0"
              >
                영상 삭제
              </button>
            </div>
          )}

          {/* 캐릭터 이름 · 클래스 · 현재 의상 및 장착 장비 요약 */}
          <div className="text-center pt-1 space-y-2">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {name.trim() || 'Runner'}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  👕 {activeTier.outfitName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                  {activeClassObj.name.replace('The ', '')} • {rankTitle} (Lv.{currentLevel})
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-600">
                {activeTier.outfitSummary}
              </p>
            </div>

            {/* 현재 캐릭터 외형에 적용된 레벨별 장비 슬롯 표시 */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-2.5 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  ✨ 현재 캐릭터에 꾸며진 장비 ({equippedGears.length}종 장착 중)
                </span>
                <span className="text-[10px] font-black text-amber-600">
                  💰 {modularGearState.goldBalance.toLocaleString()} G
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {equippedGears.map((gear) => (
                  <span
                    key={gear.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-[10px] font-bold text-slate-800 shadow-2xs"
                  >
                    <span>{gear.slotIcon}</span>
                    <span>
                      Lv.{gear.level} {gear.itemName}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. STEP 1: 모바일 얼굴 사진 촬영 / 앨범 업로드 스튜디오 카드 */}
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/80 p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                STEP 1 • 사진 → AI 캐릭터화
              </span>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-1">
                <span>📸</span>
                <span>모바일 사진 촬영 / 앨범에서 올리기</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                전면 카메라로 찍거나 사진첩에서 사진을 고르면 애니메이션 RPG 캐릭터로 변환됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowApiConfig((prev) => !prev)}
              className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 underline cursor-pointer shrink-0"
            >
              {showApiConfig ? 'API 닫기' : '⚙️ AI 키'}
            </button>
          </div>

          {/* 모바일 전면 카메라 전용 Input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
          />
          {/* 모바일 사진첩(갤러리) / PC 파일 선택 전용 Input */}
          <input
            ref={albumInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* 사진에서 강조할 본인 특징 메모 */}
          <label className="block">
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">
              얼굴 특징 키워드 (선택 입력 시 AI 반영도 향상)
            </span>
            <input
              type="text"
              value={traitNotes}
              onChange={(e) => setTraitNotes(e.target.value)}
              placeholder="예: 동그란 안경, 짧은 흑발 웨이브, 밝은 미소"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
            />
          </label>

          {showApiConfig && (
            <div className="rounded-2xl bg-slate-900 text-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-400 uppercase">
                  Gemini API Key (gemini-nano-banana-2.1)
                </span>
                <span className="text-[10px] text-slate-400">
                  미입력 시 레벨별 공식 일러스트 자동 적용
                </span>
              </div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setConfiguredGeminiApiKey(e.target.value);
                }}
                placeholder="AIzaSy... (Google AI Studio API Key)"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-400"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isGenerating}
              className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>📷</span>
              <span>셀카 카메라 촬영</span>
            </button>

            <button
              type="button"
              onClick={() => albumInputRef.current?.click()}
              disabled={isGenerating}
              className="py-3 px-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>🖼️</span>
              <span>앨범에서 사진 선택</span>
            </button>
          </div>

          {uploadedPhotoData && (
            <button
              type="button"
              onClick={() => {
                void triggerAiGeneration({
                  ...uploadedPhotoData,
                  tierNumber: selectedTierNumber,
                });
              }}
              disabled={isGenerating}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>✨</span>
              <span>업로드한 얼굴로 현재 의상(Tier {selectedTierNumber}) 다시 생성</span>
            </button>
          )}
        </div>

        {/* 2.5 STEP 2: 생성된 캐릭터 이미지로 만든 나만의 모션 영상 업로드 카드 */}
        <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/80 p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                STEP 2 • 캐릭터 모션 영상 적용
              </span>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-1">
                <span>🎬</span>
                <span>캐릭터 모션 영상 업로드 (MP4 / WebM / MOV)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                생성된 캐릭터 이미지를 저장해 영상을 만든 뒤 업로드하면 대시보드와 프로필에서 살아 움직입니다.
              </p>
            </div>
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadCharacterImage}
              className="py-3 px-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-black text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>📥</span>
              <span>1. 캐릭터 이미지 저장</span>
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-violet-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🎬</span>
              <span>2. 만든 영상 올리기</span>
            </button>
          </div>

          <Link
            to="/"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🌟</span>
            <span>랜딩페이지(/)에서 적용된 달리는 영상 확인하기 →</span>
          </Link>
        </div>

        {/* 3. 레벨업에 따른 의상 업그레이드 진화 시스템 (Tier 1 심플 러너복 ~ Tier 4 마스터 예장) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>👕</span>
                <span>레벨업 의상 진화 단계 (Outfit Progression)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                첫 캐릭터는 <strong>심플 스타터 러닝복(Tier 1)</strong>으로 시작하며 레벨에 따라 업그레이드됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectTier(currentLevelTier.tierNumber)}
              className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-black hover:bg-amber-200 transition-all cursor-pointer shrink-0"
            >
              내 레벨(Lv.{currentLevel}) 맞춤
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {EXPLORER_OUTFIT_TIERS.map((tier) => {
              const isSelected = selectedTierNumber === tier.tierNumber;
              const isUnlockedByLevel = currentLevel >= tier.minLevel;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleSelectTier(tier.tierNumber)}
                  className={`rounded-2xl p-2.5 text-left transition-all border cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-emerald-600 bg-emerald-50/70 border-emerald-400 shadow-md'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={tier.fallbackImage}
                      alt={tier.outfitName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase text-emerald-700">
                          Tier {tier.tierNumber} • Lv.{tier.minLevel}
                          {tier.maxLevel < 99 ? `~${tier.maxLevel}` : '+'}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                            isUnlockedByLevel
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {tier.tierNumber === 1
                            ? '기본 시작복'
                            : isUnlockedByLevel
                              ? '해금됨'
                              : `Lv.${tier.minLevel} 해금`}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900 truncate mt-0.5">
                        {tier.outfitName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {tier.titleKo}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 1레벨 단위(Lv.1~Lv.10) 장비 획득 및 외형 꾸미기 상세 로드맵 */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-black text-slate-800 block">
                  🛡️ 1레벨 단위 장비 획득 & 외형 성장 스튜디오 (Lv.1 → Lv.10)
                </span>
                <span className="text-[10px] text-slate-500">
                  퀘스트 달성 또는 골드로 장비를 생성해 캐릭터를 한 단계씩 꾸며보세요.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStepLevelUp(1)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black cursor-pointer"
                >
                  Lv.1 초기화
                </button>
                <button
                  type="button"
                  onClick={() => handleStepLevelUp(currentLevel + 1)}
                  disabled={currentLevel >= 10}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                >
                  ⚡ +1 레벨업 (Lv.{currentLevel}→{Math.min(10, currentLevel + 1)})
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {LEVEL_EQUIPMENT_PROGRESSION.map((step) => {
                const isOwned = modularGearState.ownedLevels.includes(step.level);
                const isEquipped = modularGearState.equippedLevels.includes(step.level);
                const isNext = step.level === currentLevel + 1;
                return (
                  <div
                    key={step.level}
                    className={`rounded-2xl p-3 border text-left transition-all ${
                      isEquipped
                        ? 'bg-emerald-50/75 border-emerald-300 shadow-xs'
                        : isNext
                          ? 'bg-amber-50/90 border-amber-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span className="text-sm">{step.slotIcon}</span>
                        <span>
                          Lv.{step.level} • {step.itemName}
                        </span>
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          isEquipped
                            ? 'bg-emerald-600 text-white'
                            : isOwned
                              ? 'bg-slate-300 text-slate-800'
                              : isNext
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isEquipped
                          ? '✨ 착용 중'
                          : isOwned
                            ? '보유 중'
                            : isNext
                              ? '다음 목표 🎯'
                              : `${step.requiredXp} XP (~${step.approxDistanceKm}km)`}
                      </span>
                    </div>

                    <p className="text-[10px] font-bold text-emerald-800 mt-1">
                      획득 조건: {step.acquisitionMethod}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      외형 꾸미기: {step.visualChangeSummary}
                    </p>
                    <p className="text-[10px] font-bold text-violet-700 mt-0.5">
                      효과: {step.statBonusText}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-end gap-1.5">
                      {!isOwned ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcquireGear(step.level, 'quest')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            🎯 퀘스트 달성 해금 (+100G)
                          </button>
                          {step.priceGold > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAcquireGear(step.level, 'gold')}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black shadow-2xs active:scale-95 transition-all cursor-pointer"
                            >
                              🛒 {step.priceGold.toLocaleString()}G 구매
                            </button>
                          )}
                        </>
                      ) : step.level === 1 ? (
                        <span className="text-[10px] font-bold text-emerald-700">
                          기본 베이스 의상 (항상 착용)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleEquipGear(step.level)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          {isEquipped ? '착용 해제' : '✨ 장착하여 캐릭터 꾸미기'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. 닉네임 및 탐험가 클래스 패시브 설정 */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <label className="block text-left">
            <span className="text-[11px] font-black uppercase text-slate-400 block mb-1">
              Explorer Nickname
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              placeholder="Enter nickname"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
          </label>

          <div className="text-left">
            <span className="text-[11px] font-black uppercase text-slate-400 block mb-1.5">
              Explorer Specialization (패시브 효과)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {mockCharacters.map((cls) => {
                const isClsSelected = cls.id === selectedClassId;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClassIdState(cls.id)}
                    className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isClsSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[11px] font-black">
                      {cls.name.replace('The ', '')}
                    </span>
                    <span
                      className={`block text-[9px] font-bold truncate mt-0.5 ${
                        isClsSelected ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {cls.bonus.replace(' XP', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. 공식 캐릭터 생성 규칙 안내 카드 */}
        <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-4 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              📜 RunQuest PH 캐릭터 생성 표준 규칙
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              v2.0 Unified Rules
            </span>
          </div>
          <div className="space-y-2">
            {CHARACTER_GENERATION_RULES.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-2.5 flex items-start gap-2.5"
              >
                <span className="text-base shrink-0 mt-0.5">{rule.icon}</span>
                <div>
                  <p className="text-xs font-black text-white">{rule.title}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {status && (
          <p className="text-center text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 py-2.5 px-3 rounded-xl animate-pulse">
            {status}
          </p>
        )}

        {/* 하단 플로팅 액션 바 */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent z-30 flex justify-center">
          <div className="max-w-md w-full">
            <button
              type="button"
              onClick={handleSaveCharacter}
              disabled={!selectedAvatar || !name.trim() || isSaving || isGenerating}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
            >
              {isSaving
                ? '저장 중...'
                : customVideoUrl && displayMode === 'video'
                  ? `캐릭터 & 모션 영상 저장하기`
                  : `탐험가 캐릭터 저장하기 (${activeTier.outfitName})`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
