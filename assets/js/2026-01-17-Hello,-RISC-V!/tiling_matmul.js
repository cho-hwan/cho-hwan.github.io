/**
 * Tiling DGEMM Visualizer (Fixed: Register Reuse & Correct Tiling)
 */
(function() {
    const TARGET_CONTAINER_ID = "tiling_matmul_visualization";
    const ID_PREFIX = "tiling_viz_" + Math.random().toString(36).substr(2, 9);

    class TilingMatMulVisualizer {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;
            
            this.N = 6;
            this.BLOCKSIZE = 3;
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
                #${ID_PREFIX}_wrapper { font-family: 'Consolas', monospace; background: #1a1a1a; padding: 25px; border-radius: 12px; color: #e0e0e0; margin: 20px 0; }
                .header { text-align: center; margin-bottom: 20px; font-family: sans-serif; }
                .title { font-size: 1.2rem; font-weight: 600; color: #4CAF50; }
                .controls { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
                .gemm-btn { padding: 8px 16px; border: none; border-radius: 6px; background: #4CAF50; color: white; cursor: pointer; transition: 0.3s; font-weight: bold; }
                .gemm-btn:hover { background: #45a049; }
                .gemm-btn:disabled { background: #444; cursor: not-allowed; }
                .canvas-area { background: #252525; border-radius: 8px; padding: 20px; display: flex; justify-content: center; gap: 30px; align-items: flex-start; flex-wrap: wrap; }
                .matrix-box { text-align: center; }
                .matrix-label { font-size: 0.75rem; color: #999; margin-bottom: 8px; font-weight: bold; }
                .matrix-grid { display: grid; gap: 2px; background: #333; }
                .cell { width: 22px; height: 22px; background: #333; border-radius: 2px; transition: background 0.1s; }
                .age-dark { background: #666 !important; }
                .age-light { background: #444 !important; }
                .age-white { background: #2a2a2a !important; }
                .active-cell { background: #4CAF50 !important; outline: 1px solid #fff; z-index: 10; }
                .status-panel { background: #2a2a2a; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 0.85rem; line-height: 1.4; }
                .code-line { margin: 2px 0; color: #777; white-space: pre; }
                .code-active { color: #f1c40f; font-weight: bold; background: #34495e; padding: 0 4px; border-radius: 2px; }
                .highlight-fma { color: #4CAF50; font-weight: bold; }
            `;
            document.head.appendChild(style);

            this.container.innerHTML = `
                <div id="${ID_PREFIX}_wrapper">
                    <div class="header">
                        <div class="title">Tiled DGEMM with Register Reuse</div>
                    </div>
                    <div class="controls">
                        <button class="gemm-btn" id="${ID_PREFIX}_start">Start Simulation</button>
                        <button class="gemm-btn" id="${ID_PREFIX}_reset">Reset</button>
                    </div>
                    <div class="canvas-area">
                        <div class="matrix-box" id="${ID_PREFIX}_C_box"></div>
                        <div class="matrix-box" id="${ID_PREFIX}_A_box"></div>
                        <div class="matrix-box" id="${ID_PREFIX}_B_box"></div>
                    </div>
                    <div class="status-panel">
                        <div id="${ID_PREFIX}_line_outer" class="code-line">// Tiling loops (Cache Blocking)</div>
                        <div id="${ID_PREFIX}_line_loops" class="code-line">for (sj, si, sk) { </div>
                        <div id="${ID_PREFIX}_line_i" class="code-line">  for (int i = si; i < si+BS; ++i)</div>
                        <div id="${ID_PREFIX}_line_j" class="code-line">    for (int j = sj; j < sj+BS; ++j) {</div>
                        <div id="${ID_PREFIX}_line_load" class="code-line">      double <span class="highlight-fma">cij</span> = C[i + j*n]; // Load into Register</div>
                        <div id="${ID_PREFIX}_line_k" class="code-line">      for (int k = sk; k < sk+BS; ++k)</div>
                        <div id="${ID_PREFIX}_line_fma" class="code-line">        <span class="highlight-fma">cij</span> += A[i + k*n] * B[k + j*n]; // FMA</div>
                        <div id="${ID_PREFIX}_line_store" class="code-line">      C[i + j*n] = <span class="highlight-fma">cij</span>; // Store back to Memory</div>
                        <div id="${ID_PREFIX}_line_end" class="code-line">    } }</div>
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
                        const lastAccess = this.accessHistory[m][r][c];
                        cell.classList.remove('age-dark', 'age-light', 'age-white', 'active-cell');
                        if (lastAccess === -1) cell.classList.add('age-white');
                        else if (this.globalClock - lastAccess < 12) cell.classList.add('age-dark');
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

            try {
                for (let sj = 0; sj < this.N; sj += this.BLOCKSIZE) {
                    for (let si = 0; si < this.N; si += this.BLOCKSIZE) {
                        for (let sk = 0; sk < this.N; sk += this.BLOCKSIZE) {
                            if (signal.aborted) return;
                            
                            this.highlightLine('line_loops');

                            for (let i = si; i < si + this.BLOCKSIZE; i++) {
                                this.highlightLine('line_i');
                                for (let j = sj; j < sj + this.BLOCKSIZE; j++) {
                                    if (signal.aborted) return;
                                    
                                    // 1. LOAD: cij = C[i+j*n]
                                    this.highlightLine('line_load');
                                    this.globalClock++;
                                    this.accessHistory.C[i][j] = this.globalClock;
                                    this.updateShading();
                                    document.getElementById(`${ID_PREFIX}_C_${i}_${j}`).classList.add('active-cell');
                                    await this.sleep(150, signal);

                                    // 2. FMA: cij += A*B
                                    this.highlightLine('line_k');
                                    for (let k = sk; k < sk + this.BLOCKSIZE; k++) {
                                        if (signal.aborted) return;
                                        this.highlightLine('line_fma');
                                        this.globalClock++;
                                        this.accessHistory.A[i][k] = this.globalClock;
                                        this.accessHistory.B[k][j] = this.globalClock;
                                        this.updateShading();
                                        document.getElementById(`${ID_PREFIX}_A_${i}_${k}`).classList.add('active-cell');
                                        document.getElementById(`${ID_PREFIX}_B_${k}_${j}`).classList.add('active-cell');
                                        await this.sleep(60, signal);
                                    }

                                    // 3. STORE: C[i+j*n] = cij
                                    this.highlightLine('line_store');
                                    this.globalClock++;
                                    this.accessHistory.C[i][j] = this.globalClock;
                                    this.updateShading();
                                    document.getElementById(`${ID_PREFIX}_C_${i}_${j}`).classList.add('active-cell');
                                    await this.sleep(150, signal);
                                }
                            }
                        }
                    }
                }
                document.getElementById(`${ID_PREFIX}_info`).innerText = "Tiling & Register Reuse Complete";
                this.highlightLine(null);
            } catch (e) { if (e.message !== "aborted") console.error(e); } 
            finally { this.isAnimating = false; this.startBtn.disabled = true; }
        }

        highlightLine(idSuffix) {
            const lines = ['line_loops', 'line_i', 'line_load', 'line_k', 'line_fma', 'line_store'];
            lines.forEach(l => {
                const el = document.getElementById(`${ID_PREFIX}_${l}`);
                if (el) el.classList.remove('code-active');
            });
            if(idSuffix) {
                const activeEl = document.getElementById(`${ID_PREFIX}_${idSuffix}`);
                if (activeEl) activeEl.classList.add('code-active');
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

    const initViz = () => { if (document.getElementById(TARGET_CONTAINER_ID)) new TilingMatMulVisualizer(TARGET_CONTAINER_ID); };
    if (document.readyState === 'complete') initViz();
    else window.addEventListener('load', initViz);
})();
