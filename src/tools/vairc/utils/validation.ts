// aadishv.github.io/src/components/vairc/utils/validation.ts
import type { DetectionPayload, Detection } from "../Layout";

/**
 * Validates a detection payload and ensures it has the expected structure
 * @param payload The detection payload to validate
 * @returns True if the payload is valid, false otherwise
 */
export function isValidDetectionPayload(payload: DetectionPayload | null): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  // Check if stuff exists and is an array
  if (!Array.isArray(payload.stuff)) {
    return false;
  }

  return true;
}

/**
 * Validates an individual detection object
 * @param detection The detection to validate
 * @returns True if the detection is valid, false otherwise
 */
export function isValidDetection(detection: Detection | null): boolean {
  if (!detection || typeof detection !== 'object') {
    return false;
  }

  // Check for required properties
  if (typeof detection.x !== 'number' ||
      typeof detection.y !== 'number' ||
      typeof detection.width !== 'number' ||
      typeof detection.height !== 'number' ||
      typeof detection.class !== 'string' ||
      typeof detection.confidence !== 'number') {
    return false;
  }

  return true;
}

/**
 * Ensures a detection payload has a valid structure, or returns a default empty payload
 * @param payload The detection payload to validate
 * @returns The original payload if valid, or a default empty payload
 */
export function ensureValidPayload(payload: DetectionPayload | null): DetectionPayload {
  if (isValidDetectionPayload(payload)) {
    return payload as DetectionPayload;
  }

  // Return a default payload
  return { stuff: [] };
}

/**
 * Safely get the stuff array from a detection payload
 * @param payload The detection payload
 * @returns The stuff array if it exists and is valid, or an empty array
 */
export function safeGetStuff(payload: DetectionPayload | null): Detection[] {
  if (isValidDetectionPayload(payload)) {
    return payload!.stuff;
  }
  return [];
}
