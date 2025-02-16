interface Memory {
  [key: string]: unknown;
}

interface CropCoordsMessage {
  type: "CROP_COORDS";
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AddMemoryMessage {
  type: "ADD_MEMORY";
  data: Memory;
}

type BackgroundMessage = CropCoordsMessage | AddMemoryMessage;

interface ShowModalMessage {
  type: "SHOW_MODAL";
  memoryType: "image" | "text";
  data: string;
}

interface CropScreenshotMessage {
  type: "CROP_SCREENSHOT";
  dataUrl: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

chrome.runtime.onInstalled.addListener((): void => {
  chrome.contextMenus.create({
    id: "prysmAddMemory",
    title: "Prysm Memory: Text",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "prysmCaptureScreenshot",
    title: "Prysm Memory: Screenshot",
    contexts: ["page", "selection"]
  });
  chrome.contextMenus.create({
    id: "prysmCaptureScreenshotCropped",
    title: "Prysm Memory: Cropped Screenshot",
    contexts: ["page", "selection"]
  });
});

chrome.contextMenus.onClicked.addListener(
  (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void => {
    if (!tab?.id) return;

    if (info.menuItemId === "prysmCaptureScreenshot") {
      chrome.tabs.captureVisibleTab(
        tab.windowId,
        { format: "png" },
        (dataUrl?: string) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
          }
          const message: ShowModalMessage = {
            type: "SHOW_MODAL",
            memoryType: "image",
            data: dataUrl || ""
          };
          chrome.tabs.sendMessage(tab.id ?? -1, message);
        }
      );
    } else if (info.menuItemId === "prysmCaptureScreenshotCropped") {
      chrome.tabs.sendMessage(tab.id, { type: "CAPTURE_CROPPED" });
    } else if (info.menuItemId === "prysmAddMemory" && info.selectionText) {
      const message: ShowModalMessage = {
        type: "SHOW_MODAL",
        memoryType: "text",
        data: info.selectionText
      };
      chrome.tabs.sendMessage(tab.id, message);
    }
  }
);

chrome.runtime.onMessage.addListener(
  (
    message: BackgroundMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; error?: string }) => void
  ): boolean | undefined => {
    if (message.type === "CROP_COORDS") {
      if (!sender.tab || !sender.tab.windowId) return;
      chrome.tabs.captureVisibleTab(
        sender.tab.windowId,
        { format: "png" },
        (dataUrl?: string) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
          }
          const cropMsg: CropScreenshotMessage = {
            type: "CROP_SCREENSHOT",
            dataUrl: dataUrl || "",
            rect: message.rect
          };
          if (sender.tab?.id !== undefined) {
            chrome.tabs.sendMessage(sender.tab.id, cropMsg);
          }
          sendResponse({ success: true });
        }
      );
    } else if (message.type === "ADD_MEMORY") {
      sendToPrysm(message.data)
        .then((result) => {
          sendResponse(result);
        })
        .catch((error: Error) => {
          sendResponse({ success: false, error: error.toString() });
        });
      return true; // Indicates asynchronous response
    }
  }
);

async function sendToPrysm(
  memory: Memory
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = "http://localhost:3000/api/memories";
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memory)
    });
    if (!response.ok) {
      throw new Error("Response not ok");
    }
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network Error" };
  }
}
