// const Notification = require('../models/Notification');

// // 1. GET SYSTEM NOTIFICATIONS FOR ACTIVE USER
// exports.getUserNotifications = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     const notifications = await Notification.find({ recipient: userId })
//                                              .sort({ createdAt: -1 });
//     res.json(notifications);
//   } catch (err) {
//     res.status(500).json({ message: 'Error retrieving notifications logs.' });
//   }
// };

// // 2. FETCH AND MARK UN-TOASTED RECENT RECORDS ON LOGIN EVENT
// exports.getUnToastedAndMark = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     // Pulls top most un-toasted unread notification records
//     const unToasted = await Notification.find({ recipient: userId, isRead: false, isToasted: false })
//                                          .sort({ createdAt: -1 })
//                                          .limit(3);

//     if (unToasted.length > 0) {
//       const ids = unToasted.map(n => n._id);
//       await Notification.updateMany({ _id: { $in: ids } }, { isToasted: true });
//     }
//     res.json(unToasted);
//   } catch (err) {
//     res.status(500).json({ message: 'Error tracking toaster matrix blocks.' });
//   }
// };

// // 3. DISMISS INDIVIDUAL MESSAGE
// exports.dismissNotification = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await Notification.findByIdAndDelete(id);
//     res.json({ success: true, message: 'Message dismissed successfully.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Error wiping target message document.' });
//   }
// };

// // 4. BULK DISMISS CLEAR ALL (MARK ALL AS READ)
// exports.markAllAsRead = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     await Notification.updateMany({ recipient: userId }, { isRead: true });
//     res.json({ success: true, message: 'All messages catalog marked read.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Error cleansing notification database stacks.' });
//   }
// };