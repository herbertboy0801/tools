/**
 * app.js
 * Main application logic for the Sudoku game.
 * 
 * This file handles:
 * - DOM manipulation and event handling.
 * - Game state management (current puzzle, solution, selected cell).
 * - Interaction with the sudoku.js library.
 * - Timer, difficulty, and other UI updates.
 * - Save/Load game functionality using localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const boardElement = document.getElementById('sudoku-board');
    const numberPadElement = document.getElementById('number-pad');
    const timerElement = document.getElementById('timer');
    const completionElement = document.getElementById('completion');
    const difficultySelect = document.getElementById('difficulty-select');

    const newGameBtn = document.getElementById('btn-new-game');
    const hintBtn = document.getElementById('btn-hint');
    const showSolutionBtn = document.getElementById('btn-show-solution');
    const clearBtn = document.getElementById('btn-clear');
    const checkBtn = document.getElementById('btn-check');

    // Game State
    let puzzle = [];
    let solution = [];
    let userBoard = [];
    let selectedCell = { row: -1, col: -1, element: null };
    let timerInterval;
    let secondsElapsed = 0;
    let initialEmptyCells = 0;

    const createBoard = () => {
        boardElement.innerHTML = '';
        numberPadElement.innerHTML = '';

        // Create 81 cells for the board
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            const row = Math.floor(i / 9);
            const col = i % 9;
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add thicker borders for 3x3 boxes
            if ((col + 1) % 3 === 0 && col < 8) cell.classList.add('border-right');
            if ((row + 1) % 3 === 0 && row < 8) cell.classList.add('border-bottom');
            
            boardElement.appendChild(cell);
        }

        // Create number pad
        for (let i = 1; i <= 9; i++) {
            const numButton = document.createElement('div');
            numButton.classList.add('num');
            numButton.textContent = i;
            numButton.dataset.num = i;
            numberPadElement.appendChild(numButton);
        }
    };

    const startGame = (difficulty) => {
        stopTimer();
        secondsElapsed = 0;
        updateTimerDisplay();

        const gameData = sudoku.generate(difficulty);
        puzzle = gameData.puzzle;
        solution = gameData.solution;
        userBoard = JSON.parse(JSON.stringify(puzzle)); // Deep copy for user input

        initialEmptyCells = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                cell.textContent = userBoard[r][c] === 0 ? '' : userBoard[r][c];
                cell.classList.remove('fixed', 'error', 'selected', 'highlight');
                if (userBoard[r][c] !== 0) {
                    cell.classList.add('fixed');
                } else {
                    initialEmptyCells++;
                }
            }
        }
        updateCompletion();
        clearSave();
        startTimer();
    };

    const loadGame = (savedState) => {
        stopTimer();
        
        puzzle = savedState.puzzle;
        solution = savedState.solution;
        userBoard = savedState.userBoard;
        secondsElapsed = savedState.secondsElapsed;
        difficultySelect.value = savedState.difficulty;

        initialEmptyCells = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                 if(puzzle[r][c] === 0) initialEmptyCells++;
                const cell = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                cell.textContent = userBoard[r][c] === 0 ? '' : userBoard[r][c];
                cell.classList.remove('fixed', 'error', 'selected', 'highlight');
                if (puzzle[r][c] !== 0) {
                    cell.classList.add('fixed');
                }
            }
        }

        updateCompletion();
        startTimer();
    };

    // --- Timer ---
    const startTimer = () => {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    };

    const stopTimer = () => {
        clearInterval(timerInterval);
    };

    const updateTimerDisplay = () => {
        const minutes = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const seconds = (secondsElapsed % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    };

    // --- User Interaction ---
    const handleCellClick = (e) => {
        const cell = e.target.closest('.cell');
        if (!cell) return;

        // Deselect previous
        if (selectedCell.element) {
            selectedCell.element.classList.remove('selected');
        }
        document.querySelectorAll('.highlight').forEach(c => c.classList.remove('highlight'));

        // Select new
        selectedCell = {
            row: parseInt(cell.dataset.row),
            col: parseInt(cell.dataset.col),
            element: cell
        };
        cell.classList.add('selected');

        // Highlight row, col, and box
        highlightGroup(selectedCell.row, selectedCell.col);
    };
    
    const highlightGroup = (row, col) => {
        for(let i=0; i<9; i++) {
            boardElement.querySelector(`[data-row='${row}'][data-col='${i}']`).classList.add('highlight');
            boardElement.querySelector(`[data-row='${i}'][data-col='${col}']`).classList.add('highlight');
        }
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                boardElement.querySelector(`[data-row='${startRow+r}'][data-col='${startCol+c}']`).classList.add('highlight');
            }
        }
    };

    const handleNumberClick = (e) => {
        const num = e.target.closest('.num');
        if (!num || !selectedCell.element || selectedCell.element.classList.contains('fixed')) {
            return;
        }
        
        const value = parseInt(num.dataset.num);
        selectedCell.element.textContent = value;
        selectedCell.element.classList.remove('error');
        userBoard[selectedCell.row][selectedCell.col] = value;
        
        updateCompletion();
        saveGame();
        checkWin();
    };
    
    const handleClearClick = () => {
        if (!selectedCell.element || selectedCell.element.classList.contains('fixed')) return;
        
        selectedCell.element.textContent = '';
        selectedCell.element.classList.remove('error');
        userBoard[selectedCell.row][selectedCell.col] = 0;
        
        updateCompletion();
        saveGame();
    };

    const handleCheckClick = () => {
        let errors = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puzzle[r][c] === 0 && userBoard[r][c] !== 0) { // Check user-filled cells
                    const cell = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                    if (userBoard[r][c] !== solution[r][c]) {
                        cell.classList.add('error');
                        errors++;
                    } else {
                        cell.classList.remove('error');
                    }
                }
            }
        }
        if (errors === 0) alert('检查完毕，没有发现错误！');
    };

    const handleHintClick = () => {
        if (!selectedCell.element || selectedCell.element.classList.contains('fixed')) {
             alert('请先选择一个空格子！');
             return;
        }

        const { row, col } = selectedCell;
        if(userBoard[row][col] === 0) {
            const correctValue = solution[row][col];
            selectedCell.element.textContent = correctValue;
            userBoard[row][col] = correctValue;
            updateCompletion();
            saveGame();
            checkWin();
        } else {
            alert('这个格子已经有数字了。');
        }
    };
    
    const handleShowSolution = () => {
        stopTimer();
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                cell.textContent = solution[r][c];
                cell.classList.remove('error');
            }
        }
    };

    // --- Game Logic ---
    const updateCompletion = () => {
        let filledCount = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puzzle[r][c] === 0 && userBoard[r][c] !== 0) {
                    filledCount++;
                }
            }
        }
        const percentage = initialEmptyCells > 0 ? Math.floor((filledCount / initialEmptyCells) * 100) : 100;
        completionElement.textContent = `${percentage}%`;
    };
    
    const checkWin = () => {
        for(let r=0; r<9; r++){
            for(let c=0; c<9; c++){
                if(userBoard[r][c] === 0 || userBoard[r][c] !== solution[r][c]) {
                    return; // Not won yet
                }
            }
        }
        stopTimer();
        clearSave();
        setTimeout(() => alert(`恭喜你！你完成了数独，用时 ${timerElement.textContent}！`), 100);
    };

    // --- Save/Load ---
    const saveGame = () => {
        const gameState = {
            puzzle,
            solution,
            userBoard,
            secondsElapsed,
            difficulty: difficultySelect.value
        };
        localStorage.setItem('sudokuGame', JSON.stringify(gameState));
    };

    const clearSave = () => {
        localStorage.removeItem('sudokuGame');
    };

    const checkForSavedGame = () => {
        const savedStateJSON = localStorage.getItem('sudokuGame');
        if (savedStateJSON) {
            if (confirm('发现有未完成的游戏，要继续吗？')) {
                loadGame(JSON.parse(savedStateJSON));
            } else {
                clearSave();
                startGame(difficultySelect.value);
            }
        } else {
            startGame(difficultySelect.value);
        }
    };

    // --- Event Listeners ---
    boardElement.addEventListener('click', handleCellClick);
    numberPadElement.addEventListener('click', handleNumberClick);
    newGameBtn.addEventListener('click', () => {
        if(confirm('确定要开始新游戏吗？当前进度将不会被保存。')){
            startGame(difficultySelect.value);
        }
    });
    difficultySelect.addEventListener('change', () => {
        if(confirm('更改难度将开始一局新游戏，确定吗？')){
            startGame(difficultySelect.value);
        }
    });
    clearBtn.addEventListener('click', handleClearClick);
    checkBtn.addEventListener('click', handleCheckClick);

    hintBtn.addEventListener('click', handleHintClick);
    showSolutionBtn.addEventListener('click', () => {
        if(confirm('确定要显示答案吗？这将结束当前游戏。')){
            handleShowSolution();
        }
    });

    // --- Initial Setup ---
    createBoard();
    checkForSavedGame();
});