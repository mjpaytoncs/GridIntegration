// VVIQ Questionnaire

//PPPP   AAAAA  Y   Y  TTTTTT  OOOO   N   N
//P   P  A   A   Y Y     TT   O    O  NN  N
//PPPP   AAAAA    Y      TT   O    O  N N N
//P      A   A    Y      TT   O    O  N  NN
//P      A   A    Y      TT    OOOO   N   N

// Notes:
// VVIQ - Visual Vividness Imagery Questionnaire adapted from JM code
// vviq (vviq2 version): Marks, D. F. (1995). New directions for mental imagery research. Journal of Mental Imagery, 19(3-4), 153–167.
// here is the website https://davidfmarks.net/vividness-of-visual-imagery-questionnaire-2/


(function () {
    window.Modules = window.Modules || {};

    // --- VVIQ Items and Questions---
    
    // Scenes
    const vviqItems = [
        "Think of some relative or friend whom you frequently see (but who is not with you at present) and consider carefully the picture that comes before your mind's eye.",
        "Think of the rising sun. Consider carefully the picture that comes before your mind's eye.",
        "Think of the front of a shop which you often go to. Consider the picture that comes before your mind's eye.",
        "Finally, think of a country scene which involves trees, mountains and a lake. Consider the picture that comes before your mind's eye.",
    ];

    // Questions
    const vviqQuestions1 = [
        "1 The exact contour of face, head, shoulders and body.",
        "2 Characteristic poses of head, attitudes of body etc.",
        "3 The precise carriage, length of step, etc. in walking.",
        "4 The different colors worn in some familiar clothes."
    ];
    const vviqQuestions2 = [
        "5 The sun is rising above the horizon into a hazy sky.",
        "6 The sky clears and surrounds the sun with blueness.",
        "7 Clouds. A storm blows up, with flashes of lightening.",
        "8 A rainbow appears."
    ];
    const vviqQuestions3 = [
        "9 The overall appearance of the shop from the opposite side of the road.",
        "10 A window display including colors, shape and details of individual items for sale.",
        "11 You are near the entrance. The color, shape and details of the door.",
        "12 You enter the shop and go to the counter. The counter assistant serves you. Money changes hands."
    ];
    const vviqQuestions4 = [
        "13 The contours of the landscape.",
        "14 The color and shape of the trees.",
        "15 The color and shape of the lake.",
        "16 A strong wind blows on the tree and on the lake causing waves."
    ];

    const vviqQuestions = [vviqQuestions1, vviqQuestions2, vviqQuestions3, vviqQuestions4];

    const vviqOptions = [
        "1: No image at all, you only 'know' that you are thinking of the object.",
        "2: Vague and dim.",
        "3: Moderately clear and vivid.",
        "4: Clear and reasonably vivid.",
        "5: Perfectly clear and as vivid as normal vision."
    ];

    const vviqScores = [1, 2, 3, 4, 5];

    // --- Module function ---
    window.Modules.vviq = function () {
        

        let vviqPages = [];

        function generateQuestionsArray(questionIndex) {
            let vviqQuestionsArray = [];
            for (let i = 0; i < vviqQuestions[questionIndex].length; i++) {
                let question = {
                    prompt: vviqQuestions[questionIndex][i],
                    name: 'vviq_' + String(questionIndex * 4 + (i + 1)).padStart(2, '0'),
                    options: vviqOptions,
                    required: true
                };
                vviqQuestionsArray.push(question);
            }
            return vviqQuestionsArray;
        }

        for (let i = 0; i < vviqQuestions.length; i++) {
            let page = {
                type: 'survey-multi-choice', 
                preamble: "<div class='vviq_preamble'>" + vviqItems[i] + "</div>",
                questions: generateQuestionsArray(i),

                //Saving VVIQ Scores
                on_finish: function (data) {
                    data.phase = "vviq"; // Defines phase for incremental saving. 
                    let respObj = null;

                    if (data.response && typeof data.response === 'object') {
                        respObj = data.response;
                    } else if (data.responses && typeof data.responses === 'string') {
                        try {
                            respObj = JSON.parse(data.responses);
                        } catch (e) {
                            respObj = null;
                        }
                    }

                    // Compute numeric scores for the 4 items on this page
                    const pageItemKeys = [
                        'vviq_' + String(i * 4 + 1).padStart(2, '0'),
                        'vviq_' + String(i * 4 + 2).padStart(2, '0'),
                        'vviq_' + String(i * 4 + 3).padStart(2, '0'),
                        'vviq_' + String(i * 4 + 4).padStart(2, '0')
                    ];

                    let pageSum = 0;

                    if (respObj) {
                        pageItemKeys.forEach((key) => {
                            const opt = respObj[key];
                            const idx = vviqOptions.indexOf(opt);
                            const score = (idx >= 0) ? vviqScores[idx] : null;
                            data[key] = score;
                            if (typeof score === 'number') pageSum += score;
                        });
                    } else {
                        // if we failed to parse, still put placeholders
                        pageItemKeys.forEach((key) => { data[key] = null; });
                    }

                    data.vviq_page_index = i + 1;
                    data.vviq_page_sum = pageSum;

                    // keep a raw JSON string for safety
                    if (respObj) data.vviq_raw = JSON.stringify(respObj);
                },

                button_label: 'Continue'
            };
            vviqPages.push(page);
        }

        return vviqPages;
    };
})();
