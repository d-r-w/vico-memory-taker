import type {
  MemoryType,
  AddMemoryResponse,
  Message,
  AddMemoryMessage,
  ShowModalMessage,
  CropScreenshotMessage
} from "./types/messages";

import { MessageType } from "./types/messages";

function injectModalStyles(): void {
  if (document.getElementById("memory-taker-styles")) return;

  const link: HTMLLinkElement = document.createElement("link");
  link.id = "memory-taker-styles";
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("modal.css");

  document.head.appendChild(link);
}

function showMemoryModal(content: string, type: MemoryType): HTMLDivElement {
  injectModalStyles();

  const overlay: HTMLDivElement = document.createElement("div");
  overlay.className = "memory-taker-overlay";

  const modal: HTMLDivElement = document.createElement("div");
  modal.className = "memory-taker-modal";

  let contentElement: HTMLImageElement | HTMLTextAreaElement;
  let contextTextArea: HTMLTextAreaElement | null = null;
  
  if (type === "image") {
    contentElement = document.createElement("img");
    contentElement.src = content;
    contentElement.style.display = "block";
    contentElement.style.maxWidth = "100%";
    contentElement.style.maxHeight = "300px";
    contentElement.style.marginBottom = "15px";
    
    contextTextArea = document.createElement("textarea");
    contextTextArea.className = "memory-taker-textarea";
    contextTextArea.placeholder = "Optional context for memory...";
    contextTextArea.style.height = "100px";
    setTimeout(() => contentElement.focus(), 0);
  } else {
    contentElement = document.createElement("textarea");
    contentElement.className = "memory-taker-textarea";
    contentElement.value = content;
    setTimeout(() => contentElement.focus(), 0);
  }
  
  modal.appendChild(contentElement);

  if (contextTextArea) {
    modal.appendChild(contextTextArea);
  }

  const buttonsDiv: HTMLDivElement = document.createElement("div");
  buttonsDiv.className = "memory-taker-buttons";

  const saveButton: HTMLButtonElement = document.createElement("button");
  saveButton.className = "memory-taker-button save";
  saveButton.textContent = "Save Memory";
  buttonsDiv.appendChild(saveButton);

  const cancelButton: HTMLButtonElement = document.createElement("button");
  cancelButton.className = "memory-taker-button cancel";
  cancelButton.textContent = "Cancel";
  buttonsDiv.appendChild(cancelButton);

  modal.appendChild(buttonsDiv);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  cancelButton.addEventListener("click", () => overlay.remove());

  saveButton.addEventListener("click", () => {
    let text: string | null;
    let image: string | null = null;

    if (type === "image") {
      text = contextTextArea?.value || null;
      image = content;
    } else {
      text = (contentElement as HTMLTextAreaElement).value;
    }
    
    chrome.runtime.sendMessage(
      {
        type: MessageType.ADD_MEMORY,
        data: { text, image }
      } as AddMemoryMessage,
      (response: AddMemoryResponse | undefined) => {
        if (response?.success) {
          overlay.remove();
        } else {
          const originalText: string = saveButton.textContent || "Save Memory";
          saveButton.textContent = "Error Saving";
          saveButton.style.backgroundColor = "#e53935";
          saveButton.disabled = true;
          setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.style.backgroundColor = "#4CAF50";
            saveButton.disabled = false;
          }, 5000);
        }
      }
    );
  });

  return overlay;
}

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; error?: string }) => void
  ): boolean | undefined => {
    switch (message.type) {
      case MessageType.SHOW_MODAL: {
        const showModalMessage = message as ShowModalMessage;
        showMemoryModal(showModalMessage.data, showModalMessage.memoryType);
        sendResponse({ success: true });
        return true;
      }
      case MessageType.CROP_SCREENSHOT: {
        const cropScreenshotMessage = message as CropScreenshotMessage;
        const { dataUrl, rect } = cropScreenshotMessage;
        const img = new Image();
        img.onload = () => {
          const canvas: HTMLCanvasElement = document.createElement("canvas");
          const scale: number = window.devicePixelRatio;
          canvas.width = rect.width * scale;
          canvas.height = rect.height * scale;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            sendResponse({
              success: false,
              error: "Unable to get canvas context"
            });
            return;
          }
          ctx.drawImage(
            img,
            rect.left * scale,
            rect.top * scale,
            rect.width * scale,
            rect.height * scale,
            0,
            0,
            rect.width * scale,
            rect.height * scale
          );

          const croppedDataUrl: string = canvas.toDataURL("image/png");
          showMemoryModal(croppedDataUrl, "image");
          sendResponse({ success: true });
        };

        img.addEventListener("error", (event: Event) => {
          console.error("Error loading image:", event);
          sendResponse({ success: false, error: "Image load error" });
        });

        img.src = dataUrl;
        return true;
      }
    }
  }
);
