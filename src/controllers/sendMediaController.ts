import { Request, Response } from 'express';
import { MessageMedia } from 'whatsapp-web.js';

import { clients } from '../service';
import { logger, writeTempFile } from '../utils';

// Helper function to validate base64 string
const isValidBase64 = (str: string): boolean => {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
};

// Helper function to remove base64 prefix
const removeBase64Prefix = (str: string): string => {
  return str.replace(/^data:.*;base64,/, '');
};

export const sendMedia = async (req: Request, res: Response) => {
  const {
    clientId,
    numero,
    mediaData,
    mediaType,
    mediaUrl,
    fileType,
    caption,
  } = req.body;

  // Ensure required fields are provided
  if (!clientId || !numero || (!mediaData && !mediaUrl)) {
    return res.status(400).send({
      error: 'clientId, numero, and either mediaData or mediaUrl are required',
    });
  }

  try {
    // Get the client instance
    const client = clients[clientId];
    if (!client) {
      return res.status(404).send({ error: 'Client not found' });
    }

    let media: MessageMedia;

    // Handle media from base64 string
    if (mediaData && mediaType === 'base64') {
      const cleanedMediaData = removeBase64Prefix(mediaData);
      if (!isValidBase64(cleanedMediaData)) {
        return res
          .status(400)
          .send({ error: 'Invalid base64 mediaData provided' });
      }

      media = new MessageMedia(fileType, cleanedMediaData);

      // Handle media from URL
    } else if (mediaUrl) {
      media = await MessageMedia.fromUrl(mediaUrl);

      // Handle media from byte array
    } else if (mediaData && mediaType === 'byteArray') {
      const byteArray = Buffer.from(mediaData, 'base64');
      const tempFilePath = writeTempFile(byteArray, fileType);
      media = MessageMedia.fromFilePath(tempFilePath);
    } else {
      return res.status(400).send({ error: 'Invalid media format provided' });
    }

    // Send media
    const chatId = `${numero}@c.us`;
    await client.sendMessage(chatId, media, { caption: caption || '' });

    res.status(200).send({ success: true, message: 'Media sent successfully' });
  } catch (error) {
    logger.error('Error sending media:', error);
    res.status(500).send({ success: false, message: 'Error sending media' });
  }
};
