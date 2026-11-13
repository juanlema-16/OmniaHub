import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ACCOUNT_STATUS, KYC_STATUS, TELEFONO_REGEX } from '../utils/constants.js';

const kycSchema = new Schema(
  {
    status: { type: String, enum: KYC_STATUS, default: 'no_enviado' },
    dpiFrente: String,
    dpiReverso: String,
    selfie: String,
    motivoRechazo: String,
    enviadoEn: Date,
    revisadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    revisadoEn: Date,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 60 },
    apellido: { type: String, required: [true, 'El apellido es obligatorio'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo inválido'],
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      match: [TELEFONO_REGEX, 'El teléfono debe tener 8 dígitos'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, required: true },
    accountStatus: { type: String, enum: ACCOUNT_STATUS, default: 'pendiente_email' },
    emailVerification: {
      code: { type: String, select: false },
      expiresAt: Date,
    },
    kyc: { type: kycSchema, default: () => ({}) },
    tienda: {
      nombre: { type: String, trim: true },
      slug: { type: String, trim: true, lowercase: true },
      logo: String,
    },
    empresa: {
      nombre: { type: String, trim: true },
      nit: { type: String, trim: true },
      bodega: { type: String, trim: true },
    },
    avatar: String,
  },
  { timestamps: true }
);

userSchema.index(
  { 'tienda.slug': 1 },
  { unique: true, partialFilterExpression: { 'tienda.slug': { $type: 'string' } } }
);
userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ 'kyc.status': 1 });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.virtual('nombreCompleto').get(function nombreCompleto() {
  return `${this.nombre} ${this.apellido}`;
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    if (ret.emailVerification) delete ret.emailVerification.code;
    delete ret.__v;
    return ret;
  },
});

export default model('User', userSchema);
