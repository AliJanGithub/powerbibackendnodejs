import { AuthService } from '../services/auth.service.js';
import { asyncHandler, sanitizeUser } from '../utils/helpers.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await AuthService.login(email, password);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    }
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const { user, accessToken, refreshToken: newRefreshToken } = await AuthService.refreshTokens(
    refreshToken
  );

  res.json({
    success: true,
    message: 'Tokens refreshed',
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: newRefreshToken
    }
  });
});






export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  await AuthService.logout(refreshToken);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export const acceptInvite = asyncHandler(async (req, res) =>
   { const { token, password, name } = req.body;
 const { user, accessToken, refreshToken } = await AuthService.acceptInvite( token, password, name );
  res.json({ success: true, message: 'Invitation accepted successfully',
     data: { user: sanitizeUser(user), accessToken, refreshToken } });
     });
     export const me = asyncHandler(async (req, res) =>
       { res.json({ success: true, data: { user: sanitizeUser(req.user) } }); 
    })
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const dbUser = await AuthService.getUserById(user._id);
  const isMatch = await dbUser.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  await dbUser.hashPassword(newPassword);
  await dbUser.save();

  res.json({ success: true, message: 'Password changed successfully' });
});


export const changeName = asyncHandler(async (req, res) => {
  const { newName } = req.body;
  const user = req.user;

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const dbUser = await AuthService.getUserById(user._id);
  dbUser.name = newName;
  await dbUser.save();

  res.json({
    success: true,
    message: 'Name updated successfully',
    data: { name: dbUser.name },
  });
});


