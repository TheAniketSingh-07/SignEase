import { SUPPORTED_GESTURES } from "./definitions"

/**
 * Calculates Euclidean distance between two 2D/3D points
 */
function distance(p1, p2) {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Classifies a set of 21 MediaPipe hand landmarks into a supported gesture
 * @param {Array<{x: number, y: number, z: number}>} landmarks 
 * @returns {{ gesture: object | null, confidence: number }}
 */
export function classifyHandGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: null, confidence: 0 }
  }

  const wrist = landmarks[0]

  // Tips
  const thumbTip = landmarks[4]
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]

  // PIP joints
  const thumbIp = landmarks[3]
  const thumbMcp = landmarks[2]
  const indexPip = landmarks[6]
  const middlePip = landmarks[10]
  const ringPip = landmarks[14]
  const pinkyPip = landmarks[18]

  // MCP joints
  const indexMcp = landmarks[5]
  const middleMcp = landmarks[9]
  const ringMcp = landmarks[13]
  const pinkyMcp = landmarks[17]

  // Finger extension check (y is 0 at top, 1 at bottom)
  // Extended if tip is higher (smaller y) than PIP by at least a small threshold
  const indexExtended = indexTip.y < indexPip.y - 0.02
  const middleExtended = middleTip.y < middlePip.y - 0.02
  const ringExtended = ringTip.y < ringPip.y - 0.02
  const pinkyExtended = pinkyTip.y < pinkyPip.y - 0.02

  // Thumb extended check
  const thumbDistFromWrist = distance(thumbTip, wrist)
  const thumbMcpDistFromWrist = distance(thumbMcp, wrist)
  const thumbExtended = thumbDistFromWrist > thumbMcpDistFromWrist * 1.2

  // Distance between thumb tip and index tip (for pinch / C shape)
  const pinchDist = distance(thumbTip, indexTip)

  // 1. PINCH / SLOW DOWN (Thumb tip close to Index tip, others relaxed or slightly open)
  if (pinchDist < 0.06 && middleExtended && ringExtended) {
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === "slow_down")
    return { gesture, confidence: 0.88 }
  }

  // 2. I LOVE YOU (ASL) -> Thumb, Index, Pinky extended; Middle and Ring folded
  if (thumbExtended && indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === "love_appreciate")
    return { gesture, confidence: 0.94 }
  }

  // 3. THUMBS UP -> Thumb pointing up (y much less than MCP), other 4 fingers folded
  if (thumbTip.y < thumbMcp.y - 0.05 && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === "understood")
    return { gesture, confidence: 0.95 }
  }

  // 4. THUMBS DOWN -> Thumb pointing down (y much greater than MCP), other 4 fingers folded
  if (thumbTip.y > thumbMcp.y + 0.06 && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === "not_understood")
    return { gesture, confidence: 0.92 }
  }

  // 5. QUESTION (Index finger pointed up, middle, ring, pinky folded)
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === "question")
    return { gesture, confidence: 0.93 }
  }

  // 6. YES / AGREE (Victory / V sign -> Index and Middle extended, Ring and Pinky folded)
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    // Check separation between index and middle
    const separation = distance(indexTip, middleTip)
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === "yes_agree")
    return { gesture, confidence: separation > 0.04 ? 0.95 : 0.85 }
  }

  // 7. RAISE HAND / OPEN PALM -> All 4 fingers extended (and thumb usually extended)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === "raise_hand")
    return { gesture, confidence: 0.96 }
  }

  // 8. NO / DISAGREE (Closed Fist -> all 4 fingers folded and thumb folded or across)
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === "no_disagree")
    return { gesture, confidence: 0.89 }
  }

  return { gesture: null, confidence: 0 }
}
