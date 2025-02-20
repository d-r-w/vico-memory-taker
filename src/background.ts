import { MessageType } from "./types/messages";
import type {
  ShowModalMessage,
  CropScreenshotMessage,
  Message,
  CropCoordsMessage,
  AddMemoryMessage
} from "./types/messages";

interface Memory {
  [key: string]: unknown;
}

const takeTextMemory: chrome.contextMenus.CreateProperties = {
  id: "takeTextMemory",
  title: "Text",
  contexts: ["all"]
};

const takeScreenshotMemory: chrome.contextMenus.CreateProperties = {
  id: "takeScreenshotMemory",
  title: "Screenshot",
  contexts: ["all"]
};

const takeCroppedScreenshotMemory: chrome.contextMenus.CreateProperties = {
  id: "takeCroppedScreenshotMemory",
  title: "Cropped Screenshot",
  contexts: ["all"]
};

chrome.runtime.onInstalled.addListener((): void => {
  chrome.contextMenus.create(takeTextMemory);
  chrome.contextMenus.create(takeScreenshotMemory);
  chrome.contextMenus.create(takeCroppedScreenshotMemory);
});

chrome.contextMenus.onClicked.addListener(
  (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void => {
    if (!tab?.id) return;
    switch (info.menuItemId) {
      case takeScreenshotMemory.id:
        {
          chrome.tabs.captureVisibleTab(
            tab.windowId,
            { format: "png" },
            (dataUrl?: string) => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
              }
              const message: ShowModalMessage = {
                type: MessageType.SHOW_MODAL,
                memoryType: "image",
                data: dataUrl || ""
              };
              chrome.tabs.sendMessage(tab.id ?? -1, message);
            }
          );
        }
        break;
      case takeCroppedScreenshotMemory.id:
        {
          chrome.tabs.sendMessage(tab.id, {
            type: MessageType.CAPTURE_CROPPED
          });
        }
        break;
      case takeTextMemory.id:
        {
          const message: ShowModalMessage = {
            type: MessageType.SHOW_MODAL,
            memoryType: "text",
            data: info.selectionText ?? ""
          };
          chrome.tabs.sendMessage(tab.id, message);
        }
        break;
    }
  }
);

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; error?: string }) => void
  ): boolean | undefined => {
    if (message.type === MessageType.CROP_COORDS) {
      const cropCoordsMessage = message as CropCoordsMessage;
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
            type: MessageType.CROP_SCREENSHOT,
            dataUrl: dataUrl || "",
            rect: cropCoordsMessage.rect
          };
          if (sender.tab?.id !== undefined) {
            chrome.tabs.sendMessage(sender.tab.id, cropMsg);
          }
          sendResponse({ success: true });
        }
      );
    } else if (message.type === MessageType.ADD_MEMORY) {
      const addMemoryMessage = message as AddMemoryMessage;
      sendToEndpoint(addMemoryMessage.data)
        .then((result) => {
          sendResponse(result);
        })
        .catch((error: Error) => {
          sendResponse({ success: false, error: error.toString() });
        });
      return true;
    }
  }
);

async function sendToEndpoint(
  memory: Memory
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = "http://localhost:3020/api/save_memory/";
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
