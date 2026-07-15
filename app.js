// 定数と状態管理
const KeyboardMode = {
    Lower: 'Lower',
    Upper: 'Upper',
    Number: 'Number',
    Symbol: 'Symbol',
    Hiragana: 'Hiragana',
    Katakana: 'Katakana'
};

let currentMode = KeyboardMode.Lower;
let isTempShiftMode = false;
let lines = [""];
let lineIndex = 0;
let charIndex = 0;
let scrollIndex = 0;
let isInsertMode = true;
let cursorVisible = true;
let romajiBuffer = "";
let hiraganaBuffer = "";
let currentCandidates = [];
let jsonpCounter = 0;
let isConverting = false;
let candidateIndex = 0;
let lastInsertedLength = 0;

// Journal管理用変数
let selectedJournalKey = null;
let pendingDeleteKey = null;
let confirmAction = null; // "clear" または "delete"

const romajiMap = {
    "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お",
    "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ",
    "sa": "さ", "shi": "し", "si": "し", "su": "す", "se": "せ", "so": "そ",
    "ta": "た", "chi": "ち", "ti": "ち", "tsu": "つ", "tu": "つ", "te": "て", "to": "と",
    "na": "な", "ni": "に", "nu": "ぬ", "ne": "ね", "no": "の",
    "ha": "は", "hi": "ひ", "fu": "ふ", "hu": "ふ", "he": "へ", "ho": "ほ",
    "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も",
    "ya": "や", "yi": "い", "yu": "ゆ", "ye": "いぇ", "yo": "よ",
    "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ",
    "wa": "わ", "wi": "うぃ", "wu": "う", "we": "うぇ", "wo": "を",
    "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご",
    "za": "ざ", "zi": "じ", "ji": "じ", "zu": "ず", "ze": "ぜ", "zo": "ぞ",
    "da": "だ", "di": "ぢ", "du": "づ", "de": "で", "do": "ど",
    "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ",
    "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ",
    "kya": "きゃ", "kyi": "きぃ", "kyu": "きゅ", "kye": "きぇ", "kyo": "きょ",
    "sya": "しゃ", "syi": "しぃ", "syu": "しゅ", "sye": "しぇ", "syo": "しょ",
    "sha": "しゃ", "shi": "し", "shu": "しゅ", "she": "しぇ", "sho": "しょ",
    "tya": "ちゃ", "tyi": "ちぃ", "tyu": "ちゅ", "tye": "ちぇ", "tyo": "ちょ",
    "cha": "ちゃ", "chi": "ち", "chu": "ちゅ", "che": "ちぇ", "cho": "ちょ",
    "cya": "ちゃ", "cyi": "ちぃ", "cyu": "ちゅ", "cye": "ちぇ", "cyo": "ちょ",
    "nya": "にゃ", "nyi": "にぃ", "nyu": "にゅ", "nye": "にぇ", "nyo": "にょ",
    "hya": "ひゃ", "hyi": "ひぃ", "hyu": "ひゅ", "hye": "ひぇ", "hyo": "ひょ",
    "mya": "みゃ", "myi": "みぃ", "myu": "みゅ", "mye": "みぇ", "myo": "みょ",
    "rya": "りゃ", "ryi": "りぃ", "ryu": "りゅ", "rye": "りぇ", "ryo": "りょ",
    "gya": "ぎゃ", "gyi": "ぎぃ", "gyu": "ぎゅ", "gye": "ぎぇ", "gyo": "ぎょ",
    "zya": "じゃ", "zyi": "じぃ", "zyu": "じゅ", "zye": "じぇ", "zyo": "じょ",
    "ja": "じゃ", "ji": "じ", "ju": "じゅ", "je": "じぇ", "jo": "じょ",
    "dya": "ぢゃ", "dyi": "ぢぃ", "dyu": "ぢゅ", "dye": "ぢぇ", "dyo": "ぢょ",
    "bya": "びゃ", "byi": "びぃ", "byu": "びゅ", "bye": "びぇ", "byo": "びょ",
    "pya": "ぴゃ", "pyi": "ぴぃ", "pyu": "ぷゅ", "pye": "ぴぇ", "pyo": "ぴょ",
    "tsa": "つぁ", "tsi": "つぃ", "tse": "つぇ", "tso": "つぉ",
    "fa": "ふぁ", "fi": "ふぃ", "fe": "ふぇ", "fo": "ふぉ", "fyu": "ふゅ",
    "nn": "ん", "xn": "ん", "n": "ん",
    "la": "ぁ", "li": "ぃ", "lu": "ぅ", "le": "ぇ", "lo": "ぉ",
    "lya": "ゃ", "lyu": "ゅ", "lyo": "ょ", "ltu": "っ", "ltsu": "っ",
    "xa": "ぁ", "xi": "ぃ", "xu": "ぅ", "xe": "ぇ", "xo": "ぉ",
    "xya": "ゃ", "xyu": "ゅ", "xyo": "ょ", "xtu": "っ", "xtsu": "っ",
    "wyu": "うゅ", "va": "ヴぁ", "vi": "ヴぃ", "vu": "ヴ", "ve": "ヴぇ", "vo": "ヴぉ",
    "who": "うぉ"
};

// DOM要素のキャッシュ
const displayArea = document.getElementById('displayArea');
const displayWrapper = document.getElementById('displayWrapper');
const keyboardContainer = document.getElementById('keyboardContainer');
const menuModal = document.getElementById('menuModal');
const confirmModal = document.getElementById('confirmModal');

const btnCopy = document.getElementById('btnCopy');
const btnPaste = document.getElementById('btnPaste');
const btnPush = document.getElementById('btnPush');
const btnPop = document.getElementById('btnPop');
const btnSave = document.getElementById('btnSave');
const btnClear = document.getElementById('btnClear');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');

// Pop用ダイアログ要素
const popModal = document.getElementById('popModal');
const journalList = document.getElementById('journalList');
const btnPopExecute = document.getElementById('btnPopExecute');
const btnPopExport = document.getElementById('btnPopExport');
const btnPopDelete = document.getElementById('btnPopDelete');

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

const keysHiragana = [
    ["▶", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "H", "J", "G", "K", "L", "BS"],
    ["Switch", "Z", "、", "C", "V", "B", "N", "M", "。", "Enter"]
];

const keysKatakana = [
    ["▶", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "H", "J", "G", "K", "L", "BS"],
    ["Switch", "Z", "、", "C", "V", "B", "N", "M", "。", "Enter"]
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
            
            const H = Math.min(lastInsertedLength, left.length);
            const confirmedLeft = left.substring(0, left.length - H);
            const unconfirmedText = left.substring(left.length - H);

            const cursorSpan = document.createElement('span');
            cursorSpan.className = `cursor ${!isInsertMode ? 'overwrite' : ''}`;
            cursorSpan.style.visibility = cursorVisible ? 'visible' : 'hidden';

            const appendLeftTexts = () => {
                if (confirmedLeft) {
                    contentSpan.appendChild(document.createTextNode(confirmedLeft));
                }
                if (unconfirmedText) {
                    const uSpan = document.createElement('span');
                    uSpan.className = 'unconfirmed-text';
                    uSpan.textContent = unconfirmedText;
                    contentSpan.appendChild(uSpan);
                }
            };

            if (isInsertMode) {
                const right = lineText.substring(cIdx);
                appendLeftTexts();
                contentSpan.appendChild(cursorSpan);
                contentSpan.appendChild(document.createTextNode(right));
            } else {
                if (cIdx < lineText.length) {
                    const targetChar = lineText.charAt(cIdx);
                    const right = lineText.substring(cIdx + 1);
                    
                    const uElement = document.createElement('u');
                    uElement.textContent = targetChar;

                    appendLeftTexts();
                    contentSpan.appendChild(cursorSpan); // 上書きモード時はカーソルを文字の前に表示
                    contentSpan.appendChild(uElement);
                    contentSpan.appendChild(document.createTextNode(right));
                } else {
                    appendLeftTexts();
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
            case KeyboardMode.Hiragana:
                keyRows = keysHiragana;
                modeClass = 'keyboard-hiragana';
                break;
            case KeyboardMode.Katakana:
                keyRows = keysKatakana;
                modeClass = 'keyboard-katakana';
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
                if (keyText === "▶") {
                    button.classList.add('functional', 'btn-yellow');
                } else if (isConverting && keyText === "。") {
                    actualText = "◀";
                    button.classList.add('functional', 'btn-yellow');
                }
                button.textContent = actualText;
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
                if (isTempShiftMode || currentMode === KeyboardMode.Upper || currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) {
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
                    if (isConverting && keyText === "。") {
                        triggerKey = "◀";
                    }
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
        flushRomajiBuffer();
        clearHiraganaBuffer();
        insertText("    ");
    } else if (key === "Ins") {
        flushRomajiBuffer();
        clearHiraganaBuffer();
        isInsertMode = !isInsertMode;
        buildKeyboard();
        renderDisplay();
    } else if (key === "BS") {
        if (isConverting) {
            replaceInlineText(hiraganaBuffer);
            isConverting = false;
            closeCandidateBar();
            renderDisplay();
        } else {
            if ((currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) && romajiBuffer.length > 0) {
                romajiBuffer = romajiBuffer.slice(0, -1);
            } else if ((currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) && hiraganaBuffer.length > 0) {
                hiraganaBuffer = hiraganaBuffer.slice(0, -1);
            }
            lastInsertedLength = hiraganaBuffer.length + romajiBuffer.length;
            closeCandidateBar();
            deleteChar();
        }
    } else if (key === "▶") {
        startGoogleConversion();
    } else if (key === "◀") {
        if (isConverting && currentCandidates.length > 0) {
            candidateIndex = (candidateIndex - 1 + currentCandidates.length) % currentCandidates.length;
            const prevWord = currentCandidates[candidateIndex];
            replaceInlineText(prevWord);
            renderDisplay();
            updateSelectedCandidateUI();
        }
    } else if (key === "Menu") {
        flushRomajiBuffer();
        clearHiraganaBuffer();
        openMenu();
    } else if (key === "Enter") {
        flushRomajiBuffer();
        if (hiraganaBuffer.length > 0) {
            clearHiraganaBuffer();
            renderDisplay();
        } else {
            onEnterPressed();
        }
    } else if (key === "←") {
        flushRomajiBuffer();
        clearHiraganaBuffer();
        moveCursor(-1, 0);
    } else if (key === "→") {
        flushRomajiBuffer();
        clearHiraganaBuffer();
        moveCursor(1, 0);
    } else if (key === "↑") {
        flushRomajiBuffer();
        clearHiraganaBuffer();
        moveCursor(0, -1);
    } else if (key === "↓") {
        flushRomajiBuffer();
        clearHiraganaBuffer();
        moveCursor(0, 1);
    } else if (key === "Space") {
        flushRomajiBuffer();
        clearHiraganaBuffer();
        insertText(" ");
    } else {
        // 通常の文字入力
        let char = key;
        if (currentMode === KeyboardMode.Hiragana) {
            handleHiraganaInput(key.toLowerCase());
        } else if (currentMode === KeyboardMode.Katakana) {
            handleKatakanaInput(key.toLowerCase());
        } else {
            // 小文字モードの場合は小文字に変換して入力
            if (currentMode === KeyboardMode.Lower && !isTempShiftMode) {
                char = key.toLowerCase();
            }
            clearRomajiBuffer();
            clearHiraganaBuffer();
            insertText(char);
        }
    }
}

function handleHiraganaInput(char) {
    if (isConverting) {
        clearHiraganaBuffer();
    }

    if (!/^[a-z]$/.test(char)) {
        flushRomajiBuffer();
        insertText(char);
        hiraganaBuffer += char;
        lastInsertedLength = hiraganaBuffer.length;
        return;
    }

    romajiBuffer += char;
    insertText(char);
    checkAndConvertRomaji();
    lastInsertedLength = hiraganaBuffer.length + romajiBuffer.length;
    renderDisplay();
}

function checkAndConvertRomaji() {
    if (!romajiBuffer) return;

    for (let len = Math.min(3, romajiBuffer.length); len >= 1; len--) {
        const substr = romajiBuffer.substring(0, len);
        
        if (substr === 'n') {
            if (romajiBuffer.length > 1) {
                const nextChar = romajiBuffer.charAt(1);
                if (nextChar === 'n') {
                    replaceLastChars(2, 'ん');
                    romajiBuffer = romajiBuffer.substring(2);
                    checkAndConvertRomaji();
                    return;
                } else if (!/^[aiueoy]$/.test(nextChar)) {
                    replaceLastChars(romajiBuffer.length, 'ん' + romajiBuffer.substring(1));
                    romajiBuffer = romajiBuffer.substring(1);
                    checkAndConvertRomaji();
                    return;
                }
            }
            continue;
        }

        if (romajiMap[substr]) {
            const converted = romajiMap[substr];
            replaceLastChars(romajiBuffer.length, converted + romajiBuffer.substring(len));
            romajiBuffer = romajiBuffer.substring(len);
            checkAndConvertRomaji();
            return;
        }
    }

    if (romajiBuffer.length >= 2) {
        const c1 = romajiBuffer.charAt(0);
        const c2 = romajiBuffer.charAt(1);
        if (c1 === c2 && c1 !== 'n' && /^[bcdfghjklmpqrstvwxyz]$/.test(c1)) {
            replaceLastChars(romajiBuffer.length, 'っ' + romajiBuffer.substring(1));
            romajiBuffer = romajiBuffer.substring(1);
            checkAndConvertRomaji();
            return;
        }
    }
}

function handleKatakanaInput(char) {
    if (isConverting) {
        clearHiraganaBuffer();
    }

    if (!/^[a-z]$/.test(char)) {
        flushRomajiBuffer();
        insertText(char);
        hiraganaBuffer += char;
        lastInsertedLength = hiraganaBuffer.length;
        return;
    }

    romajiBuffer += char;
    insertText(char);
    checkAndConvertRomaji();
    lastInsertedLength = hiraganaBuffer.length + romajiBuffer.length;
    renderDisplay();
}

function hiraToKata(str) {
    return str.replace(/[\u3041-\u3096]/g, function(match) {
        const chr = match.charCodeAt(0) + 0x60;
        return String.fromCharCode(chr);
    });
}

function replaceLastChars(count, replacement) {
    for (let i = 0; i < count; i++) {
        deleteCharWithoutRender();
    }
    let text = replacement;
    if (currentMode === KeyboardMode.Katakana) {
        text = hiraToKata(replacement);
    }
    insertTextWithoutRender(text);
    
    // hiraganaBufferの更新（ローマ字変換結果のひらがな/カタカナを蓄積）
    const kanaOnly = replacement.replace(/[a-z]/gi, '');
    if (kanaOnly) {
        if (currentMode === KeyboardMode.Katakana) {
            hiraganaBuffer += hiraToKata(kanaOnly);
        } else {
            hiraganaBuffer += kanaOnly;
        }
    }
}

function deleteCharWithoutRender() {
    let curLine = lines[lineIndex];
    charIndex = Math.max(0, Math.min(charIndex, curLine.length));

    if (charIndex > 0) {
        curLine = curLine.substring(0, charIndex - 1) + curLine.substring(charIndex);
        charIndex--;
        lines[lineIndex] = curLine;
    }
}

function insertTextWithoutRender(text) {
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
    saveToLocalStorage();
}

function flushRomajiBuffer() {
    if (!romajiBuffer) return;
    if (romajiBuffer === 'n') {
        replaceLastChars(1, 'ん');
    }
    romajiBuffer = "";
}

function clearRomajiBuffer() {
    romajiBuffer = "";
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

// q, a, s, z キーの上にドラッグガイド (あ, A, @, 1) を表示する
function showDragGuides() {
    if (!dragGuideContainer) {
        dragGuideContainer = document.createElement('div');
        dragGuideContainer.className = 'drag-guide-container';
        dragGuideContainer.innerHTML = `
            <div class="drag-guide-key" id="guideHira" style="background-color: #6b3749; color: #dedede;">あ</div>
            <div class="drag-guide-key" id="guideKata" style="background-color: #5c3000; color: #dedede;">ア</div>
            <div class="drag-guide-key" id="guideA" style="background-color: #0f2d57;">A</div>
            <div class="drag-guide-key" id="guideAt" style="background-color: #222222;">&</div>
            <div class="drag-guide-key" id="guideOne" style="background-color: #16464b;">1</div>
        `;
        document.body.appendChild(dragGuideContainer);
    }
    
    const rectHira = getTargetKeyRect(0, 0); // qキーの位置 (Aの1つ上)
    const rectKata = getTargetKeyRect(0, 1); // wキーの位置 (あ の右隣)
    const rectA = getTargetKeyRect(1, 0); // aキーの位置
    const rectAt = getTargetKeyRect(1, 1); // sキーの位置
    const rectOne = getTargetKeyRect(2, 1); // zキーの位置

    if (rectHira && rectKata && rectA && rectAt && rectOne) {
        const guideHira = document.getElementById('guideHira');
        const guideKata = document.getElementById('guideKata');
        const guideA = document.getElementById('guideA');
        const guideAt = document.getElementById('guideAt');
        const guideOne = document.getElementById('guideOne');

        guideHira.style.left = `${rectHira.left}px`;
        guideHira.style.top = `${rectHira.top}px`;
        guideHira.style.width = `${rectHira.width}px`;
        guideHira.style.height = `${rectHira.height}px`;

        guideKata.style.left = `${rectKata.left}px`;
        guideKata.style.top = `${rectKata.top}px`;
        guideKata.style.width = `${rectKata.width}px`;
        guideKata.style.height = `${rectKata.height}px`;

        guideA.style.left = `${rectA.left}px`;
        guideA.style.top = `${rectA.top}px`;
        guideA.style.width = `${rectA.width}px`;
        guideA.style.height = `${rectA.height}px`;

        guideAt.style.left = `${rectAt.left}px`;
        guideAt.style.top = `${rectAt.top}px`;
        guideAt.style.width = `${rectAt.width}px`;
        guideAt.style.height = `${rectAt.height}px`;

        guideOne.style.left = `${rectOne.left}px`;
        guideOne.style.top = `${rectOne.top}px`;
        guideOne.style.width = `${rectOne.width}px`;
        guideOne.style.height = `${rectOne.height}px`;

        dragGuideContainer.style.display = 'block';
    }
}

function hideDragGuides() {
    if (dragGuideContainer) {
        dragGuideContainer.style.display = 'none';
        const guideHira = document.getElementById('guideHira');
        const guideKata = document.getElementById('guideKata');
        const guideA = document.getElementById('guideA');
        const guideAt = document.getElementById('guideAt');
        const guideOne = document.getElementById('guideOne');
        if (guideHira) guideHira.classList.remove('active');
        if (guideKata) guideKata.classList.remove('active');
        if (guideA) guideA.classList.remove('active');
        if (guideAt) guideAt.classList.remove('active');
        if (guideOne) guideOne.classList.remove('active');
    }
}

function getActiveGuideAtPoint(x, y) {
    if (!dragGuideContainer || dragGuideContainer.style.display === 'none') return null;
    const guides = [
        { id: 'guideHira', mode: KeyboardMode.Hiragana },
        { id: 'guideKata', mode: KeyboardMode.Katakana },
        { id: 'guideA', mode: KeyboardMode.Upper },
        { id: 'guideAt', mode: KeyboardMode.Symbol },
        { id: 'guideOne', mode: KeyboardMode.Number }
    ];
    for (const guide of guides) {
        const el = document.getElementById(guide.id);
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return guide;
    }
    return null;
}

function setupSwitchKeyEvents(btn) {
    if (!flickIndicators) {
        flickIndicators = document.createElement('div');
        flickIndicators.className = 'flick-indicators';
        flickIndicators.innerHTML = `
            <div class="flick-indicator" id="indUp">▲</div>
            <div class="flick-indicator" id="indUpRight">▲</div>
            <div class="flick-indicator" id="indRight">▲</div>
            <div class="flick-indicator" id="indDownRight">▲</div>
        `;
        document.body.appendChild(flickIndicators);
    }

    const startHandler = (e) => {
        e.preventDefault();
        switchPointerId = e.pointerId;
        switchTouchStart = { x: e.clientX, y: e.clientY };
        isFlickTriggered = false;
        if (currentMode === KeyboardMode.Lower) {
            isTempShiftMode = true;
            buildKeyboard();
        }
        const activeBtn = document.querySelector('.btn-switch') || btn;
        const rect = activeBtn.getBoundingClientRect();
        const container = document.querySelector('.app-container') || document.body;
        const containerRect = container.getBoundingClientRect();
        if (flickIndicators.parentNode !== container) container.appendChild(flickIndicators);
        const size = rect.width;
        flickIndicators.style.left = `${rect.left - containerRect.left}px`;
        flickIndicators.style.top = `${rect.top - containerRect.top}px`;
        flickIndicators.style.width = `${size}px`;
        flickIndicators.style.height = `${size}px`;
        flickIndicators.style.display = 'block';
        const indUp = document.getElementById('indUp');
        const indUpRight = document.getElementById('indUpRight');
        const indRight = document.getElementById('indRight');
        const indDownRight = document.getElementById('indDownRight');
        indUp.style.transform = `translate(0px, -${size * 0.7}px) rotate(0deg)`;
        indUpRight.style.transform = `translate(${size * 0.55}px, -${size * 0.55}px) rotate(45deg)`;
        indRight.style.transform = `translate(${size * 0.7}px, 0px) rotate(90deg)`;
        indDownRight.style.transform = `translate(${size * 0.55}px, ${size * 0.55}px) rotate(135deg)`;
        const indicatorSize = size * 0.4;
        [indUp, indUpRight, indRight, indDownRight].forEach(ind => {
            ind.style.width = `${indicatorSize}px`;
            ind.style.height = `${indicatorSize}px`;
            ind.style.fontSize = `${indicatorSize * 1.06}px`;
            ind.style.left = `${(size - indicatorSize) / 2}px`;
            ind.style.top = `${(size - indicatorSize) / 2}px`;
            ind.style.color = '#e6730f'; // オレンジに変更
            ind.style.backgroundColor = 'transparent';
            ind.style.borderRadius = '0';
        });
    };

    const moveHandler = (e) => {
        if (switchPointerId === null || e.pointerId !== switchPointerId) return;
        if (!switchTouchStart) return;

        const deltaX = e.clientX - switchTouchStart.x;
        const deltaY = e.clientY - switchTouchStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 30) {
            if (!isFlickTriggered) {
                isFlickTriggered = true;
                if (isTempShiftMode) {
                    isTempShiftMode = false;
                    buildKeyboard();
                }
                showDragGuides();
            }

            const guide = getActiveGuideAtPoint(e.clientX, e.clientY);
            activeGuideMode = guide ? guide.mode : null;
            
            const guideHira = document.getElementById('guideHira');
            const guideKata = document.getElementById('guideKata');
            const guideA = document.getElementById('guideA');
            const guideAt = document.getElementById('guideAt');
            const guideOne = document.getElementById('guideOne');
            
            if (guideHira && guideKata && guideA && guideAt && guideOne) {
                guideHira.classList.remove('active');
                guideKata.classList.remove('active');
                guideA.classList.remove('active');
                guideAt.classList.remove('active');
                guideOne.classList.remove('active');
                if (guide) {
                    document.getElementById(guide.id).classList.add('active');
                }
            }

            // 矢印方向ガイドの強調 (角度で判定)
            const ux = deltaX;
            const uy = -deltaY;
            const angle = Math.atan2(uy, ux) * 180 / Math.PI;

            const indUp = document.getElementById('indUp');
            const indUpRight = document.getElementById('indUpRight');
            const indRight = document.getElementById('indRight');
            const indDownRight = document.getElementById('indDownRight');

            indUp.style.color = '#e6730f';
            indUpRight.style.color = '#e6730f';
            indRight.style.color = '#e6730f';
            indDownRight.style.color = '#e6730f';

            if (angle >= 67.5 && angle < 112.5) {
                indUp.style.color = '#ffa047';
            } else if (angle >= 22.5 && angle < 67.5) {
                indUpRight.style.color = '#ffa047';
            } else if (angle >= -22.5 && angle < 22.5) {
                indRight.style.color = '#ffa047';
            } else if (angle >= -67.5 && angle < -22.5) {
                indDownRight.style.color = '#ffa047';
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
            const indDownRight = document.getElementById('indDownRight');
            if (indUp && indUpRight && indRight && indDownRight) {
                indUp.style.color = '#e6730f';
                indUpRight.style.color = '#e6730f';
                indRight.style.color = '#e6730f';
                indDownRight.style.color = '#e6730f';
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
    clearHiraganaBuffer();
    buildKeyboard();
    renderDisplay();
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

    // モーダルの外側クリックで閉じる処理
    menuModal.addEventListener('click', (e) => {
        if (e.target === menuModal) closeMenu();
    });
    
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.classList.remove('active');
            confirmAction = null;
            pendingDeleteKey = null;
            document.getElementById('confirmTitle').textContent = "Clear all text?";
        }
    });

    popModal.addEventListener('click', (e) => {
        if (e.target === popModal) closePopModal();
    });

    // メニューボタンイベント
    btnCopy.addEventListener('click', () => {
        closeMenu();
        const fullText = lines.join('\n');
        navigator.clipboard.writeText(fullText).then(() => {
            alert("クリップボードにテキストをコピーしました");
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
        });
    });

    btnPaste.addEventListener('click', () => {
        closeMenu();
        navigator.clipboard.readText().then(clip => {
            if (clip && clip.trim().length > 0) {
                insertText(clip);
            } else {
                alert("クリップボードにテキストがありません");
            }
        }).catch(err => {
            console.error('Clipboard paste failed:', err);
            alert("クリップボードにテキストがありません");
        });
    });

    btnPush.addEventListener('click', () => {
        closeMenu();
        pushJournal();
    });

    btnPop.addEventListener('click', () => {
        closeMenu();
        openPopModal();
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
        confirmAction = "clear";
        document.getElementById('confirmTitle').textContent = "Clear all text?";
        confirmModal.classList.add('active');
    });

    btnYes.addEventListener('click', () => {
        confirmModal.classList.remove('active');
        if (confirmAction === "clear") {
            lines = [""];
            lineIndex = 0;
            charIndex = 0;
            scrollIndex = 0;
            saveToLocalStorage();
            renderDisplay();
        } else if (confirmAction === "delete" && pendingDeleteKey) {
            executeDeleteJournal(pendingDeleteKey);
        }
        confirmAction = null;
        pendingDeleteKey = null;
        document.getElementById('confirmTitle').textContent = "Clear all text?";
    });

    btnNo.addEventListener('click', () => {
        confirmModal.classList.remove('active');
        confirmAction = null;
        pendingDeleteKey = null;
        document.getElementById('confirmTitle').textContent = "Clear all text?";
    });

    // Popダイアログのボタンイベント
    btnPopExecute.addEventListener('click', () => {
        if (selectedJournalKey) {
            popJournal(selectedJournalKey);
            closePopModal();
        }
    });

    btnPopExport.addEventListener('click', () => {
        exportAllJournals();
    });

    btnPopDelete.addEventListener('click', () => {
        if (selectedJournalKey) {
            pendingDeleteKey = selectedJournalKey;
            confirmAction = "delete";
            document.getElementById('confirmTitle').textContent = `Delete "${selectedJournalKey}"?`;
            confirmModal.classList.add('active');
        }
    });
}

// ─── Push/Pop用ヘルパー関数 ───
function getYyMmDd() {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return yy + mm + dd;
}

function pushJournal() {
    const fullText = lines.join('\n');
    if (!fullText.trim()) return;

    const dateStr = getYyMmDd();
    let list = [];
    try {
        const savedList = localStorage.getItem("PushJournalList");
        if (savedList) list = JSON.parse(savedList);
    } catch(e) {
        list = [];
    }

    let targetKey = dateStr;
    if (list.includes(targetKey)) {
        let index = 2;
        while (list.includes(`${dateStr}_${index}`)) {
            index++;
        }
        targetKey = `${dateStr}_${index}`;
    }

    localStorage.setItem("PushJournal_" + targetKey, fullText);
    list.push(targetKey);
    localStorage.setItem("PushJournalList", JSON.stringify(list));

    alert(`日記を「${targetKey}」として保存しました`);
}

function openPopModal() {
    selectedJournalKey = null;
    btnPopExecute.disabled = true;
    btnPopExecute.classList.add('disabled');
    btnPopDelete.disabled = true;
    btnPopDelete.classList.add('disabled');
    
    renderJournalList();
    popModal.classList.add('active');
}

function closePopModal() {
    popModal.classList.remove('active');
}

function renderJournalList() {
    journalList.innerHTML = "";
    let list = [];
    try {
        const savedList = localStorage.getItem("PushJournalList");
        if (savedList) list = JSON.parse(savedList);
    } catch(e) {
        list = [];
    }

    if (list.length === 0) {
        journalList.innerHTML = '<div style="color: #666; font-size: 14px; text-align: center; padding: 20px;">保存された日記はありません</div>';
        return;
    }

    list.forEach(key => {
        const item = document.createElement('div');
        item.className = 'journal-item';
        const content = localStorage.getItem("PushJournal_" + key) || "";
        const cleanContent = content.replace(/\n/g, " ").trim();
        item.textContent = `${key}  ${cleanContent}`;
        item.addEventListener('click', () => {
            const items = journalList.querySelectorAll('.journal-item');
            items.forEach(el => el.classList.remove('selected'));
            
            if (selectedJournalKey === key) {
                selectedJournalKey = null;
                btnPopExecute.disabled = true;
                btnPopExecute.classList.add('disabled');
                btnPopDelete.disabled = true;
                btnPopDelete.classList.add('disabled');
            } else {
                selectedJournalKey = key;
                item.classList.add('selected');
                btnPopExecute.disabled = false;
                btnPopExecute.classList.remove('disabled');
                btnPopDelete.disabled = false;
                btnPopDelete.classList.remove('disabled');
            }
        });
        journalList.appendChild(item);
    });
}

function popJournal(key) {
    const data = localStorage.getItem("PushJournal_" + key);
    if (data !== null) {
        lines = data.split('\n');
        lineIndex = lines.length - 1;
        charIndex = lines[lineIndex].length;
        scrollIndex = 0;
        saveToLocalStorage();
        renderDisplay();
    }
}

function exportAllJournals() {
    let list = [];
    try {
        const savedList = localStorage.getItem("PushJournalList");
        if (savedList) list = JSON.parse(savedList);
    } catch(e) {
        list = [];
    }

    if (list.length === 0) {
        alert("エクスポートする日記がありません");
        return;
    }

    let combinedText = "";
    list.forEach(key => {
        const content = localStorage.getItem("PushJournal_" + key);
        combinedText += `====================\nTITLE: ${key}\n====================\n${content}\n\n\n`;
    });

    const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'all_journals.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

function executeDeleteJournal(key) {
    let list = [];
    try {
        const savedList = localStorage.getItem("PushJournalList");
        if (savedList) list = JSON.parse(savedList);
    } catch(e) {
        list = [];
    }

    list = list.filter(k => k !== key);
    localStorage.setItem("PushJournalList", JSON.stringify(list));
    localStorage.removeItem("PushJournal_" + key);

    selectedJournalKey = null;
    btnPopExecute.disabled = true;
    btnPopExecute.classList.add('disabled');
    btnPopDelete.disabled = true;
    btnPopDelete.classList.add('disabled');

    renderJournalList();
}

// ─── メニュー開閉と活性制御 ───
function openMenu() {
    // Save & Clear & Copy & Push & Pop
    const totalChars = lines.reduce((acc, cur) => acc + cur.length, 0);
    const hasText = totalChars > 0;

    let list = [];
    try {
        const savedList = localStorage.getItem("PushJournalList");
        if (savedList) list = JSON.parse(savedList);
    } catch(e) {
        list = [];
    }
    const hasJournals = list.length > 0;
    
    btnCopy.disabled = !hasText;
    btnPaste.disabled = false; // Menuを開いた時点ではクリップボードにアクセスしない
    btnPush.disabled = !hasText;
    btnPop.disabled = !hasJournals;
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
        if (menuModal.classList.contains('active') || confirmModal.classList.contains('active') || popModal.classList.contains('active')) {
            return;
        }

        let mappedKey = null;

        if (e.key === "Backspace") {
            mappedKey = "BS";
        } else if (e.key === "Enter") {
            mappedKey = "Enter";
        } else if (e.key === "Tab") {
            mappedKey = "Tab";
        } else if (e.key === "ArrowLeft") {
            mappedKey = "←";
        } else if (e.key === "ArrowRight") {
            mappedKey = "→";
        } else if (e.key === "ArrowUp") {
            mappedKey = "↑";
        } else if (e.key === "ArrowDown") {
            mappedKey = "↓";
        } else if (e.key === "Insert") {
            mappedKey = "Ins";
        } else if (e.key === "-") {
            if (currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) {
                mappedKey = "▶";
            }
        } else if (e.key === ".") {
            if (currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) {
                mappedKey = isConverting ? "◀" : "。";
            }
        } else if (e.key === ",") {
            if (currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) {
                mappedKey = "、";
            }
        }

        if (mappedKey !== null) {
            e.preventDefault();
            handleKeyInput(mappedKey);
            return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleKeyInput(e.key);
        }
    });
}

function clearHiraganaBuffer() {
    hiraganaBuffer = "";
    romajiBuffer = "";
    lastInsertedLength = 0;
    isConverting = false;
    buildKeyboard();
    closeCandidateBar();
}

function closeCandidateBar() {
    const bar = document.getElementById('candidateBar');
    if (bar) {
        bar.innerHTML = "";
        bar.style.display = 'none';
    }
    currentCandidates = [];
    candidateIndex = 0;
    if (isConverting) {
        isConverting = false;
        buildKeyboard();
    }
}

function replaceInlineText(word) {
    for (let i = 0; i < lastInsertedLength; i++) {
        deleteCharWithoutRender();
    }
    insertTextWithoutRender(word);
    lastInsertedLength = word.length;
}

function startGoogleConversion() {
    flushRomajiBuffer();
    
    if (!hiraganaBuffer) {
        return;
    }
    
    if (isConverting) {
        if (currentCandidates.length > 0) {
            candidateIndex = (candidateIndex + 1) % currentCandidates.length;
            const nextWord = currentCandidates[candidateIndex];
            replaceInlineText(nextWord);
            renderDisplay();
            updateSelectedCandidateUI();
        }
        return;
    }
    
    isConverting = true;
    candidateIndex = 0;
    lastInsertedLength = hiraganaBuffer.length;
    buildKeyboard();
    
    const bar = document.getElementById('candidateBar');
    if (bar) {
        bar.style.display = 'flex';
        bar.innerHTML = '<div style="color: #888; font-size: 14px; padding-left: 8px;">変換中...</div>';
    }
    
    requestGoogleSuggest(hiraganaBuffer, function(data) {
        showCandidates(data);
    });
}

function requestGoogleSuggest(text, callback) {
    const callbackName = 'google_translate_callback_' + (jsonpCounter++);
    
    const timeoutId = setTimeout(() => {
        cleanup();
        showCandidatesError();
    }, 5000);

    function cleanup() {
        clearTimeout(timeoutId);
        if (window[callbackName]) {
            delete window[callbackName];
        }
        const script = document.getElementById(callbackName);
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }
    }

    window[callbackName] = function(data) {
        cleanup();
        callback(data);
    };

    const script = document.createElement('script');
    script.id = callbackName;
    
    script.onerror = function() {
        cleanup();
        showCandidatesError();
    };

    script.src = `https://www.google.com/transliterate?langpair=ja-Hira|ja&text=${encodeURIComponent(text)}&jsonp=${callbackName}`;
    document.body.appendChild(script);
}

function showCandidatesError() {
    const bar = document.getElementById('candidateBar');
    if (bar) {
        bar.style.display = 'flex';
        bar.innerHTML = '<div style="color: #ff6b6b; font-size: 14px; padding-left: 12px; font-weight: bold;">変換エラー（接続を確認してください）</div>';
    }
    isConverting = false;
}

function showCandidates(data) {
    const bar = document.getElementById('candidateBar');
    if (!bar) return;
    bar.innerHTML = "";
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        bar.style.display = 'none';
        isConverting = false;
        return;
    }
    
    try {
        const candidates = [];
        let maxLen = 0;
        data.forEach(segment => {
            if (segment && Array.isArray(segment) && segment[1] && Array.isArray(segment[1])) {
                if (segment[1].length > maxLen) {
                    maxLen = segment[1].length;
                }
            }
        });
        
        if (maxLen === 0) {
            bar.style.display = 'none';
            isConverting = false;
            return;
        }
        
        const maxCandidates = 8;
        for (let i = 0; i < Math.min(maxLen, maxCandidates); i++) {
            let combined = "";
            data.forEach(segment => {
                if (segment && Array.isArray(segment) && segment[1] && Array.isArray(segment[1])) {
                    const list = segment[1];
                    const cand = list[Math.min(i, list.length - 1)];
                    combined += cand;
                }
            });
            if (combined && !candidates.includes(combined)) {
                candidates.push(combined);
            }
        }
        
        currentCandidates = candidates;
        
        if (candidates.length === 0) {
            bar.style.display = 'none';
            isConverting = false;
            return;
        }
        
        candidates.forEach((candText, idx) => {
            const btn = document.createElement('div');
            btn.className = `candidate-item ${idx === candidateIndex ? 'selected' : ''}`;
            btn.textContent = candText;
            btn.addEventListener('click', () => {
                selectCandidate(candText);
            });
            bar.appendChild(btn);
        });
        
        bar.style.display = 'flex';
        
        // 最初の候補を自動でインライン適用
        replaceInlineText(candidates[0]);
        renderDisplay();
        
    } catch (e) {
        console.error(e);
        showCandidatesError();
    }
}

function updateSelectedCandidateUI() {
    const bar = document.getElementById('candidateBar');
    if (!bar) return;
    const items = bar.querySelectorAll('.candidate-item');
    items.forEach((item, idx) => {
        if (idx === candidateIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            item.classList.remove('selected');
        }
    });
}

function selectCandidate(word) {
    for (let i = 0; i < lastInsertedLength; i++) {
        deleteCharWithoutRender();
    }
    insertTextWithoutRender(word);
    clearHiraganaBuffer();
    renderDisplay();
}
