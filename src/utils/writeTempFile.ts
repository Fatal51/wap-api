import { writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid'; // For generating temp file names

// Utility function to write byte array to a temporary file
export const writeTempFile = (byteArray: Buffer, fileType: string): string => {
  const tempFilePath = `./temp/${uuidv4()}.${fileType}`;
  writeFileSync(tempFilePath, byteArray);
  return tempFilePath;
};
