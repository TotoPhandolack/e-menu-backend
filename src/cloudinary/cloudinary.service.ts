import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUNDINARY_CLOUD_NAME,
      api_key: process.env.CLOUNDINARY_API_KEY,
      api_secret: process.env.CLOUNDINARY_API_SECRET,
    });
    console.log('[Cloudinary] cloud_name:', process.env.CLOUNDINARY_CLOUD_NAME);
    console.log('[Cloudinary] api_key:', process.env.CLOUNDINARY_API_KEY);
    console.log(
      '[Cloudinary] api_secret set:',
      !!process.env.CLOUNDINARY_API_SECRET,
    );
  }

  uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: 'image' }, (err, result) => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          if (err || !result) return reject(err);
          resolve(result.secure_url);
        })
        .end(buffer);
    });
  }

  async deleteByUrl(url: string): Promise<void> {
    const folderMatch = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    if (!folderMatch) return;
    await cloudinary.uploader.destroy(folderMatch[1]);
  }
}
