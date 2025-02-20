import {
  MessageType,
  type CropCoordsMessage,
  type CaptureCroppedMessage
} from "./types/messages";

function initCropper(): void {
  const overlay: HTMLDivElement = document.createElement("div");
  overlay.id = "cropper-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.3)",
    zIndex: "9999",
    cursor: "crosshair !important"
  });
  document.body.appendChild(overlay);

  let startX = 0;
  let startY = 0;
  let selectionBox: HTMLDivElement;

  function mouseDownHandler(e: MouseEvent): void {
    startX = e.clientX;
    startY = e.clientY;

    selectionBox = document.createElement("div");
    selectionBox.id = "selection-box";
    Object.assign(selectionBox.style, {
      position: "fixed",
      border: "2px dashed #fff",
      background: "rgba(255,255,255,0.3)",
      left: `${startX}px`,
      top: `${startY}px`,
      zIndex: "10000"
    });
    overlay.appendChild(selectionBox);
    overlay.addEventListener("mousemove", mouseMoveHandler);
    overlay.addEventListener("mouseup", mouseUpHandler);
  }

  function mouseMoveHandler(e: MouseEvent): void {
    const currentX: number = e.clientX;
    const currentY: number = e.clientY;
    const rectLeft: number = Math.min(startX, currentX);
    const rectTop: number = Math.min(startY, currentY);
    const rectWidth: number = Math.abs(currentX - startX);
    const rectHeight: number = Math.abs(currentY - startY);

    Object.assign(selectionBox.style, {
      left: `${rectLeft}px`,
      top: `${rectTop}px`,
      width: `${rectWidth}px`,
      height: `${rectHeight}px`
    });
  }

  function mouseUpHandler(): void {
    overlay.removeEventListener("mousemove", mouseMoveHandler);
    overlay.removeEventListener("mouseup", mouseUpHandler);

    const rect: DOMRect = selectionBox.getBoundingClientRect();
    const left: number = rect.left;
    const top: number = rect.top;
    const width: number = rect.width;
    const height: number = rect.height;

    overlay.remove();

    // Calling setTimeout to allow for overlay removal to be rendered
    setTimeout((): void => {
      const message: CropCoordsMessage = {
        type: MessageType.CROP_COORDS,
        rect: { left, top, width, height }
      };
      chrome.runtime.sendMessage(message);
    }, 750);
  }

  overlay.addEventListener("mousedown", mouseDownHandler);
}

chrome.runtime.onMessage.addListener(
  (
    message: CaptureCroppedMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean }) => void
  ): void => {
    if (message.type === MessageType.CAPTURE_CROPPED) {
      initCropper();
      sendResponse({ success: true });
    }
  }
);
