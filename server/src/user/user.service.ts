import { Injectable, HttpException, HttpStatus, CACHE_MANAGER, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import { UserRegisterDTO, UserLoginDTO, UserResponseDTO } from './dto';
import { UserLogoutDTO } from './dto/user-logout.dto';

/**
 * @class
 * Service handles logic that gets delagated to it by the controller.
 */
@Injectable()
export class UserService {
    // Dependency Injection of userEntity collection inside this service class.
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager,
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    ) {}

    async showAll(): Promise<UserResponseDTO[]> {
        const users = await this.userRepository.find();
        return users.map(user => user.toResponseObject(false));
    }

    async login(data: UserLoginDTO): Promise<UserResponseDTO> {
        const { email, password } = data;
        const user = await this.userRepository.findOne({ where: { email }});
        if (!user || !await user.comparePassword(password)) {
            throw new HttpException('Invalid email/password', HttpStatus.BAD_REQUEST);
        }
        const userResponseObject = user.toResponseObject();
        const { id, token } = userResponseObject;
        // No need to await for this asynchronous function to finish.
        this.cacheManager.set(id, token, { ttl: process.env.JWT_EXPIRATION });
        return userResponseObject;
    }

    async register(data: UserRegisterDTO): Promise<UserResponseDTO> {
        const { email } = data;
        let user = await this.userRepository.findOne({ where: { email } });
        if (user) {
            throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
        }
        user = this.userRepository.create(data);
        await this.userRepository.save(user);
        const userResponseObject = user.toResponseObject();
        const { id, token } = userResponseObject;
        // No need to await for this asynchronous function to finish.
        this.cacheManager.set(id, token, { ttl: process.env.JWT_EXPIRATION });
        return userResponseObject;
    }

    logout(data: UserLogoutDTO): void {
        const { email } = data;
        this.cacheManager.del(email);
    }
}
