// 定数と状態管理
const KeyboardMode = {
    Lower: 'Lower',
    Upper: 'Upper',
    Number: 'Number',
    Symbol: 'Symbol'
};

let currentMode = KeyboardMode.Lower;
let isTempShiftMode = false;
let lines = [""];
let lineIndex = 0;
let charIndex = 0;
let scrollIndex = 0;
let isInsertMode = true;
let cursorVisible = true;

// DOM要素のキャッシュ
const displayArea = document.getElementById('displayArea');
const displayWrapper = document.getElementById('displayWrapper');
const keyboardContainer = document.getElementById('keyboardContainer');
const menuModal = document.getElementById('menuModal');
const confirmModal = document.getElementById('confirmModal');

const btnPaste = document.getElementById('btnPaste');
const btnSave = document.getElementById('btnSave');
const btnClear = document.getElementById('btnClear');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');

// キー定義
const keysLower = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "h", "j", "g", "k", "l", "Enter"],
    ["Switch", "z", "x", "c", "v", "b", "n", "m", ".", "Space"]
];

const keysUpper = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "H", "J", "G", "K", "L", "Enter"],
    ["Switch", "Z", "X", "C", "V", "B", "N", "M", ".", "Space"]
];

const keysNumber = [
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    ["=", "^", "¥", "@", "[", "]", "Tab", "Ins", "BS", "Enter"],
    ["Switch", ";", ":", ",", "+", "-", "*", "/", ".", "Space"]
];

const keysSymbol = [
    ["!", "\"", "#", "$", "%", "&", "'", "(", ")", "Menu"],
    ["=", "~", "|", "`", "{", "}", "", "↑", "BS", "Enter"],
    ["Switch", "<", ">", "?", "_", "\\", "←", "↓", "→", "Space"]
];

// 初期設定と読み込み
window.addEventListener('DOMContentLoaded', () => {
    // 自動保存データのロード
    const savedText = localStorage.getItem('SavedText');
    if (savedText !== null) {
        lines = savedText.split('\n');
        lineIndex = lines.length - 1;
        charIndex = lines[lineIndex].length;
    }

    renderDisplay();
    buildKeyboard();
    setupEventListeners();
    setupPhysicalKeyboard();

    // カーソル点滅タイマー
    setInterval(() => {
        cursorVisible = !cursorVisible;
        renderDisplay();
    }, 530);
});

// レンダリング: 表示エリアの描画
function renderDisplay() {
    displayArea.innerHTML = '';
    
    lines.forEach((lineText, idx) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = `display-line ${idx === lineIndex ? 'active' : ''}`;
        lineDiv.setAttribute('data-line-index', idx);

        const contentSpan = document.createElement('span');
        contentSpan.className = 'line-content';

        if (idx === lineIndex) {
            // 現在の行はカーソルを挿入して描画
            const cIdx = Math.max(0, Math.min(charIndex, lineText.length));
            const left = lineText.substring(0, cIdx);
            
            const cursorSpan = document.createElement('span');
            cursorSpan.className = `cursor ${!isInsertMode ? 'overwrite' : ''}`;
            cursorSpan.style.visibility = cursorVisible ? 'visible' : 'hidden';

            if (isInsertMode) {
                const right = lineText.substring(cIdx);
                contentSpan.appendChild(document.createTextNode(left));
                contentSpan.appendChild(cursorSpan);
                contentSpan.appendChild(document.createTextNode(right));
            } else {
                if (cIdx < lineText.length) {
                    const targetChar = lineText.charAt(cIdx);
                    const right = lineText.substring(cIdx + 1);
                    
                    const uElement = document.createElement('u');
                    uElement.textContent = targetChar;

                    contentSpan.appendChild(document.createTextNode(left));
                    contentSpan.appendChild(cursorSpan); // 上書きモード時はカーソルを文字の前に表示
                    contentSpan.appendChild(uElement);
                    contentSpan.appendChild(document.createTextNode(right));
                } else {
                    contentSpan.appendChild(document.createTextNode(left));
                    contentSpan.appendChild(cursorSpan);
                }
            }
        } else {
            contentSpan.textContent = lineText || ' '; // 空行でも高さを維持するためにスペースを入れる
        }

        lineDiv.appendChild(contentSpan);
        displayArea.appendChild(lineDiv);
    });

    // アクティブ行が画面外に行かないようオートスクロール
    const activeLine = displayArea.querySelector('.display-line.active');
    if (activeLine) {
        const wrapperRect = displayWrapper.getBoundingClientRect();
        const lineRect = activeLine.getBoundingClientRect();
        
        if (lineRect.bottom > wrapperRect.bottom) {
            displayWrapper.scrollTop += (lineRect.bottom - wrapperRect.bottom) + 5;
        } else if (lineRect.top < wrapperRect.top) {
            displayWrapper.scrollTop -= (wrapperRect.top - lineRect.top) + 5;
        }
    }
}

// 自動セーブ機能
function saveToLocalStorage() {
    localStorage.setItem('SavedText', lines.join('\n'));
}

// キーボードのHTML構築
function buildKeyboard() {
    keyboardContainer.innerHTML = '';
    
    // 現在のモードに応じたキーボード配列を取得
    let keyRows;
    let modeClass;
    if (isTempShiftMode) {
        keyRows = keysUpper;
        modeClass = 'keyboard-upper';
    } else {
        switch (currentMode) {
            case KeyboardMode.Upper:
                keyRows = keysUpper;
                modeClass = 'keyboard-upper';
                break;
            case KeyboardMode.Number:
                keyRows = keysNumber;
                modeClass = 'keyboard-number';
                break;
            case KeyboardMode.Symbol:
                keyRows = keysSymbol;
                modeClass = 'keyboard-symbol';
                break;
            case KeyboardMode.Lower:
            default:
                keyRows = keysLower;
                modeClass = 'keyboard-lower';
                break;
        }
    }

    keyboardContainer.className = `keyboard-container ${modeClass}`;

    keyRows.forEach((row, rowIdx) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';

        row.forEach(keyText => {
            const button = document.createElement('button');
            button.className = 'key';
            
            // キー固有のクラス・スタイル設定
            if (keyText === "Enter") {
                if (isTempShiftMode) {
                    button.textContent = "BS";
                    button.classList.add('functional', 'btn-enter-bs');
                } else {
                    button.textContent = "Enter";
                    button.classList.add('functional', 'btn-enter');
                }
            } else if (keyText === "Switch") {
                button.innerHTML = "A@<br>a 1";
                button.classList.add('functional', 'btn-switch');
                setupSwitchKeyEvents(button);
            } else if (keyText === "Space") {
                button.textContent = "Space";
                button.classList.add('functional', 'btn-space');
            } else if (keyText === "BS") {
                button.textContent = "BS";
                button.classList.add('functional', 'btn-bs');
            } else if (keyText === "Tab") {
                button.textContent = "Tab";
                button.classList.add('functional', 'btn-tab');
            } else if (keyText === "Ins") {
                button.textContent = isInsertMode ? "Ins" : "Ovr";
                button.classList.add('functional', 'btn-ins');
            } else if (["↑", "↓", "←", "→"].includes(keyText)) {
                button.textContent = keyText;
                button.classList.add('btn-nav');
            } else if (keyText === "Menu") {
                button.textContent = "Menu";
                button.classList.add('functional', 'btn-menu');
            } else {
                button.textContent = keyText;
                // 数字キーボード内の数字と特定の記号に青色を設定
                if (currentMode === KeyboardMode.Number && "0123456789./*-+".includes(keyText)) {
                    button.classList.add('blue-number');
                }
            }

            // Switchキー以外の通常キーのクリック処理
            if (keyText !== "Switch") {
                button.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    let triggerKey = keyText;
                    if (keyText === "Enter" && isTempShiftMode) {
                        triggerKey = "BS";
                    }
                    handleKeyInput(triggerKey);
                });
            }

            rowDiv.appendChild(button);
        });

        keyboardContainer.appendChild(rowDiv);
    });
}

// キー入力処理の実装
function handleKeyInput(key) {
    if (key === "") return;

    if (key === "Tab") {
        insertText("    ");
    } else if (key === "Ins") {
        isInsertMode = !isInsertMode;
        buildKeyboard();
        renderDisplay();
    } else if (key === "BS") {
        deleteChar();
    } else if (key === "Menu") {
        openMenu();
    } else if (key === "Enter") {
        onEnterPressed();
    } else if (key === "←") {
        moveCursor(-1, 0);
    } else if (key === "→") {
        moveCursor(1, 0);
    } else if (key === "↑") {
        moveCursor(0, -1);
    } else if (key === "↓") {
        moveCursor(0, 1);
    } else if (key === "Space") {
        insertText(" ");
    } else {
        // 通常の文字入力
        let char = key;
        // 小文字モードの場合は小文字に変換して入力
        if (currentMode === KeyboardMode.Lower && !isTempShiftMode) {
            char = key.toLowerCase();
        }
        insertText(char);
    }
}

// テキスト挿入
function insertText(text) {
    while (lines.length <= lineIndex) {
        lines.push("");
    }
    let curLine = lines[lineIndex];
    charIndex = Math.max(0, Math.min(charIndex, curLine.length));

    if (isInsertMode) {
        curLine = curLine.substring(0, charIndex) + text + curLine.substring(charIndex);
        charIndex += text.length;
    } else {
        const replaceLen = Math.min(text.length, curLine.length - charIndex);
        curLine = curLine.substring(0, charIndex) + text + curLine.substring(charIndex + replaceLen);
        charIndex += text.length;
    }

    lines[lineIndex] = curLine;
    
    // 最大行数制御
    const MAX_LINES = 10000;
    while (lines.length > MAX_LINES) {
        lines.shift();
        lineIndex = Math.max(0, lineIndex - 1);
    }

    saveToLocalStorage();
    renderDisplay();
}

// 文字削除
function deleteChar() {
    let curLine = lines[lineIndex];
    charIndex = Math.max(0, Math.min(charIndex, curLine.length));

    if (charIndex > 0) {
        curLine = curLine.substring(0, charIndex - 1) + curLine.substring(charIndex);
        charIndex--;
        lines[lineIndex] = curLine;
    } else if (lineIndex > 0) {
        const prevLine = lines[lineIndex - 1];
        const prevLen = prevLine.length;
        lines[lineIndex - 1] = prevLine + curLine;
        lines.splice(lineIndex, 1);
        lineIndex--;
        charIndex = prevLen;
    }

    saveToLocalStorage();
    renderDisplay();
}

// Enter押下
function onEnterPressed() {
    const MAX_LINES = 10000;
    if (lines.length >= MAX_LINES) return;

    let curLine = lines[lineIndex];
    charIndex = Math.max(0, Math.min(charIndex, curLine.length));

    const left = curLine.substring(0, charIndex);
    const right = curLine.substring(charIndex);

    lines[lineIndex] = left;
    lines.splice(lineIndex + 1, 0, right);
    lineIndex++;
    charIndex = 0;

    saveToLocalStorage();
    renderDisplay();
}

// カーソル移動
function moveCursor(dx, dy) {
    if (dx !== 0) {
        charIndex += dx;
        while (charIndex < 0 && lineIndex > 0) {
            lineIndex--;
            charIndex = lines[lineIndex].length;
        }
        while (lineIndex < lines.length - 1 && charIndex > lines[lineIndex].length) {
            charIndex -= (lines[lineIndex].length + 1);
            lineIndex++;
        }
        charIndex = Math.max(0, Math.min(charIndex, lines[lineIndex].length));
    }

    if (dy !== 0) {
        lineIndex = Math.max(0, Math.min(lineIndex + dy, lines.length - 1));
        charIndex = Math.max(0, Math.min(charIndex, lines[lineIndex].length));
    }

    renderDisplay();
}

// ─── Switchキー用のフリック＆ホールドイベント処理 ───
let switchTouchStart = null;
let switchHoldTimer = null;
let isFlickTriggered = false;
let flickIndicators = null;

function setupSwitchKeyEvents(btn) {
    // フリックガイドインジケーターの作成 (ボタン直下の絶対配置用)
    if (!flickIndicators) {
        flickIndicators = document.createElement('div');
        flickIndicators.className = 'flick-indicators';
        flickIndicators.innerHTML = `
            <div class="flick-indicator" id="indUp">▲</div>
            <div class="flick-indicator" id="indUpRight">▲</div>
            <div class="flick-indicator" id="indRight">▲</div>
        `;
        document.body.appendChild(flickIndicators);
    }

    const startHandler = (e) => {
        e.preventDefault();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        switchTouchStart = { x: clientX, y: clientY };
        isFlickTriggered = false;

        // 長押し(ホールド)検出タイマー (300ms)
        switchHoldTimer = setTimeout(() => {
            if (!isFlickTriggered) {
                isTempShiftMode = true;
                buildKeyboard();
            }
        }, 300);

        // ガイドインジケーターの位置設定と表示
        const rect = btn.getBoundingClientRect();
        const size = rect.width;
        
        flickIndicators.style.left = `${rect.left}px`;
        flickIndicators.style.top = `${rect.top}px`;
        flickIndicators.style.width = `${size}px`;
        flickIndicators.style.height = `${size}px`;
        flickIndicators.style.display = 'block';

        // ガイドの位置調整（Switchキーからの相対位置。Aの上、@の右上、1の右）
        // CSSトランスフォームで回転
        const indUp = document.getElementById('indUp');
        const indUpRight = document.getElementById('indUpRight');
        const indRight = document.getElementById('indRight');

        indUp.style.transform = `translate(0px, -${size * 0.7}px) rotate(0deg)`;
        indUpRight.style.transform = `translate(${size * 0.55}px, -${size * 0.55}px) rotate(45deg)`;
        indRight.style.transform = `translate(${size * 0.7}px, 0px) rotate(90deg)`;

        // 各インジケーターの基準配置
        [indUp, indUpRight, indRight].forEach(ind => {
            ind.style.left = `${(size - 30) / 2}px`;
            ind.style.top = `${(size - 30) / 2}px`;
            ind.style.color = '#dedede';
        });
    };

    const moveHandler = (e) => {
        if (!switchTouchStart) return;

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        const deltaX = clientX - switchTouchStart.x;
        const deltaY = clientY - switchTouchStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 30) {
            isFlickTriggered = true;
            clearTimeout(switchHoldTimer);

            // フリックによる一時シフト解除
            if (isTempShiftMode) {
                isTempShiftMode = false;
                buildKeyboard();
            }

            // 角度判定 (上をプラス、右をプラスにするため Y を反転)
            const ux = deltaX;
            const uy = -deltaY;
            const angle = Math.atan2(uy, ux) * 180 / Math.PI;

            const indUp = document.getElementById('indUp');
            const indUpRight = document.getElementById('indUpRight');
            const indRight = document.getElementById('indRight');

            // フィードバック色リセット
            indUp.style.color = '#dedede';
            indUpRight.style.color = '#dedede';
            indRight.style.color = '#dedede';

            if (angle >= 67.5 && angle < 112.5) {
                // 上フリック: 大文字
                indUp.style.color = '#e6730f';
            } else if (angle >= 22.5 && angle < 67.5) {
                // 右上フリック: 記号
                indUpRight.style.color = '#e6730f';
            } else if (angle >= -22.5 && angle < 22.5) {
                // 右フリック: 数字
                indRight.style.color = '#e6730f';
            }
        }
    };

    const endHandler = (e) => {
        if (!switchTouchStart) return;

        clearTimeout(switchHoldTimer);
        flickIndicators.style.display = 'none';

        const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

        const deltaX = clientX - switchTouchStart.x;
        const deltaY = clientY - switchTouchStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 30) {
            // フリック完了によるモード遷移
            const ux = deltaX;
            const uy = -deltaY;
            const angle = Math.atan2(uy, ux) * 180 / Math.PI;

            if (angle >= 67.5 && angle < 112.5) {
                setKeyboardMode(KeyboardMode.Upper);
            } else if (angle >= 22.5 && angle < 67.5) {
                setKeyboardMode(KeyboardMode.Symbol);
            } else if (angle >= -22.5 && angle < 22.5) {
                setKeyboardMode(KeyboardMode.Number);
            }
        } else {
            // 通常タップ判定
            if (isTempShiftMode) {
                // ホールド終了による小文字戻り
                isTempShiftMode = false;
                setKeyboardMode(KeyboardMode.Lower);
            } else {
                // 通常切り替えキー単体タップ: 小文字に戻る
                if (currentMode !== KeyboardMode.Lower) {
                    setKeyboardMode(KeyboardMode.Lower);
                }
            }
        }

        switchTouchStart = null;
    };

    btn.addEventListener('pointerdown', startHandler);
    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', endHandler);
}

function setKeyboardMode(mode) {
    currentMode = mode;
    isTempShiftMode = false;
    buildKeyboard();
}

// ─── 表示エリアのクリックによるカーソル移動 ───
function setupEventListeners() {
    displayWrapper.addEventListener('click', (e) => {
        // line-content、または display-line がクリックされたか確認
        const lineContent = e.target.closest('.line-content');
        if (!lineContent) return; // 文字列幅の外側（右側の余白等）をクリックした場合は移動しない

        const lineDiv = lineContent.closest('.display-line');
        if (!lineDiv) return;

        const targetLineIdx = parseInt(lineDiv.getAttribute('data-line-index'), 10);
        if (isNaN(targetLineIdx) || targetLineIdx >= lines.length) return;

        // caretRangeFromPoint または caretPositionFromPoint を使って文字インデックスを特定
        let charIdx = 0;
        if (document.caretRangeFromPoint) {
            const range = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
                charIdx = range.startOffset;
            } else {
                // テキスト末尾などの判定補正
                charIdx = lines[targetLineIdx].length;
            }
        } else if (document.caretPositionFromPoint) {
            const position = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (position && position.offsetNode.nodeType === Node.TEXT_NODE) {
                charIdx = position.offset;
            } else {
                charIdx = lines[targetLineIdx].length;
            }
        }

        lineIndex = targetLineIdx;
        charIndex = Math.max(0, Math.min(charIdx, lines[lineIndex].length));
        
        renderDisplay();
    });

    // モーダルの外側クリックで閉じる処理
    menuModal.addEventListener('click', (e) => {
        if (e.target === menuModal) closeMenu();
    });
    
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) confirmModal.classList.remove('active');
    });

    // メニューボタンイベント
    btnPaste.addEventListener('click', () => {
        closeMenu();
        navigator.clipboard.readText().then(clip => {
            if (clip) insertText(clip);
        }).catch(err => {
            console.error('Clipboard paste failed:', err);
        });
    });

    btnSave.addEventListener('click', () => {
        closeMenu();
        const fullText = lines.join('\n');
        
        // ファイルダウンロード処理
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'keyboard_input.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    });

    btnClear.addEventListener('click', () => {
        closeMenu();
        confirmModal.classList.add('active');
    });

    btnYes.addEventListener('click', () => {
        confirmModal.classList.remove('active');
        lines = [""];
        lineIndex = 0;
        charIndex = 0;
        scrollIndex = 0;
        saveToLocalStorage();
        renderDisplay();
    });

    btnNo.addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });
}

// ─── メニュー開閉と活性制御 ───
function openMenu() {
    // 各機能の活性・非活性状態の更新
    // Paste
    navigator.clipboard.readText().then(clip => {
        const hasClipboard = !!clip;
        btnPaste.disabled = !hasClipboard;
    }).catch(() => {
        btnPaste.disabled = true; // クリップボード権限が無い場合などは非活性
    });

    // Save & Clear
    const totalChars = lines.reduce((acc, cur) => acc + cur.length, 0);
    const hasText = totalChars > 0;
    
    btnSave.disabled = !hasText;
    btnClear.disabled = !hasText;

    menuModal.classList.add('active');
}

function closeMenu() {
    menuModal.classList.remove('active');
}

// ─── 物理キーボード連携 ───
function setupPhysicalKeyboard() {
    window.addEventListener('keydown', (e) => {
        // ダイアログ表示中は物理入力を無効化
        if (menuModal.classList.contains('active') || confirmModal.classList.contains('active')) {
            return;
        }

        if (e.key === "Backspace") {
            e.preventDefault();
            deleteChar();
        } else if (e.key === "Enter") {
            e.preventDefault();
            onEnterPressed();
        } else if (e.key === "Tab") {
            e.preventDefault();
            insertText("    ");
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            moveCursor(-1, 0);
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            moveCursor(1, 0);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            moveCursor(0, -1);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            moveCursor(0, 1);
        } else if (e.key === "Insert") {
            e.preventDefault();
            isInsertMode = !isInsertMode;
            buildKeyboard();
            renderDisplay();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            insertText(e.key);
        }
    });
}
