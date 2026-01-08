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
const modeSelect = document.getElementById('mode');


let tasks = [];
let logLines = [];

// Show/hide quantum input for RR
algorithmSelect.addEventListener('change', () => {
  quantumLabel.classList.toggle('hidden', algorithmSelect.value !== 'RR');
});

// Add task
addBtn.addEventListener('click', () => {
  const name = (nameInput.value || '').trim() || `Task${tasks.length+1}`;
  const arrival = parseInt(arrivalInput.value) || 0;
  const burst = Math.max(1, parseInt(burstInput.value) || 1);
  const priority = Math.max(1, parseInt(priorityInput.value) || 3);

  tasks.push({ 
    id: tasks.length+1, name, arrival, burst, priority,
    remaining: burst, state: 'Waiting', waiting: 0, turnaround: 0
  });

  nameInput.value = arrivalInput.value = '';
  burstInput.value = priorityInput.value = 3;
  renderTaskList();
});

// Clear all tasks
clearBtn.addEventListener('click', () => {
  if (!confirm('Clear all tasks?')) return;
  tasks = []; logLines = [];
  renderTaskList(); resetUI();
});

// Run simulation
// run simulation
runBtn.addEventListener('click', async () => {
  if (tasks.length === 0) { alert('Add tasks first'); return; }
  const alg = algorithmSelect.value;
  const mode = modeSelect.value; // <---- NEW LINE
  const quantum = Math.max(1, parseInt(quantumInput.value) || 2);
  const speed = parseInt(speedSelect.value) || 450;

  const simTasks = tasks.map(t => ({ ...t }));
  resetUI();
  log(`Simulation started — Algorithm: ${alg} (${mode})${alg==='RR'?(' (Q='+quantum+')'):''}`);

  // --- Decide which to run
  if (alg === 'FCFS') {
    await simulateFCFS(simTasks, speed);// no preemptive mode for FCFS
  } 
  else if (alg === 'SJF') {
    if (mode === 'preemptive') await simulateSJFPreemptive(simTasks, speed);
    else await simulateSJF_Nonpreemptive(simTasks, speed);
  } 
  else if (alg === 'PRIORITY') {
    if (mode === 'preemptive') await simulatePriorityPreemptive(simTasks, speed);
    else await simulatePriority_Nonpreemptive(simTasks, speed);
  } 
  else if (alg === 'RR') {
    await simulateRR(simTasks, quantum, speed);// no preemptive mode for RR
  } 
  else if (alg === 'FOCUS') {
     if (mode === 'preemptive') await simulateFocusPreemptive(simTasks, speed);
    else await simulateFocus_Nonpreemptive(simTasks, speed);
  }

  log('Simulation finished.');
  exportBtn.disabled = false;
});


// Export log
exportBtn.addEventListener('click', () => {
  if (!logLines.length) { alert('No log to export'); return; }
  const blob = new Blob([logLines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'os_simulator_log.txt';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// --- UI helpers
function renderTaskList() {
  taskList.innerHTML = '';
  tasks.sort((a,b)=>a.id-b.id);
  tasks.forEach((t,i)=>{
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
window.removeTask = i => { tasks.splice(i,1); renderTaskList(); }

// Reset UI
function resetUI() {
  gantt.innerHTML = 'Gantt will appear here after start.';
  logEl.innerHTML = '';
  avgWaitEl.innerText = avgTurnEl.innerText = totalTimeEl.innerText = '-';
  logLines = [];
  exportBtn.disabled = true;
}

// Log helper
function log(msg) {
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${msg}`;
  logLines.push(line);
  logEl.innerText = line + '\n' + logEl.innerText;
}

// Sleep utility
function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

// Finish metrics
function finishMetrics(simTasks, totalTime){
  const n = simTasks.length;
  const totalWait = simTasks.reduce((s,t)=>s + (t.waiting || 0), 0);
  const totalTurn = simTasks.reduce((s,t)=>s + (t.turnaround || 0), 0);
  avgWaitEl.innerText = (totalWait/n).toFixed(2);
  avgTurnEl.innerText = (totalTurn/n).toFixed(2);
  totalTimeEl.innerText = totalTime;
  buildGantt(simTasks);
}

// Build Gantt chart
function buildGantt(simTasks, timeline=[]){
  gantt.innerHTML = '';
  const totalTime = timeline.length ? Math.max(...timeline.map(e=>e.end)) 
                  : simTasks.reduce((sum,t)=>sum+t.burst,0);
  const containerHeight = Math.max(80, simTasks.length*50);
  const ganttContainer = document.createElement('div');
  ganttContainer.className = 'gantt-container';
  ganttContainer.style.height = containerHeight+'px';

  timeline.forEach(entry=>{
    const bar = document.createElement('div');
    bar.className = 'gantt-bar';
    bar.textContent = entry.task;
    bar.style.left = `${(entry.start/totalTime)*100}%`;
    bar.style.width = `${Math.max(((entry.end-entry.start)/totalTime)*100,2)}%`;
    const laneIndex = simTasks.findIndex(t=>t.name===entry.task);
    bar.style.top = `${laneIndex*50}px`;
    bar.style.background = entry.color || 'linear-gradient(90deg, #34d399, #5eead4)';
    ganttContainer.appendChild(bar);
  });

  const markerWrap = document.createElement('div');
  markerWrap.className = 'gantt-markers';
  for(let i=0;i<=totalTime;i++){
    const tick = document.createElement('div');
    tick.className='marker';
    tick.style.left=`${(i/totalTime)*100}%`;
    tick.textContent=i;
    markerWrap.appendChild(tick);
  }

  gantt.appendChild(ganttContainer);
  gantt.appendChild(markerWrap);
}

// Update Gantt state for a task
function updateGanttState(t,state){
  if(!t._el) return;
  t._el.className='gantt-bar';
  if(state==='RUNNING') t._el.classList.add('gantt-run');
  else if(state==='SUSPENDED') t._el.classList.add('gantt-suspended');
  else if(state==='COMPLETED') t._el.classList.add('gantt-completed');
  else t._el.classList.add('gantt-wait');
}

// Initial render
renderTaskList();
resetUI();
