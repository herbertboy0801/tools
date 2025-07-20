/**
 * Sudoku.js
 * A library for generating and solving Sudoku puzzles.
 * 
 * This file contains the core logic for:
 * 1. Generating a complete Sudoku solution.
 * 2. Creating a puzzle by removing numbers from the solution.
 * 3. Solving a given Sudoku puzzle using a backtracking algorithm.
 * 4. Validating puzzle states.
 */

const sudoku = (() => {

    const a = '123456789';

    // Fisher-Yates shuffle
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    let board;
    let solution;

    const generateBoard = () => {
        board = Array(9).fill(0).map(() => Array(9).fill(0));
        solution = Array(9).fill(0).map(() => Array(9).fill(0));
        
        const nums = shuffle(a.split(''));
        
        // Fill the diagonal 3x3 matrices
        for (let i = 0; i < 9; i = i + 3) {
            fillBox(i, i, nums);
        }

        // Solve the board to get a full solution
        solve(board);

        // Copy the solved board to solution
        for(let i=0; i<9; i++) {
            for(let j=0; j<9; j++) {
                solution[i][j] = board[i][j];
            }
        }
    };
    
    const fillBox = (row, col, nums) => {
        let n = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                board[row + i][col + j] = parseInt(nums[n++]);
            }
        }
    };

    const isValid = (board, row, col, num) => {
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num || board[x][col] === num) {
                return false;
            }
        }
        
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i + startRow][j + startCol] === num) {
                    return false;
                }
            }
        }
        
        return true;
    };

    const solve = (b) => {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (b[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValid(b, row, col, num)) {
                            b[row][col] = num;
                            if (solve(b)) {
                                return true;
                            } else {
                                b[row][col] = 0;
                            }
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    };

    const createPuzzle = (difficulty) => {
        generateBoard();
        let puzzle = JSON.parse(JSON.stringify(solution)); // Deep copy

        let attempts;
        if (difficulty === 'easy') attempts = 20;
        else if (difficulty === 'medium') attempts = 35;
        else if (difficulty === 'hard') attempts = 50;
        else attempts = 35; // Default to medium

        while (attempts > 0) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);

            if (puzzle[row][col] !== 0) {
                puzzle[row][col] = 0;
                attempts--;
            }
        }
        return { puzzle, solution };
    };


    /**
     * Public API
     */
    return {
        generate: createPuzzle,
        solve: (puzzle) => {
            let solved = JSON.parse(JSON.stringify(puzzle));
            solve(solved);
            return solved;
        },
        // A simple validation check for external use if needed
        isValid: isValid
    };

})();