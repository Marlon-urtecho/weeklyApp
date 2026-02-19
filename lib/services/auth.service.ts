import { UsuarioRepository } from '../repositories/usuario.repository'
import { LoginDTOType, RegisterDTOType } from '../dto/auth.dto'
import jwt from 'jsonwebtoken'
import { AuthResponse, Usuario } from '../models'

export class AuthService {
  private usuarioRepository: UsuarioRepository

  constructor() {
    this.usuarioRepository = new UsuarioRepository()
  }

  async login(credentials: LoginDTOType): Promise<AuthResponse> {
    // 1. Buscar usuario
    const user = await this.usuarioRepository.findByUsername(credentials.username)
    
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    if (!user.activo) {
      throw new Error('Usuario inactivo')
    }

    // 2. Verificar contraseña
    const isValid = await this.usuarioRepository.verifyPassword(user, credentials.password)
    if (!isValid) {
      throw new Error('Contraseña incorrecta')
    }

    // 3. Generar token JWT
    const token = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user)

    // 4. Retornar sin password
    const { password, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      token,
      refresh_token: refreshToken
    }
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
