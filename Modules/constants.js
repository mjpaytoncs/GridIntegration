// === Global toggles so you can skip sections for debugging ===
const DEBUG_SKIP = {
    consent: false,
    instructions: false,
    vviq: false,
    brockmole: false   // keep false so your task runs
};

// === Include flags ===
const INCLUDE = {
    consent: true,
    instructions: true,
    vviq: true,
    brockmole: true
};

// === Default parameters ===
const BROCKMOLE_DEFAULTS = {
    gridSize: 4,
    cellSize: 171,
    dotSize: 143,
    ISI: 2000,
    firstGridDuration: 100,
    secondGridDuration: 100,
    numTrials: 15,
    numBlocks: 3,
    includeIntro: true,
    showFeedback: true,
    blockBreak: true
};
