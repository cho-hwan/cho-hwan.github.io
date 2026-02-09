/**
 * AI Precision Visualizer (BF16, FP8, MXFP4)
 * Dynamic Injection Script
 */
(function() {
    // 1. 고유 ID 생성
    const ID_PREFIX = "ai_conv_" + Math.random().toString(36).substr(2, 9);

    // 2. 스타일 및 UI 주입 함수
    function injectConverterUI() {
        if (document.getElementById(ID_PREFIX)) return;

        // 타겟 컨테이너 ID는 기존과 동일하게 유지하거나 필요시 변경
        const targetContainer = document.getElementById("ai-precision-container");
        if (!targetContainer) {
            console.warn("Target container 'ai-precision-container' not found.");
            return;
        }

        const container = document.createElement('div');
        container.id = ID_PREFIX;
        
        // --- CSS ---
        const style = document.createElement('style');
        style.innerHTML = `
            #${ID_PREFIX} { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 100%; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); box-sizing: border-box; color: #24292e; }
            #${ID_PREFIX} h3 { margin: 0 0 20px 0; font-size: 1.2rem; border-bottom: 2px solid #6f42c1; padding-bottom: 10px; display: inline-block; }
            #${ID_PREFIX} .input-area { margin-bottom: 25px; text-align: center; }
            #${ID_PREFIX} input[type="number"] { width: 70%; padding: 10px; font-size: 1.1rem; border: 2px solid #ddd; border-radius: 6px; outline: none; }
            #${ID_PREFIX} input[type="number"]:focus { border-color: #6f42c1; }
            
            #${ID_PREFIX} .card { background: #f8f9fa; border: 1px solid #e1e4e8; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
            #${ID_PREFIX} .card-header { font-weight: bold; font-size: 0.95rem; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
            #${ID_PREFIX} .badge { color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; }
            
            /* Data Row Styles */
            #${ID_PREFIX} .data-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; align-items: center; }
            #${ID_PREFIX} .label { color: #666; font-weight: 500; }
            #${ID_PREFIX} .val { font-family: monospace; font-weight: 600; color: #0366d6; word-break: break-all; text-align: right; }
            #${ID_PREFIX} .binary { color: #d73a49; letter-spacing: 0.5px; }
            #${ID_PREFIX} .error-val { color: #e36209; font-weight: bold; }
            
            /* Split Container for FP8 */
            #${ID_PREFIX} .split-container { display: flex; gap: 10px; }
            #${ID_PREFIX} .split-col { flex: 1; background: #fff; border: 1px solid #eee; border-radius: 6px; padding: 10px; }
            #${ID_PREFIX} .col-title { text-align: center; font-weight: bold; font-size: 0.9rem; margin-bottom: 8px; border-bottom: 2px solid #eee; padding-bottom: 5px; color: #444; }

            /* Color Themes */
            #${ID_PREFIX} .bg-bf16 { background-color: #007bff; } /* Blue */
            #${ID_PREFIX} .bg-fp8 { background-color: #6f42c1; }  /* Purple */
            #${ID_PREFIX} .bg-mxfp4 { background-color: #fd7e14; } /* Orange */
            
            @media (max-width: 600px) {
                #${ID_PREFIX} .split-container { flex-direction: column; }
            }
        `;
        document.head.appendChild(style);

        // --- HTML ---
        container.innerHTML = `
            <h3>📐 AI Precision Visualizer</h3>
            <div class="input-area">
                <input type="number" id="${ID_PREFIX}_input" placeholder="Enter a float (e.g. 0.123)" step="any" value="0.15625">
                <div style="font-size:0.8rem; color:#666; margin-top:5px;">Converts in real-time as you type</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="badge bg-bf16">BF16 (Brain Float 16)</span>
                    <span style="font-size:0.8rem; color:#666;">1 Sign | 8 Exp | 7 Mantissa</span>
                </div>
                <div class="data-row"><span class="label">Hex:</span><span class="val" id="${ID_PREFIX}_bf16_hex">-</span></div>
                <div class="data-row"><span class="label">Bin:</span><span class="val binary" id="${ID_PREFIX}_bf16_bin">-</span></div>
                <div class="data-row"><span class="label">Decimal:</span><span class="val" id="${ID_PREFIX}_bf16_dec">-</span></div>
                <div class="data-row" style="border-top:1px solid #ddd; padding-top:5px; margin-top:5px;">
                    <span class="label">Error:</span><span class="val error-val" id="${ID_PREFIX}_bf16_err">0.0</span>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="badge bg-fp8">FP8 (H100/Hopper)</span>
                    <span style="font-size:0.8rem; color:#666;">8-bit Formats</span>
                </div>
                <div class="split-container">
                    <div class="split-col">
                        <div class="col-title">E5M2 (Gradients)</div>
                        <div style="font-size:0.75rem; text-align:center; color:#888; margin-bottom:5px;">1S | 5E | 2M</div>
                        <div class="data-row"><span class="label">Hex:</span><span class="val" id="${ID_PREFIX}_e5m2_hex">-</span></div>
                        <div class="data-row"><span class="label">Bin:</span><span class="val binary" id="${ID_PREFIX}_e5m2_bin">-</span></div>
                        <div class="data-row"><span class="label">Dec:</span><span class="val" id="${ID_PREFIX}_e5m2_dec">-</span></div>
                        <div class="data-row"><span class="label">Err:</span><span class="val error-val" id="${ID_PREFIX}_e5m2_err">-</span></div>
                    </div>
                    <div class="split-col">
                        <div class="col-title">E4M3 (Weights)</div>
                        <div style="font-size:0.75rem; text-align:center; color:#888; margin-bottom:5px;">1S | 4E | 3M</div>
                        <div class="data-row"><span class="label">Hex:</span><span class="val" id="${ID_PREFIX}_e4m3_hex">-</span></div>
                        <div class="data-row"><span class="label">Bin:</span><span class="val binary" id="${ID_PREFIX}_e4m3_bin">-</span></div>
                        <div class="data-row"><span class="label">Dec:</span><span class="val" id="${ID_PREFIX}_e4m3_dec">-</span></div>
                        <div class="data-row"><span class="label">Err:</span><span class="val error-val" id="${ID_PREFIX}_e4m3_err">-</span></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="badge bg-mxfp4">MXFP4 (Blackwell)</span>
                    <span style="font-size:0.8rem; color:#666;">E2M1 (Simulated 4-bit)</span>
                </div>
                <div class="data-row"><span class="label">Hex:</span><span class="val" id="${ID_PREFIX}_fp4_hex">-</span></div>
                <div class="data-row"><span class="label">Bin:</span><span class="val binary" id="${ID_PREFIX}_fp4_bin">-</span></div>
                <div class="data-row"><span class="label">Decimal:</span><span class="val" id="${ID_PREFIX}_fp4_dec">-</span></div>
                <div class="data-row" style="border-top:1px solid #ddd; padding-top:5px; margin-top:5px;">
                    <span class="label">Error:</span><span class="val error-val" id="${ID_PREFIX}_fp4_err">0.0</span>
                </div>
                <div style="margin-top:5px; font-size:0.75rem; color:#888; text-align:right;">*MXFP4 uses shared block exponents. This is Scalar FP4.</div>
            </div>
        `;
        targetContainer.appendChild(container);

        // 이벤트 리스너
        const inputEl = document.getElementById(`${ID_PREFIX}_input`);
        inputEl.addEventListener('input', () => updateValues(inputEl.value));
        updateValues(inputEl.value);
    }

    // --- 3. 공통 유틸리티 함수 ---
    
    // 비트 문자열 생성 (그룹핑 포함)
    function formatBinary(num, width, groups) {
        let bin = num.toString(2).padStart(width, '0');
        let result = "";
        let currentIdx = 0;
        groups.forEach(g => {
            result += bin.substr(currentIdx, g) + " ";
            currentIdx += g;
        });
        return result.trim();
    }

    // 일반적인 Mini Float 인코더/디코더
    function processMiniFloat(val, totalBits, expBits, mantBits, bias) {
        if (isNaN(val)) return { hex: 'NaN', bin: '-', dec: 'NaN', err: 'NaN' };
        if (val === 0) return { hex: '0x00', bin: '0'.repeat(totalBits), dec: 0, err: 0 };

        // 1. Float32 비트 추출
        const buf = new ArrayBuffer(4);
        const view = new DataView(buf);
        view.setFloat32(0, val);
        const f32 = view.getUint32(0);

        const sign = (f32 >>> 31) & 1;
        const f32Exp = (f32 >>> 23) & 0xFF;
        const f32Mant = f32 & 0x7FFFFF;

        // 2. 지수 변환 (Re-bias)
        let newExp = f32Exp - 127 + bias;
        
        // 3. 가수 변환 (Truncate)
        // Float32는 23비트, 목표는 mantBits
        const shiftAmount = 23 - mantBits;
        let newMant = f32Mant >>> shiftAmount;

        // 4. 범위 처리 (Clamp & Subnormal handling simplified)
        const maxExp = (1 << expBits) - 1;
        
        let encodedVal = 0;
        
        // Overflow
        if (newExp >= maxExp) {
             // Inf or Max (간소화를 위해 Max Exp로 고정, Mantissa 0)
             // E4M3는 Inf가 없고 NaN만 있지만 여기선 표준적인 동작으로 근사
             newExp = maxExp; 
             newMant = 0; 
             if(expBits === 4 && mantBits === 3) newMant = (1<<mantBits)-1; // E4M3 Max Value logic
        } 
        // Subnormal or Zero
        else if (newExp <= 0) {
            newExp = 0;
            newMant = 0; // Flush to zero (simplification)
        }

        // 비트 결합
        encodedVal = (sign << (expBits + mantBits)) | (newExp << mantBits) | newMant;

        // 5. 값 복원 (Decode)
        let decodedVal = 0;
        if (newExp === 0) {
            // Subnormal: (-1)^S * 2^(1-Bias) * (0.Mant) -> 여기선 0으로 처리
            decodedVal = 0;
        } else {
            // Normal: (-1)^S * 2^(E-Bias) * (1.Mant)
            const mantNorm = 1 + (newMant / Math.pow(2, mantBits));
            decodedVal = Math.pow(-1, sign) * Math.pow(2, newExp - bias) * mantNorm;
        }

        // 6. 포맷팅
        const hexWidth = Math.ceil(totalBits / 4);
        const hexStr = '0x' + encodedVal.toString(16).toUpperCase().padStart(hexWidth, '0');
        const binStr = formatBinary(encodedVal, totalBits, [1, expBits, mantBits]); // S E M 구조
        const err = Math.abs(val - decodedVal);

        return {
            hex: hexStr,
            bin: binStr,
            dec: Number(decodedVal.toPrecision(6)), // 보기 좋게 자름
            err: err === 0 ? "0 (Perfect)" : err.toExponential(2)
        };
    }

    // --- 4. 메인 업데이트 로직 ---
    function updateValues(inputVal) {
        const val = parseFloat(inputVal);
        const isNum = !isNaN(val);

        // UI 엘리먼트 가져오기 헬퍼
        const getEl = (id) => document.getElementById(`${ID_PREFIX}_${id}`);
        const setTxt = (id, text) => { const el = getEl(id); if(el) el.textContent = text; };

        if (!isNum) {
            // Reset all
            return; 
        }

        // ------------------------------------
        // [1] BF16 (Bfloat16)
        // Logic: Float32의 상위 16비트만 잘라냄
        // ------------------------------------
        const bfBuf = new ArrayBuffer(4);
        const bfView = new DataView(bfBuf);
        bfView.setFloat32(0, val);
        const f32Int = bfView.getUint32(0);
        const bf16Int = f32Int >>> 16; // Shift right 16
        
        // BF16 Decode
        const bf16ReconstructedInt = bf16Int << 16;
        bfView.setUint32(0, bf16ReconstructedInt);
        const bf16Decoded = bfView.getFloat32(0);
        const bf16Err = Math.abs(val - bf16Decoded);

        setTxt('bf16_hex', '0x' + bf16Int.toString(16).toUpperCase().padStart(4, '0'));
        setTxt('bf16_bin', formatBinary(bf16Int, 16, [1, 8, 7]));
        setTxt('bf16_dec', bf16Decoded);
        setTxt('bf16_err', bf16Err === 0 ? "0" : bf16Err.toExponential(4));

        // ------------------------------------
        // [2] FP8 (E5M2 & E4M3)
        // ------------------------------------
        // E5M2: Bias 15
        const e5m2 = processMiniFloat(val, 8, 5, 2, 15);
        setTxt('e5m2_hex', e5m2.hex);
        setTxt('e5m2_bin', e5m2.bin);
        setTxt('e5m2_dec', e5m2.dec);
        setTxt('e5m2_err', e5m2.err);

        // E4M3: Bias 7
        const e4m3 = processMiniFloat(val, 8, 4, 3, 7);
        setTxt('e4m3_hex', e4m3.hex);
        setTxt('e4m3_bin', e4m3.bin);
        setTxt('e4m3_dec', e4m3.dec);
        setTxt('e4m3_err', e4m3.err);

        // ------------------------------------
        // [3] MXFP4 (Scalar FP4 Approximation)
        // Format: E2M1 (Standard 4-bit float used in papers)
        // Bias: 1 (2^(2-1)-1 = 1)
        // ------------------------------------
        const fp4 = processMiniFloat(val, 4, 2, 1, 1);
        setTxt('fp4_hex', fp4.hex);
        setTxt('fp4_bin', fp4.bin);
        setTxt('fp4_dec', fp4.dec);
        setTxt('fp4_err', fp4.err);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectConverterUI);
    } else {
        injectConverterUI();
    }
})();
