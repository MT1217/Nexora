const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key' &&
  process.env.CLOUDINARY_API_SECRET && 
  process.env.CLOUDINARY_API_SECRET !== 'your_cloudinary_api_secret';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary Configured Successfully!');
} else {
  console.log('Cloudinary credentials missing or default. Using local disk upload fallback (assets will be saved in /uploads directory).');
}

/**
 * Uploads a file buffer or local file path
 * @param {Object} file Multer file structure
 * @param {String} resourceType 'auto', 'video', 'raw', 'image'
 */
const uploadFile = async (file, resourceType = 'auto') => {
  // Dynamically resolve resource type to properly handle raw files vs media in Cloudinary
  let resolvedResourceType = resourceType;
  if (resolvedResourceType === 'auto' && file.mimetype) {
    if (file.mimetype.startsWith('image/')) {
      resolvedResourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resolvedResourceType = 'video';
    } else if (file.mimetype === 'application/pdf') {
      // Treat PDFs as image resources in Cloudinary so they open inline in the browser
      resolvedResourceType = 'image';
    } else {
      resolvedResourceType = 'raw';
    }
  }

  const fileExt = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, fileExt);
  const cleanName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueName = `${cleanName}-${Date.now()}`;
  
  // Cloudinary raw resources and PDFs MUST include the extension in public_id to be served with the extension
  const finalPublicId = (resolvedResourceType === 'raw' || fileExt.toLowerCase() === '.pdf')
    ? `${uniqueName}${fileExt}` 
    : uniqueName;

  // BYPASS CLOUDINARY FOR ALL DOCUMENTS (PDFs, ZIPs, DOCX, TXT)
  // This avoids Cloudinary's "deny or ACL failure" 401 block on PDF/ZIP delivery.
  if (isCloudinaryConfigured && resolvedResourceType !== 'raw' && file.mimetype !== 'application/pdf') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resolvedResourceType,
          folder: 'nexora_uploads',
          public_id: finalPublicId,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Stream Error:', error);
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              isCloudinary: true,
            });
          }
        }
      );
      uploadStream.end(file.buffer);
    });
  } else {
    // Local File Server Fallback
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/uploads/${fileName}`, // Relative url, frontend will append origin
      publicId: fileName,
      isCloudinary: false,
    };
  }
};

module.exports = {
  uploadFile,
  isCloudinaryConfigured,
};
