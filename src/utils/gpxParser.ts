import type { LatLngTuple } from '../types/area';
import { calculateHaversineDistanceKm } from './route';

export interface ParsedWorkoutData {
  title: string;
  routeCoordinates: LatLngTuple[];
  distanceKm: number;
  durationSeconds: number;
  startTime: Date | null;
  endTime: Date | null;
  avgSpeedKmh: number;
  avgPaceMinKm: string;
  elevationGainMeters: number;
  heartRates: number[];
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  estimatedXp: number;
  sourceDevice: string;
}

/**
 * ⌚ 초고속 클라이언트 사이드 GPX / TCX XML 파서
 * 삼성 헬스, 가민, 애플 워치, 샤오미, 나이키 런 클럽, 스트라바 파일 완벽 지원
 */
export function parseGpxOrTcx(fileContent: string, fileName = 'workout.gpx'): ParsedWorkoutData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fileContent, 'application/xml');

  // XML 파싱 에러 체크
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('올바른 GPX 또는 TCX XML 파일 형식이 아닙니다.');
  }

  const isTcx = fileContent.includes('<TrainingCenterDatabase') || fileName.toLowerCase().endsWith('.tcx');

  if (isTcx) {
    return parseTcxDocument(xmlDoc, fileName);
  }

  return parseGpxDocument(xmlDoc, fileName);
}

function parseGpxDocument(xmlDoc: Document, fileName: string): ParsedWorkoutData {
  const trackPoints = Array.from(xmlDoc.querySelectorAll('trkpt'));
  if (trackPoints.length === 0) {
    // 혹시 rtept(루트 포인트)나 wpt(웨이포인트)가 있는지 확인
    const waypoints = Array.from(xmlDoc.querySelectorAll('wpt, rtept'));
    if (waypoints.length === 0) {
      throw new Error('GPX 파일 내에 위치 좌표(trkpt)가 존재하지 않습니다.');
    }
    trackPoints.push(...waypoints);
  }

  const routeCoordinates: LatLngTuple[] = [];
  const timestamps: Date[] = [];
  const elevations: number[] = [];
  const heartRates: number[] = [];

  let prevCoord: LatLngTuple | null = null;
  let totalDistanceKm = 0;
  let totalElevationGain = 0;
  let prevEle: number | null = null;

  for (const pt of trackPoints) {
    const latStr = pt.getAttribute('lat');
    const lonStr = pt.getAttribute('lon');
    if (!latStr || !lonStr) continue;

    const lat = parseFloat(latStr);
    const lng = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lng)) continue;

    const coord: LatLngTuple = [lat, lng];
    routeCoordinates.push(coord);

    if (prevCoord) {
      totalDistanceKm += calculateHaversineDistanceKm(prevCoord, coord);
    }
    prevCoord = coord;

    // 시간 파싱
    const timeEl = pt.querySelector('time');
    if (timeEl && timeEl.textContent) {
      const d = new Date(timeEl.textContent.trim());
      if (!isNaN(d.getTime())) {
        timestamps.push(d);
      }
    }

    // 고도 파싱
    const eleEl = pt.querySelector('ele');
    if (eleEl && eleEl.textContent) {
      const ele = parseFloat(eleEl.textContent);
      if (!isNaN(ele)) {
        elevations.push(ele);
        if (prevEle !== null && ele > prevEle) {
          totalElevationGain += ele - prevEle;
        }
        prevEle = ele;
      }
    }

    // 심박수 파싱 (Garmin / Strava / Apple Watch / Xiaomi 트랙포인트 확장자)
    const hrEl = pt.querySelector('hr, HeartRateBpm > Value, gpxtpx\\:hr, ns3\\:hr');
    if (hrEl && hrEl.textContent) {
      const hr = parseInt(hrEl.textContent.trim(), 10);
      if (!isNaN(hr) && hr > 30 && hr < 240) {
        heartRates.push(hr);
      }
    }
  }

  // 총 시간 계산
  let durationSeconds = 0;
  let startTime: Date | null = null;
  let endTime: Date | null = null;

  if (timestamps.length >= 2) {
    startTime = timestamps[0];
    endTime = timestamps[timestamps.length - 1];
    durationSeconds = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));
  } else {
    // 시간이 없을 경우 5분/km 기준 추정
    durationSeconds = Math.max(60, Math.round(totalDistanceKm * 330));
  }

  // 속도 및 페이스
  const durationHours = durationSeconds / 3600;
  const avgSpeedKmh = durationHours > 0 ? Number((totalDistanceKm / durationHours).toFixed(1)) : 0;
  const avgPaceMinKm = formatPace(totalDistanceKm, durationSeconds);

  // 심박수 통계
  const avgHeartRate = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : null;

  // 디바이스 소스 감지
  const creator = xmlDoc.querySelector('gpx')?.getAttribute('creator') || '';
  const sourceDevice = detectDeviceSource(creator, fileName);

  // 운동 제목
  const titleEl = xmlDoc.querySelector('trk > name, metadata > name');
  const title = titleEl?.textContent?.trim() || `${sourceDevice} 러닝 기록`;

  // XP 계산 (기본 거리 XP + 심박수 버닝 보너스)
  const hrBonus = avgHeartRate && avgHeartRate >= 145 ? 50 : 0;
  const estimatedXp = Math.max(50, Math.round(totalDistanceKm * 120) + hrBonus);

  return {
    title,
    routeCoordinates,
    distanceKm: Number(totalDistanceKm.toFixed(2)),
    durationSeconds,
    startTime,
    endTime,
    avgSpeedKmh,
    avgPaceMinKm,
    elevationGainMeters: Math.round(totalElevationGain),
    heartRates,
    avgHeartRate,
    maxHeartRate,
    estimatedXp,
    sourceDevice
  };
}

function parseTcxDocument(xmlDoc: Document, fileName: string): ParsedWorkoutData {
  const trackPoints = Array.from(xmlDoc.querySelectorAll('Trackpoint'));
  const routeCoordinates: LatLngTuple[] = [];
  const timestamps: Date[] = [];
  const heartRates: number[] = [];

  let prevCoord: LatLngTuple | null = null;
  let totalDistanceKm = 0;

  for (const pt of trackPoints) {
    const latEl = pt.querySelector('LatitudeDegrees');
    const lonEl = pt.querySelector('LongitudeDegrees');
    if (!latEl || !lonEl || !latEl.textContent || !lonEl.textContent) continue;

    const lat = parseFloat(latEl.textContent);
    const lng = parseFloat(lonEl.textContent);
    if (isNaN(lat) || isNaN(lng)) continue;

    const coord: LatLngTuple = [lat, lng];
    routeCoordinates.push(coord);

    if (prevCoord) {
      totalDistanceKm += calculateHaversineDistanceKm(prevCoord, coord);
    }
    prevCoord = coord;

    const timeEl = pt.querySelector('Time');
    if (timeEl && timeEl.textContent) {
      const d = new Date(timeEl.textContent.trim());
      if (!isNaN(d.getTime())) timestamps.push(d);
    }

    const hrEl = pt.querySelector('HeartRateBpm > Value');
    if (hrEl && hrEl.textContent) {
      const hr = parseInt(hrEl.textContent.trim(), 10);
      if (!isNaN(hr) && hr > 30 && hr < 240) heartRates.push(hr);
    }
  }

  let durationSeconds = 0;
  let startTime: Date | null = null;
  let endTime: Date | null = null;

  if (timestamps.length >= 2) {
    startTime = timestamps[0];
    endTime = timestamps[timestamps.length - 1];
    durationSeconds = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));
  } else {
    durationSeconds = Math.max(60, Math.round(totalDistanceKm * 330));
  }

  const durationHours = durationSeconds / 3600;
  const avgSpeedKmh = durationHours > 0 ? Number((totalDistanceKm / durationHours).toFixed(1)) : 0;
  const avgPaceMinKm = formatPace(totalDistanceKm, durationSeconds);
  const avgHeartRate = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : null;
  const sourceDevice = detectDeviceSource('', fileName);
  const estimatedXp = Math.max(50, Math.round(totalDistanceKm * 120) + (avgHeartRate && avgHeartRate >= 145 ? 50 : 0));

  return {
    title: `${sourceDevice} 워크아웃`,
    routeCoordinates,
    distanceKm: Number(totalDistanceKm.toFixed(2)),
    durationSeconds,
    startTime,
    endTime,
    avgSpeedKmh,
    avgPaceMinKm,
    elevationGainMeters: 0,
    heartRates,
    avgHeartRate,
    maxHeartRate,
    estimatedXp,
    sourceDevice
  };
}

function formatPace(distanceKm: number, durationSeconds: number): string {
  if (distanceKm <= 0.05 || durationSeconds <= 0) return "--'--\"";
  const secPerKm = durationSeconds / distanceKm;
  const paceMin = Math.floor(secPerKm / 60);
  const paceSec = Math.floor(secPerKm % 60);
  if (paceMin > 30) return "--'--\"";
  return `${paceMin}'${paceSec.toString().padStart(2, '0')}"`;
}

function detectDeviceSource(creatorStr: string, fileName: string): string {
  const lower = (creatorStr + ' ' + fileName).toLowerCase();
  if (lower.includes('samsung') || lower.includes('galaxy') || lower.includes('shealth')) {
    return 'Galaxy Watch (삼성 헬스)';
  }
  if (lower.includes('apple') || lower.includes('workout') || lower.includes('healthkit')) {
    return 'Apple Watch (애플 헬스)';
  }
  if (lower.includes('garmin') || lower.includes('forerunner') || lower.includes('fenix')) {
    return 'Garmin (가민)';
  }
  if (lower.includes('xiaomi') || lower.includes('mi fitness') || lower.includes('zepp') || lower.includes('huami')) {
    return 'Xiaomi (미 밴드/워치)';
  }
  if (lower.includes('nike') || lower.includes('nrc')) {
    return 'Nike Run Club (나이키)';
  }
  if (lower.includes('strava')) {
    return 'Strava (스트라바)';
  }
  return 'Smartwatch (스마트워치)';
}
