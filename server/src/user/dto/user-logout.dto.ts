import { IsNotEmpty, IsEmail } from 'class-validator';

/**
 * @class
 * Class represents user's post data object received from the user.
 */
export class UserLogoutDTO {
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
