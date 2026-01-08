// --- Priority Scheduling (Preemptive)
async function simulatePriorityPreemptive(simTasks, speed) {
  // Initialize tasks
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

  log(`Simulation started — Priority (Preemptive)`);

  // Continue until all tasks complete
  while (completed < simTasks.length) {
    // Get all processes that have arrived and are not completed
    const available = simTasks.filter(t => t.arrival <= curTime && t.remaining > 0);

    // If no process is ready, CPU idle
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

    // Select process with highest priority (lower number = higher priority)
    const next = available.reduce((a, b) => a.priority < b.priority ? a : b);

    // If a new process is selected (preemption occurs)
    if (current !== next) {
      // Save the previous running segment
      if (current && lastStart !== null) {
        timeline.push({
          task: current.name,
          start: lastStart,
          end: curTime,
          color: 'linear-gradient(90deg,#a78bfa,#7c3aed)',
        });
      }

      current = next;
      lastStart = curTime;
      updateGanttState(current, 'RUNNING');
      buildGantt(simTasks, timeline);
      log(`Switched to ${current.name} (Priority=${current.priority}) at t=${curTime}`);
    }

    // Execute current process for 1 unit of time
    current.remaining--;
    await wait(speed);
    curTime++;

    // If process finishes
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
        color: 'linear-gradient(90deg,#a78bfa,#7c3aed)',
      });

      log(`Completed ${current.name} at t=${curTime}`);
      completed++;
      current = null;
      lastStart = null;
    }
  }

  finishMetrics(simTasks, curTime);
  buildGantt(simTasks, timeline);
  log(`Simulation finished — Priority (Preemptive)`);
}
