function computeInterestConfidence({ interestGraph, summaries, isColdUser }) {
  if (!interestGraph || !interestGraph.interests) return 0;

  const interests = Object.values(interestGraph.interests);

  if (interests.length === 0) return 0;

  // 1️⃣ Total interest mass
  const totalScore = interests.reduce((sum, i) => sum + i.score, 0);

  // 2️⃣ Strongest interest
  const maxScore = Math.max(...interests.map(i => i.score));

  // 3️⃣ Event maturity (how many signals exist)
  const maturity = Math.min(totalScore / 3, 1); // needs ~3 points to mature

  // 4️⃣ Focus (are interests concentrated or scattered?)
  const focus = maxScore / totalScore; // 0.3–1.0

  // 5️⃣ Confidence = weighted blend
  const confidence = Math.min(
    1,
    (0.6 * maturity) + (0.4 * focus)
  );

  return Number(confidence.toFixed(2));
}

module.exports = { computeInterestConfidence };
