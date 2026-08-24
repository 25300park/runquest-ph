import { useEffect, useState } from 'react';
import { partnerRewards, runQuestEvents, subscriptionPlans } from '../data/mockMonetization';
import { getGameProgress } from '../utils/gameProgress';
import {
  calculateRewardPoints,
  getRedemptionHistory,
  saveRedemption
} from '../utils/rewardWallet';
import { startPremiumPassCheckout } from '../services/billingService';
import { ensureUserProfile } from '../services/authService';
import { getPremiumAccess, type PremiumAccess } from '../services/premiumAccessService';

export default function RewardsPage() {
  const progress = getGameProgress();
  const rewardPoints = calculateRewardPoints(progress.totalXp);
  const [history, setHistory] = useState(getRedemptionHistory);
  const [upgradeState, setUpgradeState] = useState('');
  const [premiumAccess, setPremiumAccess] = useState<PremiumAccess>({
    active: false,
    plan: 'free',
    endDate: null,
    provider: null
  });

  useEffect(() => {
    let mounted = true;
    void ensureUserProfile()
      .then((profile) => getPremiumAccess(profile.id))
      .then((access) => {
        if (mounted) setPremiumAccess(access);
      })
      .catch(() => {
        if (mounted) {
          setPremiumAccess({ active: false, plan: 'free', endDate: null, provider: null });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

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
    <section data-testid="rewards-page" className="min-h-full space-y-4 bg-slate-50 px-4 py-5 text-slate-900 font-sans pb-20 select-none">
      {/* 1. 상단 타이틀 카드 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">RunQuest Economy</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">Reward Wallet & Premium</h1>
        <p className="mt-1 text-xs text-slate-500">
          Turn your running activities into XP, reward points, partner perks, and event quests.
        </p>
      </div>

      {/* 2. Total XP & Reward Points 2열 스탯 그리드 */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-center">
          <p className="text-[10px] font-black uppercase text-slate-400">Total XP</p>
          <p className="mt-0.5 text-2xl font-black text-amber-500 tabular-nums">{progress.totalXp}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-center">
          <p className="text-[10px] font-black uppercase text-slate-400">Reward Points</p>
          <p className="mt-0.5 text-2xl font-black text-violet-600 tabular-nums">{rewardPoints} <span className="text-xs font-bold text-slate-400">PTS</span></p>
        </div>
      </div>

      {/* 3. 포인트 전환 진행률 카드 */}
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-indigo-50/50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-violet-700">Conversion Rate</p>
            <h2 className="mt-0.5 text-sm font-black text-slate-900">1,000 XP = 1 Reward Point</h2>
          </div>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-black text-violet-700 border border-violet-200/60">
            Auto Sync
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
            style={{ width: `${Math.min(100, (progress.totalXp % 1000) / 10)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500 font-medium">
          {1000 - (progress.totalXp % 1000)} XP until your next reward point.
        </p>
      </div>

      {/* 4. Premium Pass 플랜 섹션 */}
      <div>
        <h2 className="font-black text-sm text-slate-900 mb-2.5">Premium Pass</h2>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-violet-600">Current Access Tier</p>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {premiumAccess.active ? '✨ Premium Pass Active' : '🏃 Free Plan Active'}
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${premiumAccess.active ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              {premiumAccess.plan}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {premiumAccess.active && premiumAccess.endDate
              ? `Expires ${new Date(premiumAccess.endDate).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}`
              : 'Upgrade to unlock advanced AI coaching, XP boost, and exclusive guild perks.'}
          </p>
        </div>

        <div className="grid gap-3">
          {subscriptionPlans.map((plan) => {
            const isHighlight = plan.highlighted;
            return (
              <article
                key={plan.id}
                className={`rounded-2xl p-5 border transition-all ${
                  isHighlight
                    ? 'border-2 border-violet-600 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/50 shadow-md shadow-violet-500/10'
                    : 'border-slate-100 bg-white shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{plan.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{plan.description}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black shrink-0 ${isHighlight ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'}`}>
                    {plan.priceLabel}
                  </span>
                </div>
                <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-100">
                  {plan.benefits.map((benefit) => (
                    <p key={benefit} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="text-emerald-500 text-sm">✓</span> {benefit}
                    </p>
                  ))}
                </div>
                {plan.id === 'premium' && (
                  <button
                    data-testid="buy-premium-pass"
                    type="button"
                    onClick={() => {
                      setUpgradeState('Opening Premium Pass checkout...');
                      void startPremiumPassCheckout().catch((error) =>
                        setUpgradeState(error instanceof Error ? error.message : 'Checkout failed.')
                      );
                    }}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-bold text-xs text-white shadow-lg shadow-violet-500/25 active:scale-98 transition-all"
                  >
                    ✨ Get 30-day Premium Pass
                  </button>
                )}
              </article>
            );
          })}
        </div>
        {upgradeState && (
          <p className="mt-2.5 rounded-xl bg-violet-50 border border-violet-100 p-2.5 text-center text-xs font-bold text-violet-700">
            {upgradeState}
          </p>
        )}
      </div>

      {/* 5. Partner Rewards 섹션 */}
      <div>
        <h2 className="font-black text-sm text-slate-900 mb-2.5">Partner Rewards</h2>
        <div className="grid gap-2.5">
          {partnerRewards.map((reward) => {
            const canRedeem = progress.totalXp >= reward.requiredXp;

            return (
              <article key={reward.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                      {reward.partnerType}
                    </span>
                    <h3 className="mt-1 font-black text-sm text-slate-900">{reward.partnerName}</h3>
                    <p className="text-xs font-bold text-amber-600">{reward.rewardTitle}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 shrink-0">
                    {reward.requiredXp} XP
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{reward.description}</p>
                <button
                  type="button"
                  onClick={() => redeemReward(reward.id)}
                  disabled={!canRedeem}
                  className={`mt-3 w-full rounded-xl py-2.5 font-bold text-xs transition-all ${
                    canRedeem
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md active:scale-98'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {canRedeem ? '🎁 Redeem Perk' : '🔒 Locked (Need More XP)'}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* 6. Event Quests 섹션 */}
      <div>
        <h2 className="font-black text-sm text-slate-900 mb-2.5">Event Quests</h2>
        <div className="grid gap-2.5">
          {runQuestEvents.map((event) => (
            <article key={event.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                  {event.eventType}
                </span>
                <span className="text-xs font-bold text-teal-600">{event.area}</span>
              </div>
              <h3 className="mt-1.5 text-sm font-black text-slate-900">{event.title}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{event.description}</p>
              <div className="mt-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 px-3 py-2 text-xs font-bold text-amber-800 flex items-center justify-between">
                <span>Reward Bonus</span>
                <span className="font-black text-amber-600">{event.reward}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* 7. Redemption History 섹션 */}
      <div>
        <h2 className="font-black text-sm text-slate-900 mb-2.5">Redemption History</h2>
        <div className="grid gap-2">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center text-xs text-slate-400 shadow-sm">
              No redemptions yet. Earn XP by running to unlock perks!
            </div>
          ) : (
            history.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-xs text-slate-900">{item.rewardTitle}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{item.partnerName}</p>
                </div>
                <p className="text-right text-[11px] font-bold text-slate-500 shrink-0">{item.redeemedAt}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
