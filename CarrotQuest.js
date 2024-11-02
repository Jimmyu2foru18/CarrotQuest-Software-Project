// Canvas Setup
let board;
let context;

//Dynamic sizing
const boardWidth = window.innerWidth;
const boardHeight = window.innerHeight;

// Rabbit Properties
const rabbitWidth = 100;
const rabbitHeight = 100;
let rabbitX = boardWidth / 2 - rabbitWidth / 2;
let rabbitY = boardHeight * 3 / 8 - rabbitHeight;
let rabbitRightImg = new Image();
let rabbitLeftImg = new Image();
rabbitRightImg.src = "./rabbit-right.png";
rabbitLeftImg.src = "./rabbit-left.png";

let rabbit = {
    img: rabbitRightImg,
    x: rabbitX,
    y: rabbitY,
    width: rabbitWidth,
    height: rabbitHeight
};

// Physics and Movement
let velocityX = 0;
let velocityY = 0;
const PHYSICS = {
    JUMP_FORCE: -10.5,    
    GRAVITY: 0.08,         
    MOVE_SPEED: 6,         
    MAX_FALL_SPEED: 3.5,   
    ACCELERATION: 0.35,     
    DECELERATION: 0.15,    
    AIR_RESISTANCE: 0.99   
};


// Platform Properties
let platformArray = [];
const platformWidth = 450;
const platformHeight = 250;
let platformImg = new Image();
platformImg.src = "./platform.png";


// Obstacle Properties
let obstacleArray = [];
const obstacleWidth = 50;
const obstacleHeight = 50;
let obstacleImg = new Image();
obstacleImg.src = "./bomb.png";

// Game State Variables
let score = 0;
let maxScore = 0;
let gameOver = false;
let gameState = "menu";
let isPaused = false;
let lastPlatformTouched = null;

// Audio Setup
let bounceSound = new Audio('./audio2.mp3');
bounceSound.volume = 0.05; 

let backgroundMusic = new Audio('./audio1.mp3');
backgroundMusic.volume = 0.5; 
backgroundMusic.loop = true; 

// Add main menu music
let menuMusic = new Audio('./audio3.mp3');
menuMusic.volume = 0.7;
menuMusic.loop = true;

// Add a new function to toggle menu music
function toggleMenuMusic() {
    if (menuMusic.paused) {
        menuMusic.play();
        document.getElementById("menuMusicButton").textContent = "Stop Music";
    } else {
        menuMusic.pause();
        menuMusic.currentTime = 0;
        document.getElementById("menuMusicButton").textContent = "Play Music";
    }
}

// Add the event listener for the new button
document.getElementById("menuMusicButton").addEventListener("click", toggleMenuMusic);

// Viewport and Camera
const VIEWPORT_CENTER_Y = boardHeight * 0.4; 

// Movement Control Variables
let targetVelocityX = 0;
let isMoving = false;

// Animation Timing
const FRAME_TIME = 1000 / 60; 
let lastTime = performance.now(); 

// Event Listeners
document.getElementById("playButton").addEventListener("click", startGame);
document.getElementById("instructionButton").addEventListener("click", showInstructions);
document.getElementById("highScoreButton").addEventListener("click", showHighScores);
document.getElementById("closeInstructionButton").addEventListener("click", closeInstructions);
document.getElementById("closeHighScoreButton").addEventListener("click", closeHighScores);
document.getElementById("restartButton").addEventListener("click", resetGame);
document.getElementById("menuButton").addEventListener("click", returnToMenu);
document.getElementById("continueButton").addEventListener("click", unpauseGame);
document.getElementById("pauseInstructionButton").addEventListener("click", showPauseInstructions);
document.getElementById("pauseMenuButton").addEventListener("click", returnToMenu);
document.getElementById("exitButton").addEventListener("click", exitGame);
document.getElementById("exitGameOverButton").addEventListener("click", exitGame);
document.getElementById("closePauseInstructionButton").addEventListener("click", closePauseInstructions);


// Volume Control Event Listeners
document.getElementById("backgroundVolume").addEventListener("input", function(e) {
    const volume = e.target.value / 100;
    backgroundMusic.volume = volume;
    document.getElementById("backgroundVolumeValue").textContent = `${Math.round(volume * 100)}%`;
    localStorage.setItem('backgroundVolume', volume);
});

document.getElementById("bounceVolume").addEventListener("input", function(e) {
    const volume = e.target.value / 100;
    bounceSound.volume = volume;
    document.getElementById("bounceVolumeValue").textContent = `${Math.round(volume * 100)}%`;
    localStorage.setItem('bounceVolume', volume);
});

/**
 * Initializes and starts the game
 * Sets up the canvas, loads audio, and begins the game loop
 */
function startGame() {
    document.getElementById("menu_screen").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("board").style.display = "block";

    // Stop menu music and start game music
    menuMusic.pause();
    menuMusic.currentTime = 0;
    
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    gameState = "playing";
    resetGame();

    bounceSound.load();
    backgroundMusic.play();

    const savedBackgroundVolume = localStorage.getItem('backgroundVolume') || 0.1;
    const savedBounceVolume = localStorage.getItem('bounceVolume') || 0.05;

    backgroundMusic.volume = savedBackgroundVolume;
    bounceSound.volume = savedBounceVolume;

    document.getElementById("backgroundVolume").value = savedBackgroundVolume * 100;
    document.getElementById("bounceVolume").value = savedBounceVolume * 100;
    document.getElementById("backgroundVolumeValue").textContent = `${Math.round(savedBackgroundVolume * 100)}%`;
    document.getElementById("bounceVolumeValue").textContent = `${Math.round(savedBounceVolume * 100)}%`;

    lastTime = performance.now();
    requestAnimationFrame(update);
}

/**
 * Displays the instruction screen
 * Hides menu and shows instructions
 */
function showInstructions() {
    document.getElementById("menu_screen").style.display = "none";
    document.getElementById("instruction_screen").style.display = "flex";
}

/**
 * Displays the high scores screen
 * Hides menu and shows high scores
 */
function showHighScores() {
    document.getElementById("menu_screen").style.display = "none";
    document.getElementById("highScore_screen").style.display = "flex";
    loadHighScores();
}

/**
 * Main game loop
 * Handles physics, collisions, and rendering
 * @param {number} currentTime 
 */
function update(currentTime) {
    if (gameState !== "playing" || isPaused) {
        requestAnimationFrame(update);
        return;
    }

    currentTime = performance.now();
    
    const deltaTime = Math.min((currentTime - lastTime) / FRAME_TIME, 1.5);
    lastTime = currentTime;
    
    context.clearRect(0, 0, board.width, board.height);

    velocityY = Math.min(velocityY + PHYSICS.GRAVITY * deltaTime, PHYSICS.MAX_FALL_SPEED);
    velocityY *= Math.pow(PHYSICS.AIR_RESISTANCE, deltaTime);
    
    if (isMoving) {
        if (velocityX < targetVelocityX) {
            velocityX = Math.min(velocityX + PHYSICS.ACCELERATION, targetVelocityX);
        } else if (velocityX > targetVelocityX) {
            velocityX = Math.max(velocityX - PHYSICS.ACCELERATION, targetVelocityX);
        }
    } else {
        if (velocityX > 0) {
            velocityX = Math.max(0, velocityX - PHYSICS.DECELERATION);
        } else if (velocityX < 0) {
            velocityX = Math.min(0, velocityX + PHYSICS.DECELERATION);
        }
    }

    rabbit.x += velocityX * deltaTime;

    if (rabbit.x + rabbit.width < 0) {
        rabbit.x = boardWidth;
    } else if (rabbit.x > boardWidth) {
        rabbit.x = -rabbit.width;
    }

    rabbit.y += velocityY * deltaTime;

    let viewportAdjustment = 0;
    if (rabbit.y < VIEWPORT_CENTER_Y) {
        viewportAdjustment = VIEWPORT_CENTER_Y - rabbit.y;
        rabbit.y = VIEWPORT_CENTER_Y;
        
        for (let platform of platformArray) {
            platform.y += viewportAdjustment;
        }
        for (let obstacle of obstacleArray) {
            obstacle.y += viewportAdjustment;
        }
        
        score += Math.floor(viewportAdjustment * 0.25);
    }
    
    if (rabbit.y > boardHeight) {
        gameOver = true;
        gameState = "gameOver";
        document.getElementById("board").style.display = "none";
        document.getElementById("gameOverScreen").style.display = "block";
        document.getElementById("finalScore").textContent = score;
        document.getElementById("nameInput").focus();
        return;
    }

    context.drawImage(rabbit.img, rabbit.x, rabbit.y, rabbit.width, rabbit.height);
    
    for (let platform of platformArray) {
        context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);

        if (velocityY >= 0) {
            let rabbitBottom = rabbit.y + rabbit.height;
            let rabbitRight = rabbit.x + rabbit.width;
            let platformRight = platform.x + platform.width;
            
            let platformCenterY = platform.y + (platform.height / 2);
            
            let withinX = rabbit.x < platformRight && rabbitRight > platform.x;
            
            let properY = rabbitBottom >= platformCenterY - 10 && 
                         rabbitBottom <= platformCenterY + 15;
            
            if (withinX && properY) {
                rabbit.y = platformCenterY - rabbit.height;
                
                let speedBoost = Math.abs(velocityX) * 0.15;
                velocityY = PHYSICS.JUMP_FORCE - speedBoost;
                
                velocityX *= 0.95;
                
                let bounceClone = bounceSound.cloneNode(true);
                bounceClone.volume = bounceSound.volume;
                bounceClone.play();
            }
        }
    }

    for (let obstacle of obstacleArray) {
        context.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        if (detectCollision(rabbit, obstacle)) {
            gameOver = true;
            gameState = "gameOver";
            document.getElementById("board").style.display = "none";
            document.getElementById("gameOverScreen").style.display = "block";
            document.getElementById("scoreDisplay").textContent = score;
            return;
        }
    }

    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
        platformArray.shift();
        newPlatform();
    }

    while (obstacleArray.length > 0 && obstacleArray[0].y >= boardHeight) {
        obstacleArray.shift();
        newObstacle();
    }

    updateScore();
    context.fillStyle = "black";
    context.font = "16px sans-serif";
    context.fillText("Score: " + score, 5, 20);

    requestAnimationFrame(update);
}
/**
 * Handles keyboard input for rabbit movement
 * @param {KeyboardEvent} e
 */
function moveRabbit(e) {
    if (gameState !== "playing") return;

    switch (e.code) {
        case "ArrowRight":
        case "KeyD":
            targetVelocityX = PHYSICS.MOVE_SPEED;
            rabbit.img = rabbitRightImg;
            isMoving = true;
            break;
        case "ArrowLeft":
        case "KeyA":
            targetVelocityX = -PHYSICS.MOVE_SPEED;
            rabbit.img = rabbitLeftImg;
            isMoving = true;
            break;
    }
}

document.addEventListener("keydown", moveRabbit);

document.addEventListener("keyup", function(e) {
    if (gameState !== "playing") return;

    if (e.code == "ArrowRight" || e.code == "KeyD" || e.code == "ArrowLeft" || e.code == "KeyA") {
        targetVelocityX = 0;
        isMoving = false;
    }
});

/**
 * Resets the game state to initial values
 * Resets score, position, and recreates platforms
 */
function resetGame() {
    rabbit = {
        img: rabbitRightImg,
        x: rabbitX,
        y: rabbitY,
        width: rabbitWidth,
        height: rabbitHeight
    };

    velocityX = 0;
    targetVelocityX = 0;
    velocityY = PHYSICS.JUMP_FORCE;
    isMoving = false;
    score = 0;
    maxScore = 0;
    gameOver = false;
    gameState = "playing";
    isPaused = false;
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("board").style.display = "block";
    placePlatforms();
    placeObstacles();
    lastTime = performance.now();
    requestAnimationFrame(update);
    lastPlatformTouched = null;
}

/**
 * Returns to the main menu
 * Stops game loop and music, resets display states
 */
function returnToMenu() {
    gameState = "menu";
    gameOver = false;
    isPaused = false;
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("board").style.display = "none";
    document.getElementById("pauseMenu").style.display = "none";
    document.getElementById("pauseInstructionScreen").style.display = "none";
    document.getElementById("menu_screen").style.display = "flex";
    cancelAnimationFrame(update);
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    // Start menu music when returning to menu
    menuMusic.play();
}
/**
 * Creates initial platform layout
 * Places first set of platforms for game start
 */
function placePlatforms() {
    platformArray = [];
    
    const verticalSpacing = rabbitHeight;
    
    platformArray.push({
        img: platformImg,
        x: boardWidth / 2,
        y: boardHeight - 50,
        width: platformWidth,
        height: platformHeight
    });

    for (let i = 1; i < 6; i++) {
        let randomX = Math.floor(Math.random() * (boardWidth - platformWidth));
        platformArray.push({
            img: platformImg,
            x: randomX,
            y: boardHeight - verticalSpacing * i - platformHeight + 5,
            width: platformWidth,
            height: platformHeight
        });
    }
}

/**
 * Generates a new platform above the highest existing platform
 * Called when platforms move off screen
 */
function newPlatform() {
    let lastPlatformY = platformArray[platformArray.length - 1].y;
    let randomX = Math.floor(Math.random() * (boardWidth - platformWidth));
    
    platformArray.push({
        img: platformImg,
        x: randomX,
        y: lastPlatformY - platformHeight - Math.random() * 80, 
        width: platformWidth,
        height: platformHeight
    });
}

/**
 * Creates initial obstacle layout
 * Places first set of obstacles for game start
 */
function placeObstacles() {
    obstacleArray = [];

    const verticalSpacing = boardHeight * 4;

    for (let i = 0; i < 2; i++) {
        let randomX = Math.floor(Math.random() * (boardWidth - obstacleWidth));
        obstacleArray.push({
            img: obstacleImg,
            x: randomX,
            y: boardHeight - verticalSpacing * i - obstacleHeight,
            width: obstacleWidth,
            height: obstacleHeight
        });
    }
}

/**
 * Generates a new obstacle above the highest existing obstacle
 * Called when obstacles move off screen
 */
function newObstacle() {
    let lastObstacleY = obstacleArray[obstacleArray.length - 1].y;
    let randomX = Math.floor(Math.random() * (boardWidth - obstacleWidth));

    obstacleArray.push({
        img: obstacleImg,
        x: randomX,
        y: lastObstacleY - obstacleHeight * 12,
        width: obstacleWidth,
        height: obstacleHeight
    });
}

/**
 * Checks for collision between two objects
 * @param {Object} a 
 * @param {Object} b 
 * @returns {boolean} 
 */
function detectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

/**
 * Updates the game score
 * Adds points based on platform bounces and height gained
 */
function updateScore() {
    if (rabbit.y < boardHeight * 3/4 && velocityY < 0) {
        let currentPlatform = platformArray.find(platform => 
            rabbit.y + rabbit.height >= platform.y && 
            rabbit.y + rabbit.height <= platform.y + 10 && 
            rabbit.x + rabbit.width > platform.x && 
            rabbit.x < platform.x + platform.width
        );

        if (currentPlatform && currentPlatform !== lastPlatformTouched) {
            score += 1;
            lastPlatformTouched = currentPlatform;
        }
    }
}
/**
 * Pauses the game
 * Stops game loop and shows pause menu
 */
function pauseGame() {
    if (gameState === "playing") {
        isPaused = true;
        gameState = "paused";
        document.getElementById("pauseMenu").style.display = "flex";
        backgroundMusic.pause();
        lastTime = 0; // Reset the time
    }
}

/**
 * Resumes the game from pause
 * Restarts game loop and hides pause menu
 */
function unpauseGame() {
    if (gameState === "paused") {
        isPaused = false;
        gameState = "playing";
        document.getElementById("pauseMenu").style.display = "none";
        lastTime = 0; // Reset the time
        requestAnimationFrame(update);
        backgroundMusic.play();
    }
}

/**
 * Shows instruction screen from pause menu
 */
function showPauseInstructions() {
    document.getElementById("pauseMenu").style.display = "none";
    document.getElementById("pauseInstructionScreen").style.display = "block";
}

/**
 * Closes instruction screen and returns to pause menu
 */
function closePauseInstructions() {
    document.getElementById("pauseInstructionScreen").style.display = "none";
    document.getElementById("pauseMenu").style.display = "flex";
}

/**
 * Attempts to close the game window
 */
function exitGame() {
    window.close();

    window.location.href = "about:blank";
}

/**
 * Closes the instruction screen
 * Returns to either pause menu or main menu depending on game state
 */
function closeInstructions() {
    document.getElementById("instruction_screen").style.display = "none";
    if (gameState === "paused") {
        document.getElementById("pauseMenu").style.display = "flex";
    } else {
        document.getElementById("menu_screen").style.display = "flex";
    }
}
/**
 * Closes the high score screen
 * Returns to main menu
 */
function closeHighScores() {
    document.getElementById("highScore_screen").style.display = "none";
    document.getElementById("menu_screen").style.display = "flex";
}

document.addEventListener("keydown", function(e) {
    if (e.code === "KeyP") {
        if (gameState === "playing") {
            pauseGame();
        } else if (gameState === "paused") {
            unpauseGame();
        }
    }
});

/*
async function checkHighScore(score) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ score: score })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.isHighScore) {
            promptForPlayerName(score);
        }
    } catch (error) {
        console.error('Error checking high score:', error);
    }
}

*/
function promptForPlayerName(score) {
    // Create a modal dialog for name input
    const modalHtml = `
        <div id="nameInputModal" class="modal">
            <div class="modal-content">
                <h2>New High Score!</h2>
                <p>Your score: ${score}</p>
                <input type="text" id="playerNameInput" 
                    maxlength="50" 
                    placeholder="Enter your name"
                    autocomplete="off">
                <div class="button-container">
                    <button id="submitNameButton">Submit</button>
                    <button id="cancelNameButton">Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('nameInputModal');
    const input = document.getElementById('playerNameInput');
    const submitBtn = document.getElementById('submitNameButton');
    const cancelBtn = document.getElementById('cancelNameButton');

    // Show modal and focus input
    modal.style.display = 'flex';
    input.focus();

    // Handle submit button click
    submitBtn.addEventListener('click', () => {
        const playerName = input.value.trim();
        if (playerName) {
            saveHighScore(playerName, score);
            modal.remove();
        } else {
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 500);
        }
    });

    // Handle cancel button click
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    // Handle enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });
}
/*
async function saveHighScore(playerName, score) {
    try {
        const response = await fetch('/api/highscores.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerName: playerName,
                score: score
            })
        });

        const data = await response.json();
        
        if (data.success) {
            await loadHighScores();
            return data;
        } else {
            throw new Error(data.error || 'Failed to save score');
        }
    } catch (error) {
        console.error('Error saving high score:', error);
        throw error;
    }
}
*/
/*
async function loadHighScores() {
    try {
        const response = await fetch(API_URL);
        
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const highScores = await response.json();
        console.log('Received high scores:', highScores);
        
        const highScoresList = document.getElementById('highScoresList');
        if (!highScoresList) {
            console.error('Could not find highScoresList element');
            return;
        }
        
        highScoresList.innerHTML = '';
        
        if (highScores.length === 0) {
            highScoresList.innerHTML = '<li>No high scores yet!</li>';
            return;
        }
        
        highScores.forEach((score, index) => {
            console.log(`Adding score: ${score.player_name} - ${score.score}`);
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${score.player_name} - ${score.score}`;
            highScoresList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading high scores:', error);
        // Add user-friendly error message
        const highScoresList = document.getElementById('highScoresList');
        highScoresList.innerHTML = '<li>Unable to load high scores. Please try again later.</li>';
    }
}
*/
/*
function submitScore() {
    const nameInput = document.getElementById("nameInput");
    const playerName = nameInput.value.trim();
    const submitButton = document.getElementById("submitScoreButton");
    
    if (!playerName) {
        nameInput.classList.add('error');
        setTimeout(() => nameInput.classList.remove('error'), 500);
        return;
    }

    // Disable button while submitting
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    saveHighScore(playerName, score).then(response => {
        if (response.nameTaken) {
            // If name is taken, show error and re-enable button
            nameInput.classList.add('error');
            nameInput.placeholder = "Name already taken!";
            submitButton.disabled = false;
            submitButton.textContent = "Submit Score";
            nameInput.value = '';
            nameInput.focus();
        } else {
            // Success
            nameInput.value = '';
            nameInput.placeholder = "Score submitted! Try another name?";
            submitButton.disabled = false;
            submitButton.textContent = "Submit Again";
        }
    }).catch(error => {
        console.error('Error:', error);
        submitButton.disabled = false;
        submitButton.textContent = "Try Again";
    });
}

document.getElementById("submitScoreButton").addEventListener("click", submitScore);
*/
document.getElementById("nameInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        submitScore();
    }
});


