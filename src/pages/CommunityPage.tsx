import { useState } from 'react';
import {
  communityChallenges,
  leaderboardUsers,
  runningGroups,
  socialFeedPosts
} from '../data/mockCommunity';
import type { LeaderboardPeriod } from '../types/community';
import { getJoinedGroupIds, toggleJoinedGroup } from '../utils/communityState';

const leaderboardPeriods: LeaderboardPeriod[] = ['daily', 'weekly', 'monthly'];

export default function CommunityPage() {
  const [joinedGroupIds, setJoinedGroupIds] = useState(getJoinedGroupIds);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('weekly');

  function handleJoinGroup(groupId: string) {
    setJoinedGroupIds(toggleJoinedGroup(groupId));
  }

  return (
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-[1.35rem] border border-amber-200/30 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">Community guild board</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Run with your city crew</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Join local groups, climb rankings, clear challenges, and see the city moving together.
        </p>
      </div>

      <div>
        <h2 className="font-black">Running groups</h2>
        <div className="mt-3 grid gap-3">
          {runningGroups.map((group) => {
            const isJoined = joinedGroupIds.includes(group.id);

            return (
              <article
                key={group.id}
                className={`rounded-2xl border p-4 ${
                  isJoined
                    ? 'border-amber-200 bg-amber-300 text-stone-950'
                    : 'border-stone-700 bg-stone-900 text-stone-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase opacity-70">{group.area}</p>
                    <h3 className="mt-1 text-xl font-black">{group.name}</h3>
                    <p className="mt-1 text-sm font-bold opacity-80">{group.theme}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoinGroup(group.id)}
                    className={`rounded-full px-3 py-2 text-xs font-black ${
                      isJoined
                        ? 'bg-stone-950 text-amber-200'
                        : 'bg-quest-teal text-white'
                    }`}
                  >
                    {isJoined ? 'Joined' : 'Join'}
                  </button>
                </div>
                <p className="mt-3 text-sm leading-6 opacity-80">{group.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-stone-950/80 p-3">
                    <p className="text-xs text-stone-400">XP</p>
                    <p className="font-black text-amber-200">{group.totalXp}</p>
                  </div>
                  <div className="rounded-xl bg-stone-950/80 p-3">
                    <p className="text-xs text-stone-400">Km</p>
                    <p className="font-black text-stone-50">{group.totalDistanceKm}</p>
                  </div>
                  <div className="rounded-xl bg-stone-950/80 p-3">
                    <p className="text-xs text-stone-400">Members</p>
                    <p className="font-black text-stone-50">
                      {group.memberCount + (isJoined ? 1 : 0)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-black">Leaderboard</h2>
          <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-black text-quest-teal">
            XP · Distance · Streak
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {leaderboardPeriods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setLeaderboardPeriod(period)}
              className={`rounded-2xl px-3 py-3 text-sm font-black capitalize ${
                leaderboardPeriod === period
                  ? 'bg-amber-300 text-stone-950'
                  : 'bg-stone-900 text-stone-400'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3">
          {leaderboardUsers[leaderboardPeriod].map((user, index) => (
            <article key={user.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-950 text-lg font-black text-amber-200">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black">{user.name}</h3>
                  <p className="text-sm text-stone-400">{user.title}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-200">{user.xp} XP</p>
                  <p className="text-xs text-stone-500">{user.streakDays} day streak</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-950">
                <div
                  className="h-full rounded-full bg-quest-teal"
                  style={{
                    width: `${Math.min(100, (user.xp / leaderboardUsers[leaderboardPeriod][0].xp) * 100)}%`
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-stone-500">{user.distanceKm} km completed</p>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-black">Challenges</h2>
        <div className="mt-3 grid gap-3">
          {communityChallenges.map((challenge) => {
            const progressPercent = Math.min(100, (challenge.progress / challenge.target) * 100);

            return (
              <article key={challenge.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-quest-teal">
                      {challenge.challengeType}
                    </p>
                    <h3 className="mt-1 text-xl font-black">{challenge.title}</h3>
                  </div>
                  <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-amber-200">
                    {challenge.reward}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-400">{challenge.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs font-black uppercase text-stone-500">
                  <span>
                    {challenge.progress} / {challenge.target} {challenge.unit}
                  </span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-950">
                  <div
                    className="h-full rounded-full bg-amber-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-black">Social feed</h2>
        <div className="mt-3 grid gap-3">
          {socialFeedPosts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{post.userName} completed a quest</h3>
                  <p className="mt-1 text-sm text-stone-400">{post.groupName}</p>
                </div>
                <span className="text-xs font-bold text-stone-500">{post.postedAt}</span>
              </div>
              <div className="mt-4 rounded-2xl bg-stone-950 p-4">
                <p className="text-sm font-black text-amber-200">{post.routeName}</p>
                <p className="mt-2 text-sm text-stone-400">
                  {post.distanceKm} km · +{post.xpGained} XP
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
