// --- Focus Mode (Preemptive)
//   Rules:
//   • Always pick process with the highest priority (lowest number = higher priority)
//   • If tie, pick the one with shortest remaining time
//   • Preempt when a higher-priority OR shorter job arrives
//   • Runs 1 time unit at a time
async function simulateFocusPreemptive(simTasks, speed) {
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

  log("Simulation started — Focus Mode (Preemptive)");

  while (completed < simTasks.length) {
    // Get all tasks that have arrived and not finished
    const available = simTasks.filter(t => t.arrival <= curTime && t.remaining > 0);

    if (available.length === 0) {
      // CPU idle
      const nextArrival = Math.min(...simTasks.filter(t => t.remaining > 0).map(t => t.arrival));
      timeline.push({
        task: "IDLE",
        start: curTime,
        end: nextArrival,
        color: "linear-gradient(90deg,#475569,#64748b)",
      });
      buildGantt(simTasks, timeline);
      log(`CPU Idle from t=${curTime} to t=${nextArrival}`);
      curTime = nextArrival;
      current = null;
      continue;
    }

    // Pick highest priority, then shortest remaining time
    available.sort((a, b) => a.priority - b.priority || a.remaining - b.remaining);
    const next = available[0];

    // Context switch if preempted
    if (current !== next) {
      if (current && lastStart !== null) {
        timeline.push({
          task: current.name,
          start: lastStart,
          end: curTime,
          color: "linear-gradient(90deg,#5eead4,#06b6d4)",
        });
      }

      current = next;
      lastStart = curTime;
      updateGanttState(current, "RUNNING");
      buildGantt(simTasks, timeline);
      log(`Switched to ${current.name} (P=${current.priority}, Remaining=${current.remaining}) at t=${curTime}`);
    }

    // Execute 1 time unit
    current.remaining--;
    await wait(speed);
    curTime++;

    // If process completes
    if (current.remaining === 0) {
      current.turnaround = curTime - current.arrival;
      current.waiting = current.turnaround - current.burst;
      current.state = "COMPLETED";
      updateGanttState(current, "COMPLETED");
      buildGantt(simTasks, timeline);

      timeline.push({
        task: current.name,
        start: lastStart,
        end: curTime,
        color: "linear-gradient(90deg,#5eead4,#06b6d4)",
      });

      log(`✅ Completed ${current.name} at t=${curTime}`);
      completed++;
      current = null;
      lastStart = null;
    }
  }

  finishMetrics(simTasks, curTime);
  buildGantt(simTasks, timeline);
  log("Simulation finished — Focus Mode (Preemptive)");
}
