<script>
/**
 * Single Precision (Float32) vs Fixed Point (Q16.16) Converter
 * Dynamic Injection Script
 */
(function() {
    // 1. 고유 ID 생성 (페이지 내 충돌 방지)
    const ID_PREFIX = "num_conv_" + Math.random().toString(36).substr(2, 9);

    // 2. 스타일 및 UI 주입 함수
    function injectConverterUI() {
        // 이미 존재하는지 체크
        if (document.getElementById(ID_PREFIX)) return;

        const container = document.createElement('div');
        container.id = ID_PREFIX;
        
        // --- CSS 스타일 정의 (JS 내부에 포함) ---
        const style = document.createElement('style');
        style.innerHTML = `
            #${ID_PREFIX} {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                max-width: 700px;
                margin: 30px auto;
                padding: 25px;
                background-color: #ffffff;
                border: 1px solid #e1e4e8;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                color: #24292e;
            }
            #${ID_PREFIX} h3 {
                margin-top: 0;
                margin-bottom: 20px;
                font-size: 1.2rem;
                border-bottom: 2px solid #0366d6;
                padding-bottom: 10px;
                display: inline-block;
            }
            #${ID_PREFIX} .input-area {
                margin-bottom: 25px;
                text-align: center;
            }
            #${ID_PREFIX} input[type="number"] {
                width: 60%;
                padding: 10px 15px;
                font-size: 1.1rem;
                border: 2px solid #ddd;
                border-radius: 6px;
                outline: none;
                transition: border-color 0.2s;
            }
            #${ID_PREFIX} input[type="number"]:focus {
                border-color: #0366d6;
            }
            #${ID_PREFIX} .card {
                background: #f6f8fa;
                border: 1px solid #d1d5da;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
            }
            #${ID_PREFIX} .card-title {
                font-weight: bold;
                font-size: 0.95rem;
                margin-bottom: 10px;
                color: #586069;
                display: flex;
                justify-content: space-between;
            }
            #${ID_PREFIX} .data-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 0.9rem;
                align-items: center;
            }
            #${ID_PREFIX} .label {
                color: #666;
                width: 80px;
            }
            #${ID_PREFIX} .val {
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                font-weight: 600;
                color: #0550ae;
                word-break: break-all;
                text-align: right;
                flex: 1;
            }
            #${ID_PREFIX} .binary {
                color: #d73a49;
                font-size: 0.8rem;
                letter-spacing: 0.5px;
            }
            #${ID_PREFIX} .error-val {
                color: #e36209;
                font-weight: bold;
            }
            #${ID_PREFIX} .q16-overflow {
                color: red;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);

        // --- HTML 구조 정의 ---
        container.innerHTML = `
            <h3>숫자 표현 방식 변환기 (Float vs Fixed)</h3>
            
            <div class="input-area">
                <input type="number" id="${ID_PREFIX}_input" placeholder="실수를 입력하세요 (예: 123.456)" step="any" value="123.456">
                <div style="font-size:0.8rem; color:#666; margin-top:5px;">숫자를 입력하면 자동으로 변환됩니다.</div>
            </div>

            <div class="card">
                <div class="card-title">
                    <span>IEEE 754 Single Precision (32-bit Float)</span>
                    <span style="font-size:0.8rem; background:#0366d6; color:white; padding:2px 6px; border-radius:4px;">표준</span>
                </div>
                <div class="data-row">
                    <span class="label">저장 값:</span>
                    <span class="val" id="${ID_PREFIX}_f32_val">-</span>
                </div>
                <div class="data-row">
                    <span class="label">Hex:</span>
                    <span class="val" id="${ID_PREFIX}_f32_hex">-</span>
                </div>
                <div class="data-row">
                    <span class="label">Binary:</span>
                    <span class="val binary" id="${ID_PREFIX}_f32_bin">-</span>
                </div>
                <div class="data-row" style="border-top:1px solid #ddd; padding-top:5px; margin-top:5px;">
                    <span class="label">오차:</span>
                    <span class="val error-val" id="${ID_PREFIX}_f32_err">0.0</span>
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    <span>Fixed Point (Q16.16)</span>
                    <span style="font-size:0.8rem; background:#28a745; color:white; padding:2px 6px; border-radius:4px;">임베디드</span>
                </div>
                <div class="data-row">
                    <span class="label">저장 값:</span>
                    <span class="val" id="${ID_PREFIX}_q16_val">-</span>
                </div>
                <div class="data-row">
                    <span class="label">Hex:</span>
                    <span class="val" id="${ID_PREFIX}_q16_hex">-</span>
                </div>
                <div class="data-row">
                    <span class="label">Binary:</span>
                    <span class="val binary" id="${ID_PREFIX}_q16_bin">-</span>
                </div>
                 <div class="data-row" style="border-top:1px solid #ddd; padding-top:5px; margin-top:5px;">
                    <span class="label">오차:</span>
                    <span class="val error-val" id="${ID_PREFIX}_q16_err">0.0</span>
                </div>
                <div id="${ID_PREFIX}_q16_msg" style="text-align:right; font-size:0.8rem; display:none;"></div>
            </div>
        `;

        // 현재 스크립트 태그 바로 뒤에 UI 삽입
        const currentScript = document.currentScript;
        currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

        // 이벤트 리스너 등록
        const inputEl = document.getElementById(`${ID_PREFIX}_input`);
        inputEl.addEventListener('input', () => updateValues(inputEl.value));
        
        // 초기 실행
        updateValues(inputEl.value);
    }

    // 3. 계산 로직 함수
    function updateValues(inputVal) {
        const val = parseFloat(inputVal);
        
        // 요소 가져오기
        const els = {
            f32_val: document.getElementById(`${ID_PREFIX}_f32_val`),
            f32_hex: document.getElementById(`${ID_PREFIX}_f32_hex`),
            f32_bin: document.getElementById(`${ID_PREFIX}_f32_bin`),
            f32_err: document.getElementById(`${ID_PREFIX}_f32_err`),
            q16_val: document.getElementById(`${ID_PREFIX}_q16_val`),
            q16_hex: document.getElementById(`${ID_PREFIX}_q16_hex`),
            q16_bin: document.getElementById(`${ID_PREFIX}_q16_bin`),
            q16_err: document.getElementById(`${ID_PREFIX}_q16_err`),
            q16_msg: document.getElementById(`${ID_PREFIX}_q16_msg`),
        };

        if (isNaN(val)) {
            // 입력값이 없을 때 초기화
            Object.values(els).forEach(el => el.textContent = '-');
            return;
        }

        // --- Logic 1: Single Precision (Float32) ---
        // JS는 기본적으로 Double(64bit)이므로 Float32Array를 이용해 32bit로 강제 변환
        const f32Arr = new Float32Array(1);
        f32Arr[0] = val;
        const f32Reconstructed = f32Arr[0];
        
        // 비트 값을 읽기 위해 View 사용
        const f32View = new DataView(f32Arr.buffer);
        const f32Int = f32View.getUint32(0); // 32비트 정수로 읽기
        
        els.f32_val.textContent = f32Reconstructed;
        els.f32_hex.textContent = '0x' + f32Int.toString(16).toUpperCase().padStart(8, '0');
        // 2진수 가독성을 위해 4자리씩 끊기 (정규식 이용)
        const f32BinStr = f32Int.toString(2).padStart(32, '0');
        els.f32_bin.textContent = f32BinStr.replace(/(.{8})/g, '$1 ').trim();
        
        // 오차 계산
        const f32Err = Math.abs(val - f32Reconstructed);
        els.f32_err.textContent = f32Err === 0 ? "0 (Perfect)" : f32Err.toExponential(4);


        // --- Logic 2: Fixed Point (Q16.16) ---
        // 16비트 정수부 + 16비트 소수부 = 총 32비트
        // 스케일링 팩터 = 2^16 = 65536
        const SCALE = 65536;
        const q16Raw = Math.round(val * SCALE); // 반올림 처리
        const q16Reconstructed = q16Raw / SCALE;
        
        // Range Check (Signed 32bit 범위 내여야 함, 정수부가 16비트(signed) 범위를 넘으면 안됨)
        // Q16.16의 표현 범위: 약 -32768 ~ +32767
        const MAX_Q16 = 32767.99998;
        const MIN_Q16 = -32768.0;
        
        let isOverflow = false;
        if (val > MAX_Q16 || val < MIN_Q16) {
            isOverflow = true;
        }

        if (isOverflow) {
            els.q16_val.textContent = "Overflow!";
            els.q16_hex.textContent = "Range Exceeded";
            els.q16_bin.textContent = "Cannot express in Q16.16";
            els.q16_err.textContent = "N/A";
            els.q16_msg.style.display = "block";
            els.q16_msg.innerHTML = "<span class='q16-overflow'>범위 초과: -32768 ~ 32767 사이 값만 가능</span>";
        } else {
            els.q16_val.textContent = q16Reconstructed.toFixed(6); // 소수점 보여주기
            
            // 음수 처리를 위해 비트 연산자 >>> 0 사용 (unsigned로 변환)
            const q16Int = q16Raw >>> 0; 
            
            els.q16_hex.textContent = '0x' + q16Int.toString(16).toUpperCase().padStart(8, '0');
            
            const q16BinStr = q16Int.toString(2).padStart(32, '0');
            // 정수부(16)와 소수부(16)를 시각적으로 구분
            const binInteger = q16BinStr.slice(0, 16);
            const binFraction = q16BinStr.slice(16);
            els.q16_bin.textContent = `${binInteger} . ${binFraction}`;
            
            // 오차 계산
            const q16Err = Math.abs(val - q16Reconstructed);
            els.q16_err.textContent = q16Err === 0 ? "0 (Perfect)" : q16Err.toExponential(4);
            els.q16_msg.style.display = "none";
        }
    }

    // UI 생성 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectConverterUI);
    } else {
        injectConverterUI();
    }
})();
</script>
