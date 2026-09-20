/**
 * 🛡️ 백그라운드 러닝 킵얼라이브 (Background Keep-Alive Engine)
 * 1. Web Audio API 무음 오디오 루프: 스마트폰 OS가 브라우저 탭을 미디어 재생 앱으로 인식하게 하여 백그라운드 절전 모드 방지
 * 2. MediaSession API: 잠금화면 및 알림바에 러닝 상태("1.2km | 06:30") 미디어 카드 노출
 * 3. Screen Wake Lock: 러닝 중 화면 자동 꺼짐 방지
 */

let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let wakeLock: WakeLockSentinel | null = null;

export function startSilentAudioKeepAlive(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    if (!oscillator && audioCtx) {
      // 20Hz 미만의 비가청 초저음 + 0.0001 게인으로 완전 무음 처리
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(10, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
    }
  } catch (err) {
    console.warn('Silent audio keep-alive not supported or blocked:', err);
  }
}

export function stopSilentAudioKeepAlive(): void {
  try {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      oscillator = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close();
      audioCtx = null;
    }
  } catch {
    // 무시
  }
}

export async function requestScreenWakeLock(): Promise<void> {
  try {
    if ('wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    }
  } catch {
    // 미지원 기기 무시
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    // 무시
  }
}

export function updateMediaSession(distanceKm: number, elapsedFormatted: string, paceFormatted: string): void {
  try {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `🏃 RunQuest 러닝 중: ${distanceKm.toFixed(2)} km`,
        artist: `시간: ${elapsedFormatted} | 페이스: ${paceFormatted}`,
        album: 'RunQuest PH',
        artwork: [
          {
            src: '/favicon.svg',
            sizes: '96x96',
            type: 'image/svg+xml'
          }
        ]
      });

      // 백그라운드 재생 핸들러 등록
      navigator.mediaSession.setActionHandler('play', () => {
        startSilentAudioKeepAlive();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        // 일시정지 무시
      });
    }
  } catch {
    // 무시
  }
}

export function clearMediaSession(): void {
  try {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
    }
  } catch {
    // 무시
  }
}
