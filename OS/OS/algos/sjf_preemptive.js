// --- SJF (Preemptive) — Shortest Remaining Time First (SRTF)
async function simulateSJFPreemptive(simTasks, speed) {
  // Initialize each process
  simTasks.forEach(t => {
    t.state = 'WAITING';
    t.remaining = t.burst;
  });

  const timeline = [];
  buildGantt(simTasks, timeline);
  let curTime = 0;
  let completed = 0;
  let current = null;
  let lastStart = null;

  log(`Simulation started — SJF (Preemptive / SRTF)`);

  // Run until all processes complete
  while (completed < simTasks.length) {
    // Get all tasks that have arrived and not completed
    const available = simTasks.filter(t => t.arrival <= curTime && t.remaining > 0);

    // If none are available, CPU idle
    if (available.length === 0) {
      const nextArrival = Math.min(...simTasks.filter(t => t.remaining > 0).map(t => t.arrival));
      timeline.push({
        task: 'IDLE',
        start: curTime,
        end: nextArrival,
        color: 'linear-gradient(90deg,#475569,#64748b)',
      });
      buildGantt(simTasks, timeline);
      log(`CPU Idle from t=${curTime} to t=${nextArrival}`);
      curTime = nextArrival;
      current = null;
      continue;
    }

    // Pick process with smallest remaining time
    const next = available.reduce((a, b) => a.remaining < b.remaining ? a : b);

    // Preemption / context switch
    if (current !== next) {
      // Save previous running segment if there was one
      if (current && lastStart !== null) {
        timeline.push({
          task: current.name,
          start: lastStart,
          end: curTime,
          color: 'linear-gradient(90deg,#38bdf8,#0ea5e9)',
        });
      }

      current = next;
      lastStart = curTime;
      updateGanttState(current, 'RUNNING');
      buildGantt(simTasks, timeline);
      log(`Switched to ${current.name} (Remaining=${current.remaining}) at t=${curTime}`);
    }

    // Execute 1 time unit
    current.remaining--;
    await wait(speed);
    curTime++;

    // If process completes
    if (current.remaining === 0) {
      current.turnaround = curTime - current.arrival;
      current.waiting = current.turnaround - current.burst;
      current.state = 'COMPLETED';
      updateGanttState(current, 'COMPLETED');
      buildGantt(simTasks, timeline);

      timeline.push({
        task: current.name,
        start: lastStart,
        end: curTime,
        color: 'linear-gradient(90deg,#38bdf8,#0ea5e9)',
      });

      log(`Completed ${current.name} at t=${curTime}`);
      completed++;
      current = null;
      lastStart = null;
    }
  }

  finishMetrics(simTasks, curTime);
  buildGantt(simTasks, timeline);
  log(`Simulation finished — SJF (Preemptive / SRTF)`);
}// --- Shortest Remaining Time First (Preemptive SJF)
async function simulateSRTF(simTasks, speed) {
  simTasks.sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  simTasks.forEach(t => { 
    t.state = 'WAITING'; 
    t.remaining = t.burst; 
  });

  const timeline = [];
  let curTime = 0;
  let completed = 0;
  let lastTask = null;
  let lastStart = null;

  log(`Simulation started — Algorithm: SRTF`);

  while (completed < simTasks.length) {
    // Get all available tasks at current time
    const available = simTasks.filter(t => t.arrival <= curTime && t.remaining > 0);

    if (available.length === 0) {
      // CPU idle
      const nextArrival = Math.min(...simTasks.filter(t => t.remaining > 0).map(t => t.arrival));
      timeline.push({ task: 'IDLE', start: curTime, end: nextArrival, color: 'linear-gradient(90deg,#475569,#64748b)' });
      log(`CPU idle from t=${curTime} to t=${nextArrival}`);
      curTime = nextArrival;
      lastTask = null;
      lastStart = null;
      continue;
    }

    // Pick task with shortest remaining time
    const current = available.reduce((a, b) => a.remaining <= b.remaining ? a : b);

    // If switching tasks, finalize last timeline bar
    if (lastTask !== current) {
      if (lastTask && lastStart !== null) {
        timeline.push({
          task: lastTask.name,
          start: lastStart,
          end: curTime,
          color: 'linear-gradient(90deg,#22d3ee,#0284c7)'
        });
      }
      lastTask = current;
      lastStart = curTime;
      updateGanttState(current, 'RUNNING');
      buildGantt(simTasks, timeline);
      log(`Switched to ${current.name} at t=${curTime}`);
    }

    // Execute 1 unit of time
    current.remaining--;
    await wait(speed);
    curTime++;

    // If task finishes
    if (current.remaining === 0) {
      current.turnaround = curTime - current.arrival;
      current.waiting = current.turnaround - current.burst;
      current.state = 'COMPLETED';
      updateGanttState(current, 'COMPLETED');
      buildGantt(simTasks, timeline);
      log(`Completed ${current.name} at t=${curTime}`);

      // finalize last timeline bar
      timeline.push({
        task: current.name,
        start: lastStart,
        end: curTime,
        color: 'linear-gradient(90deg,#22d3ee,#0284c7)'
      });

      completed++;
      lastTask = null;
      lastStart = null;
    }
  }

  finishMetrics(simTasks, curTime);
  buildGantt(simTasks, timeline);
  log(`Simulation finished — Algorithm: SRTF`);
}
