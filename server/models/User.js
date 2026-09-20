import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: false, // Optional for OAuth users
  },
  googleId: {
    type: String,
    sparse: true,
  },
  githubId: {
    type: String,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  subscriptionType: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  executionUsage: {
    type: Number,
    default: 0
  },
  preferences: {
    theme: { type: String, default: 'dark' },
    language: { type: String, default: 'cpp' }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Don't hash password for OAuth users
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);


});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
