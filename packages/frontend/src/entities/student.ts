export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  document: string;
  birthDate: string;
  code: string;
  userId: string;
  username?: string;
  email?: string;
};

export type CreateStudentDto = {
  firstName: string;
  lastName: string;
  document: string;
  birthDate: string;
  email?: string;
};

export type UpdateStudentDto = {
  firstName?: string;
  lastName?: string;
  document?: string;
  birthDate?: string;
  email?: string;
};
