export type ItemRow = {
  id: string;
  code: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
  standard_code?: string;
  standard_description?: string;
  purpose_type?: string;
};

export type ItemFormState = {
  id?: string;
  code: string;
  title: string;
  subject: string;
  grade: string;
  standardCode: string;
  standardDescription: string;
  purposeType: string;
  stem: string;
  answer: string;
  status?: string;
};
