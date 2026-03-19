// User entity class (for database operations)
export class User {
  id: string;
  email: string;
  username: string;
  // hashed
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
