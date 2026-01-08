# 🖥️ OS Scheduling Simulator

An interactive, web-based visualization tool for understanding **CPU scheduling algorithms** in Operating Systems.  
This simulator visually demonstrates **process execution**, **context switching**, and **performance analysis** using dynamic Gantt charts and real-time logs.

---

## 🚀 Features

- **Interactive Gantt Chart** – Visualize CPU execution in real time  
- **Multiple Scheduling Algorithms**
  - FCFS
  - SJF (Preemptive & Non-Preemptive)
  - Priority (Preemptive & Non-Preemptive)
  - Round Robin
  - Focus Mode (Custom)
- **Preemptive & Non-Preemptive Modes**
- **Automatic Performance Metrics**
  - Average Waiting Time
  - Average Turnaround Time
  - Total Execution Time
- **Simulation Speed Control** – Slow, Normal, Fast
- **Dark / Light Theme Toggle**
- **Export Execution Logs** as `.txt` files

---

## 🧠 Supported Algorithms

### FCFS (First-Come, First-Served)
- Processes execute strictly in arrival order.

### SJF (Shortest Job First)
- **Non-Preemptive:** Chooses the process with the shortest burst time.
- **Preemptive (SRTF):** Switches to a process with shorter remaining time.

### Priority Scheduling
- **Non-Preemptive:** Executes the highest-priority process (lower number = higher priority).
- **Preemptive:** Context switch occurs when a higher-priority process arrives.

### Round Robin (RR)
- Processes execute in a cyclic order using a fixed **time quantum**.

### Focus Mode (Custom Algorithm)
- Selects process based on:
  1. Highest priority
  2. Shortest remaining time (tie-breaker)

---

## 📂 Project Structure

├── index.html # Main UI
├── style.css # Styling & themes
├── script1.js # Simulation controller & DOM logic
└── algos/ # Scheduling algorithms
├── fcfs.js
├── sjf_non.js
├── sjf_preemptive.js
├── priority_non.js
├── priority_preemptive.js
├── rr.js
├── focus_non.js
└── focus_preemptive.js


---

## 🛠️ Installation & Usage

This project is built using **vanilla JavaScript** and runs entirely on the client side.

### Steps
1. Download or clone the repository
2. Ensure the folder structure remains intact
3. Open `index.html` in any modern web browser

✔ No backend  
✔ No dependencies  
✔ No installation required

---

## 🎮 How to Use

### Configure Simulation
- Select an **Algorithm**
- Choose **Preemptive / Non-Preemptive** mode
- Enter **Time Quantum** (for Round Robin)
- Select simulation **Speed**

### Add Processes
- Process Name (e.g., `P1`)
- Arrival Time
- Burst Time
- Priority (lower value = higher priority)
- Click **Add Task**

### Run & Analyze
- Click **Start Simulation**
- Observe:
  - Gantt chart execution
  - Live scheduling logs
- View calculated performance metrics
- Export logs if needed

---

## 🤝 Contributing

Contributions are welcome!  
You can:
- Add new algorithms (e.g., Multilevel Queue)
- Improve UI/animations
- Optimize performance calculations

Fork the repo and submit a pull request 🚀

---

## 📜 License

This project is created for **educational purposes**.  
Free to use, modify, and distribute.

---

## ⭐ Acknowledgment

Designed to help students and developers gain a clear understanding of **Operating System scheduling concepts** through visualization.
