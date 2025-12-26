// main.js

//PPPP   AAAAA  Y   Y  TTTTTT  OOOO   N   N
//P   P  A   A   Y Y     TT   O    O  NN  N
//PPPP   AAAAA    Y      TT   O    O  N N N
//P      A   A    Y      TT   O    O  N  NN
//P      A   A    Y      TT    OOOO   N   N

// Notes:
// Assembles the experiment timeline and starts jsPsych

console.log('main.js loaded');

const timeline = [];

// --- Run/session identifiers ---
const run_id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const params = new URLSearchParams(window.location.search);

// Store these on every row automatically
// (this is huge for Prolific + MySQL later)
jsPsych.data.addProperties({
    run_id: run_id,
    prolific_pid: params.get("PROLIFIC_PID"),
    study_id: params.get("STUDY_ID"),
    session_id: params.get("SESSION_ID")
});

// --- Save-as-you-go queue (POST batches) ---
const SAVE_ENDPOINT = "save_data.php"; // later: your server route that writes to MySQL
let sendQueue = [];
let flushInProgress = false;

// Local crash-backup key
const BACKUP_KEY = `jspsych_backup_${run_id}`;

// Minimal backup: store the whole dataset every N important trials
let importantCount = 0;

function backupToLocalStorage() {
    try {
        const payload = {
            run_id,
            time: Date.now(),
            data: jsPsych.data.get().values()
        };
        localStorage.setItem(BACKUP_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn("localStorage backup failed:", e);
    }
}

async function flushQueue() {
    if (flushInProgress) return;
    if (sendQueue.length === 0) return;

    flushInProgress = true;

    // Send a copy, keep original until confirmed
    const batch = sendQueue.slice();

    try {
        const res = await fetch(SAVE_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                run_id,
                prolific_pid: params.get("PROLIFIC_PID"),
                study_id: params.get("STUDY_ID"),
                session_id: params.get("SESSION_ID"),
                rows: batch
            })
        });

        if (!res.ok) {
            throw new Error(`Save failed: HTTP ${res.status}`);
        }

        // On success, remove sent items
        sendQueue = sendQueue.slice(batch.length);
    } catch (err) {
        console.warn("Save-as-you-go flush failed (will retry):", err);
        // Keep queue for retry, and also keep local backup
        backupToLocalStorage();
    } finally {
        flushInProgress = false;
    }
}

//Instructions and Practice 
if (INCLUDE.instructions && !DEBUG_SKIP.instructions && typeof Modules !== 'undefined' && typeof Modules.instructions === 'function') {
    timeline.push(...Modules.instructions());
}

// Main Grid task
if (INCLUDE.brockmole && !DEBUG_SKIP.brockmole && typeof Modules !== 'undefined' && typeof Modules.task_brockmole === 'function') {
    timeline.push(...Modules.task_brockmole(BROCKMOLE_DEFAULTS));
} else {
    console.warn('Brockmole module not available or disabled.');
}

//VVIQ
if (INCLUDE.vviq && !DEBUG_SKIP.vviq && typeof Modules !== 'undefined' && typeof Modules.vviq === 'function') {
    timeline.push(...Modules.vviq());
}

jsPsych.init({
    display_element: 'jspsych-target',
    timeline: timeline,

    on_data_update: function (data) {
        // Only save the important stuff incrementally
        const isImportant =
            data.phase === "brockmole_response" ||
            data.phase === "vviq";

        if (!isImportant) return;

        sendQueue.push(data);
        importantCount += 1;

        // backup every 5 important rows
        if (importantCount % 5 === 0) {
            backupToLocalStorage();
        }

        // flush when queue reaches 5 rows
        if (sendQueue.length >= 5) {
            flushQueue();
        }
    },

    on_finish: async function () {
        console.log('Experiment finished');

        // Final backup and best-effort send
        backupToLocalStorage();
        await flushQueue();

        const data = jsPsych.data.get();

        // --- Download JSON ---
        const json = data.json();
        const jsonBlob = new Blob([json], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `grid_integration_${Date.now()}.json`;
        document.body.appendChild(jsonLink);
        jsonLink.click();
        document.body.removeChild(jsonLink);
        URL.revokeObjectURL(jsonUrl);

        // --- Download CSV ---
        const csv = data.csv();
        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `grid_integration_${Date.now()}.csv`;
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);

        // Redirect to debrief (preserve Prolific params)
        window.location.href = "consent_and_debriefing/debriefing.html" + window.location.search;
    }
});

