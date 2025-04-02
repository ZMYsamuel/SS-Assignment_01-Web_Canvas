// Get canvas and its context
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Get sliders for color selection
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
const colorPicker = document.getElementById('colorPicker');

// Font settings
const fontSelect = document.getElementById('fontSelect');
const fontSizeInput = document.getElementById('fontSize');

// Tool buttons
const toolButtons = document.querySelectorAll('.tool-btn');
const brushBtn = document.getElementById('brushBtn');
const eraserBtn = document.getElementById('eraserBtn');
const textBtn = document.getElementById('textBtn');
const lineBtn = document.getElementById('lineBtn');
const circleBtn = document.getElementById('circleBtn');
const rectangleBtn = document.getElementById('rectangleBtn');
const triangleBtn = document.getElementById('triangleBtn');
const fillCheckbox = document.getElementById('fillCheckbox');

// Action buttons
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');

// State variables
let isDrawing = false;
let isErasing = false;
let isTextMode = false;
let selectedTool = 'brush';
let startX, startY;
let history = [];
let historyStep = 0;
let canvasImage; //Store the image.
let drawingTimeout; // Add this line
let textInput;
let fontSize = fontSizeInput.value;
let font = fontSelect.value;

// Initialize the canvas and tools on page load
window.onload = function () {
  ctx.fillStyle = colorPicker.value;
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = brushSizeSlider.value;
  ctx.globalAlpha = opacitySlider.value;
  saveCanvasState();
  initEventHandlers();
  updateCursorStyle(); // Initialize cursor style
  canvas.style.cursor = getCursorStyle(selectedTool);
};

// Function to initialize event handlers
function initEventHandlers() {
  // Event listeners for canvas
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mousemove', draw);

  // Event listeners for color and brush size
  brushSizeSlider.addEventListener('input', updateBrushSize);
  opacitySlider.addEventListener('input', updateOpacity);
  colorPicker.addEventListener('change', updateColor);

  // Event listeners for font settings
  fontSelect.addEventListener('change', () => {
    font = fontSelect.value;
  });
  fontSizeInput.addEventListener('input', () => {
    fontSize = fontSizeInput.value;
  });

  // Event listeners for tool buttons
  toolButtons.forEach(button => {
    button.addEventListener('click', selectTool);
  });

  // Event listeners for action buttons
  clearBtn.addEventListener('click', clearCanvas);
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  downloadBtn.addEventListener('click', downloadCanvas);
  uploadBtn.addEventListener('change', uploadCanvas);

  // Add event listeners for predefined color buttons
  const colorButtons = document.querySelectorAll('.color-btn');
  colorButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const selectedColor = event.target.dataset.color;
      colorPicker.value = selectedColor; // Update the color picker value
      updateColor(); // Update the canvas color
      updateCursorStyle(); // Update the custom cursor color
      colorButtons.forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      colornowElement.classList.remove('active');
    });
  });

  // 設置黑色按鈕為 active
  const defaultColorButton = document.querySelector('.color-btn[data-color="#000000"]');
  if (defaultColorButton) {
    defaultColorButton.classList.add('active');
  }
}

// Function to update the current drawing color
function updateColor() {
  ctx.fillStyle = colorPicker.value;
  ctx.strokeStyle = colorPicker.value;
}

// Function to update the brush size
function updateBrushSize() {
  ctx.lineWidth = brushSizeSlider.value;
  brushSizeValue.textContent = brushSizeSlider.value;
}
// Function to update the opacity
function updateOpacity() {
  ctx.globalAlpha = opacitySlider.value;
  opacityValue.textContent = opacitySlider.value;
}

// Function to select the drawing tool
function selectTool(event) {
  selectedTool = event.target.dataset.tool;
  toolButtons.forEach(button => {
    button.classList.remove('active');
  });
  event.target.classList.add('active');

  isErasing = selectedTool === 'eraser';
  isTextMode = selectedTool === 'text';

  canvas.style.cursor = getCursorStyle(selectedTool);
}

function getCursorStyle(tool) {
  switch (tool) {
    case 'brush': return "url('./img/brush_cursor.png') 10 56, auto";
    case 'eraser': return "url('./img/eraser_cursor.png') 10 56, auto";
    case 'text': return "url('./img/text_cursor.png') 32 40, auto";
    case 'line': return "url('./img/line_cursor.png') 32 32, auto";
    case 'circle': return "url('./img/circle_cursor.png') 32 32, auto";
    case 'rectangle': return "url('./img/rectangle_cursor.png') 32 32, auto";
    case 'triangle': return "url('./img/triangle_cursor.png') 32 32, auto";
    default: return 'crosshair';
  }
}

// Function to handle the start of a drawing action
function startDrawing(event) {
  isDrawing = true;
  startX = event.offsetX;
  startY = event.offsetY;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  event.preventDefault();

  if (selectedTool === 'text') {
    const input = createTextInput();
    input.focus();
    stopDrawing();
  }
}

// Function to handle the end of a drawing action
function stopDrawing() {
  isDrawing = false;
  // ctx.closePath();
  saveCanvasState();
  if (drawingTimeout) {
    clearTimeout(drawingTimeout);
  }
}

// Function to handle the drawing action
function draw(event) {
  if (!isDrawing) return;

  const x = event.offsetX;
  const y = event.offsetY;

  switch (selectedTool) {
    case 'brush':
      if (opacityValue.textContent == 1) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      else {
        ctx.beginPath(); // 每次繪製新的一段筆畫
        ctx.moveTo(startX, startY); // 確保從上一點開始
        ctx.lineTo(x, y);
        ctx.stroke();
        startX = x; // 更新起點
        startY = y;
      }
      break;
    case 'eraser':
      ctx.globalCompositeOperation = 'destination-out'; // Use destination-out for erasing
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; // Reset to default
      break;
    case 'line':
      // Use a timeout to delay the drawing and show preview
      if (drawingTimeout) {
        clearTimeout(drawingTimeout);
      }
      drawingTimeout = setTimeout(() => {
        restoreCanvasState(); // Restore the initial state
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }, 10);
      break;
    case 'circle':
      if (drawingTimeout) {
        clearTimeout(drawingTimeout);
      }
      drawingTimeout = setTimeout(() => {
        restoreCanvasState();
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        if (fillCheckbox.checked) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }, 10);
      break;
    case 'rectangle':
      if (drawingTimeout) {
        clearTimeout(drawingTimeout);
      }
      drawingTimeout = setTimeout(() => {
        restoreCanvasState();
        const width = x - startX;
        const height = y - startY;
        ctx.beginPath();
        if (fillCheckbox.checked) {
          ctx.fillRect(startX, startY, width, height);
        } else {
          ctx.strokeRect(startX, startY, width, height);
        }
      }, 10);
      break;
    case 'triangle':
      if (drawingTimeout) {
        clearTimeout(drawingTimeout);
      }
      drawingTimeout = setTimeout(() => {
        restoreCanvasState();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.lineTo(startX - (x - startX), y);  // Corrected line
        ctx.closePath();
        if (fillCheckbox.checked) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }, 10);
      break;
  }
  event.preventDefault();
}

// Function to handle text input
function createTextInput() {
  if (document.getElementById('textInput')) return document.getElementById('textInput');

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'textInput';
  input.style.position = 'absolute';
  input.style.left = startX + 'px';
  input.style.top = startY + 'px';
  input.style.border = '1px solid #000';
  input.style.padding = '2px';
  input.style.fontFamily = font;
  input.style.fontSize = fontSize + 'px';
  document.body.appendChild(input);

  input.addEventListener('blur', () => {
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillStyle = colorPicker.value;
    ctx.fillText(input.value, startX, startY);
    saveCanvasState();
    input.remove();
    textInput = null;
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      input.blur();
    }
  });

  return input;
}

// Function to save the current canvas state
function saveCanvasState() {
  canvasImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (historyStep === history.length) {
    history.push(canvasImage);
    historyStep++;
  } else {
    //when undo and draw again on the canvas.
    history.splice(historyStep, history.length - historyStep, canvasImage);
    historyStep++;
  }
}

// Function to restore a previous canvas state
function restoreCanvasState(step = historyStep - 1) {
  if (step < 0 || history.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const imageData = history[step];
  ctx.putImageData(imageData, 0, 0);
}

// Function for the undo operation
function undo() {
  if (historyStep > 1) {
    historyStep--;
    restoreCanvasState(historyStep - 1);
  }
}

// Add keyboard shortcut for undo (Ctrl+Z)
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'z') {
    undo();
  }
});

// Function for the redo operation
function redo() {
  if (historyStep < history.length) {
    restoreCanvasState(historyStep);
    historyStep++;
  }
}

// Add keyboard shortcut for redo (Ctrl+Y)
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'y') {
    redo();
  }
});

// Function to clear the entire canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveCanvasState(); // Save the current state before clearing
}

// Function to download the canvas as an image
function downloadCanvas() {
  const dataURL = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'canvas_image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Function to upload an image to the canvas
function uploadCanvas(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        let imgX = 0;
        let imgY = 0;
        let imgWidth = img.width;
        let imgHeight = img.height;

        // Temporarily draw the image at the mouse position
        const mouseMoveHandler = (moveEvent) => {
          restoreCanvasState(); // Restore the canvas state to avoid multiple drawings
          imgX = moveEvent.offsetX - imgWidth / 2; // Center the image on the cursor
          imgY = moveEvent.offsetY - imgHeight / 2; // Center the image on the cursor
          ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
        };

        // Add mousemove event listener to preview the image
        canvas.addEventListener('mousemove', mouseMoveHandler);

        // Add mousewheel event listener to resize the image
        const wheelHandler = (wheelEvent) => {
          wheelEvent.preventDefault();
          const scale = wheelEvent.deltaY < 0 ? 1.1 : 0.9; // Zoom in or out
          imgWidth *= scale;
          imgHeight *= scale;
        };

        canvas.addEventListener('wheel', wheelHandler);

        // Add click event listener to finalize the image position
        const clickHandler = () => {
          canvas.removeEventListener('mousemove', mouseMoveHandler);
          canvas.removeEventListener('click', clickHandler);
          canvas.removeEventListener('wheel', wheelHandler);
          saveCanvasState(); // Save the canvas state after placing the image
        };

        canvas.addEventListener('click', clickHandler);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

/////////////////////////////////////////////////
// Custom Cursor Implementation
/////////////////////////////////////////////////

// Add a custom cursor element to the DOM
const customCursor = document.createElement('div');
customCursor.id = 'customCursor';
document.body.appendChild(customCursor);

// Update the custom cursor position
canvas.addEventListener('mousemove', (event) => {
  const x = event.clientX - canvas.getBoundingClientRect().left;
  const y = event.clientY - canvas.getBoundingClientRect().top;
  customCursor.style.left = `${x}px`;
  customCursor.style.top = `${y}px`;
});

// Update the custom cursor size and color based on brush size and color
function updateCursorStyle() {
  const brushSize = brushSizeSlider.value;
  customCursor.style.width = `${brushSize}px`;
  customCursor.style.height = `${brushSize}px`;
  customCursor.style.opacity = opacitySlider.value; // Match the brush opacity
  customCursor.style.borderColor = colorPicker.value; // Match the brush color
}

// Update cursor style when brush size or color changes
brushSizeSlider.addEventListener('input', updateCursorStyle);
opacitySlider.addEventListener('input', updateCursorStyle);
colorPicker.addEventListener('change', updateCursorStyle);

// Hide the custom cursor when the mouse leaves the canvas
canvas.addEventListener('mouseleave', () => {
  customCursor.style.display = 'none';
});

// Show the custom cursor when the mouse enters the canvas
canvas.addEventListener('mouseenter', () => {
  if (selectedTool === 'brush' || selectedTool === 'eraser') {
    customCursor.style.display = 'block';
  }
  else {
    customCursor.style.display = 'none';
  }
});

///////////////////////////////////////////////////////
// Color Selection Implementation
///////////////////////////////////////////////////////
// Initialize color-related canvases
const colorBlock = document.getElementById('colorselect');
const ctxBlock = colorBlock.getContext('2d');
colorBlock.width = 200;
colorBlock.height = 200;
const blockWidth = colorBlock.width;
const blockHeight = colorBlock.height;

const colorLine = document.getElementById('colorline');
const ctxLine = colorLine.getContext('2d');
colorLine.width = 50;
colorLine.height = 200;
const lineWidth = colorLine.width;
const lineHeight = colorLine.height;

const colorNow = document.getElementById('colornow');
const ctxNow = colorNow.getContext('2d');
colorNow.style.backgroundColor = "black";

let x = 0;
let y = 0;
let rgbaColor = 'rgba(255,0,0,1)';
let isMouseDown = false;

// Let the cursor be a crosshair when hovering over the color line and block
colorLine.style.cursor = 'crosshair';
colorBlock.style.cursor = 'crosshair';

// Initialize gradient for the color line
ctxLine.rect(0, 0, lineWidth, lineHeight);
const grdLine = ctxLine.createLinearGradient(0, 0, 0, lineHeight);
grdLine.addColorStop(0, 'rgba(255, 0, 0, 1)');
grdLine.addColorStop(0.17, 'rgba(255, 255, 0, 1)');
grdLine.addColorStop(0.34, 'rgba(0, 255, 0, 1)');
grdLine.addColorStop(0.51, 'rgba(0, 255, 255, 1)');
grdLine.addColorStop(0.68, 'rgba(0, 0, 255, 1)');
grdLine.addColorStop(0.84, 'rgba(255, 0, 255, 1)');
grdLine.addColorStop(1, 'rgba(255, 0, 0, 1)');
ctxLine.fillStyle = grdLine;
ctxLine.fill();

// Initialize gradient for the color block
ctxBlock.rect(0, 0, blockWidth, blockHeight);
updateGradient();
// Set the initial color of the colornow element
colorNow.style.backgroundColor = rgbaColor;

function updateGradient() {
  ctxBlock.fillStyle = rgbaColor;
  ctxBlock.fillRect(0, 0, blockWidth, blockHeight);

  const grdWhite = ctxLine.createLinearGradient(0, 0, blockWidth, 0);
  grdWhite.addColorStop(0, 'rgba(255,255,255,1)');
  grdWhite.addColorStop(1, 'rgba(255,255,255,0)');
  ctxBlock.fillStyle = grdWhite;
  ctxBlock.fillRect(0, 0, blockWidth, blockHeight);

  const grdBlack = ctxLine.createLinearGradient(0, 0, 0, blockHeight);
  grdBlack.addColorStop(0, 'rgba(0,0,0,0)');
  grdBlack.addColorStop(1, 'rgba(0,0,0,1)');
  ctxBlock.fillStyle = grdBlack;
  ctxBlock.fillRect(0, 0, blockWidth, blockHeight);
}


// Event listener for the color line
colorLine.addEventListener("click", function (e) {
  updateColorline(e);
});
colorLine.addEventListener("mousemove", function (e) {
  if (isMouseDown) {
    updateColorline(e);
  }
});

// Event listeners for the color line
colorLine.addEventListener("mousedown", function (e) {
  isMouseDown = true;
  updateColorline(e);
});

colorLine.addEventListener("mousemove", function (e) {
  if (isMouseDown) {
    updateColorline(e);
  }
});

colorLine.addEventListener("mouseup", function () {
  isMouseDown = false;
});

// Event listeners for the color block
colorBlock.addEventListener("mousedown", function (e) {
  isMouseDown = true;
  updateColorNow(e);
});

colorBlock.addEventListener("mousemove", function (e) {
  if (isMouseDown) {
    updateColorNow(e);
  }
});

colorBlock.addEventListener("mouseup", function () {
  isMouseDown = false;
});

function updateColorline(e) {
  x = e.offsetX;
  y = e.offsetY;
  const data = ctxLine.getImageData(x, y, 1, 1).data;
  rgbaColor = `rgba(${data[0]},${data[1]},${data[2]},1)`;
  updateGradient();
}

// Function to update the current color
function updateColorNow(e) {
  x = e.offsetX;
  y = e.offsetY;
  const data = ctxBlock.getImageData(x, y, 1, 1).data;
  rgbaColor = `rgba(${data[0]},${data[1]},${data[2]},1)`;
  colorNow.style.backgroundColor = rgbaColor;
  colorPicker.value = rgbaColor; // Update the color picker value
  updateColor(); // Update the canvas color
  updateCursorStyle(); // Update the custom cursor color
  // remove active class from all color buttons
  const colorButtons = document.querySelectorAll('.color-btn');
  colorButtons.forEach(btn => btn.classList.remove('active'));
  colornowElement.classList.add('active');
}
// 讓 colornow 可以被選取並設置為 active
const colornowElement = document.getElementById('colornow');

colornowElement.addEventListener('click', () => {
  const colorButtons = document.querySelectorAll('.color-btn');
  colorButtons.forEach(btn => btn.classList.remove('active'));
  colornowElement.classList.remove('active');
  colornowElement.classList.add('active');
  colorPicker.value = rgbaColor;
  updateColor();
  updateCursorStyle();
});
