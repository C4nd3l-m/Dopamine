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
    // Simple "Swipe Up" simulation with click/touch for now
    document.addEventListener('click', handleInput);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') handleInput();
    });
}

let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER

function handleInput() {
    if (gameState === 'MENU') {
        startGame();
    } else if (gameState === 'GAMEOVER') {
        resetGame();
    }
}

function startGame() {
    gameState = 'PLAYING';
    mainMenu.classList.remove('active');
    gameHud.classList.add('active');
    engine.start();
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
