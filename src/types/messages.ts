export type MemoryType = "image" | "text";

export interface AddMemoryResponse {
  success: boolean;
  error?: string;
}

export enum MessageType {
  ADD_MEMORY = "ADD_MEMORY",
  SHOW_MODAL = "SHOW_MODAL",
  CROP_SCREENSHOT = "CROP_SCREENSHOT",
  CROP_COORDS = "CROP_COORDS",
  CAPTURE_CROPPED = "CAPTURE_CROPPED"
}

export interface Message {
  type: MessageType;
}

export interface AddMemoryMessage extends Message {
  type: MessageType.ADD_MEMORY;
  data: {
    text: string | null;
    image: string | null;
  };
}

export interface ShowModalMessage extends Message {
  type: MessageType.SHOW_MODAL;
  data: string;
  memoryType: MemoryType;
}

export interface CropScreenshotMessage extends Message {
  type: MessageType.CROP_SCREENSHOT;
  dataUrl: string;
  rect: CropCoords;
}

export interface CaptureCroppedMessage extends Message {
  type: MessageType.CAPTURE_CROPPED;
}

export interface CropCoordsMessage extends Message {
  type: MessageType.CROP_COORDS;
  rect: CropCoords;
}

export interface CropCoords {
  left: number;
  top: number;
  width: number;
  height: number;
}
