const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// User Profile Routes (Protected for all logged in users)
router.put('/update-me', protect, upload.single('avatar'), userController.updateMe);
router.put('/update-password', protect, userController.updatePassword);

// Admin Routes (Restricted to admin/staff)
router.get('/', protect, restrictTo('admin', 'staff'), userController.getAllUsers);
router.post('/', protect, restrictTo('admin'), userController.createUser);
router.put('/:id/status', protect, restrictTo('admin', 'staff'), userController.updateUserStatus);
router.put('/:id/role', protect, restrictTo('admin', 'staff'), userController.updateUserRole);
router.delete('/:id', protect, restrictTo('admin', 'staff'), userController.deleteUser);

module.exports = router;
