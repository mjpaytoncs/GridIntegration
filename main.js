// Build timeline using toggles from constants.js and modules in /modules

const timeline = [];

// Optional sections (placeholders now; swap with Jorge's real modules later)
if (INCLUDE.consent && !DEBUG_SKIP.consent && typeof Modules.consent === 'function') {
    timeline.push(...Modules.consent());
}
if (INCLUDE.instructions && !DEBUG_SKIP.instructions && typeof Modules.instructions === 'function') {
    timeline.push(...Modules.instructions());
}
if (INCLUDE.vviq && !DEBUG_SKIP.vviq && typeof Modules.vviq === 'function') {
    timeline.push(...Modules.vviq());
}

// Your Brockmole task (always last in this flow)
if (INCLUDE.brockmole && !DEBUG_SKIP.brockmole && typeof Modules.task_brockmole === 'function') {
    timeline.push(...Modules.task_brockmole(BROCKMOLE_DEFAULTS));
}

// === Initialize jsPsych (keeps your CSV download behavior) ===
jsPsych.init({
    timeline: timeline,
    on_finish: function () {
        const csvData = jsPsych.data.get().csv();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'experiment_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
