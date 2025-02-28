# GridIntegration

## Overview
This repository contains a replication of **Brockmole et al. (2002)**, adapted to study **aphantasia**. The experiment is a visual working memory task where participants view two sequentially presented 4x4 grids with some filled squares. Their task is identifying the **one square** missing in **both** presentations.

This version has been implemented using **jsPsych** for **online data collection**.

## Experiment Details
- **Instructions**
- **Side by Side Grid** Practice
- **Sequential Grid** see a **first grid** with some filled squares.  
- After a brief **inter-stimulus interval (ISI)**, a **second grid** appears with a different arrangement of filled squares.  
- **Main Task:** Click the square that was not present in either grid.  
- **Post-Task Questionnaire:** Strategy use, perceived difficulty and confidence
- **VVIQ** Vividness Questionnaire - Aphantasia Society Version.
 - **Demographics Survey:** Age, gender, and visualization experiences.

## Setup Instructions

### 1. Clone the Repository

git clone https://github.com/mjpaytoncs/GridIntegration.git
cd GridIntegration

### 2. Install Dependencies
This experiment runs in a web browser. To test locally:
- Open `index.html` in any modern browser (Chrome, Firefox, Edge, etc.).
- Ensure **jsPsych (v6.3.1)** and its dependencies are correctly linked.

### 3. Running the Experiment
Launch `index.html` in your preferred browser. In Vscode, open with live server.

## File Structure
```
GridIntegration/
├── brockmole.html          # Main experiment file
├── jspsych-6.3.1/      # jsPsych library files
└── README.md           # Documentation
```

## Contributors
- **Michael Payton**  
- **Hakwan Lau** 
- **Jorge Morales**

## License
This project is open-source and follows the [MIT License](LICENSE).

## Acknowledgments
- Brockmole, J. R., Wang, R. F., & Irwin, D. E. (2002). Temporal integration between visual images and visual percepts. Journal of Experimental Psychology: Human Perception and Performance, 28(2), 315.
- Special thanks to **Hakwan Lau** and **Jorge Morales** for their support.