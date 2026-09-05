export interface VoiceMessage {
  text: string;
  category: 'milestone' | 'high_five' | 'cheer' | 'warning';
  timestamp: number;
}

class VoiceCompanionService {
  private isEnabled = true;
  private synth: SpeechSynthesis | null = null;
  private activeMessageCallback: ((msg: VoiceMessage | null) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getIsEnabled() {
    return this.isEnabled;
  }

  public onMessage(callback: (msg: VoiceMessage | null) => void) {
    this.activeMessageCallback = callback;
  }

  public speak(text: string, category: VoiceMessage['category'] = 'milestone') {
    const voiceMsg: VoiceMessage = { text, category, timestamp: Date.now() };

    // 1. 화면 자막 팝업 알림
    this.activeMessageCallback?.(voiceMsg);
    setTimeout(() => {
      this.activeMessageCallback?.(null);
    }, 4500);

    // 2. TTS 음성 출력
    if (!this.isEnabled || !this.synth) return;

    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;

      // 한국어 보이스 선택
      const voices = this.synth.getVoices();
      const koreanVoice = voices.find((v) => v.lang.includes('ko') || v.name.includes('Korean'));
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }

      this.synth.speak(utterance);
    } catch {
      // ignore
    }
  }

  public speakDistanceMilestone(km: number, pace: string) {
    this.speak(`🔥 ${km}km 돌파! 현재 페이스 ${pace}입니다. 훌륭한 속도예요, 힘차게 질주하세요!`, 'milestone');
  }

  public speakHighFiveEncounter(runnerName: string) {
    this.speak(`👋 동료 러너 ${runnerName}님과 스쳐 지나갔습니다! 하이파이브 보너스 획득!`, 'high_five');
  }
}

export const voiceCompanion = new VoiceCompanionService();
