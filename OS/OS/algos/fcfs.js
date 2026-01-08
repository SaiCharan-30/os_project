// fcfs.js

// FCFS — order by arrival then insertion order
async function simulateFCFS(simTasks, speed) {
  // Step 1: Sort by arrival time (then by ID)
  simTasks.sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  simTasks.forEach(t => { t.state = 'WAITING'; t.remaining = t.burst; });

  // Step 2: Initialize timeline (for Gantt chart)
  const timeline = [];
  buildGantt(simTasks, timeline);

  let curTime = 0;

  // Step 3: Simulate FCFS
  for (let i = 0; i < simTasks.length; i++) {
    const t = simTasks[i];

    // Handle idle CPU (gap before next arrival)
    if (curTime < t.arrival) {
      log(`CPU Idle from t=${curTime} to t=${t.arrival}`);
      await wait(speed);
      timeline.push({
        task: 'IDLE',
        start: curTime,
        end: t.arrival,
        color: 'linear-gradient(90deg,#475569,#64748b)',
      });
      buildGantt(simTasks, timeline);
      curTime = t.arrival;
    }

    // Start process
    t.state = 'RUNNING';
    updateGanttState(t, 'RUNNING');
    buildGantt(simTasks, timeline);

    // Waiting time before execution
    t.waiting = curTime - t.arrival;
    log(`Running ${t.name} at t=${curTime} for ${t.burst}`);

    // Simulate execution
    for (let u = 0; u < t.burst; u++) {
      log(` ${t.name}: ${u + 1}/${t.burst}`);
      await wait(speed);
    }

    // Update timeline and time counter
    timeline.push({
      task: t.name,
      start: curTime,
      end: curTime + t.burst,
      color: 'linear-gradient(90deg,#34d399,#10b981)',
    });

    curTime += t.burst;

    // Process completed
    t.turnaround = curTime - t.arrival;
    t.state = 'COMPLETED';
    updateGanttState(t, 'COMPLETED');
    buildGantt(simTasks, timeline);

    log(`Completed ${t.name} at t=${curTime}`);
  }

  // Step 4: Compute metrics and show final Gantt
  finishMetrics(simTasks, curTime);
  buildGantt(simTasks, timeline);
}
