import { useState } from 'react';
import { partnerRewards, runQuestEvents, subscriptionPlans } from '../data/mockMonetization';
import { getGameProgress } from '../utils/gameProgress';
import {
  calculateRewardPoints,
  getRedemptionHistory,
  saveRedemption
} from '../utils/rewardWallet';

export default function RewardsPage() {
  const progress = getGameProgress();
  const rewardPoints = calculateRewardPoints(progress.totalXp);
  const [history, setHistory] = useState(getRedemptionHistory);
  const [upgradeState, setUpgradeState] = useState<'free' | 'mock-premium'>('free');

  function redeemReward(rewardId: string) {
    const reward = partnerRewards.find((item) => item.id === rewardId);

    if (!reward || progress.totalXp < reward.requiredXp) {
      return;
    }

    setHistory(
      saveRedemption({
        id: `redemption-${Date.now()}`,
        partnerName: reward.partnerName,
        rewardTitle: reward.rewardTitle,
        requiredXp: reward.requiredXp,
        redeemedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      })
    );
  }

  return (
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-[1.35rem] border border-amber-200/30 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">RunQuest economy</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Rewards and Premium</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Turn activity into XP, reward points, partner perks, and event quests.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-stone-500">Total XP</p>
          <p className="mt-1 text-3xl font-black text-amber-200">{progress.totalXp}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-stone-500">Reward points</p>
          <p className="mt-1 text-3xl font-black text-quest-teal">{rewardPoints}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-teal-200/20 bg-teal-950/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-quest-teal">Conversion</p>
            <h2 className="mt-1 text-xl font-black">1000 XP = 1 reward point</h2>
          </div>
          <span className="rounded-full bg-stone-950 px-3 py-1 text-sm font-black text-amber-200">
            Visual only
          </span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-950">
          <div
            className="h-full rounded-full bg-quest-teal"
            style={{ width: `${Math.min(100, (progress.totalXp % 1000) / 10)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-400">
          {1000 - (progress.totalXp % 1000)} XP until the next reward point.
        </p>
      </div>

      <div>
        <h2 className="font-black">Subscription plans</h2>
        <div className="mt-3 grid gap-3">
          {subscriptionPlans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-2xl border p-4 ${
                plan.highlighted
                  ? 'border-amber-200 bg-amber-300 text-stone-950'
                  : 'border-stone-700 bg-stone-900 text-stone-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{plan.name}</h3>
                  <p className="mt-1 text-sm opacity-80">{plan.description}</p>
                </div>
                <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-amber-200">
                  {plan.priceLabel}
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {plan.benefits.map((benefit) => (
                  <p key={benefit} className="text-sm font-bold">
                    {benefit}
                  </p>
                ))}
              </div>
              {plan.id === 'premium' && (
                <button
                  type="button"
                  onClick={() => setUpgradeState('mock-premium')}
                  className="mt-4 w-full rounded-2xl bg-stone-950 px-4 py-3 font-black text-amber-200"
                >
                  {upgradeState === 'mock-premium' ? 'Premium Preview Active' : 'Upgrade to Premium'}
                </button>
              )}
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-black">Partner rewards</h2>
        <div className="mt-3 grid gap-3">
          {partnerRewards.map((reward) => {
            const canRedeem = progress.totalXp >= reward.requiredXp;

            return (
              <article key={reward.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-quest-teal">
                      {reward.partnerType}
                    </p>
                    <h3 className="mt-1 text-lg font-black">{reward.partnerName}</h3>
                    <p className="mt-1 text-sm font-bold text-amber-200">{reward.rewardTitle}</p>
                  </div>
                  <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-stone-300">
                    {reward.requiredXp} XP
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-400">{reward.description}</p>
                <button
                  type="button"
                  onClick={() => redeemReward(reward.id)}
                  disabled={!canRedeem}
                  className="mt-4 w-full rounded-2xl bg-quest-teal px-4 py-3 font-black text-white disabled:bg-stone-800 disabled:text-stone-500"
                >
                  {canRedeem ? 'Redeem' : 'Locked'}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-black">Event quests</h2>
        <div className="mt-3 grid gap-3">
          {runQuestEvents.map((event) => (
            <article key={event.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
              <p className="text-xs font-black uppercase text-amber-200">{event.eventType}</p>
              <h3 className="mt-1 text-xl font-black">{event.title}</h3>
              <p className="mt-1 text-sm text-quest-teal">{event.area}</p>
              <p className="mt-3 text-sm leading-6 text-stone-400">{event.description}</p>
              <p className="mt-3 rounded-xl bg-stone-950 px-3 py-2 text-sm font-black text-amber-200">
                Reward: {event.reward}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-black">Redemption history</h2>
        <div className="mt-3 grid gap-3">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4 text-center text-sm text-stone-400">
              No redemptions yet.
            </div>
          ) : (
            history.map((item) => (
              <article key={item.id} className="rounded-2xl bg-stone-900 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{item.rewardTitle}</p>
                    <p className="mt-1 text-sm text-stone-400">{item.partnerName}</p>
                  </div>
                  <p className="text-right text-xs text-stone-500">{item.redeemedAt}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
