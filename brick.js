let ball_x = 450;
let ball_y = 400;
let ball_r = 10;
let ball_color = "white";
let ball_image = null;
const initialLaunchSpeedX = 0;
const initialLaunchSpeedY = -7;
let ball_speed = 0;
let ball_speed_x = 0;
let countBallSpeedY = (speed, speed_x) => {
    let val = speed ** 2 - speed_x ** 2;
    if (val < 0) val = 0;  // 避免負數開根號
    return Math.sqrt(val);
}
let ball_speed_y =0
let hasWon = false;
//分數表
let playerLife = 5;
let score = 0;

let isBallLaunch = false;

let lifeStartTime = Date.now();  //初始遊玩時間

let paddle_width = 100;
let paddle_height = 10;
let paddle_high = 50;
let paddle_x = 450;


//brick
// ctx.fillStyle = "royalblue";
// ctx.fillRect(2, 2, 75, 25);
const brick_width = 101;
const brick_height = 30;
const brick_gap = 3;
const brick_col = 13;
const brick_row = 10;
let brick_grid = new Array(brick_col * brick_row);
let bricks_left = 0;







window.onload = () => {
    //background 設定
    let canvas = document.getElementById("gameCanvas");
    let ctx = canvas.getContext("2d");
    canvas.width = 1200;
    canvas.height = 800;

    const drawAll = () => {
        move();
        refresh();
        updateBallSpeedByTime();
        if (!hasWon && bricks_left <= 0) {
    checkWin();
}
        requestAnimationFrame(drawAll);
    }

    const refresh = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //刷新的background
        ctx.drawImage(document.getElementById("bgImage"), 0, 0, canvas.width, canvas.height);
        // ctx.fillStyle = "#111";
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        //ball
        makeBall(ball_x, ball_y, ball_r, ball_color)
        //paddle
        makePaddle(paddle_x, canvas.height - paddle_high, paddle_width, paddle_height);
        //line
        makeLine(0, 30, canvas.width, 30, "white");
        //分數
        drawscore();
        makeLifeWord(playerLife + "UP", 10, 25, "red");
        makePointWord("HIGH SCORE : ", 650, 25, "red", "30px Impact");
        //bricks
        makeBricks();
        drawParticles(ctx);  // 在最後面畫粒子，避免被遮蓋



        if (hasWon) {
            drawWinMessage();
        }
    }
    const move = () => {
        updateParticles();  // 更新粒子狀態（移動、壽命減少）
        actionPaddel = () => { // paddle和ball的座標
            let paddleTopEdgeY = canvas.height - paddle_high;
            let paddleButtomEdgeY = paddleTopEdgeY + paddle_height;
            let paddleLeftEdgeX = paddle_x;
            let paddleRightEdgeX = paddle_x + paddle_width;
            let ballTopEdgeY = ball_y - ball_r;
            let ballButtomEdgeY = ball_y + ball_r;
            let ballLeftEdgeX = ball_x - ball_r;
            let ballRightEdgeX = ball_x + ball_r;
            let nextBall_y = ball_y + ball_speed_y;
            let nextBallButtomEdgeY = nextBall_y + ball_r;
            //碰到paddle反彈
            if (nextBallButtomEdgeY >= paddleTopEdgeY &&
                ballButtomEdgeY <= paddleTopEdgeY &&
                ballRightEdgeX >= paddleLeftEdgeX &&
                ballLeftEdgeX <= paddleRightEdgeX
                && ball_speed_y > 0
            ) {


                let centerPaddle = paddle_x + paddle_width / 2;
                let ratio = (ball_x - centerPaddle) / (paddle_width * 0.51);
                ratio = Math.max(-1, Math.min(1, ratio));

                let speed = Math.sqrt(ball_speed_x ** 2 + ball_speed_y ** 2);
                ball_speed_x = speed * ratio;
                ball_speed_y = -countBallSpeedY(speed, ball_speed_x);
                if (Math.abs(ball_speed_x) > ball_speed) {
                    ball_speed_x = Math.sign(ball_speed_x) * ball_speed;
                }

                ball_y = paddleTopEdgeY - ball_r;


            }
        }

        actionBall = () => { //ball控制方向
            let maxSpeed = Math.max(Math.abs(ball_speed_x), Math.abs(ball_speed_y));
            let step = Math.ceil(maxSpeed);
            let stepBall_speed_x = ball_speed_x / step;
            let stepBall_speed_y = ball_speed_y / step;

            for (let i = 0; i < step; i++) {
                ball_x += stepBall_speed_x;
                ball_y += stepBall_speed_y;
                if (actionBrick()) break;
                actionPaddel();
            }

            if (ball_x < 0 + ball_r) { ball_x = ball_r; ball_speed_x *= -1; changeBallDirection(); }
            if (ball_x > canvas.width - ball_r) { ball_x = canvas.width - ball_r; ball_speed_x *= -1; changeBallDirection(); }
            if (ball_y < 30 + ball_r) { ball_y = 30 + ball_r; ball_speed_y *= -1; changeBallDirection(); }
            if (ball_y > canvas.height - ball_r) { resetBall(); loseLife(); }

            //球跟板子移動
            if (isBallLaunch == false) {
                ball_x = paddle_x + paddle_width / 2;
                ball_y = canvas.height  - paddle_high-ball_r;
            }
        }

        actionBrick = () => {
            let ballLeftBrickCol = Math.floor((ball_x - ball_r) / brick_width);
            let ballRightBrickCol = Math.floor((ball_x + ball_r) / brick_width);
            let ballTopBrickRow = Math.floor((ball_y - ball_r) / brick_height);
            let ballButtomBrickRow = Math.floor((ball_y + ball_r) / brick_height);

            let collided = false;
            let reflectX = false;
            let reflectY = false;

            let prevBall_x = ball_x - ball_speed_x;
            let prevBall_y = ball_y - ball_speed_y;
            let prevCol = Math.floor(prevBall_x / brick_width);
            let prevRow = Math.floor(prevBall_y / brick_height);

            for (let col = ballLeftBrickCol; col <= ballRightBrickCol; col++) {
                for (let row = ballTopBrickRow; row <= ballButtomBrickRow; row++) {
                    if (col >= 0 && col < brick_col && row >= 0 && row < brick_row) {
                        if (isBrickExist(col, row)) {
                            let ballBrickIndex = brickArreyIndex(col, row);
                            let life = brick_grid[ballBrickIndex];  // 先取生命值
                            let baseColor = getColorByLife(life);
                            let color = generateRandomColorNear(baseColor);
                            
                            let brickX = col * brick_width + brick_width / 2;
                            let brickY = row * brick_height + brick_height / 2;
                         

                            // 用當前磚塊生命值對應的顏色來產生粒子特效
                          spawnParticles(brickX, brickY, baseColor);


                            // 判斷反彈方向，只記錄一次
                            if (!collided) {
                                if (prevCol !== col && !isBrickExist(prevCol, row)) {
                                    reflectX = true;
                                }
                                if (prevRow !== row && !isBrickExist(col, prevRow)) {
                                    reflectY = true;
                                }
                                if (!reflectX && !reflectY) {
                                    reflectX = true;
                                    reflectY = true;
                                }
                            }

                            // 處理磚塊血量
                            if (typeof life === "number") {
                                brick_grid[ballBrickIndex] -= 1;

                                if (brick_grid[ballBrickIndex] <= 0) {
                                    brick_grid[ballBrickIndex] = 0;
                                    bricks_left--;


                                }
                                score += 100000000;
                                checkWin();
                                
                            }

                            collided = true;
                        }
                    }
                }
            }


            // 執行一次反彈
            if (collided) {
                reflectSpeed(reflectX, reflectY);
                return true;
            }

            return false;
        }


        actionPaddel();
        actionBall();
      


    }
    makePaddle = (x, y, width, height) => {
        let img = document.getElementById("paddleImage");
        ctx.drawImage(img, x, y, width, height);
    }

    makeRect = (topLeftX, topLeftY, boxwidth, boxheight, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(topLeftX, topLeftY, boxwidth, boxheight);
    }
    makeBall = (centerX, centerY, r, ball_color) => {
        if (ball_image?.complete) {
            // 建立裁切路徑（圓形）
            ctx.save(); // 儲存畫布狀態
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
            ctx.clip(); // 裁切成圓形區域

            // 繪製圖片
            ctx.drawImage(ball_image, centerX - r, centerY - r, r * 2, r * 2);

            ctx.restore(); // 還原畫布狀態
        } else {
            // fallback 圓形顯示
            ctx.fillStyle = ball_color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
            ctx.fill();
        }
    };


    const colorToImage = {
        white: "./img/ball_white.jpg",
        red: "./img/ball_red.jpg",
        blue: "./img/ball_blue.jpg",
        yellow: "./img/ball_yellow.jpg",
        green: "./img/ball_green.jpg",
        orange: "./img/ball_orange.jpg",
        black: "./img/ball_black.jpg",


    };



    makeLine = (beginX, beginY, endX, endY, color) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(beginX, beginY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    makeLifeWord = (text, beginX, beginY, color) => {
        ctx.font = "30px Impact"
        ctx.fillStyle = color;
        ctx.fillText(text, beginX, beginY);
    }
    makePointWord = (text, beginX, beginY, color, size) => {
        ctx.font = size;
        ctx.fillStyle = color;
        ctx.fillText(text, beginX, beginY);
    }
    mousepos = (event) => {
        let rect = canvas.getBoundingClientRect()
        let root = document.documentElement;
        let mouse_x = event.clientX - rect.left - root.scrollLeft;
        paddle_x = mouse_x - paddle_width / 2;
    }
    //球停板子上

    canvas.addEventListener("click", () => {
        if (isBallLaunch == false) {
            isBallLaunch = true;
          
        const angle = Math.PI /2; // 45度角（45度發射）

        ball_speed_x = Math.cos(angle) *ball_speed
        ball_speed_y = -Math.sin(angle) *ball_speed         // 負值代表往上
        }
    })

    resetBall = () => {
        //球停在板子上
        ball_x = paddle_x + paddle_width / 2;
        ball_y = canvas.height - paddle_height - paddle_high;
        ball_speed_x = 0;
        ball_speed_y = 0;
        isBallLaunch = false;


        if (playerLife < 0) {
            showGameOverScreen(score);  // 顯示結束畫面
            return;
        }
    }
    //重製磚頭
    resetBrick = () => {
        bricks_left = 0;
        for (let i = 0; i < brick_row * brick_col; i++) {

            if (Math.floor(i / brick_col) < 3) { brick_grid[i] = 0; }
            else {
                let life = Math.floor(Math.random() * 5) + 1;
                brick_grid[i] = life;
                bricks_left++;
                // console.log(`初始化 磚塊 ${i} 生命: ${brick_grid[i]}`);
            }
        }
    }
    resetBrick()
    //磚塊位置
    brickArreyIndex = (col, row) => { return col + brick_col * row }

    makeBricks = () => {

        for (let count_rows = 0; count_rows < brick_row; count_rows++) {
            for (let count_cols = 0; count_cols < brick_col; count_cols++) {
                let arrayIndex = brickArreyIndex(count_cols, count_rows);
                let life = brick_grid[arrayIndex];
                if (typeof life === "number" && life > 0) {
                    let imgID = "brickImage" + Math.min(life, 5)
                    let img = document.getElementById(imgID)
                    let brickX = brick_width * count_cols;
                    let brickY = brick_height * count_rows;
                    ctx.drawImage(
                        img,
                        brickX,
                        brickY,
                        brick_width - brick_gap,
                        brick_height - brick_gap
                    );

                }
            }
        }
    }



    isBrickExist = (col, row) => {
        if (
            col >= 0 && col < brick_col &&
            row >= 0 && row < brick_row) {
            let brickIndexUnderCoord = brickArreyIndex(col, row);
            return brick_grid[brickIndexUnderCoord] > 0;
        } else { return 0; }
    }


    function reflectSpeed(reverseX, reverseY) {
        // reverseX 和 reverseY 是布林，true 代表該方向反轉
        if (reverseX) ball_speed_x = -ball_speed_x;
        if (reverseY) ball_speed_y = -ball_speed_y;

        // 保持速度大小（理論上已保持，除非你另外改了速度大小）
        // 你也可以在這裡重新算一次速度大小，確保誤差不會累積
        let speed = Math.sqrt(ball_speed_x ** 2 + ball_speed_y ** 2);
        ball_speed = speed;  // 如果你有用這個變數紀錄速度大小
    }
    drawscore = () => {
        let scoreText = score.toString().padStart(10, "0");
        makePointWord(scoreText,850, 25, "white", "25px Impact");
    }

let autoSpeedEnabled = true;
    //改變遊戲進程球速
    updateBallSpeedByTime = () => {
          if (!autoSpeedEnabled) return;
        const maxSpeed = 20;
        const minSpeed = 8;
        const maxTimeSpeed = 60 * 1000;
        const elapsed = Date.now() - lifeStartTime;
        let ratio = Math.min(elapsed / maxTimeSpeed, 1);
        let newSpeed = minSpeed + (maxSpeed - minSpeed) * ratio;
        ball_speed = newSpeed;
        const angle = Math.atan2(ball_speed_y, ball_speed_x);
        ball_speed_y = ball_speed * Math.sin(angle);
        ball_speed_x = ball_speed * Math.cos(angle);


    }

    //改變球反彈角度
    changeBallDirection = () => {
        const angleChange = 0.1;
        //算出原本速度和角度
        let speedTotal = Math.sqrt(ball_speed_x ** 2 + ball_speed_y ** 2);
        let angle = Math.atan2(ball_speed_y, ball_speed_x);
        // 隨機調整角度
        angle += (Math.random() > 0.5 ? 1 : -1) * angleChange;

        // 先設方向為單位向量
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);

        // 再乘回原來的速度
        ball_speed_x = dx * speedTotal;
        ball_speed_y = dy * speedTotal;
    }

    loseLife = () => {

        playerLife--;
        lifeStartTime = Date.now();

        resetBall();
    }


    window.addEventListener('keydown', function (event) {
        if (event.code === 'Space') {
            event.preventDefault(); // 阻止預設的空白鍵捲動行為


        }
    });






    function showGameOverScreen(score) {
        document.getElementById("finalScore").textContent = score;
        document.getElementById("gameOverScreen").style.display = "flex";
    }

    window.restartGame = (resetScore = true) => {
        document.getElementById("gameOverScreen").style.display = "none";
        // 加上你的遊戲初始化邏輯
        
        if (resetScore) {
            playerLife = 5;
            score = 0;
        }

        resetBrick();
        resetBall();

    }



    document.getElementById('finalScore').textContent = score;
    window.saveScore = function (event) {
        event.preventDefault();//防表單跳轉頁面
        console.log("saveScore called");
        const nameInput = document.getElementById("playerName");
        const playerName = nameInput.value.trim();


        console.log("playerName:", playerName);
        console.log("score:", score);



        let leaderBoard = JSON.parse(localStorage.getItem("leaderBoard")) || [];
        leaderBoard.push({ name: playerName, score: score });
        leaderBoard.sort((a, b) => b.score - a.score);
        localStorage.setItem("leaderBoard", JSON.stringify(leaderBoard));

        console.log("leaderBoard saved:", leaderBoard);



        restartGame();


    }

    console.log(localStorage.getItem('leaderBoard'));



    function getColorByLife(life) {
        switch (life) {
            case 5: return "#00FF00";  // 綠色
        case 4: return "#FFC0CB";  // 粉紅色
        case 3: return "#0000FF";  // 藍色
        case 2: return "#FFFF00";  // 黃色
        case 1: return "#FF0000";  // 紅色
        default: return "#888888"; // 灰色
        }
    }



    // 套用設定按鈕
    window.applySettings = function () {
        autoSpeedEnabled = false;
        ball_r = parseInt(document.getElementById("ballRadiusInput").value);
        ball_r = Math.max(0, Math.min(ball_r, 50));
         ball_speed = parseInt(document.getElementById("ballSpeedInput").value);
        ball_speed = Math.max(1, Math.min(ball_speed, 50));
        playerLife = parseInt(document.getElementById("lifeInput").value);
        playerLife = Math.max(playerLife, 1);  // 生命至少 1
        paddle_width = parseInt(document.getElementById("paddleWidthInput").value);

        let selectedColor = document.querySelector(".color-box.selected")?.dataset.color || ball_color;
        ball_color = selectedColor;
        ball_image = new Image();
        ball_image.src = colorToImage[selectedColor];


        // 若球還沒發射，讓球位置更新
        if (!isBallLaunch) {
            ball_x = paddle_x + paddle_width / 2;
            ball_y = canvas.height - paddle_height - paddle_high - ball_r;
        }

if (isBallLaunch) {
    let angle = Math.atan2(ball_speed_y, ball_speed_x);
    ball_speed_x = Math.cos(angle) * ball_speed;
    ball_speed_y = Math.sin(angle) * ball_speed;
}

        document.getElementById("settingsPanel").style.display = "none"; // 關閉面板
    }






    document.querySelectorAll('.color-box').forEach(box => {
        box.addEventListener('click', () => {
            document.querySelectorAll('.color-box').forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
            document.getElementById('ballColorInput').value = box.dataset.color;
        });
    });



    requestAnimationFrame(drawAll);
    canvas.addEventListener("mousemove", mousepos);
    if (bricks_left == 0) { resetBrick(); }


    function checkWin() {
        
        if (bricks_left <= 0 && !hasWon) {
            hasWon = true;
            isBallLaunch = false;
            ball_speed_x = 0;
            ball_speed_y = 0;
          

            setTimeout(() => {
                hasWon = false
                restartGame(false);
            }, 3000);
        }
    }

    function drawWinMessage() {
        ctx.save();

        // 可愛配色 + 像素風字型
        ctx.fillStyle = "#ff69b4"; // 粉紅色
        ctx.strokeStyle = "#ffffff"; // 白色描邊
        ctx.lineWidth = 3;
        ctx.font = "48px 'Press Start 2P', cursive"; // 像素字型
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = " YOU WIN! ";

        // 先描邊
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
        // 再填色
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        ctx.restore();
    }

    document.getElementById("openSettings").addEventListener("click", () => {
        const panel = document.getElementById("settingsPanel");
        if (panel.style.display === "block") {
            panel.style.display = "none";  // 如果已開就關閉
        } else {
            panel.style.display = "block"; // 否則打開設定面板
        }
    });


    let particles = [];

    function spawnParticles(x, y, baseColor) {
        const particleCount = 10 + Math.floor(Math.random() * 10); // 10~19
        for (let i = 0; i < particleCount; i++) {
            let angle = Math.random() * 2 * Math.PI;
            let speed = Math.random() * 3 + 1;
            let size = Math.random() * 3 + 2;
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            let maxLife = Math.floor(Math.random() * 40) + 20; // 每個粒子的生命 20~59

            // 🌈 隨機顏色（彩色 or 類似 baseColor）
            let color = generateRandomColorNear(baseColor); // <- 新增這個函式

            particles.push({
                x,
                y,
                vx,
                vy,
                size,
                life: Math.floor(Math.random() * 40) + 30,
                maxLife,
                color
            });
        }
    }
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }
    function drawParticles(ctx) {
        for (let p of particles) {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
    function generateRandomColorNear(baseColor) {
        // baseColor 為像 "#FF0000"
        let r = parseInt(baseColor.substr(1, 2), 16);
        let g = parseInt(baseColor.substr(3, 2), 16);
        let b = parseInt(baseColor.substr(5, 2), 16);

        // 加一點隨機抖動
        r = Math.min(255, Math.max(0, r + (Math.random() * 120 - 60)));
        g = Math.min(255, Math.max(0, g + (Math.random() * 120 - 60)));
        b = Math.min(255, Math.max(0, b + (Math.random() * 120 - 60)));

        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }



}
