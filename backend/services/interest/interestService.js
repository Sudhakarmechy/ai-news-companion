// const { interestGraphRepo } = require('../../db');
// const { applyEvent } = require('./interestBuilder');

// async function updateInterestGraph(event) {
//   if (!event?.userId) return;

//   // 1️⃣ Load existing or create new
//   let graph = await interestGraphRepo.getByUser(event.userId);  // ✅ Added await

//   if (!graph) {
//     graph = {
//       userId: event.userId,
//       interests: {},
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
//   }

//   // ✅ applyEvent already handles decay + normalization + pruning internally
//   graph = applyEvent(graph, event);

//   // ❌ REMOVE: applyEvent() already does decay/pruning
//   // graph.interests = applyTimeDecay(graph.interests);  // CRASH ❌

//   graph.updatedAt = new Date().toISOString();
//   await interestGraphRepo.save(graph);  // ✅ Added await

//   return graph;
// }

// module.exports = { updateInterestGraph };


const { interestGraphRepo } = require('../../db');
const { applyEvent } = require('./interestBuilder');

async function updateInterestGraph(event) {
  if (!event?.userId) return;

  console.log('[interestService] RAW EVENT:', JSON.stringify(event, null, 2));

  let graph = await interestGraphRepo.getByUser(event.userId);
  if (!graph) {
    graph = {
      userId: event.userId,
      interests: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // ✅ PASS FULL EVENT - NO STRIPPING!
  graph = applyEvent(graph, event);

  graph.updatedAt = new Date().toISOString();
  await interestGraphRepo.save(graph);

  return graph;
}


module.exports = { updateInterestGraph };