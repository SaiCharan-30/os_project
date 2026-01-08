// OS Scheduling & Focus Mode Simulator
// Save as script.js and include in index.html

// --- UI references
const nameInput = document.getElementById('name');
const arrivalInput = document.getElementById('arrival');
const burstInput = document.getElementById('burst');
const priorityInput = document.getElementById('priorityInput');
const addBtn = document.getElementById('addBtn');
const clearBtn = document.getElementById('clearBtn');
const taskList = document.getElementById('taskList');
const runBtn = document.getElementById('runBtn');
const gantt = document.getElementById('gantt');
const logEl = document.getElementById('log');
const avgWaitEl = document.getElementById('avgWait');
const avgTurnEl = document.getElementById('avgTurn');
const totalTimeEl = document.getElementById('totalTime');
const algorithmSelect = document.getElementById('algorithm');
const quantumInput = document.getElementById('quantum');
const quantumLabel = document.getElementById('quantumLabel');
const speedSelect = document.getElementById('speed');
const exportBtn = document.getElementById('exportBtn');

let tasks = [];
let logLines = [];

// show/hide quantum for RR
algorithmSelect.addEventListener('change', () => {
  if (algorithmSelect.value === 'RR') quantumLabel.classList.remove('hidden')
  else quantumLabel.classList.add('hidden');
});

// add tasks
addBtn.addEventListener('click', () => {
  const name = (nameInput.value || '').trim() || `Task${tasks.length+1}`;
  const arrival = parseInt(arrivalInput.value) || 0;
  const burst = Math.max(1, parseInt(burstInput.value) || 1);
  const priority = Math.max(1, parseInt(priorityInput.value) || 3);

  tasks.push({
    id: tasks.length + 1,
    name, arrival, burst,
    priority, remaining: burst,
    state: 'Waiting',
    waiting: 0, turnaround: 0
  });
  nameInput.value = arrivalInput.value = '';
  burstInput.value = 3;
  priorityInput.value = 3;
  renderTaskList();
});

// clear all
clearBtn.addEventListener('click', () => {
  if (!confirm('Clear all tasks?')) return;
  tasks = []; logLines = [];
  renderTaskList(); resetUI();
});

// run simulation
runBtn.addEventListener('click', async () => {
  if (tasks.length === 0) { alert('Add tasks first'); return; }
  const alg = algorithmSelect.value;
  const quantum = Math.max(1, parseInt(quantumInput.value) || 2);
  const speed = parseInt(speedSelect.value) || 450;

  // copy tasks so UI remains editable
  const simTasks = tasks.map(t => ({ ...t }));
  resetUI();
  log(`Simulation started — Algorithm: ${alg}${alg==='RR'?(' (Q='+quantum+')'):''}`);

  if (alg === 'FCFS') await simulateFCFS(simTasks, speed);
  else if (alg === 'SJF') await simulateSJF(simTasks, speed);
  else if (alg === "SRTF") simulateSRTF(simTasks, speed);
  else if (alg === 'PRIORITY') await simulatePriority(simTasks, speed);
  else if (alg === 'RR') await simulateRR(simTasks, quantum, speed);
  else if (alg === 'FOCUS') await simulateFocus(simTasks, speed);

  log('Simulation finished.');
  exportBtn.disabled = false;
});

// export log
exportBtn.addEventListener('click', () => {
  if (logLines.length === 0) { alert('No log to export'); return; }
  const blob = new Blob([logLines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'os_simulator_log.txt';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// --- UI helpers
function renderTaskList() {
  taskList.innerHTML = '';
  tasks.sort((a,b)=>a.id-b.id);
  tasks.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'task';
    div.innerHTML = `
      <div class="meta">
        <div class="badge">${t.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:700">${t.name}</div>
          <div class="small">Arr:${t.arrival} • Burst:${t.burst} • Pri:${t.priority}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn" onclick="removeTask(${i})">Remove</button>
      </div>`;
    taskList.appendChild(div);
  });
}
window.removeTask = (i) => { tasks.splice(i,1); renderTaskList(); }

// reset UI containers
function resetUI(){
  gantt.innerHTML = 'Gantt will appear here after start.';
  logEl.innerHTML = '';
  avgWaitEl.innerText = '-';
  avgTurnEl.innerText = '-';
  totalTimeEl.innerText = '-';
  logLines = [];
  exportBtn.disabled = true;
}

// log helper
function log(s){
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${s}`;
  logLines.push(line);
  logEl.innerText = line + '\n' + logEl.innerText;
}

// draw gantt bars proportional to burst and total time
function buildGantt(simTasks, timeline = []) {
  gantt.innerHTML = '';

  // Calculate total time (max completion)
  const totalTime = timeline.length > 0 
    ? Math.max(...timeline.map(e => e.end)) 
    : simTasks.reduce((sum, t) => sum + t.burst, 0);

  // Container height: dynamically adjust based on number of tasks
  const containerHeight = Math.max(80, simTasks.length * 50); // 50px per task lane

  const ganttContainer = document.createElement('div');
  ganttContainer.className = 'gantt-container';
  ganttContainer.style.height = containerHeight + 'px';

  // Create bars
  timeline.forEach((entry, index) => {
    const bar = document.createElement('div');
    bar.className = 'gantt-bar';
    bar.textContent = entry.task;

    // Horizontal position & width
    bar.style.left = `${(entry.start / totalTime) * 100}%`;
    bar.style.width = `${Math.max(((entry.end - entry.start) / totalTime) * 100, 2)}%`;

    // Vertical position based on task id or index
    const laneIndex = simTasks.findIndex(t => t.name === entry.task);
    bar.style.top = `${laneIndex * 50}px`; // 45px gap per lane

    // Set color
    bar.style.background = entry.color || 'linear-gradient(90deg, #34d399, #5eead4)';
    
    ganttContainer.appendChild(bar);
  });

  // Add time markers
  const markerWrap = document.createElement('div');
  markerWrap.className = 'gantt-markers';
  for (let i = 0; i <= totalTime; i++) {
    const tick = document.createElement('div');
    tick.className = 'marker';
    tick.style.left = `${(i / totalTime) * 100}%`;
    tick.textContent = i;
    markerWrap.appendChild(tick);
  }

  gantt.appendChild(ganttContainer);
  gantt.appendChild(markerWrap);
}


// update gantt single element's appearance
function updateGanttState(t, state){
  if (!t._el) return;
  t._el.className = 'gantt-bar';
  if (state === 'RUNNING') t._el.classList.add('gantt-run');
  else if (state === 'SUSPENDED') t._el.classList.add('gantt-suspended');
  else if (state === 'COMPLETED') t._el.classList.add('gantt-completed');
  else t._el.classList.add('gantt-wait');
}

// sleep utility
function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

// --- Scheduling algorithms implementations

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
      // Add idle bar to Gantt
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



// --- SJF (non-preemptive) — choose shortest burst among arrived
async function simulateSJF(simTasks, speed) {
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


// --- Priority (non-preemptive)
async function simulatePriority(simTasks, speed) {
  simTasks.forEach(t => { t.state = 'WAITING'; t.remaining = t.burst; });
  const timeline = [];
  buildGantt(simTasks, timeline);
  let curTime = 0;
  const pending = [...simTasks];

  while (pending.length) {
    const arrived = pending.filter(p => p.arrival <= curTime);
    let pick;

    if (arrived.length) {
      arrived.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
      pick = arrived[0];
    } else {
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
    log(`Running ${pick.name} at t=${curTime} (Priority=${pick.priority})`);

    for (let u = 0; u < pick.burst; u++) { await wait(speed); }

    timeline.push({
      task: pick.name,
      start: curTime,
      end: curTime + pick.burst,
      color: 'linear-gradient(90deg,#a78bfa,#7c3aed)',
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



// --- Shortest Remaining Time First (Preemptive SJF)
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


// Focus Mode (pick highest-priority among arrived tasks, non-preemptive)
async function simulateFocus(simTasks, speed){
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


// finalize metrics & show
function finishMetrics(simTasks, totalTime){
  const n = simTasks.length;
  const totalWait = simTasks.reduce((s,t)=>s + (t.waiting || 0), 0);
  const totalTurn = simTasks.reduce((s,t)=>s + (t.turnaround || 0), 0);
  avgWaitEl.innerText = (totalWait / n).toFixed(2);
  avgTurnEl.innerText = (totalTurn / n).toFixed(2);
  totalTimeEl.innerText = totalTime;
  // ensure gantt rebuilt to reflect states
  buildGantt(simTasks);
}

// initial render
renderTaskList();
resetUI();
