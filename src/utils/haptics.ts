/** 매칭 시 햅틱 피드백 (지원 시에만) */
export function vibrateOnMatch(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(30);
  }
}
