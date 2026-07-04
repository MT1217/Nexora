const File = require('../models/File');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadFile } = require('../utils/cloudinary');

// Helpers to get course media type
const parseMediaType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  return 'document';
};

// @desc    Upload course material (Videos, PDFs, etc.)
// @route   POST /api/files/upload
// @access  Private (Mentors only)
const uploadCourseFile = async (req, res) => {
  const { title, description } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please attach a file to upload' });
  }

  if (!title) {
    return res.status(400).json({ success: false, message: 'File title is required' });
  }

  try {
    const fileType = parseMediaType(req.file.mimetype);
    
    // Upload file using our utility (resolves to Cloudinary URL or local file path fallback)
    const uploadResult = await uploadFile(req.file, fileType === 'video' ? 'video' : 'auto');

    // Create DB entry
    const newFile = await File.create({
      mentor: req.user.id,
      title,
      description,
      fileUrl: uploadResult.url,
      fileType,
    });

    // Notify Subscribed Students
    const subscribedStudents = await User.find({
      role: 'student',
      subscribedMentors: req.user.id,
    });

    const isCloud = uploadResult.isCloudinary;
    const notificationMessage = `Your subscribed mentor ${req.user.name} posted a new ${fileType}: "${title}"`;

    const notificationPromises = subscribedStudents.map(async (student) => {
      const notification = await Notification.create({
        recipient: student._id,
        sender: req.user.id,
        message: notificationMessage,
        type: 'file_upload',
        referenceId: newFile._id,
        onModel: 'File',
      });

      // Emit real-time Socket notification if socket server io exists
      const io = req.app.get('io');
      if (io) {
        // Emit to student-specific socket room: `/student/studentId`
        io.to(`user_${student._id.toString()}`).emit('new_mailbox_message', {
          id: notification._id,
          message: notificationMessage,
          type: 'file_upload',
          createdAt: notification.createdAt,
          senderName: req.user.name,
          referenceId: newFile._id,
        });
      }
    });

    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      message: `File uploaded successfully. Notified ${subscribedStudents.length} student(s).`,
      file: newFile,
    });

  } catch (error) {
    console.error('File Upload Controller Error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file content' });
  }
};

// @desc    Get files of a specific mentor (For subscribed students)
// @route   GET /api/files/mentor/:mentorId
// @access  Private (Students must be subscribed)
const getMentorFiles = async (req, res) => {
  const { mentorId } = req.params;

  try {
    // Check if user is mentor themselves, or if student is subscribed
    const isMentorSelf = req.user.role === 'mentor' && req.user.id === mentorId;
    
    if (!isMentorSelf && req.user.role === 'student') {
      const student = await User.findById(req.user.id);
      if (!student.subscribedMentors.includes(mentorId)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access Denied. You must subscribe to the mentor to access their files.' 
        });
      }
    }

    const files = await File.find({ mentor: mentorId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: files.length, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current mentor uploaded files
// @route   GET /api/files/my-uploads
// @access  Private (Mentors only)
const getMyUploadedFiles = async (req, res) => {
  try {
    const files = await File.find({ mentor: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: files.length, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete course file
// @route   DELETE /api/files/:id
// @access  Private (Mentors only, must own the file)
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File asset not found' });
    }

    // Verify ownership
    if (file.mentor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this file.' });
    }

    await File.deleteOne({ _id: req.params.id });

    // Optional: Delete from Cloudinary (requires publicId logic, keeping simple for database cleanup here)
    res.status(200).json({ success: true, message: 'File deleted from system database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadCourseFile,
  getMentorFiles,
  getMyUploadedFiles,
  deleteFile
};
