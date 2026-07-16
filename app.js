// 定数と状態管理
// 各キーカラーに対するCSSフィルタ値（#511612の画像を目標カラーに変換する値）
const keyFilters = {
    lower: 'hue-rotate(18deg) saturate(0.45) brightness(1.35)',
    upper: 'hue-rotate(207deg) saturate(0.9) brightness(1.6)',
    number: 'hue-rotate(37deg) saturate(0.3) brightness(1.2)',
    blueNumber: 'hue-rotate(171deg) saturate(1.0) brightness(1.2)',
    symbol: 'hue-rotate(37deg) saturate(0.3) brightness(1.2)',
    hiragana: 'hue-rotate(45deg) saturate(0.3) brightness(2.2)',
    katakana: 'hue-rotate(39deg) saturate(1.5) brightness(1.15)',
    enter: 'hue-rotate(180deg) saturate(1.5) brightness(3.0)',
    enterBs: 'hue-rotate(8deg) saturate(1.1) brightness(1.8)',
    bs: 'hue-rotate(4deg) saturate(1.0) brightness(1.4)',
    tab: 'hue-rotate(216deg) saturate(1.5) brightness(2.0)',
    ins: 'hue-rotate(46deg) saturate(1.5) brightness(1.7)',
    menu: 'hue-rotate(35deg) saturate(1.3) brightness(2.1)',
    switch: 'hue-rotate(35deg) saturate(1.3) brightness(2.1)',
    space: 'hue-rotate(59deg) saturate(0.3) brightness(4.0)',
    yellow: 'hue-rotate(42deg) saturate(1.5) brightness(2.1)'
};

// タイピング音（Rainy75 Pro風のThocky音）の生成
let audioCtx = null;

// キー位置（X座標：0〜9、中心は4.5）のマッピング。外側ほど高音化するため
const keyPositions = {
    "q": 0, "w": 1, "e": 2, "r": 3, "t": 4, "y": 5, "u": 6, "i": 7, "o": 8, "p": 9,
    "Q": 0, "W": 1, "E": 2, "R": 3, "T": 4, "Y": 5, "U": 6, "I": 7, "O": 8, "P": 9,
    "0": 9, "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7, "9": 8,
    "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "j": 5, "g": 6, "k": 7, "l": 8, "Enter": 9,
    "A": 0, "S": 1, "D": 2, "F": 3, "H": 4, "J": 5, "G": 6, "K": 7, "L": 8,
    "Switch": 0, "z": 1, "x": 2, "c": 3, "v": 4, "b": 5, "n": 6, "m": 7, ".": 8, "Space": 9,
    "Z": 1, "X": 2, "C": 3, "V": 4, "B": 5, "N": 6, "M": 7, "、": 2, "。": 8,
    "BS": 8, "Tab": 6, "Ins": 7, "Ovr": 7, "Menu": 9,
    "↑": 7, "↓": 7, "←": 6, "→": 8
};

function playTypingSound(type = 'normal', key = '') {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;

        // キーボードの外側にいくほど高音にする倍率を計算 (中心4.5から離れるほど最大約11.2%高音化)
        let posFactor = 1.0;
        if (key && keyPositions[key] !== undefined) {
            const col = keyPositions[key];
            posFactor = 1.0 + Math.abs(col - 4.5) * 0.025;
        }

        // --- 共通のハイパスフィルターとマスターゲイン ---
        const hpFilter = audioCtx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(55 * posFactor, now); // 低音側もposFactorに追従

        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.24, now); // 全体の出力バランス調整

        hpFilter.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        // 各種キータイプごとの基準パラメータ
        let thockFreq = 210 * posFactor; 
        let thockDecay = 0.05;
        let thockVol = 0.35;

        let tapFreq = 700 * posFactor;
        let tapDecay = 0.015;
        let tapVol = 0.4;

        let noiseFreq = 1300 * posFactor;
        let noiseQ = 2.0;
        let noiseDecay = 0.02;
        let noiseVol = 0.12;

        if (type === 'space') {
            thockFreq = 150 * posFactor; 
            thockDecay = 0.08;
            thockVol = 0.55;
            tapFreq = 450 * posFactor;
            tapDecay = 0.02;
            tapVol = 0.35;
            noiseFreq = 1000 * posFactor;
            noiseVol = 0.15;
        } else if (type === 'enter') {
            thockFreq = 180 * posFactor;
            thockDecay = 0.07;
            thockVol = 0.45;
            tapFreq = 800 * posFactor;
            tapDecay = 0.02;
            tapVol = 0.45;
            noiseFreq = 1500 * posFactor;
            noiseVol = 0.16;
        } else if (type === 'bs') {
            thockFreq = 230 * posFactor;
            thockDecay = 0.045;
            thockVol = 0.3;
            tapFreq = 900 * posFactor;
            tapDecay = 0.015;
            tapVol = 0.35;
            noiseFreq = 1600 * posFactor;
            noiseVol = 0.08;
        } else if (type === 'switch') {
            thockFreq = 250 * posFactor;
            thockDecay = 0.04;
            thockVol = 0.25;
            tapFreq = 1000 * posFactor;
            tapDecay = 0.012;
            tapVol = 0.25;
            noiseFreq = 1800 * posFactor;
            noiseVol = 0.06;
        }

        // --- 系統A: 少し高めの音 (1.55倍) + 音量（0.225倍）（キー接触音：余韻を少し長く） ---
        createSoundSource(thockFreq * 1.55, thockVol * 0.225, thockDecay * 0.75, tapFreq * 1.55, tapVol * 0.225, tapDecay * 0.75, noiseFreq * 1.55, noiseVol * 0.225, noiseDecay * 0.75, noiseQ, now, 0, hpFilter);

        // --- 系統B: 劇的に低い音 (0.4倍) + 音量（0.525倍）（0.1秒遅れて鳴る底打ちのコトコト音） ---
        createSoundSource(thockFreq * 0.4, thockVol * 0.525, thockDecay * 1.8, tapFreq * 0.4, tapVol * 0.525, tapDecay * 1.8, noiseFreq * 0.4, noiseVol * 0.525, noiseDecay * 1.8, noiseQ, now, 0.1, hpFilter);

    } catch (e) {
        console.warn("AudioContext playback failed: ", e);
    }
}

// レイヤー音源生成用サブ関数 (ディレイ対応)
function createSoundSource(thockF, thockV, thockD, tapF, tapV, tapD, noiseF, noiseV, noiseD, noiseQ, now, delay, destination) {
    const oscThock = audioCtx.createOscillator();
    const gainThock = audioCtx.createGain();
    oscThock.type = 'sine';

    const oscTap = audioCtx.createOscillator();
    const gainTap = audioCtx.createGain();
    oscTap.type = 'triangle';

    const bufferSize = audioCtx.sampleRate * 0.04;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    const gainNoise = audioCtx.createGain();

    oscThock.connect(gainThock);
    gainThock.connect(destination);

    oscTap.connect(gainTap);
    gainTap.connect(destination);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(gainNoise);
    gainNoise.connect(destination);

    const targetTime = now + delay;

    // Thock
    oscThock.frequency.setValueAtTime(thockF, targetTime);
    gainThock.gain.setValueAtTime(0.001, targetTime);
    gainThock.gain.linearRampToValueAtTime(thockV, targetTime + 0.003); 
    gainThock.gain.exponentialRampToValueAtTime(0.001, targetTime + thockD);

    // Tap
    oscTap.frequency.setValueAtTime(tapF, targetTime);
    gainTap.gain.setValueAtTime(0.001, targetTime);
    gainTap.gain.linearRampToValueAtTime(tapV, targetTime + 0.002);
    gainTap.gain.exponentialRampToValueAtTime(0.001, targetTime + tapD);

    // Noise
    noiseFilter.frequency.setValueAtTime(noiseF, targetTime);
    noiseFilter.Q.setValueAtTime(noiseQ, targetTime);
    gainNoise.gain.setValueAtTime(0.001, targetTime);
    gainNoise.gain.linearRampToValueAtTime(noiseV, targetTime + 0.002);
    gainNoise.gain.exponentialRampToValueAtTime(0.001, targetTime + noiseD);

    oscThock.start(targetTime);
    oscThock.stop(targetTime + thockD + 0.05);

    oscTap.start(targetTime);
    oscTap.stop(targetTime + tapD + 0.05);

    noiseSource.start(targetTime);
    noiseSource.stop(targetTime + noiseD + 0.05);
}

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

// 長押しリピート用変数
let repeatTimer = null;
let repeatInterval = null;

// 現在タッチで押し込まれているキーの位置情報
let activePressedKey = null;

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
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
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

    // keytop02.pngのプリロード（タッチ時の画像切り替えラグ防止）
    const preloadActiveImg = new Image();
    preloadActiveImg.src = 'keytop02.png';

    renderDisplay();
    buildKeyboard();
    setupEventListeners();
    setupPhysicalKeyboard();

    // カーソル点滅タイマー（DOM再構築せずカーソル要素のvisibilityだけ更新）
    setInterval(() => {
        cursorVisible = !cursorVisible;
        const cursorEl = displayArea.querySelector('.cursor');
        if (cursorEl) {
            cursorEl.style.visibility = cursorVisible ? 'visible' : 'hidden';
        }
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
                    button.classList.add('functional', 'btn-enter-bs');
                } else {
                    actualText = "Enter";
                    button.classList.add('functional', 'btn-enter');
                }
            } else if (keyText === "Switch") {
                actualText = "A&\na 1";
                button.classList.add('functional', 'btn-switch');
                setupSwitchKeyEvents(button);
            } else if (keyText === "Space") {
                actualText = "Space";
                button.classList.add('functional', 'btn-space');
            } else if (keyText === "BS") {
                actualText = "BS";
                button.classList.add('functional', 'btn-bs');
            } else if (keyText === "Tab") {
                actualText = "Tab";
                button.classList.add('functional', 'btn-tab');
            } else if (keyText === "Ins") {
                actualText = isInsertMode ? "Ins" : "Ovr";
                button.classList.add('functional', 'btn-ins');
            } else if (["↑", "↓", "←", "→"].includes(keyText)) {
                actualText = keyText;
                button.classList.add('btn-nav');
            } else if (keyText === "Menu") {
                actualText = "Menu";
                button.classList.add('functional', 'btn-menu');
            } else {
                actualText = keyText;
                if (keyText === "▶") {
                    button.classList.add('functional', 'btn-yellow');
                } else if (isConverting && keyText === "。") {
                    actualText = "◀";
                    button.classList.add('functional', 'btn-yellow');
                }
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

            // --- 背景カラーフィルタタイプの判定 ---
            let keyColorType = 'lower'; // デフォルト

            if (keyText === "Enter") {
                keyColorType = isTempShiftMode ? 'enterBs' : 'enter';
            } else if (keyText === "Switch") {
                keyColorType = 'switch';
            } else if (keyText === "Space") {
                keyColorType = 'space';
            } else if (keyText === "BS") {
                keyColorType = 'bs';
            } else if (keyText === "Tab" || ["↑", "↓", "←", "→"].includes(keyText)) {
                keyColorType = 'tab';
            } else if (keyText === "Ins") {
                keyColorType = 'ins';
            } else if (keyText === "Menu") {
                keyColorType = 'menu';
            } else {
                if (currentMode === KeyboardMode.Upper || isTempShiftMode) {
                    keyColorType = 'upper';
                } else if (currentMode === KeyboardMode.Hiragana) {
                    keyColorType = 'hiragana';
                } else if (currentMode === KeyboardMode.Katakana) {
                    keyColorType = 'katakana';
                } else if (currentMode === KeyboardMode.Number) {
                    keyColorType = "0123456789./*-+".includes(keyText) ? 'blueNumber' : 'number';
                } else if (currentMode === KeyboardMode.Symbol) {
                    keyColorType = 'symbol';
                } else {
                    keyColorType = 'lower';
                }
                
                // 特殊黄色キー（▶等）の判定
                if (keyText === "▶" || (isConverting && keyText === "。")) {
                    keyColorType = 'yellow';
                }
            }

            // 1. キートップ背景画像レイヤーの追加（CSSフィルタで色変換）
            const bgDiv = document.createElement('div');
            bgDiv.className = 'key-bg';
            bgDiv.dataset.colorType = keyColorType; // 物理キー打鍵時の色参照用
            bgDiv.style.filter = keyFilters[keyColorType] || 'none';
            button.appendChild(bgDiv);

            // 2. キートップ文字・記号レイヤーの追加（背景画像の上に重なり、フィルタの影響を受けない）
            const textSpan = document.createElement('span');
            textSpan.className = 'key-text';
            if (keyText === "Switch") {
                textSpan.innerHTML = "A&<br>a 1";
            } else {
                textSpan.textContent = actualText;
            }
            button.appendChild(textSpan);

            // タッチデバイスでの画像切り替えを100%確実にするためのイベントリスナー
            const setKeyActiveState = (isActive) => {
                if (isActive) {
                    bgDiv.style.backgroundImage = "url('keytop02.png')";
                    bgDiv.style.filter = (keyFilters[keyColorType] || 'none') + ' brightness(0.75)';
                    textSpan.style.filter = 'brightness(0.75)'; // フォント色の明るさを25%落とす
                } else {
                    bgDiv.style.backgroundImage = "url('keytop01.png')";
                    bgDiv.style.filter = keyFilters[keyColorType] || 'none';
                    textSpan.style.filter = 'none'; // 元に戻す
                }
            };

            // 再構築時に現在押されているキーであればアクティブ状態にする
            const isCurrentlyPressed = activePressedKey && activePressedKey.row === rowIdx && activePressedKey.col === colIdx;
            setKeyActiveState(isCurrentlyPressed);

            button.addEventListener('pointerdown', () => {
                activePressedKey = { row: rowIdx, col: colIdx };
                setKeyActiveState(true);
            });
            const releaseHandler = () => {
                if (activePressedKey && activePressedKey.row === rowIdx && activePressedKey.col === colIdx) {
                    activePressedKey = null;
                }
                setKeyActiveState(false);
            };
            button.addEventListener('pointerup', releaseHandler);
            button.addEventListener('pointercancel', releaseHandler);
            button.addEventListener('pointerleave', releaseHandler);

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
                    // Switch・Menu・Ins以外は長押し1秒後にリピート開始
                    if (keyText !== "Menu" && keyText !== "Ins") {
                        startRepeat(triggerKey);
                    }
                });
                button.addEventListener('pointerup', stopRepeat);
                button.addEventListener('pointercancel', stopRepeat);
                button.addEventListener('pointerleave', stopRepeat);
            }

            rowDiv.appendChild(button);
        });

        keyboardContainer.appendChild(rowDiv);
    });
}

// キー入力処理の実装
function handleKeyInput(key, isRepeatInput = false) {
    if (key === "") return;

    // タイピング音を再生 (Rainy75 Pro風、押しっぱなしの時は最初の1回のみ)
    if (!isRepeatInput && !repeatInterval) {
        let soundType = 'normal';
        if (key === 'Space') {
            soundType = 'space';
        } else if (key === 'Enter') {
            soundType = 'enter';
        } else if (key === 'BS') {
            soundType = 'bs';
        }
        playTypingSound(soundType, key);
    }

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

// ─── 長押しリピート処理 ───
function startRepeat(key) {
    stopRepeat();
    repeatTimer = setTimeout(() => {
        repeatInterval = setInterval(() => {
            handleKeyInput(key, true); // リピート中であることを伝える
        }, 80); // リピート間隔 80ms
    }, 1000); // 長押し判定 1秒
}

function stopRepeat() {
    if (repeatTimer !== null) {
        clearTimeout(repeatTimer);
        repeatTimer = null;
    }
    if (repeatInterval !== null) {
        clearInterval(repeatInterval);
        repeatInterval = null;
    }
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
            <div class="drag-guide-key" id="guideHira" style="background-color: #908868; color: #ffffff;">あ</div>
            <div class="drag-guide-key" id="guideKata" style="background-color: #886000; color: #ffffff;">ア</div>
            <div class="drag-guide-key" id="guideA" style="background-color: #205080; color: #ffffff;">A</div>
            <div class="drag-guide-key" id="guideAt" style="background-color: #484030; color: #ffffff;">&</div>
            <div class="drag-guide-key" id="guideOne" style="background-color: #484030; color: #ffffff;">1</div>
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
        // オーバーレイを表示
        document.querySelector('.app-container')?.classList.add('flick-active');
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
    // オーバーレイを非表示
    document.querySelector('.app-container')?.classList.remove('flick-active');
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
        indUp.style.transform = `translate(0px, -${size * 0.7}px) rotate(0deg)`;
        indUpRight.style.transform = `translate(${size * 0.55}px, -${size * 0.55}px) rotate(45deg)`;
        indRight.style.transform = `translate(${size * 0.7}px, 0px) rotate(90deg)`;
        const indicatorSize = size * 0.4;
        [indUp, indUpRight, indRight].forEach(ind => {
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

            indUp.style.color = '#e6730f';
            indUpRight.style.color = '#e6730f';
            indRight.style.color = '#e6730f';

            if (angle >= 67.5 && angle < 112.5) {
                indUp.style.color = '#ffa047';
            } else if (angle >= 22.5 && angle < 67.5) {
                indUpRight.style.color = '#ffa047';
            } else if (angle >= -22.5 && angle < 22.5) {
                indRight.style.color = '#ffa047';
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
                indUp.style.color = '#e6730f';
                indUpRight.style.color = '#e6730f';
                indRight.style.color = '#e6730f';
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
                playTypingSound('switch');
            }
        } else {
            // タップまたははみ出なかった場合
            if (isTempShiftMode) {
                isTempShiftMode = false;
                buildKeyboard();
                playTypingSound('switch');
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
    playTypingSound('switch');
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

    alert(`Memo「${targetKey}」として保存しました`);
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
        journalList.innerHTML = '<div style="color: #666; font-size: 14px; text-align: center; padding: 20px;">保存されたMemoはありません</div>';
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
        alert("エクスポートするMemoがありません");
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

// 物理キーのキー文字列から画面上のキー座標 (row, col) を特定するヘルパー
function findKeyCoords(eventKey) {
    let target = eventKey;
    if (eventKey === "Backspace") target = "BS";
    else if (eventKey === "Enter") {
        target = isTempShiftMode ? "BS" : "Enter";
    }
    else if (eventKey === "Tab") target = "Tab";
    else if (eventKey === "ArrowLeft") target = "←";
    else if (eventKey === "ArrowRight") target = "→";
    else if (eventKey === "ArrowUp") target = "↑";
    else if (eventKey === "ArrowDown") target = "↓";
    else if (eventKey === "Insert") target = "Ins";
    else if (eventKey === " ") target = "Space";
    else if (eventKey === "-") {
        if (currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) {
            target = "▶";
        }
    }
    else if (eventKey === ".") {
        if (currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) {
            target = isConverting ? "◀" : "。";
        }
    }
    else if (eventKey === ",") {
        if (currentMode === KeyboardMode.Hiragana || currentMode === KeyboardMode.Katakana) {
            target = "、";
        }
    }

    let keyRows;
    if (isTempShiftMode) {
        keyRows = keysUpper;
    } else {
        switch (currentMode) {
            case KeyboardMode.Upper: keyRows = keysUpper; break;
            case KeyboardMode.Hiragana: keyRows = keysHiragana; break;
            case KeyboardMode.Katakana: keyRows = keysKatakana; break;
            case KeyboardMode.Number: keyRows = keysNumber; break;
            case KeyboardMode.Symbol: keyRows = keysSymbol; break;
            case KeyboardMode.Lower:
            default: keyRows = keysLower; break;
        }
    }

    for (let r = 0; r < keyRows.length; r++) {
        for (let c = 0; c < keyRows[r].length; c++) {
            let cell = keyRows[r][c];
            if (cell.toLowerCase() === target.toLowerCase()) {
                return { row: r, col: c };
            }
        }
    }
    return null;
}

// ─── 物理キーボード連携 ───
function setupPhysicalKeyboard() {
    window.addEventListener('keydown', (e) => {
        // ダイアログ表示中は物理入力を無効化
        if (menuModal.classList.contains('active') || confirmModal.classList.contains('active') || popModal.classList.contains('active')) {
            return;
        }

        // 物理キー押下で画面上の対応するキーを押し込む
        if (!e.repeat) {
            const coords = findKeyCoords(e.key);
            if (coords) {
                activePressedKey = coords;
                const btn = keyboardContainer.querySelector(`.key[data-row="${coords.row}"][data-col="${coords.col}"]`);
                if (btn) {
                    const bg = btn.querySelector('.key-bg');
                    const txt = btn.querySelector('.key-text');
                    const colorType = bg ? bg.dataset.colorType : 'lower';
                    if (bg) {
                        bg.style.backgroundImage = "url('keytop02.png')";
                        bg.style.filter = (keyFilters[colorType] || 'none') + ' brightness(0.75)';
                    }
                    if (txt) {
                        txt.style.filter = 'brightness(0.75)';
                    }
                }
            }
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
            handleKeyInput(mappedKey, e.repeat);
            return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleKeyInput(e.key, e.repeat);
        }
    });

    window.addEventListener('keyup', (e) => {
        const coords = findKeyCoords(e.key);
        if (coords) {
            if (activePressedKey && activePressedKey.row === coords.row && activePressedKey.col === coords.col) {
                activePressedKey = null;
            }
            const btn = keyboardContainer.querySelector(`.key[data-row="${coords.row}"][data-col="${coords.col}"]`);
            if (btn) {
                const bg = btn.querySelector('.key-bg');
                const txt = btn.querySelector('.key-text');
                const colorType = bg ? bg.dataset.colorType : 'lower';
                if (bg) {
                    bg.style.backgroundImage = "url('keytop01.png')";
                    bg.style.filter = keyFilters[colorType] || 'none';
                }
                if (txt) {
                    txt.style.filter = 'none';
                }
            }
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
