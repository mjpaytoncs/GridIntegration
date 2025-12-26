// constants.js

//PPPP   AAAAA  Y   Y  TTTTTT  OOOO   N   N
//P   P  A   A   Y Y     TT   O    O  NN  N
//PPPP   AAAAA    Y      TT   O    O  N N N
//P      A   A    Y      TT   O    O  N  NN
//P      A   A    Y      TT    OOOO   N   N

// Notes: 
// Toggles, Debugging Settings and Defaults for Experiment modules

// Which sections to include in the experiment 
const INCLUDE = {
    instructions: true,   // 
    vviq: true,          // 
    brockmole: true       // 
};

// Debug skips (toggle true/false for debugging, true means "is skipped" false means "not skipped"<3) 
const DEBUG_SKIP = {
    instructions: true,
    vviq: true,
    brockmole: true
};

// Default parameters for the Grid Integration Brockmole task
const BROCKMOLE_DEFAULTS = {
    gridSize: 4, // number of squares in the grid
    cellSize: 171, // original 171
    dotSize: 143, // original 143
    ISI: 500, // in MS
    firstGridDuration: 100,
    secondGridDuration: 100,

    // Optional Mask Controls 
    firstGridMask: false,
    secondGridMask: false,

    // brief blank grid inserted immediately before the mask (helps avoid "filling-in" percept)
    blankBeforeMaskDuration: 200, // ms (set to 0 to disable)
    maskDuration: 50, // ms

    // Main Experiment Trials: Original Brockmole was 384 trials in 8 blocks (48 per block)
    numTrials: 25, // total number of trials across all blocks
    numBlocks: 5, // total umber of blocks 

    // Main task: NO feedback in original
    giveTrialFeedback: false,
    giveBlockFeedback: false
};

// Practice settings (for Instructions.js)

// Side-by-side practice: two grids shown at once, unlimited time, click directly on grids
const PRACTICE_SIDE_BY_SIDE = {
    numTrials: 3
};

// Sequential practice: real-timing version of task (same flow as main task w/ feedback),
//Original Brockmole was 25 trials in 5 blocks, 
const PRACTICE_SEQUENTIAL = {
    numTrials: 25,
    numBlocks: 5,

    // Practice Setting and Feedback
    isPractice: true,
    giveTrialFeedback: true,
    giveBlockFeedback: true
};
