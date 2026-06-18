import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const videoElement = document.getElementById('webcam');
const drawingCanvas = document.getElementById('drawing-canvas');
const drawingCtx = drawingCanvas.getContext('2d');
const canvasContainer = document.getElementById('canvas-container');
const statusText = document.getElementById('status');

let handLandmarker = null;
let drawingUtils = null;

// --- VARIABEL THREE.JS ---
let scene, camera, renderer, cameraPivot;
let handCursor, blocksGroup;
const blocks = {};
let GRID_SIZE = 5; // Diubah jadi let agar bisa dinamis
let gridHelper;    // Tambahan untuk menyimpan objek garis grid
const VOXEL_SIZE = 1;

// --- STATUS GESTUR ---
let isAddingBlock = false;
let isDeletingBlock = false;

// TAMBAHKAN DUA BARIS INI:
let lastActionTime = 0;
const ACTION_COOLDOWN = 500; // Jeda 500 milidetik (0.5 detik)

// Variabel baru untuk fitur Grab & Drag (Rotasi)
let isDragging = false;
let dragPreviousX = 0;

// --- VARIABEL OPTIMASI KURSOR TANGAN KANAN ---
let smoothedX = 2.5; // Titik awal di tengah grid
let smoothedZ = 2.5;
const SMOOTHING_FACTOR = 0.15; // Semakin kecil = kursor makin halus tapi agak melayang (delay)

// --- VARIABEL GAME PUZZLE & LEVELING ---
let targetPuzzle = []; 
let targetBlocks = {}; 
let hasWon = false; 
let isTransitioning = false; // Kunci agar pemain tidak bisa pasang blok saat jeda level

// Variabel Waktu & Level
let currentLevel = 1;
let timeLeft = 30;
let timerInterval = null;

// --- SISTEM STATE GAME BARU ---
let gameState = "LOADING"; // Status: LOADING, WAITING, COUNTDOWN, PLAYING, TRANSITION

// 1. Fungsi Membuat Puzzle Random (Sistem Kluster & Grid Dinamis)
function generateRandomPuzzle(numBlocks) {
    // Rumus Luas Grid & Jumlah Kluster
    GRID_SIZE = Math.floor(currentLevel / 3) + 5;
    const numClusters = Math.floor(currentLevel / 5) + 1;

    targetPuzzle = [];
    const blocksSet = new Set();
    
    // Buat titik awal (bibit) untuk setiap kluster secara acak di dalam Grid
    for (let i = 0; i < numClusters; i++) {
        const startX = Math.floor(Math.random() * GRID_SIZE);
        const startZ = Math.floor(Math.random() * GRID_SIZE);
        const startKey = `${startX},0,${startZ}`;
        
        if (!blocksSet.has(startKey)) {
            blocksSet.add(startKey);
            targetPuzzle.push(startKey);
        }
    }

    const directions = [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }];
    
    // Kembangkan kluster secara acak sampai memenuhi target blok
    while (blocksSet.size < numBlocks) {
        // Pilih salah satu blok dari targetPuzzle yang sudah ada secara acak
        const randomExistingKey = targetPuzzle[Math.floor(Math.random() * targetPuzzle.length)];
        const [x, y, z] = randomExistingKey.split(',').map(Number);
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const newX = x + dir.dx;
        const newZ = z + dir.dz;
        
        // Pastikan tidak keluar dari batas GRID_SIZE yang baru
        if (newX >= 0 && newX < GRID_SIZE && newZ >= 0 && newZ < GRID_SIZE) {
            const newKey = `${newX},0,${newZ}`;
            if (!blocksSet.has(newKey)) {
                blocksSet.add(newKey);
                targetPuzzle.push(newKey);
            }
        }
    }
}

// 2. Fungsi Persiapan Level (Menu Start)
function startLevel() {
    gameState = "WAITING"; 
    clearInterval(timerInterval);
    
    // Bersihkan papan lama
    for (let key in blocks) { blocksGroup.remove(blocks[key]); delete blocks[key]; }
    for (let key in targetBlocks) { scene.remove(targetBlocks[key]); delete targetBlocks[key]; }

    // Buat puzzle baru (Level 1 = 4 blok, Level 2 = 5, dst)
    const numBlocks = currentLevel + 3;
    generateRandomPuzzle(numBlocks);
    
    // -- PERBARUI VISUAL GRID KE UKURAN BARU --
    if (gridHelper) scene.remove(gridHelper); // Hapus garis grid lama
    gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE); // Buat baru
    gridHelper.position.set(GRID_SIZE/2, 0, GRID_SIZE/2);
    scene.add(gridHelper);
    cameraPivot.position.set(GRID_SIZE/2, 0, GRID_SIZE/2); // Geser titik pusat kamera
    // -----------------------------------------

    targetPuzzle.forEach(key => {
        const coords = key.split(',').map(Number);
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE),
            new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 })
        );
        cube.position.set(coords[0] + 0.5, coords[1] + 0.5, coords[2] + 0.5);
        scene.add(cube);
        targetBlocks[key] = cube;
    });

    document.getElementById('level-text').innerText = `Level: ${currentLevel}`;
    document.getElementById('timer-text').innerText = `Waktu: 30s`;
    
    document.getElementById("center-overlay").style.display = "block";
    document.getElementById("overlay-title").innerText = `Level ${currentLevel}`;
    document.getElementById("overlay-desc").style.display = "block";
    document.getElementById("countdown-text").style.display = "none";
    
    statusText.innerText = "Menunggu Gestur Jempol (👍)...";
    statusText.style.color = "yellow";
}

// 3. Fungsi Hitung Mundur 3 Detik
function startCountdown() {
    if (gameState !== "WAITING") return;
    gameState = "COUNTDOWN"; // Ubah status agar jempol tidak terdeteksi berulang kali
    
    document.getElementById("overlay-desc").style.display = "none";
    const countdownEl = document.getElementById("countdown-text");
    countdownEl.style.display = "block";
    
    let count = 3;
    countdownEl.innerText = count;
    
    let countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.innerText = count;
        } else {
            clearInterval(countInterval);
            document.getElementById("center-overlay").style.display = "none";
            startGameplay();
        }
    }, 1000);
}

// 4. Fungsi Mulai Waktu Permainan 30 Detik
function startGameplay() {
    gameState = "PLAYING"; // Buka kunci permainan!
    statusText.innerText = "Mulai bangun! Waktu terus berjalan...";
    statusText.style.color = "white";
    
    timeLeft = 30;
    document.getElementById('timer-text').innerText = `Waktu: ${timeLeft}s`;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-text').innerText = `Waktu: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameState = "TRANSITION";
            statusText.innerText = "💥 Waktu Habis! Mengulang level... 💥";
            statusText.style.color = "red";
            setTimeout(() => { startLevel(); }, 3000);
        }
    }, 1000);
}

// 5. Logika Deteksi Jempol (Thumbs Up) yang Ketat
function isThumbsUp(landmarks) {
    // Ingat: Di layar komputer, nilai Y semakin KECIL berarti posisinya semakin ke ATAS.

    // 1. Cek postur jempol: Ujung (4) harus di atas sendi tengah (3), dan sendi tengah di atas pangkal (2)
    const thumbIsUp = landmarks[4].y < landmarks[3].y && landmarks[3].y < landmarks[2].y;

    // 2. Jempol WAJIB menjadi titik tertinggi dari seluruh bagian tangan
    // Kita bandingkan ujung jempol (4) dengan ujung jari lain dan pangkal jari (knuckles)
    const thumbIsHighest = landmarks[4].y < Math.min(
        landmarks[8].y, landmarks[12].y, landmarks[16].y, landmarks[20].y, // Ujung jari lain
        landmarks[5].y, landmarks[9].y, landmarks[13].y, landmarks[17].y   // Pangkal jari (MCP)
    );

    // 3. Keempat jari lainnya WAJIB mengepal
    // Syarat mengepal: Ujung jari (Tip) posisinya harus lebih Bawah (Y lebih besar) 
    // daripada pangkal jarinya (MCP) masing-masing.
    const indexFolded = landmarks[8].y > landmarks[5].y;
    const middleFolded = landmarks[12].y > landmarks[9].y;
    const ringFolded = landmarks[16].y > landmarks[13].y;
    const pinkyFolded = landmarks[20].y > landmarks[17].y;

    // Hanya kembalikan nilai TRUE jika SEMUA syarat di atas terpenuhi mutlak
    return thumbIsUp && thumbIsHighest && indexFolded && middleFolded && ringFolded && pinkyFolded;
}


// ==========================================
// --- INISIALISASI THREE.JS (3D) ---
// ==========================================
function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    cameraPivot = new THREE.Group();
    cameraPivot.add(camera);
    cameraPivot.position.set(GRID_SIZE/2, 0, GRID_SIZE/2);
    camera.lookAt(cameraPivot.position);
    scene.add(cameraPivot);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasContainer.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 5);
    scene.add(dirLight);
    blocksGroup = new THREE.Group();
    scene.add(blocksGroup);
    handCursor = new THREE.Mesh(
        new THREE.BoxGeometry(VOXEL_SIZE * 1.01, VOXEL_SIZE * 1.01, VOXEL_SIZE * 1.01),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.8 })
    );
    scene.add(handCursor);
    handCursor.visible = false;
}

// ===============================================
// --- RESIZE HANDLER (BIAR PUZZLE RESPONSIF) ---
// ===============================================
window.addEventListener('resize', () => {
    // 1. Perbarui Rasio Aspek Kamera (Lensa)
    camera.aspect = window.innerWidth / window.innerHeight;
    
    // 2. Terapkan pembaruan lensa agar tidak terdistorsi (mleyot)
    camera.updateProjectionMatrix();
    
    // 3. Perbarui ukuran resolusi Renderer (Canvas 3D)
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===========================================
// --- MEDIAPIPE CORE & SETUP DRAWING ---
// ===========================================
async function initializeMediaPipe() {
    statusText.innerText = "Memuat Model...";
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: `./hand_landmarker.task`, delegate: "GPU" },
        runningMode: "VIDEO", numHands: 2
    });
    drawingUtils = new DrawingUtils(drawingCtx);

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        videoElement.srcObject = stream;
        videoElement.addEventListener("loadeddata", () => {
            drawingCanvas.width = videoElement.videoWidth;
            drawingCanvas.height = videoElement.videoHeight;
            startLevel(); // <--- JALANKAN LEVEL
            animate();
        });
    }).catch((e) => console.error("Kamera Error:", e));
}

// ===============================================
// --- LOOP UTAMA ---
// ===============================================
function animate() {
    let startTimeMs = performance.now();
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    handCursor.visible = false; 

    if (handLandmarker && videoElement.currentTime > 0) {
        const results = handLandmarker.detectForVideo(videoElement, startTimeMs);
        
        if (results.landmarks) {
            let hasProcessedLeftHand = false;
            let hasProcessedRightHand = false;

            for (let i = 0; i < results.landmarks.length; i++) {
                const landmarks = results.landmarks[i];
                const handedness = results.handednesses[i][0].categoryName; 

                // DETEKSI JEMPOL JIKA SEDANG WAITING
                if (gameState === "WAITING" && isThumbsUp(landmarks)) {
                    startCountdown();
                }

                if (handedness === 'Right' && !hasProcessedLeftHand) {
                    hasProcessedLeftHand = true; 
                    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FFFF", lineWidth: 4 });
                    drawingUtils.drawLandmarks(landmarks, { color: "#FFFF00", lineWidth: 2, radius: 3 });
                    handleLeftHandRotation(landmarks);
                } 
                else if (handedness === 'Left' && !hasProcessedRightHand) {
                    hasProcessedRightHand = true; 
                    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#FF00FF", lineWidth: 4 });
                    drawingUtils.drawLandmarks(landmarks, { color: "#FFFF00", lineWidth: 2, radius: 3 });
                    handleRightHandBuilding(landmarks);
                }
            }
        }
    }
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
}

// ===============================================
// --- KONTROL TANGAN ---
// ===============================================
function handleLeftHandRotation(landmarks) {
    if (gameState !== "PLAYING" && gameState !== "WAITING") return; // Tetap bisa rotasi pas nunggu, asik kan?
    const wrist = landmarks[0], middleTip = landmarks[12], middleMCP = landmarks[9]; 
    const isGrabbing = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y) < (Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y) * 1.2);

    if (isGrabbing) {
        if (!isDragging) { isDragging = true; dragPreviousX = wrist.x; } 
        else { cameraPivot.rotation.y += (wrist.x - dragPreviousX) * 5; dragPreviousX = wrist.x; }
        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#FFA500", lineWidth: 6 });
    } else {
        isDragging = false; 
    }
}

function handleRightHandBuilding(landmarks) {
    if (gameState !== "PLAYING") return; // Kursor hilang jika belum PLAYING

    const thumb = landmarks[4], index = landmarks[8], ring = landmarks[16];
    let rawX = Math.max(0, Math.min(1, ((1 - index.x) - 0.2) / 0.6));
    let rawY = Math.max(0, Math.min(1, (index.y - 0.2) / 0.6));

    let localTarget = new THREE.Vector3((rawX - 0.5) * GRID_SIZE, 0, (rawY - 0.5) * GRID_SIZE);
    localTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraPivot.rotation.y);
    
    smoothedX += ((localTarget.x + (GRID_SIZE / 2)) - smoothedX) * SMOOTHING_FACTOR;
    smoothedZ += ((localTarget.z + (GRID_SIZE / 2)) - smoothedZ) * SMOOTHING_FACTOR;

    const snapX = Math.floor(smoothedX) + 0.5, snapZ = Math.floor(smoothedZ) + 0.5;
    
    if (snapX >= 0 && snapX <= GRID_SIZE && snapZ >= 0 && snapZ <= GRID_SIZE) {
        handCursor.visible = true;
        handCursor.position.set(snapX, 0.5, snapZ);
    }

    const indexPinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
    const ringPinchDist = Math.hypot(thumb.x - ring.x, thumb.y - ring.y);
    const currentTime = performance.now();
    const voxelX = Math.floor(smoothedX), voxelZ = Math.floor(smoothedZ);

    if (indexPinchDist < 0.05) {
        handCursor.material.color.setHex(0x0000ff); 
        if (!isAddingBlock && handCursor.visible && (currentTime - lastActionTime > ACTION_COOLDOWN)) {
            isAddingBlock = true; lastActionTime = currentTime; spawnBlock(voxelX, 0, voxelZ);
        }
    } else if (ringPinchDist < 0.085) {
        handCursor.material.color.setHex(0xff0000); 
        if (!isDeletingBlock && handCursor.visible && (currentTime - lastActionTime > ACTION_COOLDOWN)) {
            isDeletingBlock = true; lastActionTime = currentTime; removeBlock(voxelX, 0, voxelZ);
        }
    } else {
        if (indexPinchDist > 0.05 * 1.5 && ringPinchDist > 0.085 * 1.5) {
            handCursor.material.color.setHex(0x00ff00); isAddingBlock = false; isDeletingBlock = false;
        }
    }
}

function spawnBlock(x, y, z) {
    if (gameState !== "PLAYING") return; // Ekstra kunci
    const key = `${x},${y},${z}`;
    if (blocks[key]) return; 

    const cube = new THREE.Mesh(new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE), new THREE.MeshNormalMaterial());
    cube.position.set(x + 0.5, y + 0.5, z + 0.5);
    blocksGroup.add(cube); blocks[key] = cube;   
    checkGameStatus();
}

function removeBlock(x, y, z) {
    if (gameState !== "PLAYING") return; // Ekstra kunci
    const key = `${x},${y},${z}`;
    if (blocks[key]) {
        blocksGroup.remove(blocks[key]); delete blocks[key];             
        checkGameStatus();
    }
}

// PERBAIKAN TOTAL: Fungsi Check Win
function checkWinCondition() {
    const userKeys = Object.keys(blocks);
    if (userKeys.length !== targetPuzzle.length) return false;
    for (let i = 0; i < targetPuzzle.length; i++) {
        if (!blocks[targetPuzzle[i]]) return false; 
    }
    return true; 
}

function checkGameStatus() {
    if (gameState !== "PLAYING") return; 
    
    if (checkWinCondition()) {
        gameState = "TRANSITION"; // Ubah state! Waktu akan otomatis berhenti
        clearInterval(timerInterval); 
        
        statusText.innerText = `🎉 KEREN! Lanjut ke Level ${currentLevel + 1}! 🎉`;
        statusText.style.color = "#00FF00";
        
        // Jeda 3 detik, lalu level bertambah
        setTimeout(() => {
            currentLevel++;
            startLevel();
        }, 3000);
    }
}

initThree();
initializeMediaPipe();