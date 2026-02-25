/**
 * Naive DGEMM Implementation
 */
(function() {
    const TARGET_CONTAINER_ID = "naive_matmul";
    const ID_PREFIX = "naive_full_" + Math.random().toString(36).substr(2, 9);

    class FullNaiveMatMulVisualizer {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;
            
            // 레이아웃 강제 교정: 주변 요소와 겹치지 않게 함
            this.container.style.clear = "both";
            this.container.style.display = "block";
            this.container.style.overflow = "hidden";
            this.container.style.width = "100%";

            this.N = 6;
            this.isAnimating = false;
            this.abortController = null;
            this.accessHistory = {
                A: Array.from({length: this.N}, () => Array(this.N).fill(-1)),
                B: Array.from({length: this.N}, () => Array(this.N).fill(-1)),
                C: Array.from({length: this.N}, () => Array(this.N).fill(-1))
            };
            this.globalClock = 0;
            this.init();
        }

        init() {
            const style = document.createElement('style');
            style.innerHTML = `
                #${ID_PREFIX}_wrapper { font-family: -apple-system, sans-serif; background: #1a1a1a; padding: 25px; border-radius: 12px; color: #e0e0e0; margin: 20px 0; }
                .naive-header { text-align: center; margin-bottom: 25px; }
                .naive-title { font-size: 1.4rem; font-weight: 600; color: #4CAF50; margin-bottom: 10px; }
                .naive-subtitle { font-size: 0.85rem; color: #888; }
                .naive-controls { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
                .gemm-btn { padding: 10px 20px; border: none; border-radius: 6px; background: #4CAF50; color: white; cursor: pointer; transition: 0.3s; font-weight: bold; }
                .gemm-btn:hover { background: #45a049; }
                .gemm-btn:disabled { background: #444; cursor: not-allowed; }
                .canvas-area { background: #252525; border-radius: 8px; padding: 20px; display: flex; justify-content: center; gap: 30px; align-items: flex-start; flex-wrap: wrap; }
                .matrix-box { text-align: center; }
                .matrix-label { font-size: 0.75rem; color: #999; margin-bottom: 8px; font-weight: bold; }
                .matrix-grid { display: grid; gap: 2px; background: #333; }
                .cell { width: 20px; height: 20px; background: #333; border-radius: 2px; transition: background 0.1s; }
                .age-dark { background: #666 !important; }
                .age-light { background: #444 !important; }
                .age-white { background: #2a2a2a !important; }
                .active-cell { background: #4CAF50 !important; outline: 1px solid #fff; z-index: 10; }
                .status-panel { background: #2a2a2a; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 0.8rem; font-family: monospace; }
                .code-line { margin: 2px 0; color: #888; }
                .code-active { color: #4CAF50; font-weight: bold; background: #1e3a1e; padding: 0 4px; border-radius: 2px; }
            `;
            document.head.appendChild(style);

            this.container.innerHTML = `
                <div id="${ID_PREFIX}_wrapper">
                    <div class="naive-header">
                        <div class="naive-title">Naive DGEMM Simulation (N=6)</div>
                        <div class="naive-subtitle">Sequential element-by-element access without cache blocking.</div>
                    </div>
                    <div class="naive-controls">
                        <button class="gemm-btn" id="${ID_PREFIX}_start">Start Simulation</button>
                        <button class="gemm-btn" id="${ID_PREFIX}_reset">Reset</button>
                    </div>
                    <div class="canvas-area">
                        <div class="matrix-box" id="${ID_PREFIX}_C_box"></div>
                        <div class="matrix-box" id="${ID_PREFIX}_A_box"></div>
                        <div class="matrix-box" id="${ID_PREFIX}_B_box"></div>
                    </div>
                    <div class="status-panel">
                        <div id="${ID_PREFIX}_line_i" class="code-line">for (int i = 0; i &lt; n; ++i) {</div>
                        <div id="${ID_PREFIX}_line_j" class="code-line">&nbsp;&nbsp;for (int j = 0; j &lt; n; ++j) {</div>
                        <div id="${ID_PREFIX}_line_cij" class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;double cij = C[i + j * n];</div>
                        <div id="${ID_PREFIX}_line_k" class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;for (int k = 0; k &lt; n; k++) {</div>
                        <div id="${ID_PREFIX}_line_acc" class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cij += A[i + k * n] * B[k + j * n];</div>
                        <div id="${ID_PREFIX}_line_store" class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;} C[i + j * n] = cij;</div>
                        <div id="${ID_PREFIX}_line_end_j" class="code-line">&nbsp;&nbsp;}</div>
                        <div id="${ID_PREFIX}_line_end_i" class="code-line">}</div>
                        <div id="${ID_PREFIX}_info" style="margin-top:10px; font-weight:bold; color:#4CAF50;">Status: Ready</div>
                    </div>
                </div>
            `;
            this.renderGrids();
            this.startBtn = document.getElementById(`${ID_PREFIX}_start`);
            this.resetBtn = document.getElementById(`${ID_PREFIX}_reset`);
            this.startBtn.onclick = () => this.startSimulation();
            this.resetBtn.onclick = () => this.reset();
        }

        renderGrids() {
            ['C', 'A', 'B'].forEach(m => {
                const box = document.getElementById(`${ID_PREFIX}_${m}_box`);
                if (!box) return;
                box.innerHTML = `<div class="matrix-label">Matrix ${m}</div>`;
                const grid = document.createElement('div');
                grid.className = 'matrix-grid';
                grid.style.gridTemplateColumns = `repeat(${this.N}, 1fr)`;
                for (let r = 0; r < this.N; r++) {
                    for (let c = 0; c < this.N; c++) {
                        const cell = document.createElement('div');
                        cell.className = 'cell age-white';
                        cell.id = `${ID_PREFIX}_${m}_${r}_${c}`;
                        grid.appendChild(cell);
                    }
                }
                box.appendChild(grid);
            });
        }

        updateShading() {
            for (let r = 0; r < this.N; r++) {
                for (let c = 0; c < this.N; c++) {
                    ['A', 'B', 'C'].forEach(m => {
                        const cell = document.getElementById(`${ID_PREFIX}_${m}_${r}_${c}`);
                        if (!cell) return;
                        const lastAccess = this.accessHistory[m][r][c];
                        cell.classList.remove('age-dark', 'age-light', 'age-white', 'active-cell');
                        if (lastAccess === -1) cell.classList.add('age-white');
                        else if (this.globalClock - lastAccess < 15) cell.classList.add('age-dark');
                        else cell.classList.add('age-light');
                    });
                }
            }
        }

        async startSimulation() {
            if (this.isAnimating) return;
            this.isAnimating = true;
            this.startBtn.disabled = true;
            this.abortController = new AbortController();
            const { signal } = this.abortController;
            const info = document.getElementById(`${ID_PREFIX}_info`);
            try {
                for (let i = 0; i < this.N; i++) {
                    this.highlightLine('line_i');
                    for (let j = 0; j < this.N; j++) {
                        this.highlightLine('line_j');
                        if (signal.aborted) return;
                        this.globalClock++;
                        this.accessHistory.C[i][j] = this.globalClock;
                        this.highlightLine('line_cij');
                        this.updateShading();
                        const targetC = document.getElementById(`${ID_PREFIX}_C_${i}_${j}`);
                        if (targetC) targetC.classList.add('active-cell');
                        await this.sleep(100, signal);
                        for (let k = 0; k < this.N; k++) {
                            if (signal.aborted) return;
                            this.globalClock++;
                            this.accessHistory.A[i][k] = this.globalClock;
                            this.accessHistory.B[k][j] = this.globalClock;
                            this.highlightLine('line_acc');
                            this.updateShading();
                            const targetA = document.getElementById(`${ID_PREFIX}_A_${i}_${k}`);
                            const targetB = document.getElementById(`${ID_PREFIX}_B_${k}_${j}`);
                            if (targetA) targetA.classList.add('active-cell');
                            if (targetB) targetB.classList.add('active-cell');
                            await this.sleep(40, signal);
                        }
                        this.globalClock++;
                        this.accessHistory.C[i][j] = this.globalClock;
                        this.highlightLine('line_store');
                        this.updateShading();
                        const finalC = document.getElementById(`${ID_PREFIX}_C_${i}_${j}`);
                        if (finalC) finalC.classList.add('active-cell');
                        await this.sleep(80, signal);
                    }
                }
                info.innerText = "All loops finished (D = AB + C)";
                this.highlightLine(null);
            } catch (e) { } 
            finally {
                this.isAnimating = false;
                this.startBtn.disabled = true;
            }
        }

        highlightLine(idSuffix) {
            const lines = ['line_i', 'line_j', 'line_cij', 'line_k', 'line_acc', 'line_store'];
            lines.forEach(l => {
                const el = document.getElementById(`${ID_PREFIX}_${l}`);
                if (el) el.classList.remove('code-active');
            });
            if(idSuffix) {
                const el = document.getElementById(`${ID_PREFIX}_${idSuffix}`);
                if (el) el.classList.add('code-active');
            }
        }

        reset() {
            if (this.abortController) this.abortController.abort();
            this.isAnimating = false;
            this.startBtn.disabled = false;
            this.globalClock = 0;
            this.accessHistory.A.forEach(row => row.fill(-1));
            this.accessHistory.B.forEach(row => row.fill(-1));
            this.accessHistory.C.forEach(row => row.fill(-1));
            this.updateShading();
            this.highlightLine(null);
            document.getElementById(`${ID_PREFIX}_info`).innerText = "Status: Reset & Ready";
        }

        sleep(ms, signal) {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, ms);
                signal.addEventListener('abort', () => {
                    clearTimeout(timeout);
                    reject(new Error("aborted"));
                });
            });
        }
    }

    const initViz = () => { if (document.getElementById(TARGET_CONTAINER_ID)) new FullNaiveMatMulVisualizer(TARGET_CONTAINER_ID); };
    if (document.readyState === 'complete') initViz();
    else window.addEventListener('load', initViz);
})();
