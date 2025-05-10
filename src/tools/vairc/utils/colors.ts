// aadishv.github.io/src/components/vairc/utils/colors.ts
// Utility function to get color for detection classes
export const getDetectionColor = (className: string): string => {
  switch (className?.toLowerCase()) {
    case 'blue':
      return '#0000FF'; // Blue
    case 'goal':
      return '#FFD700'; // Gold
    case 'red':
      return '#FF0000'; // Red
    case 'bot':
      return '#000000'; // Black
    default:
      return '#FF00FF'; // Default Magenta for unknown
  }
};