import { Engine } from './game/Engine.js';

const canvas = document.getElementById('gameCanvas');
const uiLayer = document.getElementById('ui-layer');
const mainMenu = document.getElementById('main-menu');
const gameHud = document.getElementById('game-hud');
const gameOverScreen = document.getElementById('game-over');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');

let engine;

function init() {
    engine = new Engine(canvas, {
        onGameOver: handleGameOver,
        onScoreUpdate: updateScore
    });

    // Event listeners for game state
    const btnNormal = document.getElementById('btn-normal');
    const btnHardcore = document.getElementById('btn-hardcore');
    const btnZen = document.getElementById('btn-zen');

    console.log('Buttons found:', { btnNormal, btnHardcore, btnZen });

    // Add click listeners with capture and debugging
    if (btnNormal) {
        btnNormal.addEventListener('click', (e) => {
            console.log('Normal button clicked', e);
            e.preventDefault();
            e.stopPropagation();
            startGame('NORMAL');
        }, true);

        btnNormal.addEventListener('touchstart', (e) => {
            console.log('Normal button touched', e);
            e.preventDefault();
            startGame('NORMAL');
        }, true);
    }

    if (btnHardcore) {
        btnHardcore.addEventListener('click', (e) => {
            console.log('Hardcore button clicked', e);
            e.preventDefault();
            e.stopPropagation();
            startGame('HARDCORE');
        }, true);

        btnHardcore.addEventListener('touchstart', (e) => {
            console.log('Hardcore button touched', e);
            e.preventDefault();
            startGame('HARDCORE');
        }, true);
    }

    if (btnZen) {
        btnZen.addEventListener('click', (e) => {
            console.log('Zen button clicked', e);
            e.preventDefault();
            e.stopPropagation();
            startGame('ZEN');
        }, true);

        btnZen.addEventListener('touchstart', (e) => {
            console.log('Zen button touched', e);
            e.preventDefault();
            startGame('ZEN');
        }, true);
    }

    // Keep spacebar for quick restart or default start
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') handleInput();
    });

    // Also add click listener to game over screen
    gameOverScreen.addEventListener('click', () => {
        if (gameState === 'GAMEOVER') {
            resetGame();
        }
    });
}

let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER

function handleInput() {
    if (gameState === 'MENU') {
        // Default to normal if space pressed
        startGame('NORMAL');
    } else if (gameState === 'GAMEOVER') {
        resetGame();
    }
}

function startGame(mode) {
    console.log('Starting game with mode:', mode);
    gameState = 'PLAYING';
    mainMenu.classList.remove('active');
    gameHud.classList.add('active');
    engine.start(mode);
}

function handleGameOver(score) {
    gameState = 'GAMEOVER';
    engine.stop();
    finalScoreEl.innerText = score;
    gameHud.classList.remove('active');
    gameOverScreen.classList.add('active');
}

function resetGame() {
    // Reload page for simplest reset or re-init engine
    window.location.reload();
}

function updateScore(score) {
    scoreEl.innerText = score;
}

init();
