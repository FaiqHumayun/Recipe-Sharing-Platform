import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async signIn(
    email: string,
    pass: string,
  ): Promise<{ access_token?: string; message?: string }> {
    console.log('hitted service');
    const user = await this.userService.viewUser(email);
    const passwordMatched = await bcrypt.compare(pass, user.password);
    console.log('user password', user.password);
    console.log(passwordMatched);
    if (!passwordMatched) {
      return { message: 'You need to sign up first' };
    }
    const payload = { sub: user.id, username: user.name };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(
    req_body: Record<string, any>,
  ): Promise<{ access_token?: string; message?: string }> {
    console.log('hitted service');
    let user = await this.userService.viewUser(req_body.email);
    if (user) {
      return { message: 'You already have a account with this email' };
    }
    const { name, email, password } = req_body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    user = await this.userRepository.save(newUser);
    const payload = { sub: user.id, username: user.name };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
