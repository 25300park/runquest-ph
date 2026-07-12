function riskLevel(score) {
  if (score >= 75) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function riskAction(score) {
  if (score >= 85) return 'block';
  if (score >= 40) return 'review';
  return 'allow';
}

export async function detectPaymentFraud({ supabaseFetch, userId, provider, transactionId, amountCents, request }) {
  if (!userId) return null;

  const recentEvents = await supabaseFetch(
    `subscription_events?user_id=eq.${encodeURIComponent(
      userId
    )}&order=created_at.desc&limit=25`
  );
  const recentPasses = await supabaseFetch(
    `premium_passes?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=10`
  );
  const duplicateEvents = recentEvents.filter((event) => event.payment_reference === transactionId);
  const failedEvents = recentEvents.filter((event) => ['failed', 'blocked', 'review'].includes(event.status));
  const rapidPassChanges = recentPasses.filter((pass) => {
    const createdAt = new Date(pass.created_at).getTime();
    return Number.isFinite(createdAt) && Date.now() - createdAt < 60 * 60 * 1000;
  });
  const highAmountSpike = amountCents > 500000;
  let fraudScore = 0;
  const reasons = [];

  if (duplicateEvents.length > 1) {
    fraudScore += 35;
    reasons.push('duplicate payment attempt');
  }

  if (failedEvents.length >= 3) {
    fraudScore += 30;
    reasons.push('multiple failed payments');
  }

  if (rapidPassChanges.length >= 3) {
    fraudScore += 25;
    reasons.push('rapid premium pass changes');
  }

  if (highAmountSpike) {
    fraudScore += 20;
    reasons.push('unusual transaction amount');
  }

  const ipAddress =
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() || request.socket?.remoteAddress || null;
  const userAgent = request.headers['user-agent'] ?? null;
  const normalizedScore = Math.min(100, fraudScore);
  const log = {
    user_id: userId,
    payment_provider: provider,
    transaction_id: transactionId,
    fraud_score: normalizedScore,
    risk_level: riskLevel(normalizedScore),
    action: riskAction(normalizedScore),
    reasons,
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {
      recent_event_count: recentEvents.length,
      failed_event_count: failedEvents.length,
      recent_pass_change_count: rapidPassChanges.length
    }
  };

  await supabaseFetch('payment_fraud_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(log)
  });

  return log;
}
