// --- SJF (non-preemptive) — choose shortest burst among arrived
async function simulateSJF_Nonpreemptive(simTasks, speed) {
  simTasks.forEach(t => { t.state = 'WAITING'; t.remaining = t.burst; });
  const timeline = [];
  buildGantt(simTasks, timeline);
  let curTime = 0;
  const pending = [...simTasks];

  while (pending.length) {
    const arrived = pending.filter(p => p.arrival <= curTime);
    let pick;

    if (arrived.length) {
      arrived.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
      pick = arrived[0];
    } else {
      // idle period
      const nextA = pending.reduce((m, p) => Math.min(m, p.arrival), Infinity);
      timeline.push({
        task: 'IDLE',
        start: curTime,
        end: nextA,
        color: 'linear-gradient(90deg,#475569,#64748b)',
      });
      buildGantt(simTasks, timeline);
      log(`CPU Idle from t=${curTime} to t=${nextA}`);
      curTime = nextA;
      continue;
    }

    const idx = pending.indexOf(pick);
    pending.splice(idx, 1);

    pick.state = 'RUNNING';
    updateGanttState(pick, 'RUNNING');
    buildGantt(simTasks, timeline);

    pick.waiting = curTime - pick.arrival;
    log(`Running ${pick.name} at t=${curTime} for ${pick.burst} (SJF)`);

    for (let u = 0; u < pick.burst; u++) { await wait(speed); }

    timeline.push({
      task: pick.name,
      start: curTime,
      end: curTime + pick.burst,
      color: 'linear-gradient(90deg,#38bdf8,#0ea5e9)',
    });

    curTime += pick.burst;
    pick.turnaround = curTime - pick.arrival;
    pick.state = 'COMPLETED';
    updateGanttState(pick, 'COMPLETED');
    buildGantt(simTasks, timeline);
    log(`Completed ${pick.name} at t=${curTime}`);
  }

  finishMetrics(simTasks, curTime);
  buildGantt(simTasks, timeline);
}
