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
    ["=", "^", "¥", "@", "(", ")", "Tab", "Ins", "BS", "Enter"],
    ["Switch", ";", ":", ",", "+", "-", "*", "/", ".", "Space"]
];

const keysSymbol = [
    ["!", "\"", "#", "$", "%", "&", "'", "[", "]", "Menu"],
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

    // 画面位置強制リセット（iPhone Safari横画面のアドレスバー格納・座標ズレ防止）
    function resetViewport() {
        window.scrollTo(0, 0);
        if (document.body) document.body.scrollTop = 0;
        if (document.documentElement) document.documentElement.scrollTop = 0;
    }

    // 起動1秒後、3秒後に全画面表示を促すリセット
    setTimeout(resetViewport, 1000);
    setTimeout(resetViewport, 3000);

    // 画面サイズ変更や画面回転時にも追従してリセット
    window.addEventListener('resize', resetViewport);
    window.addEventListener('orientationchange', resetViewport);
    
    // タッチによる余計なバウンススクロールを防止
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault(); // ピンチイン・アウトによる拡大防止
        }
    }, { passive: false });
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

        row.forEach((keyText, colIdx) => {
            const button = document.createElement('button');
            button.className = 'key';
            button.setAttribute('data-row', rowIdx);
            button.setAttribute('data-col', colIdx);
            
            let displayLength = 1;
            let actualText = keyText;
            
            // キー固有のクラス・スタイル設定
            if (keyText === "Enter") {
                if (isTempShiftMode) {
                    actualText = "BS";
                    button.textContent = "BS";
                    button.classList.add('functional', 'btn-enter-bs');
                } else {
                    actualText = "Enter";
                    button.textContent = "Enter";
                    button.classList.add('functional', 'btn-enter');
                }
            } else if (keyText === "Switch") {
                actualText = "A&\na 1";
                button.innerHTML = "A&<br>a 1";
                button.classList.add('functional', 'btn-switch');
                setupSwitchKeyEvents(button);
            } else if (keyText === "Space") {
                actualText = "Space";
                button.textContent = "Space";
                button.classList.add('functional', 'btn-space');
            } else if (keyText === "BS") {
                actualText = "BS";
                button.textContent = "BS";
                button.classList.add('functional', 'btn-bs');
            } else if (keyText === "Tab") {
                actualText = "Tab";
                button.textContent = "Tab";
                button.classList.add('functional', 'btn-tab');
            } else if (keyText === "Ins") {
                actualText = isInsertMode ? "Ins" : "Ovr";
                button.textContent = actualText;
                button.classList.add('functional', 'btn-ins');
            } else if (["↑", "↓", "←", "→"].includes(keyText)) {
                actualText = keyText;
                button.textContent = keyText;
                button.classList.add('btn-nav');
            } else if (keyText === "Menu") {
                actualText = "Menu";
                button.textContent = "Menu";
                button.classList.add('functional', 'btn-menu');
            } else {
                actualText = keyText;
                button.textContent = keyText;
                // 数字キーボード内の数字と特定の記号に青色を設定
                if (currentMode === KeyboardMode.Number && "0123456789./*-+".includes(keyText)) {
                    button.classList.add('blue-number');
                }
            }

            // 文字数に応じたクラス付与
            displayLength = actualText.length;
            if (keyText === "Switch") {
                displayLength = 3; // "A@\na 1" は最大3文字
            }

            if (displayLength === 1) {
                if (isTempShiftMode || currentMode === KeyboardMode.Upper) {
                    button.classList.add('char-len-1-upper');
                } else if (currentMode === KeyboardMode.Lower) {
                    button.classList.add('char-len-1-lower');
                    // qypjg は下はみ出しを防ぐためクラス追加
                    if ("qypjg".includes(actualText)) {
                        button.classList.add('descender-key');
                    }
                } else {
                    button.classList.add('char-len-1-default');
                }
            } else {
                button.classList.add(`char-len-${displayLength}`);
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
let isFlickTriggered = false;
let flickIndicators = null;
let switchPointerId = null;
let dragGuideContainer = null;
let activeGuideMode = null;

// 特定のキーの矩形範囲を取得するヘルパー
function getTargetKeyRect(row, col) {
    const keyEl = document.querySelector(`.key[data-row="${row}"][data-col="${col}"]`);
    if (keyEl) {
        return keyEl.getBoundingClientRect();
    }
    return null;
}

// a, s, z キーの上にドラッグガイド (A, @, 1) を表示する
function showDragGuides() {
    if (!dragGuideContainer) {
        dragGuideContainer = document.createElement('div');
        dragGuideContainer.className = 'drag-guide-container';
        dragGuideContainer.innerHTML = `
            <div class="drag-guide-key" id="guideA" style="background-color: #1a3556;">A</div>
            <div class="drag-guide-key" id="guideAt" style="background-color: #4a4a4a;">&</div>
            <div class="drag-guide-key" id="guideOne" style="background-color: #11353c;">1</div>
        `;
        document.body.appendChild(dragGuideContainer);
    }
    
    // a = row 1, col 0
    // s = row 1, col 1
    // z = row 2, col 1
    const rectA = getTargetKeyRect(1, 0);
    const rectS = getTargetKeyRect(1, 1);
    const rectZ = getTargetKeyRect(2, 1);

    if (rectA && rectS && rectZ) {
        const guideA = document.getElementById('guideA');
        const guideAt = document.getElementById('guideAt');
        const guideOne = document.getElementById('guideOne');

        guideA.style.left = `${rectA.left}px`;
        guideA.style.top = `${rectA.top}px`;
        guideA.style.width = `${rectA.width}px`;
        guideA.style.height = `${rectA.height}px`;

        guideAt.style.left = `${rectS.left}px`;
        guideAt.style.top = `${rectS.top}px`;
        guideAt.style.width = `${rectS.width}px`;
        guideAt.style.height = `${rectS.height}px`;

        guideOne.style.left = `${rectZ.left}px`;
        guideOne.style.top = `${rectZ.top}px`;
        guideOne.style.width = `${rectZ.width}px`;
        guideOne.style.height = `${rectZ.height}px`;

        dragGuideContainer.style.display = 'block';
    }
}

function hideDragGuides() {
    if (dragGuideContainer) {
        dragGuideContainer.style.display = 'none';
        document.getElementById('guideA').classList.remove('active');
        document.getElementById('guideAt').classList.remove('active');
        document.getElementById('guideOne').classList.remove('active');
    }
}

// 座標から現在ポインターがどのガイドキーの上にあるか取得
function getActiveGuideAtPoint(x, y) {
    if (!dragGuideContainer || dragGuideContainer.style.display === 'none') return null;

    const guides = [
        { id: 'guideA', mode: KeyboardMode.Upper },
        { id: 'guideAt', mode: KeyboardMode.Symbol },
        { id: 'guideOne', mode: KeyboardMode.Number }
    ];

    for (const guide of guides) {
        const el = document.getElementById(guide.id);
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return guide;
        }
    }
    return null;
}

function setupSwitchKeyEvents(btn) {
    // フリックガイドインジケーターの作成 (矢印用)
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
        switchPointerId = e.pointerId;

        switchTouchStart = { x: e.clientX, y: e.clientY };
        isFlickTriggered = false;

        // 押した瞬間に小文字モードなら一時大文字(Shift)化する
        if (currentMode === KeyboardMode.Lower) {
            isTempShiftMode = true;
            buildKeyboard();
        }

        // 矢印インジケーター表示
        const activeBtn = document.querySelector('.btn-switch') || btn;
        const rect = activeBtn.getBoundingClientRect();
        const container = document.querySelector('.app-container') || document.body;
        const containerRect = container.getBoundingClientRect();

        if (flickIndicators.parentNode !== container) {
            container.appendChild(flickIndicators);
        }

        const size = rect.width;
        
        flickIndicators.style.left = `${rect.left - containerRect.left}px`;
        flickIndicators.style.top = `${rect.top - containerRect.top}px`;
        flickIndicators.style.width = `${size}px`;
        flickIndicators.style.height = `${size}px`;
        flickIndicators.style.display = 'block';

        const indUp = document.getElementById('indUp');
        const indUpRight = document.getElementById('indUpRight');
        const indRight = document.getElementById('indRight');

        indUp.style.transform = `translate(0px, -${size * 0.7}px) rotate(0deg)`;
        indUpRight.style.transform = `translate(${size * 0.55}px, -${size * 0.55}px) rotate(45deg)`;
        indRight.style.transform = `translate(${size * 0.7}px, 0px) rotate(90deg)`;

        const indicatorSize = size * 0.4;
        [indUp, indUpRight, indRight].forEach(ind => {
            ind.style.width = `${indicatorSize}px`;
            ind.style.height = `${indicatorSize}px`;
            ind.style.fontSize = `${indicatorSize * 1.06}px`; /* 動的にフォントサイズと寸法をスケーリング */
            ind.style.left = `${(size - indicatorSize) / 2}px`;
            ind.style.top = `${(size - indicatorSize) / 2}px`;
            ind.style.color = '#dedede';
        });
    };

    const moveHandler = (e) => {
        if (switchPointerId === null || e.pointerId !== switchPointerId) return;
        if (!switchTouchStart) return;

        const deltaX = e.clientX - switchTouchStart.x;
        const deltaY = e.clientY - switchTouchStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 30) {
            // オレンジのキーの外に30px以上はみ出た場合 ➔ フリック状態
            if (!isFlickTriggered) {
                isFlickTriggered = true;

                // 一時大文字(Shift)解除して、背景キーボードを小文字に戻す
                if (isTempShiftMode) {
                    isTempShiftMode = false;
                    buildKeyboard();
                }

                // a, s, z の位置に A, @, 1 のフリックボタン（ドラッグガイド）を表示
                showDragGuides();
            }

            // 現在ポインターが重なっているガイドボタンの強調と記憶
            const guide = getActiveGuideAtPoint(e.clientX, e.clientY);
            activeGuideMode = guide ? guide.mode : null; // ドラッグ中の状態を記憶
            const guideA = document.getElementById('guideA');
            const guideAt = document.getElementById('guideAt');
            const guideOne = document.getElementById('guideOne');
            if (guideA && guideAt && guideOne) {
                guideA.classList.remove('active');
                guideAt.classList.remove('active');
                guideOne.classList.remove('active');
                if (guide) {
                    document.getElementById(guide.id).classList.add('active');
                }
            }

            // 矢印方向ガイドの強調 (角度で簡易判定)
            const ux = deltaX;
            const uy = -deltaY;
            const angle = Math.atan2(uy, ux) * 180 / Math.PI;

            const indUp = document.getElementById('indUp');
            const indUpRight = document.getElementById('indUpRight');
            const indRight = document.getElementById('indRight');

            indUp.style.color = '#dedede';
            indUpRight.style.color = '#dedede';
            indRight.style.color = '#dedede';

            if (angle >= 67.5 && angle < 112.5) {
                indUp.style.color = '#e6730f';
            } else if (angle >= 22.5 && angle < 67.5) {
                indUpRight.style.color = '#e6730f';
            } else if (angle >= -22.5 && angle < 22.5) {
                indRight.style.color = '#e6730f';
            }
        } else {
            // オレンジのキーの中にいる場合（距離30px以内 ➔ パカパカ切り替えを防ぐ）
            if (isFlickTriggered) {
                isFlickTriggered = false;
                hideDragGuides();
            }
            activeGuideMode = null;
            
            // 再び一時大文字化
            if (!isTempShiftMode && currentMode === KeyboardMode.Lower) {
                isTempShiftMode = true;
                buildKeyboard();
            }
            
            // 矢印インジケーターをリセット
            const indUp = document.getElementById('indUp');
            const indUpRight = document.getElementById('indUpRight');
            const indRight = document.getElementById('indRight');
            if (indUp && indUpRight && indRight) {
                indUp.style.color = '#dedede';
                indUpRight.style.color = '#dedede';
                indRight.style.color = '#dedede';
            }
        }
    };

    const endHandler = (e) => {
        if (switchPointerId === null || e.pointerId !== switchPointerId) return;
        switchPointerId = null;

        flickIndicators.style.display = 'none';
        hideDragGuides();

        if (!switchTouchStart) {
            activeGuideMode = null;
            isFlickTriggered = false;
            return;
        }

        if (isFlickTriggered) {
            // pointermove中に記憶したドラッグガイドのモードで切り替える
            if (activeGuideMode) {
                setKeyboardMode(activeGuideMode);
            } else {
                // ガイド以外の場所で離された場合は切り替えない。一時シフトしていた場合は解除
                isTempShiftMode = false;
                buildKeyboard();
            }
        } else {
            // タップまたははみ出なかった場合
            if (isTempShiftMode) {
                isTempShiftMode = false;
                buildKeyboard();
            } else {
                // 小文字キーボード以外でタップした場合は小文字に戻る
                if (currentMode !== KeyboardMode.Lower) {
                    setKeyboardMode(KeyboardMode.Lower);
                }
            }
        }

        switchTouchStart = null;
        activeGuideMode = null;
        isFlickTriggered = false;
    };

    btn.addEventListener('pointerdown', startHandler);
    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', endHandler);
    window.addEventListener('pointercancel', endHandler);
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
