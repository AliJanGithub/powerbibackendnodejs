import { UserService } from '../services/user.service.js';
import { asyncHandler, sanitizeUser } from '../utils/helpers.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserService.getAllUsers(req.user);

  res.json({
    success: true,
    data: { users }
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await UserService.getUserById(id, req.user);

  res.json({
    success: true,
    data: { user: sanitizeUser(user) }
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await UserService.updateUser(id, req.body, req.user);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: sanitizeUser(user) }
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await UserService.deleteUser(id, req.user);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// ✅ Change Password Controller
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id; // from authenticate middleware

  const user = await AuthService.changePassword(userId, currentPassword, newPassword);

  res.json({
    success: true,
    message: 'Password updated successfully',
    data: {
      user: sanitizeUser(user)
    }
  });
});

// ✅ Change Name Controller
export const changeName = asyncHandler(async (req, res) => {
  const { newName } = req.body;
  const userId = req.user._id;

  const user = await AuthService.changeName(userId, newName);

  res.json({
    success: true,
    message: 'Name updated successfully',
    data: {
      user: sanitizeUser(user)
    }
  });
});

