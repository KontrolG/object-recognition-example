import "./style.css";

const video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
const demosSection = document.getElementById("demos");
const enableWebcamButton = document.getElementById("webcamButton");
const canvas = document.createElement("canvas");

// creat worker thread
const worker = new Worker("tfjs.worker.js");

// listen to worker if any message is there
worker.addEventListener("message", (event) => {
  // read and print out the incoming data
  const { data } = event;

  switch (data.status) {
    case "loaded":
      demosSection.classList.remove("invisible");
      break;

    case "predicted":
      updateBoundingBoxes(data.data);
      sendImageData();
      break;
    case "log":
      console.log(data.data);
      break;
    default:
      break;
  }
});

// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will
// define in the next step.
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  // Hide the button once clicked.
  event.target.classList.add("removed");

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

var children = [];

const scale = 1;

let previousPerformance = 0;

function sendImageData() {
  const newPerformance = performance.now();
  console.log("Secs:", (newPerformance - previousPerformance) / 1000);
  previousPerformance = newPerformance;
  const tempCtx = canvas.getContext("2d");
  // get canvas context and draw video onto it
  tempCtx.drawImage(
    video,
    0,
    0,
    video.videoWidth * scale,
    video.videoHeight * scale
  );

  // extract ImageData objct because you cannot send HTMLElements to Web Worker
  const imageData = tempCtx.getImageData(
    0,
    0,
    video.videoWidth * scale,
    video.videoHeight * scale
  );

  console.log(imageData);
  worker.postMessage({ data: imageData, status: "predict" });
}

function predictWebcam() {
  // Set canvas to be the same height as video input
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  sendImageData();
}

function updateBoundingBoxes(predictions) {
  // Remove any highlighting we did previous frame.
  for (let i = 0; i < children.length; i++) {
    liveView.removeChild(children[i]);
  }
  children.splice(0);

  // Now lets loop through predictions and draw them to the live view if
  // they have a high confidence score.
  for (let n = 0; n < predictions.length; n++) {
    // If we are over 66% sure we are sure we classified it right, draw it!
    if (predictions[n].score > 0.33) {
      const p = document.createElement("p");
      p.innerText =
        predictions[n].class +
        " - with " +
        Math.round(parseFloat(predictions[n].score) * 100) +
        "% confidence.";
      p.style =
        "margin-left: " +
        predictions[n].bbox[0] +
        "px; margin-top: " +
        (predictions[n].bbox[1] - 10) +
        "px; width: " +
        (predictions[n].bbox[2] - 10) +
        "px; top: 0; left: 0;";

      const highlighter = document.createElement("div");
      highlighter.setAttribute("class", "highlighter");
      highlighter.style =
        "left: " +
        predictions[n].bbox[0] +
        "px; top: " +
        predictions[n].bbox[1] +
        "px; width: " +
        predictions[n].bbox[2] +
        "px; height: " +
        predictions[n].bbox[3] +
        "px;";

      liveView.appendChild(highlighter);
      liveView.appendChild(p);
      children.push(highlighter);
      children.push(p);
    }
  }
}
