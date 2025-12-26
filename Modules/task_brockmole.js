// modules/task_brockmole.js

//PPPP   AAAAA  Y   Y  TTTTTT  OOOO   N   N
//P   P  A   A   Y Y     TT   O    O  NN  N
//PPPP   AAAAA    Y      TT   O    O  N N N
//P      A   A    Y      TT   O    O  N  NN
//P      A   A    Y      TT    OOOO   N   N

// Notes:
// Wrapper around Brockmole task

(function (global) {
    if (!global.Modules) global.Modules = {};

    global.Modules.task_brockmole = function (config) {
        // Merge config with defaults from BROCKMOLE_DEFAULTS
        config = config || {};
        const gridSize = config.gridSize || BROCKMOLE_DEFAULTS.gridSize;
        const cellSize = config.cellSize || BROCKMOLE_DEFAULTS.cellSize;
        const dotSize = config.dotSize || BROCKMOLE_DEFAULTS.dotSize;
        const ISI = config.ISI || BROCKMOLE_DEFAULTS.ISI;
        const firstGridDuration = config.firstGridDuration || BROCKMOLE_DEFAULTS.firstGridDuration;
        const secondGridDuration = config.secondGridDuration || BROCKMOLE_DEFAULTS.secondGridDuration;
        const numTrials = config.numTrials || BROCKMOLE_DEFAULTS.numTrials;
        const numBlocks = config.numBlocks || BROCKMOLE_DEFAULTS.numBlocks;

        // Mask Controls (Optional)
        const firstGridMask = (typeof config.firstGridMask === 'boolean')
            ? config.firstGridMask
            : BROCKMOLE_DEFAULTS.firstGridMask;

        const secondGridMask = (typeof config.secondGridMask === 'boolean')
            ? config.secondGridMask
            : BROCKMOLE_DEFAULTS.secondGridMask;

        const blankBeforeMaskDuration = (typeof config.blankBeforeMaskDuration === 'number')
            ? config.blankBeforeMaskDuration
            : BROCKMOLE_DEFAULTS.blankBeforeMaskDuration;

        const maskDuration = (typeof config.maskDuration === 'number')
            ? config.maskDuration
            : BROCKMOLE_DEFAULTS.maskDuration;


        // Practice setting
        const isPractice = !!(config && config.isPractice === true);

        //Feedback flags (default: only practice gets feedback)
        const giveTrialFeedback = (typeof config.giveTrialFeedback === 'boolean')
            ? config.giveTrialFeedback
            : isPractice;

        const giveBlockFeedback = (typeof config.giveBlockFeedback === 'boolean')
            ? config.giveBlockFeedback
            : isPractice;



        // Trialcounter for Feedback screen
        let trialIndex = 0;
        let correctSoFar = 0;
        let lastCorrect = false;
        let currentBlock = 0;
        let lastBlockNumber = 1;
        let lastTrialInBlock = 1;


        // === Generate Grid ===

        function generateGrids() {
            let allCells = [];
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    allCells.push([i + 1, j + 1]);
                }
            }
            allCells = jsPsych.randomization.shuffle(allCells);
            const firstGridCells = allCells.slice(0, Math.floor((gridSize * gridSize) / 2));
            const remainingCells = allCells.slice(Math.floor((gridSize * gridSize) / 2));
            const missingCell = remainingCells.pop();
            const firstGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
            firstGridCells.forEach(([i, j]) => { firstGrid[i - 1][j - 1] = 1; });
            const secondGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
            remainingCells.forEach(([i, j]) => { secondGrid[i - 1][j - 1] = 1; });
            return { firstGrid, secondGrid, missingCell };
        }

        // Rendering

        // Convert grid to a  list of dot locations for saving and later analysis
        function gridToDotLocations(grid) {
            const locs = [];
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    if (grid[r][c] === 1) {
                        locs.push((r + 1) + ',' + (c + 1));
                    }
                }
            }
            return locs;
        }


        function renderGrid(grid) {
            let html = '<div style="display: grid; grid-template-columns: repeat(' + gridSize + ', ' + cellSize + 'px);">';
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const hasDot = grid[row][col] === 1;
                    html += '<div style="width: ' + cellSize + 'px; height: ' + cellSize + 'px; border: 1px solid black; display: flex; align-items: center; justify-content: center;">';
                    if (hasDot) {
                        html += '<div style="width: ' + dotSize + 'px; height: ' + dotSize + 'px; border-radius: 50%; background-color: black;"></div>';
                    }
                    html += '</div>';
                }
            }
            html += '</div>';
            return html;
        }

        // Mask grid: every cell contains a dot
        function renderMaskGrid() {
            const maskGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(1));
            return renderGrid(maskGrid);
        }

        function renderBlankGrid() {
            const blankGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
            return renderGrid(blankGrid);
        }

        // Staging before it is presented.
        function stage(gridHTML, instructionText = "") {
            const hasTextClass = instructionText.trim() ? "has-text" : "";
            return `
        <div class="stage">
          <div class="grid-slot">
            ${gridHTML}
          </div>
          <div class="instr-slot ${hasTextClass}">
            ${instructionText}
          </div>
        </div>
      `;
        }

        const timeline = [];

        // Intro screen
        timeline.push({
            type: 'html-keyboard-response',
            stimulus: '<h1>When you are ready, press space to start.</h1>',
            choices: [' ']
        });

        const trialsPerBlock = Math.ceil(numTrials / numBlocks);

        for (let block = 0; block < numBlocks; block++) {
            currentBlock = block;

            for (let i = 0; i < trialsPerBlock; i++) {

                // hard stop so total trials never exceeds numTrials
                if ((block * trialsPerBlock + i) >= numTrials) break;

                const { firstGrid, secondGrid, missingCell } = generateGrids();

                const firstGridDots = gridToDotLocations(firstGrid);
                const secondGridDots = gridToDotLocations(secondGrid);



                // Augmented trialData with parameters
                let trialData = {
                    trueLocation: missingCell.join(','),
                    gridSize: gridSize,
                    cellSize: cellSize,
                    dotSize: dotSize,
                    ISI: ISI,
                    firstGridDuration: firstGridDuration,
                    secondGridDuration: secondGridDuration,

                    // mask settings
                    firstGridMask: firstGridMask,
                    secondGridMask: secondGridMask,
                    blankBeforeMaskDuration: blankBeforeMaskDuration,
                    maskDuration: maskDuration,

                    practice: config && config.isPractice === true,

                    blockNumber: block + 1,
                    trialInBlock: i + 1,
                    overallTrialNumber: (block * trialsPerBlock) + (i + 1),
                    totalBlocks: numBlocks,
                    totalTrials: numTrials,


                    // stimulus configuration (critical)
                    firstGridDots: firstGridDots,
                    secondGridDots: secondGridDots

                };


                // Trial-start screen with grid 
                timeline.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        // build blank grid identical to response grid
                        let gridHTML = '<div style="display: grid; grid-template-columns: repeat(' + gridSize + ', ' + cellSize + 'px);">';
                        for (let r = 0; r < gridSize; r++) {
                            for (let c = 0; c < gridSize; c++) {
                                gridHTML += `<div style="width: ${cellSize}px; height: ${cellSize}px; border: 1px solid black; display: inline-block;"></div>`;
                            }
                        }
                        gridHTML += '</div>';
                        return stage(gridHTML);
                    },
                    choices: [' ']
                });

                // first grid
                timeline.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        trialData.firstStart = performance.now();
                        return stage(renderGrid(firstGrid), '');
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: firstGridDuration,
                    on_finish: function () {
                        trialData.firstEnd = performance.now();
                    }
                });

                // Optional mask after first grid
                if (firstGridMask) {

                    // brief blank grid before mask (optional)
                    if (blankBeforeMaskDuration > 0) {
                        timeline.push({
                            type: 'html-keyboard-response',
                            stimulus: function () {
                                trialData.firstPreMaskBlankStart = performance.now();
                                return stage(renderBlankGrid(), '');
                            },
                            choices: jsPsych.NO_KEYS,
                            trial_duration: blankBeforeMaskDuration,
                            on_finish: function () {
                                trialData.firstPreMaskBlankEnd = performance.now();
                            }
                        });
                    }

                    // mask
                    timeline.push({
                        type: 'html-keyboard-response',
                        stimulus: function () {
                            trialData.firstMaskStart = performance.now();
                            return stage(renderMaskGrid(), '');
                        },
                        choices: jsPsych.NO_KEYS,
                        trial_duration: maskDuration,
                        on_finish: function () {
                            trialData.firstMaskEnd = performance.now();
                        }
                    });
                }



                // ISI grid
                timeline.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        trialData.ISIStart = performance.now();
                        const blankGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
                        return stage(renderGrid(blankGrid), '');
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: ISI,
                    on_finish: function () {
                        trialData.ISIEnd = performance.now();
                    }
                });

                // second grid
                timeline.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        trialData.secondStart = performance.now();
                        return stage(renderGrid(secondGrid), '');
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: secondGridDuration,
                    on_finish: function () {
                        trialData.secondEnd = performance.now();
                    }
                });

                // Optional mask after second grid
                if (secondGridMask) {

                    // brief blank grid before mask (optional)
                    if (blankBeforeMaskDuration > 0) {
                        timeline.push({
                            type: 'html-keyboard-response',
                            stimulus: function () {
                                trialData.secondPreMaskBlankStart = performance.now();
                                return stage(renderBlankGrid(), '');
                            },
                            choices: jsPsych.NO_KEYS,
                            trial_duration: blankBeforeMaskDuration,
                            on_finish: function () {
                                trialData.secondPreMaskBlankEnd = performance.now();
                            }
                        });
                    }

                    // mask grid
                    timeline.push({
                        type: 'html-keyboard-response',
                        stimulus: function () {
                            trialData.secondMaskStart = performance.now();
                            return stage(renderMaskGrid(), '');
                        },
                        choices: jsPsych.NO_KEYS,
                        trial_duration: maskDuration,
                        on_finish: function () {
                            trialData.secondMaskEnd = performance.now();
                        }
                    });
                }

                // response grid
                timeline.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        let gridHTML = '<div style="display: grid; grid-template-columns: repeat(' + gridSize + ', ' + cellSize + 'px);">';
                        for (let row = 0; row < gridSize; row++) {
                            for (let col = 0; col < gridSize; col++) {
                                gridHTML += `<div class="clickable-cell" data-row="${row + 1}" data-col="${col + 1}" style="width: ${cellSize}px; height: ${cellSize}px; border: 1px solid black; display: inline-block;"></div>`;
                            }
                        }
                        gridHTML += '</div>';
                        return stage(gridHTML, '');
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: null,
                    on_load: function () {
                        document.querySelectorAll('.clickable-cell').forEach(cell => {
                            cell.addEventListener('click', function () {
                                let selectedRow = parseInt(this.dataset.row);
                                let selectedCol = parseInt(this.dataset.col);
                                trialData.selectedLocation = selectedRow + ',' + selectedCol;
                                trialData.isCorrect = (trialData.trueLocation === trialData.selectedLocation);

                                // Update progress counters for both practice and main experiment
                                lastCorrect = trialData.isCorrect === true;
                                trialIndex += 1;
                                if (lastCorrect) correctSoFar += 1;

                                // Track block/trial numbers for the progress screen
                                lastBlockNumber = block + 1;
                                lastTrialInBlock = i + 1;

                                trialData.phase = "brockmole_response";
                                jsPsych.finishTrial(trialData);


                            });

                        });
                    }
                });

                // visual feedback for practice trials: show green correct, red chosen incorrect
                if (giveTrialFeedback) {
                    if (giveTrialFeedback) {
                        timeline.push({
                            type: 'html-keyboard-response',
                            stimulus: function () {
                                const last = jsPsych.data.getLastTrialData().values()[0]; // response trial

                                const [trueRow, trueCol] = last.trueLocation.split(',').map(Number);
                                let selRow = null;
                                let selCol = null;
                                if (last.selectedLocation) {
                                    [selRow, selCol] = last.selectedLocation.split(',').map(Number);
                                }

                                const isCorrect = last.isCorrect === true ||
                                    last.trueLocation === last.selectedLocation;

                                // Counters are updated in the response click handler (once per trial).
                                lastCorrect = isCorrect;
                                lastBlockNumber = last.blockNumber;
                                lastTrialInBlock = last.trialInBlock;



                                let gridHTML = '<div style="display: grid; grid-template-columns: repeat(' + gridSize + ', ' + cellSize + 'px);">';
                                for (let row = 1; row <= gridSize; row++) {
                                    for (let col = 1; col <= gridSize; col++) {
                                        gridHTML += '<div style="width: ' + cellSize + 'px; height: ' + cellSize + 'px; border: 1px solid black; display: flex; align-items: center; justify-content: center;">';

                                        // green dot at correct location
                                        if (row === trueRow && col === trueCol) {
                                            gridHTML += '<div style="width: ' + dotSize + 'px; height: ' + dotSize + 'px; border-radius: 50%; background-color: green;"></div>';
                                        }

                                        // red dot at chosen location, if incorrect
                                        if (!isCorrect && selRow === row && selCol === col) {
                                            gridHTML += '<div style="width: ' + dotSize + 'px; height: ' + dotSize + 'px; border-radius: 50%; background-color: red;"></div>';
                                        }


                                        gridHTML += '</div>';
                                    }
                                }
                                gridHTML += '</div>';

                                return stage(gridHTML, 'Press space to see your score.');
                            },
                            choices: [' ']
                        });
                    }
                }

                // text feedback screen
                timeline.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        const message = lastCorrect ? 'Correct!' : 'Incorrect.';

                        const totalTrials = numTrials;
                        const trialsCompleted = trialIndex;

                        const scoreText = 'Correct so far: ' + correctSoFar + ' / ' + trialsCompleted;
                        const progressText = 'Completed ' + trialsCompleted + ' / ' + totalTrials + ' trials';

                        const blockNumber = lastBlockNumber;
                        const trialsPerBlock = Math.ceil(numTrials / numBlocks);
                        const trialInBlock = lastTrialInBlock;
                        const blockText = 'Block ' + blockNumber + ' of ' + numBlocks +
                            ' (trial ' + trialInBlock + ' of ' + trialsPerBlock + ')';

                        return `
      <div style="font-size: 28px;">
        
        <p>${progressText}</p>
        <p>${blockText}</p>
        <p>Press space to continue.</p>
      </div>
    `;
                    },


                    choices: [' ']
                });



            }

            // break between blocks
            if (block < numBlocks - 1) {

                // For PRACTICE trials, show score and block info
                if (giveBlockFeedback) {
                    timeline.push({
                        type: 'html-keyboard-response',
                        stimulus: function () {
                            const blockNumber = lastBlockNumber;      // completed block
                            const totalBlocks = numBlocks;
                            const scoreText = 'Correct so far: ' + correctSoFar + ' / ' + trialIndex;

                            return `
        <div style="font-size: 24px;">
          <p>End of Block ${blockNumber} of ${totalBlocks}.</p>
          <p>${scoreText}</p>
          <p>Take a short break if you like.</p>
          <p>Press space to start the next block.</p>
        </div>
      `;
                        },
                        choices: [' ']
                    });

                } else {
                    // MAIN TASK: neutral break screen (no score, no correctness message)
                    timeline.push({
                        type: 'html-keyboard-response',
                        stimulus: function () {
                            const nextBlock = block + 2;
                            return `
        <div style="font-size: 24px;">
          <p>Take a short break if you like.</p>
          <p>Press space to start the next Block ${nextBlock}.</p>
        </div>
      `;
                        },
                        choices: [' ']
                    });
                }
            }

        }

        // return the timeline to be used by main.js
        return timeline;
    };

})(window);
