import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { applyRunReward } from '../services/characterService';
import { refreshCharacterAvatar } from '../services/aiAvatarService';
import { maybeDropEquipment } from '../services/equipmentEconomyService';
import { contributeToGuild } from '../services/guildService';
import { updateLeaderboardScore } from '../features/leaderboard/leaderboardService';
import { getCharacterProfile } from '../services/characterService';
import { getRealtimeCoaching, saveCoachMessage } from '../services/aiCoachService';
import { analyzeAndStoreGpsSessionSafely } from '../services/antiCheatService';
import { awardRunTokens } from '../features/economy/tokenEconomyService';
import { updateSeasonScore } from '../services/seasonService';
import type { CompletedActivitySummary } from '../types/activity';
import type { Course, Difficulty } from '../types/course';
import {
  calculateActivityReward,
  completeActivityProgress,
  getGameProgress,
  type ProgressUpdate
} from '../utils/gameProgress';
import { difficultyXpValues } from '../utils/characterRpg';

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function QuestCompletedPage() {
  const { courseId } = useParams();
  const location = useLocation();
  const summary = location.state as CompletedActivitySummary | null;
  const course = useMemo<Course>(() => {
    const difficulty = (summary?.difficulty ?? 'Easy') as Difficulty;

    return {
      id: summary?.courseId ?? courseId ?? 'unknown-course',
      areaId: summary?.areaName?.toLowerCase() ?? 'global',
      areaName: summary?.areaName ?? 'Global',
      name: summary?.courseName ?? 'Completed Route',
      description: 'Supabase run summary',
      courseType: 'running',
      distanceKm: summary?.distanceKm ?? 0,
      estimatedTimeMin: Math.max(1, Math.ceil((summary?.durationSeconds ?? 60) / 60)),
      difficulty,
      xpReward: Math.round((summary?.distanceKm ?? 0) * 100),
      explorationReward: Math.max(1, Math.round((summary?.distanceKm ?? 0) * 2)),
      startPoint: [14.5503, 121.0507],
      finishPoint: [14.5503, 121.0507],
      routeCoordinates: [],
      checkpoints: [],
      pois: [],
      safetyNotes: ''
    };
  }, [courseId, summary]);
  const courseName = summary?.courseName ?? course.name;
  const areaName = summary?.areaName ?? course.areaName;
  const distanceKm = summary?.distanceKm ?? course.distanceKm;
  const durationSeconds = summary?.durationSeconds ?? course.estimatedTimeMin * 60;
  const loopCount = summary?.loopCount ?? 1;
  const processedRef = useRef(false);
  const [characterRewardStatus, setCharacterRewardStatus] = useState('');
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate>(() => {
    const progress = getGameProgress();
    const reward = calculateActivityReward(course, distanceKm, progress.completedActivities);
    const currentLevel = Math.max(1, progress.characterProgress[progress.selectedCharacterId]?.level ?? 1);

    return {
      progress,
      reward,
      previousLevel: currentLevel,
      currentLevel,
      didLevelUp: false
    };
  });

  useEffect(() => {
    if (!summary || processedRef.current) {
      return;
    }

    processedRef.current = true;
    setProgressUpdate(completeActivityProgress(course, summary));
    applyRunReward({
      distanceKm: summary.distanceKm,
      difficultyMultiplier: difficultyXpValues[summary.difficulty ?? course.difficulty] ?? 1,
      loopMultiplier: loopCount
    })
      .then(async (reward) => {
        if (!reward) {
          setCharacterRewardStatus('Create a character to store RPG XP in Supabase.');
          return;
        }

        setCharacterRewardStatus(
          reward.leveledUp
            ? `Character level up: ${reward.previousLevel} to ${reward.nextLevel}`
            : `Character gained ${reward.xpEarned} RPG XP`
        );
        await updateLeaderboardScore({
          characterId: reward.characterId,
          userId: reward.userId,
          region: 'Global',
          totalDistance: reward.totalDistance,
          totalXp: reward.totalXp,
          level: reward.nextLevel,
          streakDays: reward.streakDays
        });
        await contributeToGuild({
          characterId: reward.characterId,
          xp: reward.xpEarned,
          distanceKm: summary.distanceKm
        });
        await updateSeasonScore({
          userId: reward.userId,
          characterId: reward.characterId,
          xp: reward.xpEarned,
          distanceKm: summary.distanceKm
        });
        const antiCheatResult = summary.gpsSessionId
          ? await analyzeAndStoreGpsSessionSafely({
              sessionId: summary.gpsSessionId,
              characterId: reward.characterId
            })
          : null;
        const tokenReward = await awardRunTokens({
          characterId: reward.characterId,
          userId: reward.userId,
          reward: {
            distanceKm: summary.distanceKm,
            streakBonus: summary.streakBonus ?? Math.min(20, reward.streakDays * 2),
            difficultyMultiplier: difficultyXpValues[summary.difficulty ?? course.difficulty] ?? 1,
            cheatPenalty:
              summary.cheatPenalty ??
              (antiCheatResult ? Math.round(antiCheatResult.analysis.cheatScore / 2) : 0)
          },
          metadata: {
            course_id: summary.courseId,
            gps_session_id: summary.gpsSessionId ?? null
          }
        });
        const coachMessage = await getRealtimeCoaching({
          distanceKm: summary.distanceKm,
          paceSecondsPerKm:
            summary.distanceKm > 0 ? Math.round(summary.durationSeconds / summary.distanceKm) : 0,
          elapsedSeconds: summary.durationSeconds
        });
        await saveCoachMessage({
          characterId: reward.characterId,
          sessionId: summary.gpsSessionId ?? null,
          message: coachMessage
        });
        await maybeDropEquipment(reward.characterId);

        const profile = await getCharacterProfile(reward.characterId);
        if (profile) {
          await refreshCharacterAvatar(profile, 'quest_completed');
        }
        setCharacterRewardStatus((currentStatus) =>
          `${currentStatus} · +${tokenReward.amount} RunTokens · Coach: ${coachMessage.message}`
        );
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Character XP update failed.';
        setCharacterRewardStatus(message);
      });
  }, [course, loopCount, summary]);

  const xpEarned = progressUpdate.reward.totalXp;

  return (
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-8 text-center text-stone-50">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-amber-200 bg-quest-teal text-3xl font-black shadow-[0_0_34px_rgba(20,184,166,0.45)]">
        XP
      </div>
      <div>
        <p className="text-sm font-black uppercase text-amber-200">Quest completed</p>
        <h1 className="mt-2 text-3xl font-black text-stone-50">You cleared {courseName}.</h1>
        <p className="mt-3 text-stone-300">
          You earned {xpEarned} XP and increased {areaName} exploration.
        </p>
      </div>
      {progressUpdate.didLevelUp && (
        <div className="animate-pulse rounded-2xl border border-amber-200 bg-amber-300 px-4 py-3 text-stone-950 shadow-[0_0_34px_rgba(250,204,21,0.28)]">
          <p className="text-xs font-black uppercase">Level up</p>
          <p className="mt-1 text-xl font-black">
            Level {progressUpdate.previousLevel} to {progressUpdate.currentLevel}
          </p>
        </div>
      )}
      {characterRewardStatus && (
        <div className="rounded-2xl border border-teal-200/30 bg-teal-950/30 px-4 py-3 text-sm font-bold text-teal-100">
          {characterRewardStatus}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-sm text-stone-500">Distance</p>
          <p className="text-xl font-black">{distanceKm.toFixed(2)} km</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-sm text-stone-500">Time</p>
          <p className="text-xl font-black">{formatElapsedTime(durationSeconds)}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-sm text-stone-500">XP earned</p>
          <p className="text-xl font-black text-amber-200">{xpEarned}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-sm text-stone-500">Area progress</p>
          <p className="text-xl font-black">+{course.explorationReward}%</p>
        </div>
      </div>
      <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4 text-left">
        <p className="text-xs font-black uppercase text-amber-200">XP breakdown</p>
        <div className="mt-3 grid gap-2 text-sm text-stone-300">
          <div className="flex justify-between">
            <span>Distance XP</span>
            <span>{progressUpdate.reward.baseXp}</span>
          </div>
          <div className="flex justify-between">
            <span>{course.difficulty} route bonus</span>
            <span>{progressUpdate.reward.difficultyBonusXp}</span>
          </div>
          <div className="flex justify-between">
            <span>Consistency bonus</span>
            <span>{progressUpdate.reward.consistencyBonusXp}</span>
          </div>
        </div>
      </div>
      <Link
        to="/profile"
        className="block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 font-black text-stone-950"
      >
        View Progress
      </Link>
    </section>
  );
}
