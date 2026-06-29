const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/providers', userController.getProviders);
router.get('/admin/all', userController.getAdminDashboardData); 
router.put('/admin/update/:id', userController.updateUserAdmin);
router.delete('/admin/reject/:id', userController.rejectAndRemoveUser); 
router.put('/availability/:id', userController.updateAvailability); 
router.put('/profile/:id', userController.updateProfile);
router.post('/review/add', userController.addReview);

// 🔥 NEW NOTIFICATION LAYER ROUTINGS
router.get('/notifications/stream', userController.getNotifications);
router.put('/notifications/dismiss/:id', userController.dismissNotification);
router.post('/notifications/clear-all', userController.bulkDismissNotifications);

module.exports = router;