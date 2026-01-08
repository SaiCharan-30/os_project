
// Focus Mode (pick highest-priority among arrived tasks, non-preemptive)
async function simulateFocus_Nonpreemptive(simTasks, speed){
  // lower number = higher priority
  simTasks.forEach(t => { t.state = 'WAITING'; t.remaining = t.burst; });
  const timeline = [];
  let curTime = 0;
  const pending = [...simTasks];

  while (pending.length) {
    // tasks that have arrived by curTime
    const arrived = pending.filter(p => p.arrival <= curTime);
    let pick;

    if (arrived.length) {
      // choose highest priority (lowest number), break ties by arrival then id
      arrived.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.id - b.id);
      pick = arrived[0];
    } else {
      // advance to next arrival — optional idle bar
      const nextA = pending.reduce((m, p) => Math.min(m, p.arrival), Infinity);
      timeline.push({
        task: 'IDLE',
        start: curTime,
        end: nextA,
        color: 'linear-gradient(90deg,#475569,#64748b)'
      });
      curTime = nextA;
      continue;
    }

    // remove chosen process
    const idx = pending.indexOf(pick);
    pending.splice(idx, 1);

    // run the task completely
    pick.state = 'RUNNING';
    updateGanttState(pick, 'RUNNING');
    buildGantt(simTasks, timeline);

    pick.waiting = curTime - pick.arrival;
    log(`Focus: Running ${pick.name} at t=${curTime} (priority ${pick.priority})`);

    for (let u = 0; u < pick.burst; u++) await wait(speed);

    // add to Gantt timeline
    timeline.push({
      task: pick.name,
      start: curTime,
      end: curTime + pick.burst,
      color: 'linear-gradient(90deg,#34d399,#10b981)'
    });

    curTime += pick.burst;
    pick.turnaround = curTime - pick.arrival;
    pick.state = 'COMPLETED';
    updateGanttState(pick, 'COMPLETED');
    buildGantt(simTasks, timeline);

    log(`Focus finished ${pick.name} at t=${curTime}`);
  }

  finishMetrics(simTasks, curTime);
  buildGantt(simTasks, timeline);
}

