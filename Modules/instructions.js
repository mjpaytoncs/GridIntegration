// modules/instructions.js

//PPPP   AAAAA  Y   Y  TTTTTT  OOOO   N   N
//P   P  A   A   Y Y     TT   O    O  NN  N
//PPPP   AAAAA    Y      TT   O    O  N N N
//P      A   A    Y      TT   O    O  N  NN
//P      A   A    Y      TT    OOOO   N   N

// Notes: 
// Instruction and practice flow for the Brockmole task
// modules/instructions.js
// Instruction and practice flow for the Brockmole task

(function (global) {
    global.Modules = global.Modules || {};

    global.Modules.instructions = function () {
        const timeline = [];

        // Use same defaults as the main Brockmole task
        const gridSize = BROCKMOLE_DEFAULTS.gridSize;
        const cellSize = BROCKMOLE_DEFAULTS.cellSize;
        const dotSize = BROCKMOLE_DEFAULTS.dotSize;

        // ---------- Helpers ----------

        function generateGrids() {
            // One location is empty in BOTH grids
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

            // Missing cell is from remainingCells, so it is not in either grid
            const missingCell = remainingCells.pop();

            const firstGrid = Array.from({ length: gridSize }, () =>
                Array(gridSize).fill(0)
            );
            firstGridCells.forEach(([i, j]) => {
                firstGrid[i - 1][j - 1] = 1;
            });

            const secondGrid = Array.from({ length: gridSize }, () =>
                Array(gridSize).fill(0)
            );
            remainingCells.forEach(([i, j]) => {
                secondGrid[i - 1][j - 1] = 1;
            });

            return { firstGrid, secondGrid, missingCell };
        }

        // Render a grid with optional dots and optional clickable cells
        function renderGridWithDots(grid, cellClass) {
            let html =
                '<div style="display: grid; grid-template-columns: repeat(' +
                gridSize +
                ', ' +
                cellSize +
                'px);">';

            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const hasDot = grid[row][col] === 1;
                    const cls = cellClass ? 'class="' + cellClass + '"' : "";
                    html +=
                        "<div " +
                        cls +
                        ' data-row="' +
                        (row + 1) +
                        '" data-col="' +
                        (col + 1) +
                        '" style="width: ' +
                        cellSize +
                        "px; height: " +
                        cellSize +
                        'px; border: 1px solid black; display: flex; align-items: center; justify-content: center;">';
                    if (hasDot) {
                        html +=
                            '<div style="width: ' +
                            dotSize +
                            "px; height: " +
                            dotSize +
                            'px; border-radius: 50%; background-color: black;"></div>';
                    }
                    html += "</div>";
                }
            }

            html += "</div>";
            return html;
        }

        // ---------- Multi-page written instructions (Next/Previous) ----------

        timeline.push({
            type: "instructions",
            pages: [
                `
        <div style="font-size: 26px;">
          <p>Welcome to the grid task.</p>
          <p>On each trial you will see two grids of circles.</p>
          <p>Your job is to find the one location that is empty in both grids.</p>
        </div>
        `,
                `
        <div style="font-size: 24px;">
          <p>Some squares have a circle in the first grid.</p>
          <p>Other squares have a circle in the second grid.</p>
          <p>There is only <strong>one</strong> square in each trial stays empty on both grids.</p>
          <p>On each trial, click on the square that was empty on <strong>both</strong> the first and second grids</p>
        </div>
        `,
                `
        <div style="font-size: 24px;">
          <p>First, you will practice with both grids on the screen at the same time.</p>
          <p>You can take as much time as you need.</p>
          <p>To respond, you will click directly on one of the squares in the grids.</p>
          <p>After practice, you will do a more challenging version of the task.</p>
        </div>
        `,
                `
        <div style="font-size: 24px;">
          <p>After each practice trial, you will see another grid with colored dots:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>A <strong>green</strong> dot marks the correct location that was empty in both grids.</li>
            <li>If you were wrong, a <strong>red</strong> dot marks the square you clicked.</li>
          </ul>
          <p>This feedback is only for practice, not for the main task.</p>
        </div>
        `
            ],
            show_clickable_nav: true,
            button_label_next: "Next",
            button_label_previous: "Previous"
        });

        // ---------- Stage A: 3 side-by-side practice trials (no timing) ----------

        let practiceSideIndex = 0;
        let practiceSideCorrect = 0;

        for (let t = 0; t < PRACTICE_SIDE_BY_SIDE.numTrials; t++) {
            const { firstGrid, secondGrid, missingCell } = generateGrids();
            const correctLocation = missingCell[0] + "," + missingCell[1];

            // Side-by-side grids, both clickable
            timeline.push({
                type: "html-keyboard-response",
                stimulus: (function () {
                    // Build HTML once for this trial
                    const grid1HTML = renderGridWithDots(firstGrid, "side-practice-cell");
                    const grid2HTML = renderGridWithDots(secondGrid, "side-practice-cell");

                    let html = `
            <div style="display: flex; justify-content: center; gap: 40px; align-items: center; margin-top: 20px;">
              <div>
                ${grid1HTML}
              </div>
              <div>
                ${grid2HTML}
              </div>
            </div>
            <p style="margin-top: 20px; font-size: 20px;">
              Click the one square that is empty in both grids.
            </p>
          `;
                    return html;
                })(),
                choices: jsPsych.NO_KEYS,
                trial_duration: null,
                on_load: function () {
                    const cells = document.querySelectorAll(".side-practice-cell");
                    cells.forEach(function (cell) {
                        cell.addEventListener("click", function () {
                            const selectedRow = parseInt(this.dataset.row, 10);
                            const selectedCol = parseInt(this.dataset.col, 10);
                            const selectedLocation = selectedRow + "," + selectedCol;
                            const isCorrect = selectedLocation === correctLocation;

                            practiceSideIndex += 1;
                            if (isCorrect) {
                                practiceSideCorrect += 1;
                            }

                            jsPsych.finishTrial({
                                practice: true,
                                practice_stage: "side_by_side",
                                trueLocation: correctLocation,
                                selectedLocation: selectedLocation,
                                isCorrect: isCorrect,
                                trialIndex: practiceSideIndex,
                                correctSoFar: practiceSideCorrect
                            });
                        });
                    });
                }
            });

            // Visual feedback for Stage A
            timeline.push({
                type: "html-keyboard-response",
                stimulus: function () {
                    const last = jsPsych.data.getLastTrialData().values()[0];
                    const isCorrect = last.isCorrect;
                    const trueLoc = last.trueLocation;
                    const selected = last.selectedLocation;
                    const trialIdx = last.trialIndex;
                    const correctSoFar = last.correctSoFar;

                    const partsTrue = trueLoc.split(",");
                    const trueRow = parseInt(partsTrue[0], 10);
                    const trueCol = parseInt(partsTrue[1], 10);

                    let selRow = null;
                    let selCol = null;
                    if (selected) {
                        const partsSel = selected.split(",");
                        selRow = parseInt(partsSel[0], 10);
                        selCol = parseInt(partsSel[1], 10);
                    }

                    let gridHTML =
                        '<div style="display: grid; grid-template-columns: repeat(' +
                        gridSize +
                        ", " +
                        cellSize +
                        'px); margin-bottom: 20px;">';

                    for (let row = 1; row <= gridSize; row++) {
                        for (let col = 1; col <= gridSize; col++) {
                            gridHTML +=
                                '<div style="width: ' +
                                cellSize +
                                "px; height: " +
                                cellSize +
                                'px; border: 1px solid black; display: flex; align-items: center; justify-content: center;">';

                            // green dot at correct location
                            if (row === trueRow && col === trueCol) {
                                gridHTML +=
                                    '<div style="width: ' +
                                    dotSize +
                                    "px; height: " +
                                    dotSize +
                                    'px; border-radius: 50%; background-color: green;"></div>';
                            }

                            // red dot at chosen location, if incorrect
                            if (!isCorrect && selRow === row && selCol === col) {
                                gridHTML +=
                                    '<div style="width: ' +
                                    dotSize +
                                    "px; height: " +
                                    dotSize +
                                    'px; border-radius: 50%; background-color: red;"></div>';
                            }

                            gridHTML += "</div>";
                        }
                    }
                    gridHTML += "</div>";

                    const msg = isCorrect ? "Correct!" : "Sorry, wrong location.";

                    return `
            <div style="font-size: 24px;">
              ${gridHTML}
              <p>${msg}</p>
              <p>Press space to continue.</p>
            </div>
          `;
                },
                choices: [" "]
            });
        }

        // ---------- Sequential practice version Instructions----------

        timeline.push({
            type: "instructions",
            pages: [
                `
        <div style="font-size: 24px;">
          <p>Now, you will practice the more challenging sequential version of the task.</p>
          <p>Press the spacebar to begin each trial.</p>
          <p>Once you do, the two grids will appear one after another. They will be <strong>very</strong> fast. </p>
          <p>After the second grid, you will click the one square that was empty in both grids.</p>
          <p>The idea is the same as the first practice set, only now, you have to combine the two images in your mind.</p>
        </div>
        `
            ],
            show_clickable_nav: true,
            button_label_next: "Start practice",
            button_label_previous: "Previous"
        });

        // ---------- Sequential practice trials with feedback ----------

        if (global.Modules && typeof global.Modules.task_brockmole === "function") {

            const practiceTimeline = global.Modules.task_brockmole(PRACTICE_SEQUENTIAL);
            timeline.push(...practiceTimeline);

        } else {
            console.warn(
                "Brockmole practice could not be added because Modules.task_brockmole is missing."
            );
        }

        // ---------- Final "ready" screen ----------

        timeline.push({
            type: "html-keyboard-response",
            stimulus: `
        <div style="font-size: 24px;">
          <p>You have finished the practice trials.</p>
          <p>The task will now begin.</p>
          <p>Remember, on every trial there is exactly one location that is empty in both grids.</p>
          <p>Click that always empty location as accurately as you can.</p>
          <p>Press space to begin the main task.</p>
        </div>
      `,
            choices: [" "]
        });

        return timeline;
    };
})(window);
