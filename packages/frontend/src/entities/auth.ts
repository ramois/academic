export type LoginResult = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  access_token: string;
  user: LoginResult;
};
