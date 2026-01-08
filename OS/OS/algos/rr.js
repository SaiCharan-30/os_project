// --- Round Robin (preemptive)
async function simulateRR(simTasks, quantum, speed) {
  // Sort by arrival time initially
  simTasks.sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  simTasks.forEach(t => { t.state = 'WAITING'; t.remaining = t.burst; });

  const timeline = [];
  buildGantt(simTasks, timeline);

  let curTime = 0;
  const queue = [];
  let i = 0;

  while (queue.length > 0 || i < simTasks.length) {
    // Add tasks that have arrived by current time
    while (i < simTasks.length && simTasks[i].arrival <= curTime) {
      queue.push(simTasks[i]);
      i++;
    }

    if (queue.length === 0) {
      // CPU idle if no task is ready
      const nextArrival = simTasks[i].arrival;
      timeline.push({
        task: 'IDLE',
        start: curTime,
        end: nextArrival,
        color: 'linear-gradient(90deg,#475569,#64748b)',
      });
      buildGantt(simTasks, timeline);
      log(`CPU Idle from t=${curTime} to t=${nextArrival}`);
      curTime = nextArrival;
      continue;
    }

    // Execute the first task in queue
    const task = queue.shift();
    const exec = Math.min(task.remaining, quantum);

    task.state = 'RUNNING';
    updateGanttState(task, 'RUNNING');
    buildGantt(simTasks, timeline);
    log(`Running ${task.name} for ${exec} units (RR)`);

    for (let u = 0; u < exec; u++) {
      await wait(speed);
    }

    // Add the executed segment to timeline
    timeline.push({
      task: task.name,
      start: curTime,
      end: curTime + exec,
      color: 'linear-gradient(90deg,#f97316,#f59e0b)',
    });

    curTime += exec;
    task.remaining -= exec;

    // Add new arrivals after execution
    while (i < simTasks.length && simTasks[i].arrival <= curTime) {
      queue.push(simTasks[i]);
      i++;
    }

    if (task.remaining > 0) {
      // Task not finished, push it back to the end of the queue
      task.state = 'WAITING';
      queue.push(task);
      updateGanttState(task, 'WAITING');
      buildGantt(simTasks, timeline);
    } else {
      // Task finished
      task.state = 'COMPLETED';
      task.turnaround = curTime - task.arrival;
      task.waiting = task.turnaround - task.burst;
      updateGanttState(task, 'COMPLETED');
      buildGantt(simTasks, timeline);
      log(`Completed ${task.name} at t=${curTime}`);
    }
  }

  finishMetrics(simTasks, curTime);
  buildGantt(simTasks, timeline);
}