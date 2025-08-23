// modules/task_brockmole.js

(function (global) {
    if (!global.Modules) global.Modules = {};

    // CSS to lock layout 

    function ensureCSS() {
        const id = "brockmole-stage-css";
        if (document.getElementById(id)) return;
        const style = document.createElement("style");
        style.id = id;
        style.textContent = `
      html, body { height: 100%; margin: 0; }
      .stage {
        min-height: 90vh;
        display: flex; flex-direction: column;
        justify-content: center; align-items: center;
      }
      .grid-slot { position: relative; }
      .instr-slot {
        height: 48px; display:flex; align-items:center; justify-content:center;
        font-size:16px; line-height:1.2; visibility:hidden;
      }
      .instr-slot.has-text { visibility: visible; }
      #jspsych-target { text-align:left; margin:0 auto; }
    `;
        document.head.appendChild(style);
    }

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

    function renderGrid(grid, gridSize, cellSize, dotSize) {
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

    function generateGrids(gridSize) {
        let allCells = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                allCells.push([i + 1, j + 1]);
            }
        }
        allCells = jsPsych.randomization.shuffle(allCells);
        const half = Math.floor((gridSize * gridSize) / 2);
        const firstGridCells = allCells.slice(0, half);
        const remainingCells = allCells.slice(half);
        const missingCell = remainingCells.pop();

        const firstGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
        firstGridCells.forEach(([i, j]) => { firstGrid[i - 1][j - 1] = 1; });
        const secondGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
        remainingCells.forEach(([i, j]) => { secondGrid[i - 1][j - 1] = 1; });

        return { firstGrid, secondGrid, missingCell };
    }

    // Build timeline
    function task_brockmole(config = {}) {
        ensureCSS();

        const {
            gridSize = 4,
            cellSize = 171,
            dotSize = 143,
            ISI = 2000,
            firstGridDuration = 100,
            secondGridDuration = 100,
            numTrials = 15,
            numBlocks = 3,
            includeIntro = true,
            showFeedback = true,
            blockBreak = true
        } = config;

        const tl = [];

        if (includeIntro) {
            tl.push({
                type: 'html-keyboard-response',
                stimulus: '<h1>The main experiment will now begin. Press space to start.</h1>',
                choices: [' ']
            });
        }

        const trialsPerBlock = Math.ceil(numTrials / numBlocks);

        for (let block = 0; block < numBlocks; block++) {
            for (let i = 0; i < trialsPerBlock; i++) {
                const { firstGrid, secondGrid, missingCell } = generateGrids(gridSize);

                let trialData = {
                    trueLocation: missingCell.join(','),
                    gridSize, cellSize, dotSize, ISI,
                    firstGridDuration, secondGridDuration
                };

                // Trial-start screen (blank grid + space)
                tl.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        let gridHTML = '<div style="display: grid; grid-template-columns: repeat(' + gridSize + ', ' + cellSize + 'px);">';
                        for (let r = 0; r < gridSize; r++) {
                            for (let c = 0; c < gridSize; c++) {
                                gridHTML += `<div style="width: ${cellSize}px; height: ${cellSize}px; border: 1px solid black; display: inline-block;"></div>`;
                            }
                        }
                        gridHTML += '</div>';
                        return stage(gridHTML, 'Press space to begin this trial.');
                    },
                    choices: [' ']
                });

                // Array 1
                tl.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        trialData.firstStart = performance.now();
                        return stage(renderGrid(firstGrid, gridSize, cellSize, dotSize), '');
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: firstGridDuration,
                    on_finish: function () { trialData.firstEnd = performance.now(); }
                });

                // ISI
                tl.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        trialData.ISIStart = performance.now();
                        const blankGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
                        return stage(renderGrid(blankGrid, gridSize, cellSize, dotSize), '');
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: ISI,
                    on_finish: function () { trialData.ISIEnd = performance.now(); }
                });

                // Array 2
                tl.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        trialData.secondStart = performance.now();
                        return stage(renderGrid(secondGrid, gridSize, cellSize, dotSize), '');
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: secondGridDuration,
                    on_finish: function () { trialData.secondEnd = performance.now(); }
                });

                // Response grid
                tl.push({
                    type: 'html-keyboard-response',
                    stimulus: function () {
                        let gridHTML = '<div style="display: grid; grid-template-columns: repeat(' + gridSize + ', ' + cellSize + 'px);">';
                        for (let row = 0; row < gridSize; row++) {
                            for (let col = 0; col < gridSize; col++) {
                                gridHTML += `<div class="clickable-cell" data-row="${row + 1}" data-col="${col + 1}" style="width: ${cellSize}px; height: ${cellSize}px; border: 1px solid black; display: inline-block;"></div>`;
                            }
                        }
                        gridHTML += '</div>';
                        return stage(gridHTML, 'Click on the square that was missing.');
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: null,
                    on_load: function () {
                        document.querySelectorAll('.clickable-cell').forEach(cell => {
                            cell.addEventListener('click', function () {
                                let selectedRow = parseInt(this.dataset.row);
                                let selectedCol = parseInt(this.dataset.col);
                                trialData.selectedLocation = selectedRow + ',' + selectedCol;
                                jsPsych.finishTrial(trialData);
                            });
                        });
                    }
                });

                if (showFeedback) {
                    tl.push({
                        type: 'html-keyboard-response',
                        stimulus: function () {
                            const last = jsPsych.data.getLastTrialData().values()[0];
                            const isCorrect = last.trueLocation === last.selectedLocation;
                            return `<h1>${isCorrect ? "Yes, that was correct!" : "Sorry, that was incorrect!"} The missing location was ${last.trueLocation}, and you clicked ${last.selectedLocation}.</h1>`;
                        },
                        choices: jsPsych.NO_KEYS,
                        trial_duration: 2000
                    });
                }
            }

            if (block < numBlocks - 1 && blockBreak) {
                tl.push({
                    type: 'html-keyboard-response',
                    stimulus: '<h2>Take a short break! Press space when ready to continue.</h2>',
                    choices: [' ']
                });
            }
        }

        return tl;
    }

    global.Modules.task_brockmole = task_brockmole;

})(window);
