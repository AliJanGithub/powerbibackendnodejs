import { User } from '../models/user.model.js';
import { Company } from '../models/company.model.js';
import { JWTService } from './jwt.service.js';
import { emailService } from './email.service.js';
import { generateToken, hashToken, createApiError } from '../utils/helpers.js';
import { config } from '../configs/secrets.js';

export class AuthService {
  static async login(email, password) {
    const user = await User.findOne({ email });

    if (!user || !user.passwordHash) {
      throw createApiError('Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw createApiError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw createApiError('Account is inactive', 403);
    }

    const { accessToken, refreshToken } = JWTService.generateTokenPair(user._id, user.role);
    await JWTService.storeRefreshToken(user._id, refreshToken);

    return { user, accessToken, refreshToken };
  }

  static async getUserById(id) {
  return User.findById(id);
}


// ✅ Change Password
static async changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  if (!user) {
    throw createApiError('User not found', 404);
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw createApiError('Current password is incorrect', 400);
  }

  // Hash and set new password
  await user.hashPassword(newPassword);
  await user.save();

  return user;
}

// ✅ Change Name
static async changeName(userId, newName) {
  const user = await User.findById(userId);
  if (!user) {
    throw createApiError('User not found', 404);
  }

  user.name = newName.trim();
  await user.save();

  return user;
}





  static async refreshTokens(refreshToken) {
    try {
      const user = await JWTService.verifyRefreshToken(refreshToken);

      await JWTService.revokeRefreshToken(refreshToken);

      const { accessToken, refreshToken: newRefreshToken } = JWTService.generateTokenPair(
        user._id,
        user.role
      );
      await JWTService.storeRefreshToken(user._id, newRefreshToken);

      return { user, accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw createApiError('Invalid or expired refresh token', 401);
    }
  }

  static async logout(refreshToken) {
    if (refreshToken) {
      await JWTService.revokeRefreshToken(refreshToken);
    }
  }

  static async inviteAdmin(superAdminId, email, companyName, name = null) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createApiError('User with this email already exists', 400);
    }

    let company = await Company.findOne({ name: companyName });

    if (!company) {
      company = await Company.create({
        name: companyName,
        createdBy: superAdminId
      });
    }

    const inviteToken = generateToken();
    const inviteTokenHash = hashToken(inviteToken);
    const inviteExpiresAt = new Date(Date.now() + config.inviteTokenExpiry * 60 * 60 * 1000);

    const admin = await User.create({
      email,
      name,
      role: 'ADMIN',
      company: company._id,
      invitedBy: superAdminId,
      inviteTokenHash,
      inviteExpiresAt,
      isActive: false
    });

    await emailService.sendInviteEmail(email, name, 'ADMIN', inviteToken);

    return { admin, company };
  }

  static async inviteUser(adminId, email, name = null) {
    const admin = await User.findById(adminId).populate('company');

    if (!admin || admin.role !== 'ADMIN') {
      throw createApiError('Only admins can invite users', 403);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createApiError('User with this email already exists', 400);
    }

    const inviteToken = generateToken();
    const inviteTokenHash = hashToken(inviteToken);
    const inviteExpiresAt = new Date(Date.now() + config.inviteTokenExpiry * 60 * 60 * 1000);

    const user = await User.create({
      email,
      name,
      role: 'USER',
      company: admin.company._id,
      invitedBy: adminId,
      inviteTokenHash,
      inviteExpiresAt,
      isActive: false
    });

    await emailService.sendInviteEmail(email, name, 'USER', inviteToken);

    return user;
  }

  static async acceptInvite(token, password, name = null) {
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      inviteTokenHash: tokenHash,
      inviteExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      throw createApiError('Invalid or expired invitation token', 400);
    }

    await user.hashPassword(password);

    if (name) {
      user.name = name;
    }

    user.isActive = true;
    user.inviteTokenHash = undefined;
    user.inviteExpiresAt = undefined;

    await user.save();

    const { accessToken, refreshToken } = JWTService.generateTokenPair(user._id, user.role);
    await JWTService.storeRefreshToken(user._id, refreshToken);

    return { user, accessToken, refreshToken };
  }
}
