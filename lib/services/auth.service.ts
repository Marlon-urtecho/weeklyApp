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
    const token = this.generateToken(user)

    // 4. Retornar sin password
    const { password, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      token
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
    const token = this.generateToken(user)

    const { password, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      token
    }
  }

  private generateToken(user: Usuario): string {
    const payload = {
      id: user.id_usuario,
      username: user.username,
      roles: user.roles?.map(r => r.nombre_rol) || []
    }

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h'
    })
  }

  verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!)
  }
}