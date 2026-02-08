function blendRankings(cold, personalized, confidence) {
  const map = new Map();

  // normalize confidence
  const wPersonal = confidence;
  const wCold = 1 - confidence;

  function add(item, weight) {
    const id = item.id;
    const prev = map.get(id) || { ...item, _score: 0 };
    prev._score += (item._score || 1) * weight;
    map.set(id, prev);
  }

  cold.forEach(i => add(i, wCold));
  personalized.forEach(i => add(i, wPersonal));

  return [...map.values()].sort((a, b) => b._score - a._score);
}

module.exports = { blendRankings };
