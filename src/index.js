import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import './styles.css';
import { setupScene } from './scenes/mainScene';

// Global game state
const gameState = {
    isLoading: true,
    scene: null,
    engine: null,
    camera: null,
    player: null,
    enemies: [],
    assets: {
        models: {},
        textures: {},
        sounds: {}
    },
    inputs: {
        keys: {},
        mouse: {
            x: 0,
            y: 0,
            leftButton: false,
            rightButton: false
        }
    }
};

// DOM elements
const canvas = document.getElementById('renderCanvas');
const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');

// Initialize game
function initGame() {
    // Create engine
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    gameState.engine = engine;

    // Loading screen event
    engine.loadingScreen = {
        displayLoadingUI: function() {
            loadingScreen.style.display = 'flex';
        },
        hideLoadingUI: function() {
            loadingScreen.style.display = 'none';
            gameState.isLoading = false;
        },
        loadingUIText: function(text) {
            loadingText.textContent = text;
        },
        loadingUIBackgroundColor: "black"
    };

    // Set up the main scene
    setupScene(gameState, engine, canvas).then(scene => {
        gameState.scene = scene;
        
        // Handle window resize
        window.addEventListener('resize', function() {
            engine.resize();
        });

        // Register render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    });
}

// Update loading progress
function updateLoadingProgress(progress) {
    loadingProgress.style.width = `${progress * 100}%`;
}

// Initialize game when DOM content is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Start loading
    loadingScreen.style.display = 'flex';
    updateLoadingProgress(0.1);
    
    // Simulate loading progress (will be replaced with actual asset loading later)
    let progress = 0.1;
    const loadingInterval = setInterval(() => {
        progress += 0.1;
        updateLoadingProgress(progress);
        
        if (progress >= 1) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                initGame();
            }, 500);
        }
    }, 300);
});