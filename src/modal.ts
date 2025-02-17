type MemoryType = "image" | "text";

interface AddMemoryResponse {
  success: boolean;
  error?: string;
}

interface Message {
  type: MessageType;
}

enum MessageType {
  ADD_MEMORY = "ADD_MEMORY",
  SHOW_MODAL = "SHOW_MODAL",
  CROP_SCREENSHOT = "CROP_SCREENSHOT"
}

interface AddMemoryMessage extends Message {
  type: MessageType.ADD_MEMORY;
  data: {
    memory: string | null;
    media: string | null;
  };
}

interface ShowModalMessage extends Message {
  type: MessageType.SHOW_MODAL;
  data: string;
  memoryType: MemoryType;
}

interface CropScreenshotMessage extends Message {
  type: MessageType.CROP_SCREENSHOT;
  dataUrl: string;
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

function injectModalStyles(): void {
  if (document.getElementById("prysm-styles")) return;

  const link: HTMLLinkElement = document.createElement("link");
  link.id = "prysm-styles";
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("modal.css");

  document.head.appendChild(link);
}

function showMemoryModal(content: string, type: MemoryType): HTMLDivElement {
  injectModalStyles();

  const overlay: HTMLDivElement = document.createElement("div");
  overlay.className = "prysm-overlay";

  const modal: HTMLDivElement = document.createElement("div");
  modal.className = "prysm-modal";

  let contentElement: HTMLImageElement | HTMLTextAreaElement;
  if (type === "image") {
    contentElement = document.createElement("img");
    contentElement.src = content;
    contentElement.style.display = "block";
    contentElement.style.maxWidth = "100%";
    contentElement.style.maxHeight = "300px";
    contentElement.style.marginBottom = "15px";
  } else {
    contentElement = document.createElement("textarea");
    contentElement.className = "prysm-textarea";
    contentElement.value = content;
    setTimeout(() => contentElement.focus(), 0);
  }
  modal.appendChild(contentElement);

  const buttonsDiv: HTMLDivElement = document.createElement("div");
  buttonsDiv.className = "prysm-buttons";

  const saveButton: HTMLButtonElement = document.createElement("button");
  saveButton.className = "prysm-button save";
  saveButton.textContent = "Save Memory";
  buttonsDiv.appendChild(saveButton);

  const cancelButton: HTMLButtonElement = document.createElement("button");
  cancelButton.className = "prysm-button cancel";
  cancelButton.textContent = "Cancel";
  buttonsDiv.appendChild(cancelButton);

  modal.appendChild(buttonsDiv);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  cancelButton.addEventListener("click", () => overlay.remove());

  saveButton.addEventListener("click", () => {
    const memory: string | null =
      type === "image" ? null : (contentElement as HTMLTextAreaElement).value;
    const media: string | null = type === "image" ? content : null;
    chrome.runtime.sendMessage(
      {
        type: MessageType.ADD_MEMORY,
        data: { memory, media }
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
