/**
 * Single Precision (Float32) vs Fixed Point (Q16.16) Converter
 * Dynamic Injection Script
 */
(function() {
    // 1. 고유 ID 생성
    const ID_PREFIX = "num_conv_" + Math.random().toString(36).substr(2, 9);

    // 2. 스타일 및 UI 주입 함수
    function injectConverterUI() {
        if (document.getElementById(ID_PREFIX)) return;

        const targetContainer = document.getElementById("float-converter-container");
        if (!targetContainer) {
            console.warn("Target container 'float-converter-container' not found.");
            return;
        }

        const container = document.createElement('div');
        container.id = ID_PREFIX;
        
        // --- CSS ---
        const style = document.createElement('style');
        style.innerHTML = `
            #${ID_PREFIX} { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 100%; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); box-sizing: border-box; color: #24292e; }
            #${ID_PREFIX} h3 { margin: 0 0 20px 0; font-size: 1.2rem; border-bottom: 2px solid #0366d6; padding-bottom: 10px; display: inline-block; }
            #${ID_PREFIX} .input-area { margin-bottom: 25px; text-align: center; }
            #${ID_PREFIX} input[type="number"] { width: 70%; padding: 10px; font-size: 1.1rem; border: 2px solid #ddd; border-radius: 6px; outline: none; }
            #${ID_PREFIX} input[type="number"]:focus { border-color: #0366d6; }
            #${ID_PREFIX} .card { background: #f6f8fa; border: 1px solid #d1d5da; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
            #${ID_PREFIX} .card-title { font-weight: bold; font-size: 0.95rem; margin-bottom: 10px; color: #586069; display: flex; justify-content: space-between; }
            #${ID_PREFIX} .data-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; align-items: center; }
            #${ID_PREFIX} .label { color: #666; width: 80px; }
            #${ID_PREFIX} .val { font-family: monospace; font-weight: 600; color: #0550ae; word-break: break-all; text-align: right; flex: 1; }
            #${ID_PREFIX} .binary { color: #d73a49; font-size: 0.8rem; letter-spacing: 0.5px; }
            #${ID_PREFIX} .error-val { color: #e36209; font-weight: bold; }
            #${ID_PREFIX} .q16-overflow { color: red; font-weight: bold; }
        `;
        document.head.appendChild(style);

        // --- HTML ---
        container.innerHTML = `
            <h3>🔬Visualizer</h3>
            <div class="input-area">
                <input type="number" id="${ID_PREFIX}_input" placeholder="실수 입력 (예: 123.456)" step="any" value="123.456">
                <div style="font-size:0.8rem; color:#666; margin-top:5px;">Converts in real-time as you type</div>
            </div>

            <div class="card">
                <div class="card-title">
                    <span style="font-size:0.9rem; background:#0366d6; color:white; padding:3px 8px; border-radius:4px;">Float32 (IEEE 754)</span>
                </div>
                <div class="data-row"><span class="label">Hex:</span><span class="val" id="${ID_PREFIX}_f32_hex">-</span></div>
                <div class="data-row"><span class="label">Bin:</span><span class="val binary" id="${ID_PREFIX}_f32_bin">-</span></div>
                <div class="data-row"><span class="label">Decimal:</span><span class="val" id="${ID_PREFIX}_f32_dec" style="color:#333;">-</span></div>
                <div class="data-row" style="border-top:1px solid #ddd; padding-top:5px; margin-top:5px;">
                    <span class="label">오차:</span><span class="val error-val" id="${ID_PREFIX}_f32_err">0.0</span>
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    <span style="background:#28a745; color:white; padding:3px 8px; border-radius:4px;">Fixed Point (Q16.16)</span>                   
                </div>
                <div class="data-row"><span class="label">Hex:</span><span class="val" id="${ID_PREFIX}_q16_hex">-</span></div>
                <div class="data-row"><span class="label">Bin:</span><span class="val binary" id="${ID_PREFIX}_q16_bin">-</span></div>
                <div class="data-row"><span class="label">Decimal:</span><span class="val" id="${ID_PREFIX}_q16_dec" style="color:#333;">-</span></div>
                 <div class="data-row" style="border-top:1px solid #ddd; padding-top:5px; margin-top:5px;">
                    <span class="label">오차:</span><span class="val error-val" id="${ID_PREFIX}_q16_err">0.0</span>
                </div>
                <div id="${ID_PREFIX}_q16_msg" style="text-align:right; font-size:0.8rem; display:none;"></div>
            </div>
        `;
        targetContainer.appendChild(container);

        // 이벤트 리스너
        const inputEl = document.getElementById(`${ID_PREFIX}_input`);
        inputEl.addEventListener('input', () => updateValues(inputEl.value));
        updateValues(inputEl.value);
    }

    // 3. 계산 로직 (여기가 수정되었습니다)
    function updateValues(inputVal) {
        const val = parseFloat(inputVal);
        const els = {
            f32_hex: document.getElementById(`${ID_PREFIX}_f32_hex`),
            f32_bin: document.getElementById(`${ID_PREFIX}_f32_bin`),
            f32_dec: document.getElementById(`${ID_PREFIX}_f32_dec`),
            f32_err: document.getElementById(`${ID_PREFIX}_f32_err`),
            q16_hex: document.getElementById(`${ID_PREFIX}_q16_hex`),
            q16_bin: document.getElementById(`${ID_PREFIX}_q16_bin`),
            q16_dec: document.getElementById(`${ID_PREFIX}_q16_dec`),
            q16_err: document.getElementById(`${ID_PREFIX}_q16_err`),
            q16_msg: document.getElementById(`${ID_PREFIX}_q16_msg`),
        };

        if (isNaN(val)) {
            Object.values(els).forEach(el => el.textContent = '-');
            return;
        }

        // ==========================================
        // [Logic 1] Float32 (IEEE 754)
        // ==========================================
        const f32Arr = new Float32Array(1);
        f32Arr[0] = val; // 값을 넣고 (여기서 정밀도 손실 발생)
        const f32Reconstructed = f32Arr[0]; // 다시 꺼냄
        
        // ★ 중요 수정: DataView 대신 Uint32Array 사용 (시스템 엔디안 따름)
        // 이렇게 해야 0xFFFF3343(거꾸로) 대신 0x4333FFFF(정상)가 나옵니다.
        const f32Int = new Uint32Array(f32Arr.buffer)[0];
        
        els.f32_hex.textContent = '0x' + f32Int.toString(16).toUpperCase().padStart(8, '0');
        const f32BinStr = f32Int.toString(2).padStart(32, '0');
        els.f32_bin.textContent = f32BinStr.replace(/(.{8})/g, '$1 ').trim();
        els.f32_dec.textContent = f32Reconstructed; 
        
        const f32Err = Math.abs(val - f32Reconstructed);
        els.f32_err.textContent = f32Err === 0 ? "0 (Perfect)" : f32Err.toExponential(4);

        // ==========================================
        // [Logic 2] Fixed Point (Q16.16)
        // ==========================================
        const SCALE = 65536;
        const q16Raw = Math.round(val * SCALE); // 곱하기 65536 후 반올림
        const q16Reconstructed = q16Raw / SCALE; // 다시 나누기 65536
        const MAX_Q16 = 32767.99998;
        const MIN_Q16 = -32768.0;

        if (val > MAX_Q16 || val < MIN_Q16) {
            els.q16_hex.textContent = "Range Exceeded";
            els.q16_bin.textContent = "-";
            els.q16_dec.textContent = "N/A";
            els.q16_err.textContent = "N/A";
            els.q16_msg.style.display = "block";
            els.q16_msg.innerHTML = "<span class='q16-overflow'>범위 초과</span>";
        } else {
            const q16Int = q16Raw >>> 0; 
            els.q16_hex.textContent = '0x' + q16Int.toString(16).toUpperCase().padStart(8, '0');
            const q16BinStr = q16Int.toString(2).padStart(32, '0');
            els.q16_bin.textContent = `${q16BinStr.slice(0, 16)} . ${q16BinStr.slice(16)}`;
            els.q16_dec.textContent = q16Reconstructed; 
            
            const q16Err = Math.abs(val - q16Reconstructed);
            els.q16_err.textContent = q16Err === 0 ? "0 (Perfect)" : q16Err.toExponential(4);
            els.q16_msg.style.display = "none";
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectConverterUI);
    } else {
        injectConverterUI();
    }
})();
