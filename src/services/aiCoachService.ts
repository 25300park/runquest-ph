import { requireSupabaseClient } from '../lib/supabase';

export type CoachMessageType = 'motivation' | 'pace' | 'hydration' | 'recovery' | 'fatigue';

export type RunningHistoryInput = {
  totalRuns: number;
  totalDistanceKm: number;
  averagePaceSecondsPerKm: number;
  streakDays: number;
};

export type RealtimeCoachInput = {
  distanceKm: number;
  paceSecondsPerKm: number;
  elapsedSeconds: number;
  fatigueLevel?: number;
  targetPaceSecondsPerKm?: number;
};

export type CoachMessage = {
  message: string;
  messageType: CoachMessageType;
  paceTarget?: number | null;
  fatigueLevel: number;
};

export function generateTrainingPlan(history: RunningHistoryInput) {
  const preferredDistance = history.totalRuns > 0
    ? Math.max(1, history.totalDistanceKm / history.totalRuns)
    : 2;
  const easyRunKm = Math.max(1.5, Number((preferredDistance * 0.8).toFixed(1)));
  const challengeRunKm = Number((preferredDistance * 1.25).toFixed(1));

  return {
    weeklyGoalKm: Math.max(5, Math.round(preferredDistance * 3)),
    easyRunKm,
    challengeRunKm,
    recoveryAdvice:
      history.streakDays >= 4
        ? 'Keep today light. A short recovery walk still moves the quest forward.'
        : 'Build rhythm first. A steady easy route is the best next step.',
    focus:
      history.averagePaceSecondsPerKm > 0 && history.averagePaceSecondsPerKm < 420
        ? 'Control your pace and protect recovery.'
        : 'Stay consistent and finish feeling ready for another route.'
  };
}

export async function getRealtimeCoaching(input: RealtimeCoachInput): Promise<CoachMessage> {
  const apiUrl = import.meta.env.VITE_AI_COACH_API_URL;

  if (apiUrl) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (response.ok) {
      return response.json();
    }
  }

  const fatigueLevel = input.fatigueLevel ?? Math.min(1, input.elapsedSeconds / 3600);
  const targetPace = input.targetPaceSecondsPerKm;

  if (fatigueLevel > 0.75) {
    return {
      message: 'Ease the pace and focus on clean breathing. Recovery keeps the adventure going.',
      messageType: 'fatigue',
      paceTarget: targetPace ?? null,
      fatigueLevel
    };
  }

  if (targetPace && input.paceSecondsPerKm > targetPace + 75) {
    return {
      message: 'You can gently increase pace if your breathing feels steady.',
      messageType: 'pace',
      paceTarget: targetPace,
      fatigueLevel
    };
  }

  if (targetPace && input.paceSecondsPerKm < targetPace - 75) {
    return {
      message: 'Slow down a little and save energy for the final checkpoint.',
      messageType: 'pace',
      paceTarget: targetPace,
      fatigueLevel
    };
  }

  if (input.elapsedSeconds > 1200) {
    return {
      message: 'Hydration check. Take a calm sip when you reach a safe spot.',
      messageType: 'hydration',
      paceTarget: targetPace ?? null,
      fatigueLevel
    };
  }

  return {
    message: 'Good rhythm. Keep this pace and stay aware of the route ahead.',
    messageType: 'motivation',
    paceTarget: targetPace ?? null,
    fatigueLevel
  };
}

export async function saveCoachMessage(input: {
  userId?: string | null;
  characterId?: string | null;
  sessionId?: string | null;
  message: CoachMessage;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('ai_coach_messages')
    .insert({
      user_id: input.userId ?? null,
      character_id: input.characterId ?? null,
      session_id: input.sessionId ?? null,
      message: input.message.message,
      message_type: input.message.messageType,
      pace_target: input.message.paceTarget ?? null,
      fatigue_level: input.message.fatigueLevel
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToCoachMessages(characterId: string, onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel(`ai-coach-${characterId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'ai_coach_messages',
      filter: `character_id=eq.${characterId}`
    }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
