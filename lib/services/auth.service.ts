import { UsuarioRepository } from '../repositories/usuario.repository'
import { ForgotPasswordDTOType, LoginDTOType, RegisterDTOType, ResetPasswordDTOType } from '../dto/auth.dto'
import jwt from 'jsonwebtoken'
import { AuthResponse, Usuario } from '../models'
import { prisma } from '../db'
import bcrypt from 'bcryptjs'
import { EmailService } from './email.service'

export class AuthService {
  private usuarioRepository: UsuarioRepository
  private emailService: EmailService

  constructor() {
    this.usuarioRepository = new UsuarioRepository()
    this.emailService = new EmailService()
      // No changes made, accepting the existing code as is.
  }

  async register(data: RegisterDTOType): Promise<AuthResponse> {
    // 1. Verificar que no exista
    const existing = await this.usuarioRepository.findByUsername(data.username)
    if (existing) {
      throw new Error('El usuario ya existe')
    }

    // 2. Crear usuario
    const user = await this.usuarioRepository.createWithRoles(data)
    
    // 3. Generar token
    const token = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user)

    const { password, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      token,
      refresh_token: refreshToken
    }
  }

  async refresh(refreshToken: string): Promise<{ token: string; refresh_token: string }> {
    const decoded = this.verifyRefreshToken(refreshToken) as any
    const idUsuario = Number(decoded?.id)
    if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
      throw new Error('Refresh token inválido')
    }

    const user = await this.usuarioRepository.findById(idUsuario)
    if (!user || !user.activo) {
      throw new Error('Usuario no autorizado')
    }

    return {
      token: this.generateAccessToken(user),
      refresh_token: this.generateRefreshToken(user)
    }
  }

  async requestPasswordReset(data: ForgotPasswordDTOType): Promise<void> {
    const user = await this.usuarioRepository.findByUsername(data.username)

    // Evita filtrar existencia de usuarios.
    if (!user || !user.activo) return

    const code = `${Math.floor(100000 + Math.random() * 900000)}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.password_reset_codes.create({
      data: {
        id_usuario: Number(user.id_usuario),
        code,
        expires_at: expiresAt,
        used: false
      }
    })

    await this.emailService.sendPasswordResetCode(data.email, code, user.username)
  }

  async resetPassword(data: ResetPasswordDTOType): Promise<void> {
    const user = await this.usuarioRepository.findByUsername(data.username)
    if (!user || !user.activo) {
      throw new Error('Código inválido o vencido')
    }

    const resetCode = await prisma.password_reset_codes.findFirst({
      where: {
        id_usuario: Number(user.id_usuario),
        code: data.code,
        used: false,
        expires_at: { gt: new Date() }
      },
      orderBy: { created_at: 'desc' }
    })

    if (!resetCode) {
      throw new Error('Código inválido o vencido')
    }

    const hashed = await bcrypt.hash(data.newPassword, 10)
    await prisma.$transaction([
      prisma.usuarios.update({
        where: { id_usuario: Number(user.id_usuario) },
        data: { password: hashed }
      }),
      prisma.password_reset_codes.updateMany({
        where: { id_usuario: Number(user.id_usuario), used: false },
        data: { used: true }
      })
    ])
  }

  private generateAccessToken(user: Usuario): string {
    const payload = {
      id: user.id_usuario,
      username: user.username,
      roles: user.roles?.map(r => r.nombre_rol) || []
    }

    return jwt.sign(payload, this.getAccessTokenSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    })
  }

  private generateRefreshToken(user: Usuario): string {
    const payload = {
      id: user.id_usuario,
      username: user.username,
      type: 'refresh'
    }

    return jwt.sign(payload, this.getRefreshTokenSecret(), {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    })
  }

  verifyToken(token: string) {
    return jwt.verify(token, this.getAccessTokenSecret())
  }

  private verifyRefreshToken(token: string) {
    const decoded = jwt.verify(token, this.getRefreshTokenSecret()) as any
    if (decoded?.type !== 'refresh') {
      throw new Error('Refresh token inválido')
    }
    return decoded
  }

  private getAccessTokenSecret(): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está definido')
    }
    return process.env.JWT_SECRET
  }

  private getRefreshTokenSecret(): string {
    if (process.env.JWT_REFRESH_SECRET) return process.env.JWT_REFRESH_SECRET
    return this.getAccessTokenSecret()
  }
}
